-- Align hadeeth table with Book → Kitab → Chapter → Hadith import format.

BEGIN;

ALTER TABLE hadeeth ADD COLUMN IF NOT EXISTS reference_number INT;
ALTER TABLE hadeeth ADD COLUMN IF NOT EXISTS arabic TEXT;
ALTER TABLE hadeeth ADD COLUMN IF NOT EXISTS english TEXT;
ALTER TABLE hadeeth ADD COLUMN IF NOT EXISTS grade VARCHAR(64);

UPDATE hadeeth
SET reference_number = refernce_number
WHERE reference_number IS NULL
  AND refernce_number IS NOT NULL;

UPDATE hadeeth
SET arabic = hadeeth
WHERE arabic IS NULL
  AND hadeeth IS NOT NULL
  AND COALESCE(lang_code, 'ar') = 'ar';

UPDATE hadeeth
SET english = hadeeth
WHERE english IS NULL
  AND hadeeth IS NOT NULL
  AND lang_code IS NOT NULL
  AND lang_code <> 'ar';

ALTER TABLE hadeeth ALTER COLUMN is_published SET DEFAULT TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS ux_hadeeth_chapter_reference
  ON hadeeth(chapter_id, reference_number)
  WHERE chapter_id IS NOT NULL AND reference_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_kitabs_book_title
  ON kitabs(book_id, title);

CREATE UNIQUE INDEX IF NOT EXISTS ux_chapters_kitab_title
  ON chapters(kitab_id, title);

COMMIT;
