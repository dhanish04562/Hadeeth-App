const pool = require("../../db/pool");
const createId = require("../../utils/create-id");
const pickDefined = require("../../utils/pick-defined");

async function listHadeeth(filters) {
  const conditions = [];
  const values = [];

  if (filters.chapter_id) {
    values.push(filters.chapter_id);
    conditions.push(`chapter_id = $${values.length}`);
  }

  if (filters.lang_code) {
    values.push(filters.lang_code);
    conditions.push(`lang_code = $${values.length}`);
  }

  if (filters.refernce_number !== undefined) {
    values.push(filters.refernce_number);
    conditions.push(`refernce_number = $${values.length}`);
  }

  if (filters.is_published !== undefined) {
    values.push(filters.is_published);
    conditions.push(`is_published = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const query = `
    SELECT id, chapter_id, is_published, notes, hadeeth, refernce_number, reported_by, lang_code
    FROM hadeeth
    ${whereClause}
    ORDER BY refernce_number ASC NULLS LAST, id ASC
  `;

  const { rows } = await pool.query(query, values);
  return rows;
}

async function getHadeethById(id) {
  const { rows } = await pool.query(
    `
      SELECT id, chapter_id, is_published, notes, hadeeth, refernce_number, reported_by, lang_code
      FROM hadeeth
      WHERE id = $1
    `,
    [id]
  );

  return rows[0] || null;
}

async function createHadeeth(payload) {
  const id = createId();
  const {
    chapter_id,
    is_published,
    notes,
    hadeeth,
    refernce_number,
    reported_by,
    lang_code
  } = payload;

  const { rows } = await pool.query(
    `
      INSERT INTO hadeeth (
        id,
        chapter_id,
        is_published,
        notes,
        hadeeth,
        refernce_number,
        reported_by,
        lang_code
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, chapter_id, is_published, notes, hadeeth, refernce_number, reported_by, lang_code
    `,
    [
      id,
      chapter_id || null,
      is_published ?? false,
      notes || null,
      hadeeth || null,
      refernce_number ?? null,
      reported_by || null,
      lang_code || null
    ]
  );

  return rows[0];
}

async function updateHadeeth(id, payload) {
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
      UPDATE hadeeth
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING id, chapter_id, is_published, notes, hadeeth, refernce_number, reported_by, lang_code
    `,
    values
  );

  return rows[0] || null;
}

async function deleteHadeeth(id) {
  const result = await pool.query("DELETE FROM hadeeth WHERE id = $1", [id]);
  return result.rowCount > 0;
}

module.exports = {
  listHadeeth,
  getHadeethById,
  createHadeeth,
  updateHadeeth,
  deleteHadeeth
};
