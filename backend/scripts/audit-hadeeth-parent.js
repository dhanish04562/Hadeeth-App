const pool = require("../src/db/pool");

async function audit() {
  const { rows } = await pool.query(
    `SELECT h.id AS hadeeth_id, h.chapter_id, c.title AS chapter_title, c.kitab_id
     FROM   hadeeth h
     JOIN   chapters c ON c.id = h.chapter_id
     WHERE  c.kitab_id IS NULL`
  );

  if (rows.length === 0) {
    console.log("OK — every hadeeth belongs to a chapter with a kitab.");
    return;
  }

  console.log(`WARNING — ${rows.length} hadeeth record(s) have no kitab:`);
  for (const row of rows) {
    console.log(`  hadeeth ${row.hadeeth_id} → chapter "${row.chapter_title}" (${row.chapter_id})`);
  }
}

audit()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => pool.end());
