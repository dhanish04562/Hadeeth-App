const pool = require("../../db/pool");

async function listLanguages(filters) {
  const values = [];
  let whereClause = "";

  if (filters.name) {
    values.push(`%${filters.name}%`);
    whereClause = `WHERE name ILIKE $1`;
  }

  const { rows } = await pool.query(
    `
      SELECT code, name
      FROM languages
      ${whereClause}
      ORDER BY name ASC
    `,
    values
  );

  return rows;
}

async function getLanguageByCode(code) {
  const { rows } = await pool.query(
    `
      SELECT code, name
      FROM languages
      WHERE code = $1
    `,
    [code]
  );

  return rows[0] || null;
}

async function createLanguage(payload) {
  const { rows } = await pool.query(
    `
      INSERT INTO languages (code, name)
      VALUES ($1, $2)
      RETURNING code, name
    `,
    [payload.code, payload.name]
  );

  return rows[0];
}

async function updateLanguage(code, payload) {
  const { rows } = await pool.query(
    `
      UPDATE languages
      SET name = $1
      WHERE code = $2
      RETURNING code, name
    `,
    [payload.name, code]
  );

  return rows[0] || null;
}

async function deleteLanguage(code) {
  const result = await pool.query("DELETE FROM languages WHERE code = $1", [code]);
  return result.rowCount > 0;
}

module.exports = {
  listLanguages,
  getLanguageByCode,
  createLanguage,
  updateLanguage,
  deleteLanguage
};
