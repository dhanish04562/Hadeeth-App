const pool = require("../../db/pool");
const createId = require("../../utils/create-id");
const pickDefined = require("../../utils/pick-defined");

let hasNodeIdColumnCache;

async function hasNodeIdColumn() {
  if (hasNodeIdColumnCache !== undefined) {
    return hasNodeIdColumnCache;
  }

  const { rows } = await pool.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'hadeeth'
          AND column_name = 'node_id'
      ) AS exists
    `
  );

  hasNodeIdColumnCache = rows[0]?.exists === true;
  return hasNodeIdColumnCache;
}

async function getHadeethColumns() {
  const nodeColumn = (await hasNodeIdColumn()) ? "node_id" : "chapter_id";
  const selectFields =
    `id, ${nodeColumn} AS node_id, reference_number, arabic, tamil, english, reported_by, grade, is_published`;

  return { nodeColumn, selectFields };
}

async function listHadeeth(filters) {
  const { nodeColumn, selectFields } = await getHadeethColumns();
  const conditions = [];
  const values = [];

  if (filters.node_id) {
    values.push(filters.node_id);
    conditions.push(`${nodeColumn} = $${values.length}`);
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
    SELECT ${selectFields}
    FROM hadeeth
    ${whereClause}
    ORDER BY reference_number ASC NULLS LAST, id ASC
  `;

  const { rows } = await pool.query(query, values);
  return rows;
}

async function getHadeethById(id) {
  const { selectFields } = await getHadeethColumns();
  const { rows } = await pool.query(
    `SELECT ${selectFields} FROM hadeeth WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findHadeethByNodeAndReference(nodeId, referenceNumber) {
  const { nodeColumn, selectFields } = await getHadeethColumns();
  const { rows } = await pool.query(
    `
      SELECT ${selectFields}
      FROM hadeeth
      WHERE ${nodeColumn} = $1
        AND reference_number = $2
      LIMIT 1
    `,
    [nodeId, referenceNumber]
  );
  return rows[0] || null;
}

async function createHadeeth(payload) {
  const { nodeColumn, selectFields } = await getHadeethColumns();
  const id = createId();
  const {
    node_id,
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
        id, ${nodeColumn}, reference_number, arabic, tamil, english, reported_by, grade, is_published
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING ${selectFields}
    `,
    [
      id,
      node_id || null,
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
  const { nodeColumn, selectFields } = await getHadeethColumns();
  const allowed = [
    "node_id",
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
    .map((assignment) => assignment.replace(/^node_id =/, `${nodeColumn} =`))
    .join(", ");

  values.push(id);

  const { rows } = await pool.query(
    `
      UPDATE hadeeth
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING ${selectFields}
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
  findHadeethByNodeAndReference,
  createHadeeth,
  updateHadeeth,
  deleteHadeeth
};
