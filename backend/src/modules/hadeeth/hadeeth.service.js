const pool = require("../../db/pool");
const createId = require("../../utils/create-id");
const pickDefined = require("../../utils/pick-defined");

const SELECT_FIELDS =
  "id, chapter_id, reference_number, arabic, tamil, english, reported_by, grade, is_published";

async function listHadeeth(filters) {
  const conditions = [];
  const values = [];

  if (filters.chapter_id) {
    values.push(filters.chapter_id);
    conditions.push(`chapter_id = $${values.length}`);
  }

  if (filters.reference_number !== undefined) {
    values.push(filters.reference_number);
    conditions.push(`reference_number = $${values.length}`);
  }

  if (filters.is_published !== undefined) {
    values.push(filters.is_published);
    conditions.push(`is_published = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const query = `
    SELECT ${SELECT_FIELDS}
    FROM hadeeth
    ${whereClause}
    ORDER BY reference_number ASC NULLS LAST, id ASC
  `;

  const { rows } = await pool.query(query, values);
  return rows;
}

async function getHadeethById(id) {
  const { rows } = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM hadeeth WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findHadeethByChapterAndReference(chapterId, referenceNumber) {
  const { rows } = await pool.query(
    `
      SELECT ${SELECT_FIELDS}
      FROM hadeeth
      WHERE chapter_id = $1
        AND reference_number = $2
      LIMIT 1
    `,
    [chapterId, referenceNumber]
  );
  return rows[0] || null;
}

async function createHadeeth(payload) {
  const id = createId();
  const {
    chapter_id,
    reference_number,
    arabic,
    tamil,
    english,
    reported_by,
    grade,
    is_published
  } = payload;

  const { rows } = await pool.query(
    `
      INSERT INTO hadeeth (
        id, chapter_id, reference_number, arabic, tamil, english, reported_by, grade, is_published
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING ${SELECT_FIELDS}
    `,
    [
      id,
      chapter_id || null,
      reference_number ?? null,
      arabic || null,
      tamil || null,
      english || null,
      reported_by || null,
      grade || null,
      is_published ?? true
    ]
  );

  return rows[0];
}

async function updateHadeeth(id, payload) {
  const allowed = [
    "chapter_id",
    "reference_number",
    "arabic",
    "tamil",
    "english",
    "reported_by",
    "grade",
    "is_published"
  ];
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
      UPDATE hadeeth
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING ${SELECT_FIELDS}
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
  findHadeethByChapterAndReference,
  createHadeeth,
  updateHadeeth,
  deleteHadeeth
};
