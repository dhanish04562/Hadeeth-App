const pool = require("../../db/pool");
const createId = require("../../utils/create-id");
const pickDefined = require("../../utils/pick-defined");

async function listBooks(filters) {
  const conditions = [];
  const values = [];

  if (filters.author) {
    values.push(filters.author);
    conditions.push(`author = $${values.length}`);
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
    SELECT id, title, author, notes, is_published, lang_code
    FROM books
    ${whereClause}
    ORDER BY title ASC
  `;

  const { rows } = await pool.query(query, values);
  return rows;
}

async function getBookById(id) {
  const { rows } = await pool.query(
    `
      SELECT id, title, author, notes, is_published, lang_code
      FROM books
      WHERE id = $1
    `,
    [id]
  );

  return rows[0] || null;
}

async function createBook(payload) {
  const id = createId();
  const { title, author, notes, is_published, lang_code } = payload;

  const { rows } = await pool.query(
    `
      INSERT INTO books (id, title, author, notes, is_published, lang_code)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, title, author, notes, is_published, lang_code
    `,
    [id, title, author || null, notes || null, is_published ?? false, lang_code || null]
  );

  return rows[0];
}

async function updateBook(id, payload) {
  const updates = pickDefined(payload);
  const entries = Object.entries(updates);

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
      UPDATE books
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING id, title, author, notes, is_published, lang_code
    `,
    values
  );

  return rows[0] || null;
}

async function deleteBook(id) {
  const result = await pool.query("DELETE FROM books WHERE id = $1", [id]);
  return result.rowCount > 0;
}

module.exports = {
  listBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};
