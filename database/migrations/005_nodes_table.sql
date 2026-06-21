BEGIN;

-- Enable ltree extension for materialized paths
CREATE EXTENSION IF NOT EXISTS ltree;

-- 1. Create the unified nodes table ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS nodes (
  id          VARCHAR(24) PRIMARY KEY,
  parent_id   VARCHAR(24) REFERENCES nodes(id) ON DELETE CASCADE,
  type        VARCHAR(32) NOT NULL DEFAULT 'node',   -- book, category, chapter, lesson, section, etc.
  title       TEXT NOT NULL DEFAULT '',
  path        LTREE,                                  -- materialized path e.g. "1.2.3.4"
  is_published BOOLEAN DEFAULT TRUE,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nodes_parent_id ON nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_nodes_path ON nodes USING GIST (path);
CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(type);

-- 2. Add node_id to hadeeth ----------------------------------------------------------------
ALTER TABLE hadeeth ADD COLUMN IF NOT EXISTS node_id VARCHAR(24);

CREATE INDEX IF NOT EXISTS idx_hadeeth_node_id ON hadeeth(node_id);

-- 3. Migrate existing books, kitabs, chapters into nodes ------------------------------------
-- Books become type='book'
INSERT INTO nodes (id, parent_id, type, title, is_published, sort_order)
SELECT id, NULL, 'book', COALESCE(title, ''), COALESCE(is_published, FALSE), 0
FROM books
ON CONFLICT (id) DO NOTHING;

-- Kitabs become type='kitab', parented to their book
INSERT INTO nodes (id, parent_id, type, title, is_published, sort_order)
SELECT k.id, k.book_id, 'kitab', COALESCE(k.title, ''), COALESCE(k.is_published, TRUE), 0
FROM kitabs k
ON CONFLICT (id) DO NOTHING;

-- Chapters become type='chapter', parented to their kitab (or book)
INSERT INTO nodes (id, parent_id, type, title, is_published, sort_order)
SELECT c.id, COALESCE(c.kitab_id, c.book_id), 'chapter', COALESCE(c.title, ''), COALESCE(c.is_published, FALSE), 0
FROM chapters c
ON CONFLICT (id) DO NOTHING;

-- 4. Map hadeeth.chapter_id -> node_id -----------------------------------------------------
UPDATE hadeeth h
SET node_id = h.chapter_id
WHERE h.chapter_id IS NOT NULL
  AND h.node_id IS NULL;

-- 5. Update ltree paths for all migrated nodes ----------------------------------------------
-- We do a simple depth-first numbering using parent_id resolution.
-- For small datasets (<10k rows) this recursive CTE is fine.
WITH RECURSIVE node_tree AS (
  SELECT id, parent_id, type, 1 AS depth, id::TEXT AS path_str
  FROM nodes
  WHERE parent_id IS NULL

  UNION ALL

  SELECT n.id, n.parent_id, n.type, nt.depth + 1,
         nt.path_str || '.' || n.id
  FROM nodes n
  JOIN node_tree nt ON n.parent_id = nt.id
)
UPDATE nodes n
SET path = text2ltree(nt.path_str)
FROM node_tree nt
WHERE n.id = nt.id;

COMMIT;
