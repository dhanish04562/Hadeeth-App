const pool = require("../../db/pool");
const createId = require("../../utils/create-id");
const pickDefined = require("../../utils/pick-defined");

const SELECT_FIELDS = "id, title, kitab_id, book_id, is_published, notes, lang_code";

async function listChapters(filters) {
  const conditions = [];
  const values = [];

  if (filters.book_id) {
    values.push(filters.book_id);
    conditions.push(`book_id = $${values.length}`);
  }

  if (filters.kitab_id) {
    values.push(filters.kitab_id);
    conditions.push(`kitab_id = $${values.length}`);
  }

  if (filters.lang_code) {
    values.push(filters.lang_code);
    conditions.push(`lang_code = $${values.length}`);
  }

  if (filters.is_published !== undefined) {
    values.push(filters.is_published);
    conditions.push(`is_published = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const query = `
    SELECT ${SELECT_FIELDS}
    FROM chapters
    ${whereClause}
    ORDER BY title ASC
  `;

  const { rows } = await pool.query(query, values);
  return rows;
}

async function getChapterById(id) {
  const { rows } = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM chapters WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function createChapter(payload) {
  const id = createId();
  const { title, kitab_id, book_id, is_published, notes, lang_code } = payload;

  const { rows } = await pool.query(
    `
      INSERT INTO chapters (id, title, kitab_id, book_id, is_published, notes, lang_code)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING ${SELECT_FIELDS}
    `,
    [
      id,
      title,
      kitab_id || null,
      book_id || null,
      is_published ?? false,
      notes || null,
      lang_code || null
    ]
  );

  return rows[0];
}

async function updateChapter(id, payload) {
  const allowed = ["title", "kitab_id", "book_id", "is_published", "notes", "lang_code"];
  const updates = pickDefined(payload);
  const entries = Object.entries(updates).filter(([key]) => allowed.includes(key));

  if (!entries.length) {
    const error = new Error("No fields were provided to update.");
    error.statusCode = 400;
    throw error;
  }

  const values = entries.map(([, value]) => value);
  const setClause = entries
    .map(([key], index) => `${key} = $${index + 1}`)
    .join(", ");

  values.push(id);

  const { rows } = await pool.query(
    `
      UPDATE chapters
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING ${SELECT_FIELDS}
    `,
    values
  );

  return rows[0] || null;
}

async function deleteChapter(id) {
  const result = await pool.query("DELETE FROM chapters WHERE id = $1", [id]);
  return result.rowCount > 0;
}

module.exports = {
  listChapters,
  getChapterById,
  createChapter,
  updateChapter,
  deleteChapter
};
