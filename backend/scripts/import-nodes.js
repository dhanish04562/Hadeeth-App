require("dotenv").config();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const pool = require("../src/db/pool");

function createId() {
  return crypto.randomBytes(12).toString("hex");
}

function pick(obj, ...keys) {
  for (const key of keys) {
    const v = obj[key];
    if (v !== undefined && v !== null && v !== "") return String(v).trim();
  }
  return undefined;
}

function extractTitle(obj) {
  return pick(obj, "title", "book_title", "name", "arabic_title", "tamil_title") || "Untitled";
}

function inferType(obj, depth) {
  if (obj.type) return obj.type;
  if (depth === 0) return obj.book_title ? "book" : "collection";
  if (depth === 1) return "kitab";
  if (depth === 2) return "chapter";
  return "section";
}

function hadithArrays(obj) {
  const result = [];
  if (Array.isArray(obj.hadiths)) result.push(obj.hadiths);
  if (Array.isArray(obj.hadith) && obj.hadith !== obj.hadiths) result.push(obj.hadith);
  return result;
}

function childArrays(obj) {
  const result = [];
  for (const [key, val] of Object.entries(obj)) {
    if (key === "hadiths" || key === "hadith") continue;
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object" && !Array.isArray(val[0])) {
      result.push(val);
    }
  }
  return result;
}

async function importNode(obj, parentId, depth, client) {
  const id = createId();
  const title = extractTitle(obj);
  const type = inferType(obj, depth);
  const sortOrder = obj.sort_order ?? 0;

  await client.query(
    `INSERT INTO nodes (id, parent_id, type, title, is_published, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title`,
    [id, parentId, type, title, true, sortOrder]
  );

  if (parentId) {
    await client.query(
      `UPDATE nodes SET path = (SELECT path FROM nodes WHERE id = $1) || text2ltree($2) WHERE id = $2`,
      [parentId, id]
    );
  } else {
    await client.query(`UPDATE nodes SET path = text2ltree($1) WHERE id = $1`, [id]);
  }

  for (const hadiths of hadithArrays(obj)) {
    for (let i = 0; i < hadiths.length; i++) {
      const h = hadiths[i];
      const hid = createId();
      await client.query(
        `INSERT INTO hadeeth (id, node_id, reference_number, arabic, tamil, english, reported_by, grade, is_published)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           arabic = EXCLUDED.arabic, tamil = EXCLUDED.tamil`,
        [
          hid, id,
          h.reference_number || h.referenceNumber || h.number || i + 1,
          h.arabic || h.arabic_text || "",
          h.tamil || h.tamil_text || "",
          h.english || "",
          h.reported_by || h.reportedBy || h.references || "",
          h.grade || "",
          true,
        ]
      );
    }
  }

  for (const children of childArrays(obj)) {
    for (let i = 0; i < children.length; i++) {
      await importNode(children[i], id, depth + 1, client);
    }
  }

  return id;
}

async function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error("Usage: node scripts/import-nodes.js <path-to-json>");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(path.resolve(jsonPath), "utf8"));
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`INSERT INTO languages (code, name) VALUES ('ar', 'Arabic') ON CONFLICT (code) DO NOTHING`);
    await client.query(`INSERT INTO languages (code, name) VALUES ('ta', 'Tamil') ON CONFLICT (code) DO NOTHING`);

    if (Array.isArray(data)) {
      for (const item of data) {
        await importNode(item, null, 0, client);
      }
    } else {
      await importNode(data, null, 0, client);
    }

    await client.query("COMMIT");
    console.log("Import complete");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Import failed:", error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
