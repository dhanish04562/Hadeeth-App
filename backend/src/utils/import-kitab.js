const pool = require("../db/pool");
const createId = require("./create-id");

const DEFAULT_COLLECTION_KEY = "sahih-muslim";
const DEFAULT_COLLECTION_NAME_AR = "صحيح مسلم";
const DEFAULT_COLLECTION_NAME_EN = "Sahih Muslim";

function numberKey(value) {
  return String(Number(value) || 0).padStart(3, "0");
}

function text(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function requirePositiveInt(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    const error = new Error(`${field} must be a positive integer.`);
    error.statusCode = 400;
    throw error;
  }
  return number;
}

function assertKitabPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    const error = new Error("Kitab import payload must be a JSON object.");
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(payload.chapters)) {
    const error = new Error("Kitab import payload must include a chapters array.");
    error.statusCode = 400;
    throw error;
  }

  requirePositiveInt(payload.book_number, "book_number");

  if (!text(payload.book_name_ar)) {
    const error = new Error("book_name_ar is required.");
    error.statusCode = 400;
    throw error;
  }
}

async function ensureImportSchema(client) {
  await client.query(`
    ALTER TABLE books ADD COLUMN IF NOT EXISTS source_key TEXT;
    ALTER TABLE chapters ADD COLUMN IF NOT EXISTS source_key TEXT;
    ALTER TABLE chapters ADD COLUMN IF NOT EXISTS sort_order INTEGER;
    ALTER TABLE hadeeth ADD COLUMN IF NOT EXISTS source_key TEXT;

    CREATE UNIQUE INDEX IF NOT EXISTS ux_books_source_key
      ON books(source_key)
      WHERE source_key IS NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS ux_chapters_source_key
      ON chapters(source_key)
      WHERE source_key IS NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS ux_hadeeth_source_key
      ON hadeeth(source_key)
      WHERE source_key IS NOT NULL;

    CREATE INDEX IF NOT EXISTS ix_chapters_book_parent_sort
      ON chapters(book_id, parent_id, sort_order, title);

    CREATE INDEX IF NOT EXISTS ix_hadeeth_chapter_reference
      ON hadeeth(chapter_id, refernce_number);
  `);
}

async function ensureArabicLanguage(client) {
  await client.query(
    `
      INSERT INTO languages (code, name)
      VALUES ('ar', 'Arabic')
      ON CONFLICT (code) DO NOTHING
    `
  );
}

async function upsertCollection(client, payload) {
  const collectionKey = text(payload.collection_key, DEFAULT_COLLECTION_KEY);
  const nameAr = text(payload.collection_name_ar, DEFAULT_COLLECTION_NAME_AR);
  const nameEn = text(payload.collection_name_en, DEFAULT_COLLECTION_NAME_EN);

  const existing = await client.query(
    `
      SELECT id
      FROM books
      WHERE source_key = $1
        OR LOWER(title) IN (LOWER($2), LOWER($3))
      ORDER BY source_key = $1 DESC
      LIMIT 1
    `,
    [collectionKey, nameAr, nameEn]
  );

  if (existing.rows[0]) {
    const { rows } = await client.query(
      `
        UPDATE books
        SET
          title = $2,
          author = COALESCE(NULLIF(author, ''), 'Imam Muslim'),
          notes = COALESCE(NULLIF(notes, ''), $3),
          is_published = true,
          lang_code = 'ar',
          source_key = $4
        WHERE id = $1
        RETURNING id
      `,
      [existing.rows[0].id, nameAr, nameEn, collectionKey]
    );
    return rows[0].id;
  }

  const id = createId();
  const { rows } = await client.query(
    `
      INSERT INTO books (id, title, author, notes, is_published, lang_code, source_key)
      VALUES ($1, $2, 'Imam Muslim', $3, true, 'ar', $4)
      RETURNING id
    `,
    [id, nameAr, nameEn, collectionKey]
  );
  return rows[0].id;
}

async function upsertChapter(client, payload) {
  const existing = await client.query(
    "SELECT id FROM chapters WHERE source_key = $1 LIMIT 1",
    [payload.sourceKey]
  );

  if (existing.rows[0]) {
    const { rows } = await client.query(
      `
        UPDATE chapters
        SET
          title = $2,
          parent_id = $3,
          book_id = $4,
          is_published = true,
          notes = $5,
          lang_code = 'ar',
          sort_order = $6
        WHERE id = $1
        RETURNING id
      `,
      [
        existing.rows[0].id,
        payload.title,
        payload.parentId,
        payload.bookId,
        payload.notes,
        payload.sortOrder,
      ]
    );
    return { id: rows[0].id, created: false };
  }

  const id = createId();
  const { rows } = await client.query(
    `
      INSERT INTO chapters (
        id, title, parent_id, book_id, is_published, notes, lang_code, source_key, sort_order
      )
      VALUES ($1, $2, $3, $4, true, $5, 'ar', $6, $7)
      RETURNING id
    `,
    [id, payload.title, payload.parentId, payload.bookId, payload.notes, payload.sourceKey, payload.sortOrder]
  );

  return { id: rows[0].id, created: true };
}

