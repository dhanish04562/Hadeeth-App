const pool = require("../../db/pool");
const createId = require("../../utils/create-id");
const pickDefined = require("../../utils/pick-defined");

const SELECT_FIELDS = "id, book_id, title, notes, lang_code, is_published, source_key, sort_order";

async function listKitabs(filters) {
  const conditions = [];
  const values = [];

  if (filters.book_id) {
    values.push(filters.book_id);
    conditions.push(`book_id = $${values.length}`);
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
    FROM kitabs
    ${whereClause}
    ORDER BY sort_order ASC NULLS LAST, title ASC
  `;

  const { rows } = await pool.query(query, values);
  return rows;
}

async function getKitabById(id) {
  const { rows } = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM kitabs WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function createKitab(payload) {
  const id = createId();
  const { title, book_id, is_published, notes, lang_code, source_key, sort_order } = payload;

  const { rows } = await pool.query(
    `
      INSERT INTO kitabs (id, title, book_id, is_published, notes, lang_code, source_key, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING ${SELECT_FIELDS}
    `,
    [
      id,
      title,
      book_id,
      is_published ?? true,
      notes || null,
      lang_code || null,
      source_key || null,
      sort_order ?? null
    ]
  );

  return rows[0];
}

async function updateKitab(id, payload) {
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
      UPDATE kitabs
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING ${SELECT_FIELDS}
    `,
    values
  );

  return rows[0] || null;
}

async function deleteKitab(id) {
  const result = await pool.query("DELETE FROM kitabs WHERE id = $1", [id]);
  return result.rowCount > 0;
}

module.exports = {
  listKitabs,
  getKitabById,
  createKitab,
  updateKitab,
  deleteKitab
};
