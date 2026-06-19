const pool = require("../db/pool");
const createId = require("./create-id");
const { importCollectionSchema } = require("../modules/hadeeth/hadeeth.validation");

function text(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeLangCode(value) {
  const code = text(value).toLowerCase();
  return code || "ar";
}

function emptyStats() {
  return {
    kitabs_created: 0,
    chapters_created: 0,
    hadeeth_created: 0,
    duplicates_skipped: 0
  };
}

function validatePayload(payload) {
  const parsed = importCollectionSchema.safeParse(payload);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join("; ");
    const error = new Error(message || "Invalid import payload.");
    error.statusCode = 400;
    throw error;
  }
  return parsed.data;
}

async function findBookByTitle(client, bookTitle) {
  const { rows } = await client.query(
    `
      SELECT id, title, author, notes, lang_code, is_published
      FROM books
      WHERE title = $1
      LIMIT 1
    `,
    [bookTitle]
  );
  return rows[0] || null;
}

async function findKitab(client, bookId, title) {
  const { rows } = await client.query(
    `
      SELECT id, book_id, title, notes, lang_code, is_published
      FROM kitabs
      WHERE book_id = $1
        AND title = $2
      LIMIT 1
    `,
    [bookId, title]
  );
  return rows[0] || null;
}

async function findChapter(client, kitabId, title) {
  const { rows } = await client.query(
    `
      SELECT id, book_id, kitab_id, title, notes, lang_code, is_published
      FROM chapters
      WHERE kitab_id = $1
        AND title = $2
      LIMIT 1
    `,
    [kitabId, title]
  );
  return rows[0] || null;
}

async function findHadeeth(client, chapterId, referenceNumber) {
  const { rows } = await client.query(
    `
      SELECT id, chapter_id, reference_number, arabic, tamil, english, reported_by, grade, is_published
      FROM hadeeth
      WHERE chapter_id = $1
        AND reference_number = $2
      LIMIT 1
    `,
    [chapterId, referenceNumber]
  );
  return rows[0] || null;
}

async function upsertKitab(client, bookId, kitabData, stats) {
  const title = text(kitabData.title);
  const langCode = normalizeLangCode(kitabData.lang_code);
  const existing = await findKitab(client, bookId, title);

  if (existing) {
    await client.query(
      `
        UPDATE kitabs
        SET lang_code = $2, is_published = true
        WHERE id = $1
      `,
      [existing.id, langCode]
    );
    stats.duplicates_skipped += 1;
    return existing.id;
  }

  const id = createId();
  await client.query(
    `
      INSERT INTO kitabs (id, book_id, title, notes, lang_code, is_published)
      VALUES ($1, $2, $3, NULL, $4, true)
    `,
    [id, bookId, title, langCode]
  );
  stats.kitabs_created += 1;
  return id;
}

async function upsertChapter(client, bookId, kitabId, chapterData, stats) {
  const title = text(chapterData.title);
  const langCode = normalizeLangCode(chapterData.lang_code);
  const existing = await findChapter(client, kitabId, title);

  if (existing) {
    await client.query(
      `
        UPDATE chapters
        SET book_id = $2, lang_code = $3, is_published = true
        WHERE id = $1
      `,
      [existing.id, bookId, langCode]
    );
    stats.duplicates_skipped += 1;
    return existing.id;
  }

  const id = createId();
  await client.query(
    `
      INSERT INTO chapters (id, book_id, kitab_id, title, notes, lang_code, is_published)
      VALUES ($1, $2, $3, $4, NULL, $5, true)
    `,
    [id, bookId, kitabId, title, langCode]
  );
  stats.chapters_created += 1;
  return id;
}

async function upsertHadeeth(client, chapterId, hadithData, stats) {
  const referenceNumber = Number(hadithData.reference_number);
  const arabic = text(hadithData.arabic);
  const tamil = text(hadithData.tamil);
  const english = text(hadithData.english);
  const reportedBy = text(hadithData.reported_by);
  const grade = text(hadithData.grade);

  if (!arabic && !english) {
    const error = new Error(
      `Hadith #${referenceNumber} must include arabic or english text.`
    );
    error.statusCode = 400;
    throw error;
  }

  const existing = await findHadeeth(client, chapterId, referenceNumber);

  if (existing) {
    await client.query(
      `
        UPDATE hadeeth
        SET
          arabic = $2,
          tamil = $3,
          english = $4,
          reported_by = $5,
          grade = $6,
          is_published = true
        WHERE id = $1
      `,
      [existing.id, arabic || null, tamil || null, english || null, reportedBy || null, grade || null]
    );
    stats.duplicates_skipped += 1;
    return existing.id;
  }

  const id = createId();
  await client.query(
    `
      INSERT INTO hadeeth (
        id, chapter_id, reference_number, arabic, tamil, english, reported_by, grade, is_published
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
    `,
    [id, chapterId, referenceNumber, arabic || null, tamil || null, english || null, reportedBy || null, grade || null]
  );
  stats.hadeeth_created += 1;
  return id;
}

async function importCollection(payload) {
  const data = validatePayload(payload);
  const stats = emptyStats();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const book = await findBookByTitle(client, data.book_title);
    if (!book) {
      const error = new Error(`Book not found: "${data.book_title}"`);
      error.statusCode = 404;
      throw error;
    }

    for (const kitabData of data.kitabs) {
      const kitabId = await upsertKitab(client, book.id, kitabData, stats);

      for (const chapterData of kitabData.chapters) {
        const chapterId = await upsertChapter(client, book.id, kitabId, chapterData, stats);

        for (const hadithData of chapterData.hadiths) {
          await upsertHadeeth(client, chapterId, hadithData, stats);
        }
      }
    }

    await client.query("COMMIT");

    return {
      book_id: book.id,
      book_title: book.title,
      ...stats
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function isCollectionImport(payload) {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      text(payload.book_title) &&
      Array.isArray(payload.kitabs)
  );
}

module.exports = {
  importCollection,
  isCollectionImport,
  emptyStats
};