async function upsertHadeeth(client, payload) {
  const existing = await client.query(
    "SELECT id FROM hadeeth WHERE source_key = $1 LIMIT 1",
    [payload.sourceKey]
  );

  if (existing.rows[0]) {
    await client.query(
      `
        UPDATE hadeeth
        SET
          chapter_id = $2,
          is_published = true,
          notes = $3,
          hadeeth = $4,
          refernce_number = $5,
          reported_by = NULL,
          lang_code = 'ar'
        WHERE id = $1
      `,
      [
        existing.rows[0].id,
        payload.chapterId,
        payload.notes,
        payload.arabic,
        payload.hadithNumber,
      ]
    );
    return { created: false };
  }

  await client.query(
    `
      INSERT INTO hadeeth (
        id, chapter_id, is_published, notes, hadeeth, refernce_number, reported_by, lang_code, source_key
      )
      VALUES ($1, $2, true, $3, $4, $5, NULL, 'ar', $6)
    `,
    [createId(), payload.chapterId, payload.notes, payload.arabic, payload.hadithNumber, payload.sourceKey]
  );

  return { created: true };
}

async function importKitab(payload) {
  assertKitabPayload(payload);

  const client = await pool.connect();
  const summary = {
    collection: null,
    kitab: null,
    chapters: { created: 0, updated: 0 },
    hadeeth: { created: 0, updated: 0 },
  };

  try {
    await client.query("BEGIN");
    await ensureImportSchema(client);
    await ensureArabicLanguage(client);

    const collectionKey = text(payload.collection_key, DEFAULT_COLLECTION_KEY);
    const collectionId = await upsertCollection(client, payload);
    const bookNumber = requirePositiveInt(payload.book_number, "book_number");
    const kitabSourceKey = `${collectionKey}:kitab:${numberKey(bookNumber)}`;

    const kitab = await upsertChapter(client, {
      sourceKey: kitabSourceKey,
      title: text(payload.book_name_ar),
      parentId: null,
      bookId: collectionId,
      notes: `kitab_number:${bookNumber}`,
      sortOrder: bookNumber,
    });

    summary.collection = collectionId;
    summary.kitab = kitab.id;
    if (kitab.created) summary.chapters.created += 1;
    else summary.chapters.updated += 1;

    for (const chapter of payload.chapters) {
      const chapterNumber = requirePositiveInt(chapter.chapter_number, "chapter_number");
      const chapterTitle = text(chapter.chapter_name_ar || chapter.name_ar);
      if (!chapterTitle) {
        const error = new Error(`chapter_name_ar is required for chapter ${chapterNumber}.`);
        error.statusCode = 400;
        throw error;
      }

      const babSourceKey = `${collectionKey}:kitab:${numberKey(bookNumber)}:chapter:${numberKey(chapterNumber)}`;
      const bab = await upsertChapter(client, {
        sourceKey: babSourceKey,
        title: chapterTitle,
        parentId: kitab.id,
        bookId: collectionId,
        notes: `kitab_number:${bookNumber};chapter_number:${chapterNumber}`,
        sortOrder: chapterNumber,
      });

      if (bab.created) summary.chapters.created += 1;
      else summary.chapters.updated += 1;

      if (!Array.isArray(chapter.hadiths)) {
        continue;
      }

      for (const hadith of chapter.hadiths) {
        const hadithNumber = requirePositiveInt(hadith.hadith_number, "hadith_number");
        const arabic = text(hadith.arabic);
        if (!arabic) {
          const error = new Error(`arabic is required for hadith ${hadithNumber}.`);
          error.statusCode = 400;
          throw error;
        }

        const hadithSourceKey = `${collectionKey}:kitab:${numberKey(bookNumber)}:chapter:${numberKey(chapterNumber)}:hadith:${numberKey(hadithNumber)}`;
        const result = await upsertHadeeth(client, {
          sourceKey: hadithSourceKey,
          chapterId: bab.id,
          hadithNumber,
          arabic,
          notes: `kitab_number:${bookNumber};chapter_number:${chapterNumber}`,
        });

        if (result.created) summary.hadeeth.created += 1;
        else summary.hadeeth.updated += 1;
      }
    }

    await client.query("COMMIT");
    return summary;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function isKitabImport(payload) {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      payload.book_number &&
      payload.book_name_ar &&
      Array.isArray(payload.chapters)
  );
}

module.exports = {
  importKitab,
  isKitabImport,
};
