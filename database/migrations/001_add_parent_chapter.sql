-- ============================================================
-- Migration: Add hierarchical chapter support (Kitab / Bab)
-- Noor Hadith App
-- ============================================================

-- 1. Add parent_id to chapters table (matches existing app column)
ALTER TABLE chapters
  ADD COLUMN IF NOT EXISTS parent_id INTEGER NULL
    REFERENCES chapters(id) ON DELETE CASCADE;

-- 2. Add an index for fast child-chapter lookups
CREATE INDEX IF NOT EXISTS idx_chapters_parent_id
  ON chapters(parent_id);

-- 3. Add an index for book + top-level chapter queries
CREATE INDEX IF NOT EXISTS idx_chapters_book_id_parent_null
  ON chapters(book_id)
  WHERE parent_id IS NULL;

-- 4. Note: hadeeth.chapter_id should reference a child (Bab) in normal usage.
COMMENT ON COLUMN chapters.parent_id IS
  'NULL = top-level Kitab. Non-null = Bab whose parent is the referenced Kitab.';

COMMENT ON COLUMN hadeeth.chapter_id IS
  'References the Bab (child chapter) to which this hadith belongs.';

-- 5. (Optional) Verify integrity: ensure no existing hadith points
--    to a parent (Kitab) chapter once you start using the new hierarchy.
--    Run the query below manually to audit before enforcing:
--
--    SELECT h.id, h.chapter_id
--    FROM   hadeeth h
--    JOIN   chapters c ON c.id = h.chapter_id
--    WHERE  c.parent_chapter_id IS NULL;
