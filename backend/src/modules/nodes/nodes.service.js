const pool = require("../../db/pool");
const createId = require("../../utils/create-id");
const pickDefined = require("../../utils/pick-defined");

const SELECT_FIELDS = "id, parent_id, type, title, path::text AS path, is_published, sort_order, created_at, updated_at";

async function listNodes(filters) {
  const conditions = [];
  const values = [];

  if (filters.parent_id !== undefined) {
    if (filters.parent_id === null || filters.parent_id === "null") {
      conditions.push("parent_id IS NULL");
    } else {
      values.push(filters.parent_id);
      conditions.push(`parent_id = $${values.length}`);
    }
  }

  if (filters.type) {
    values.push(filters.type);
    conditions.push(`type = $${values.length}`);
  }

  if (filters.is_published !== undefined) {
    const boolVal = filters.is_published === true || filters.is_published === "true";
    values.push(boolVal);
    conditions.push(`is_published = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const query = `
    SELECT ${SELECT_FIELDS}
    FROM nodes
    ${whereClause}
    ORDER BY sort_order ASC, title ASC
  `;

  const { rows } = await pool.query(query, values);
  return rows;
}

async function getNodeById(id) {
  const { rows } = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM nodes WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function getNodeChildren(parentId, filters = {}) {
  const conditions = ["parent_id = $1"];
  const values = [parentId];
  let paramIndex = 2;

  if (filters.type) {
    values.push(filters.type);
    conditions.push(`type = $${paramIndex++}`);
  }

  if (filters.is_published !== undefined) {
    const boolVal = filters.is_published === true || filters.is_published === "true";
    values.push(boolVal);
    conditions.push(`is_published = $${paramIndex++}`);
  }

  const whereClause = conditions.join(" AND ");
  const query = `
    SELECT ${SELECT_FIELDS}
    FROM nodes
    WHERE ${whereClause}
    ORDER BY sort_order ASC, title ASC
  `;

  const { rows } = await pool.query(query, values);
  return rows;
}

async function getNodeAncestors(id) {
  const { rows } = await pool.query(
    `
      SELECT n.id, n.parent_id, n.type, n.title, n.path::text AS path
      FROM nodes n
      WHERE n.path @> (SELECT subpath(path, 0, 1) FROM nodes WHERE id = $1)
        AND n.id != $1
      ORDER BY nlevel(n.path) ASC
    `,
    [id]
  );
  return rows;
}

async function getNodeHadithCount(id) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM hadeeth WHERE node_id = $1`,
    [id]
  );
  return rows[0]?.count || 0;
}

async function createNode(payload) {
  const id = createId();
  const { parent_id, type, title, is_published, sort_order } = payload;

  const { rows } = await pool.query(
    `
      INSERT INTO nodes (id, parent_id, type, title, is_published, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING ${SELECT_FIELDS}
    `,
    [
      id,
      parent_id || null,
      type || "node",
      title,
      is_published ?? true,
      sort_order ?? 0
    ]
  );

  if (rows[0].parent_id) {
    await pool.query(
      `
        UPDATE nodes
        SET path = (SELECT path FROM nodes WHERE id = $1) || text2ltree($2)
        WHERE id = $3
      `,
      [rows[0].parent_id, rows[0].id, rows[0].id]
    );
  } else {
    await pool.query(
      `UPDATE nodes SET path = text2ltree($1) WHERE id = $2`,
      [rows[0].id, rows[0].id]
    );
  }

  const { rows: updated } = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM nodes WHERE id = $1`,
    [id]
  );
  return updated[0];
}

async function updateNode(id, payload) {
  const allowed = ["parent_id", "type", "title", "is_published", "sort_order"];
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
      UPDATE nodes
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING ${SELECT_FIELDS}
    `,
    values
  );

  if (rows[0] && payload.parent_id !== undefined) {
    if (rows[0].parent_id) {
      await pool.query(
        `
          UPDATE nodes
          SET path = (SELECT path FROM nodes WHERE id = $1) || text2ltree($2)
          WHERE id = $2
        `,
        [rows[0].parent_id, rows[0].id]
      );
    } else {
      await pool.query(
        `UPDATE nodes SET path = text2ltree($1) WHERE id = $1`,
        [rows[0].id]
      );
    }

    const { rows: refreshed } = await pool.query(
      `SELECT ${SELECT_FIELDS} FROM nodes WHERE id = $1`,
      [id]
    );
    return refreshed[0];
  }

  return rows[0] || null;
}

async function deleteNode(id) {
  const childCount = await getNodeChildCount(id);
  if (childCount > 0) {
    const error = new Error("Cannot delete node with children. Remove children first.");
    error.statusCode = 400;
    throw error;
  }
  const result = await pool.query("DELETE FROM nodes WHERE id = $1", [id]);
  return result.rowCount > 0;
}

async function getNodeChildCount(id) {
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS count FROM nodes WHERE parent_id = $1",
    [id]
  );
  return rows[0]?.count || 0;
}

module.exports = {
  listNodes,
  getNodeById,
  getNodeChildren,
  getNodeAncestors,
  getNodeHadithCount,
  createNode,
  updateNode,
  deleteNode
};
