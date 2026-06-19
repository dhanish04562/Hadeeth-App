-- Add tamil column to hadeeth table for Tamil translation text.

BEGIN;

ALTER TABLE hadeeth ADD COLUMN IF NOT EXISTS tamil TEXT;

COMMIT;
