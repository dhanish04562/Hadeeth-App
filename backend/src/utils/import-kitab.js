const pool = require("../db/pool");
const createId = require("./create-id");

const DEFAULT_COLLECTION_KEY = "sahih-muslim";
const DEFAULT_COLLECTION_NAME_AR = "صحيح مسلم";
const DEFAULT_COLLECTION_NAME_EN = "Sahih Muslim";

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

function collectionNotes(collectionKey, nameEn) {
  return `collection_key:${collectionKey};summary:${nameEn}`;
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
  const notes = collectionNotes(collectionKey, nameEn);

  const existing = await client.query(
    `
      SELECT id
      FROM books
      WHERE LOWER(title) IN (LOWER($1), LOWER($2))
         OR notes LIKE $3
      LIMIT 1
    `,
    [nameAr, nameEn, `%collection_key:${collectionKey}%`]
  );

  if (existing.rows[0]) {
    const { rows } = await client.query(
      `
        UPDATE books
        SET
          title = $2,
          author = COALESCE(NULLIF(author, ''), 'Imam Muslim'),
          notes = $3,
          is_published = true,
          lang_code = 'ar'
        WHERE id = $1
        RETURNING id
      `,
      [existing.rows[0].id, nameAr, notes]
    );
    return rows[0].id;
  }

  const id = createId();
  const { rows } = await client.query(
    `
      INSERT INTO books (id, title, author, notes, is_published, lang_code)
      VALUES ($1, $2, 'Imam Muslim', $3, true, 'ar')
      RETURNING id
    `,
    [id, nameAr, notes]
  );
  return rows[0].id;
}

async function upsertKitab(client, payload) {
  const existing = await client.query(
    `
      SELECT id
      FROM kitabs
      WHERE book_id = $1
        AND notes = $2
      LIMIT 1
    `,
    [payload.bookId, payload.notes]
  );

  if (existing.rows[0]) {
    const { rows } = await client.query(
      `
        UPDATE kitabs
        SET
          title = $2,
          book_id = $3,
          is_published = true,
          notes = $4,
          lang_code = 'ar'
        WHERE id = $1
        RETURNING id
      `,
      [existing.rows[0].id, payload.title, payload.bookId, payload.notes]
    );
    return { id: rows[0].id, created: false };
  }

  const id = createId();
  const { rows } = await client.query(
    `
      INSERT INTO kitabs (id, title, book_id, is_published, notes, lang_code)
      VALUES ($1, $2, $3, true, $4, 'ar')
      RETURNING id
    `,
    [id, payload.title, payload.bookId, payload.notes]
  );

  return { id: rows[0].id, created: true };
}

async function upsertChapter(client, payload) {
  const existing = await client.query(
    `
      SELECT id
      FROM chapters
      WHERE kitab_id = $1
        AND notes = $2
      LIMIT 1
    `,
    [payload.kitabId, payload.notes]
  );

  if (existing.rows[0]) {
    const { rows } = await client.query(
      `
        UPDATE chapters
        SET
          title = $2,
          kitab_id = $3,
          book_id = $4,
          is_published = true,
          notes = $5,
          lang_code = 'ar'
        WHERE id = $1
        RETURNING id
      `,
      [
        existing.rows[0].id,
        payload.title,
        payload.kitabId,
        payload.bookId,
        payload.notes
      ]
    );
    return { id: rows[0].id, created: false };
  }

  const id = createId();
  const { rows } = await client.query(
    `
      INSERT INTO chapters (id, title, kitab_id, book_id, is_published, notes, lang_code)
      VALUES ($1, $2, $3, $4, true, $5, 'ar')
      RETURNING id
    `,
    [id, payload.title, payload.kitabId, payload.bookId, payload.notes]
  );

  return { id: rows[0].id, created: true };
}

async function upsertHadeeth(client, payload) {
  const existing = await client.query(
    `
      SELECT id
      FROM hadeeth
      WHERE chapter_id = $1
        AND reference_number = $2
      LIMIT 1
    `,
    [payload.chapterId, payload.hadithNumber]
  );

  if (existing.rows[0]) {
    await client.query(
      `
        UPDATE hadeeth
        SET
          chapter_id = $2,
          is_published = true,
          arabic = $3,
          tamil = $4,
          reference_number = $5,
          reported_by = NULL,
          grade = NULL
        WHERE id = $1
      `,
      [
        existing.rows[0].id,
        payload.chapterId,
        payload.arabic,
        payload.tamil || null,
        payload.hadithNumber
      ]
    );
    return { created: false };
  }

  await client.query(
    `
      INSERT INTO hadeeth (
        id, chapter_id, is_published, arabic, tamil, reference_number, reported_by, grade
      )
      VALUES ($1, $2, true, $3, $4, $5, NULL, NULL)
    `,
    [createId(), payload.chapterId, payload.arabic, payload.tamil || null, payload.hadithNumber]
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
    hadeeth: { created: 0, updated: 0 }
  };

  try {
    await client.query("BEGIN");
    await ensureArabicLanguage(client);

    const collectionId = await upsertCollection(client, payload);
    const bookNumber = requirePositiveInt(payload.book_number, "book_number");
    const kitabNotes = `kitab_number:${bookNumber}`;

    const kitab = await upsertKitab(client, {
      title: text(payload.book_name_ar),
      bookId: collectionId,
      notes: kitabNotes
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

      const chapterNotes = `kitab_number:${bookNumber};chapter_number:${chapterNumber}`;
      const bab = await upsertChapter(client, {
        title: chapterTitle,
        kitabId: kitab.id,
        bookId: collectionId,
        notes: chapterNotes
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

        const result = await upsertHadeeth(client, {
          chapterId: bab.id,
          hadithNumber,
          arabic,
          tamil: text(hadith.tamil),
          notes: chapterNotes
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
  isKitabImport
};
