// Simple script to list hadeeth that reference a top-level chapter (Kitab)
// Usage: node backend/scripts/audit-hadeeth-parent.js
const pool = require("../src/db/pool");

async function run() {
  try {
    const { rows } = await pool.query(
      `SELECT h.id AS hadeeth_id, h.chapter_id, c.title AS chapter_title, c.parent_id
       FROM   hadeeth h
       JOIN   chapters c ON c.id = h.chapter_id
       WHERE  c.parent_id IS NULL`
    );

    if (rows.length === 0) {
      console.log("No hadeeth point to top-level Kitab chapters.");
      process.exit(0);
    }

    console.log(`Found ${rows.length} hadeeth attached to top-level chapters:`);
    for (const r of rows) {
      console.log(`- hadeeth id=${r.hadeeth_id} chapter_id=${r.chapter_id} chapter_title="${r.chapter_title}"`);
    }
    process.exit(0);
  } catch (err) {
    console.error("Audit failed:", err && err.message);
    process.exit(2);
  }
}

run();
