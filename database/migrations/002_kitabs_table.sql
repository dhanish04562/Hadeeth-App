-- Migration: Book → Kitab → Chapter → Hadeeth
-- Replaces the nested chapters approach (parent_id) with a dedicated kitabs table.
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS guards).

BEGIN;

-- ── 1. Create kitabs table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kitabs (
  id          VARCHAR(24) PRIMARY KEY,
  book_id     VARCHAR(24) NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  notes       TEXT,
  lang_code   VARCHAR(20),
  is_published BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_kitabs_book_id ON kitabs(book_id);

-- ── 2. Add kitab_id to chapters (nullable during migration) ─────────────────
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS kitab_id VARCHAR(24);

-- ── 3. Migrate old Kitab-level chapters (parent_id IS NULL, have children) ──
--     Re-use the same id so child chapters can reference them via parent_id.
INSERT INTO kitabs (id, book_id, title, notes, lang_code, is_published)
SELECT c.id, c.book_id, c.title, c.notes, c.lang_code, COALESCE(c.is_published, TRUE)
FROM chapters c
WHERE c.parent_id IS NULL
  AND EXISTS (SELECT 1 FROM chapters child WHERE child.parent_id = c.id)
ON CONFLICT (id) DO NOTHING;

-- ── 4. Point Bab chapters at their parent Kitab ─────────────────────────────
UPDATE chapters
SET kitab_id = parent_id
WHERE parent_id IS NOT NULL
  AND kitab_id IS NULL;

-- ── 5. Handle legacy flat chapters (parent_id IS NULL, no children) ─────────
--     Create a wrapper kitab per flat chapter; keep the chapter row for hadeeth.
DO $$
DECLARE
  rec RECORD;
  new_kitab_id VARCHAR(24);
BEGIN
  FOR rec IN
    SELECT c.id, c.book_id, c.title, c.notes, c.lang_code, c.is_published
    FROM chapters c
    WHERE c.parent_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM chapters child WHERE child.parent_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM kitabs k WHERE k.id = c.id)
  LOOP
    new_kitab_id := substr(md5(random()::text || rec.id || clock_timestamp()::text), 1, 24);

    INSERT INTO kitabs (id, book_id, title, notes, lang_code, is_published)
    VALUES (
      new_kitab_id,
      rec.book_id,
      rec.title,
      rec.notes,
      rec.lang_code,
      COALESCE(rec.is_published, TRUE)
    );

    UPDATE chapters SET kitab_id = new_kitab_id WHERE id = rec.id;
  END LOOP;
END $$;

-- ── 6. Remove old Kitab chapter rows (now represented in kitabs table) ──────
DELETE FROM chapters c
WHERE c.parent_id IS NULL
  AND EXISTS (SELECT 1 FROM kitabs k WHERE k.id = c.id);

-- ── 7. Drop parent_id column and related constraints ────────────────────────
ALTER TABLE chapters DROP CONSTRAINT IF EXISTS fk_chapters_parent;
DROP INDEX IF EXISTS idx_chapters_parent_id;
DROP INDEX IF EXISTS idx_chapters_book_id_parent_null;
DROP INDEX IF EXISTS ix_chapters_book_parent_sort;
ALTER TABLE chapters DROP COLUMN IF EXISTS parent_id;

-- ── 8. Enforce kitab_id foreign key ─────────────────────────────────────────
ALTER TABLE chapters DROP CONSTRAINT IF EXISTS fk_chapters_kitab;

ALTER TABLE chapters
  ADD CONSTRAINT fk_chapters_kitab
  FOREIGN KEY (kitab_id)
  REFERENCES kitabs(id)
  ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_chapters_kitab_id ON chapters(kitab_id);

-- Optional import columns (used by import-kitab utility)
ALTER TABLE kitabs ADD COLUMN IF NOT EXISTS source_key TEXT;
ALTER TABLE kitabs ADD COLUMN IF NOT EXISTS sort_order INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS ux_kitabs_source_key
  ON kitabs(source_key)
  WHERE source_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_chapters_kitab_sort
  ON chapters(kitab_id, sort_order, title);

COMMIT;
