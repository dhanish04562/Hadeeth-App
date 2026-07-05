require('dotenv').config();
const pool = require('../src/db/pool');

async function check() {
  const c = await pool.connect();

  // Check if node_id exists
  const r1 = await c.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name='hadeeth' AND column_name='node_id'`
  );
  console.log('node_id column:', r1.rows.length > 0 ? 'EXISTS' : 'MISSING');

  // Check migrations table
  const r2 = await c.query(
    `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name='migrations')`
  );
  if (r2.rows[0].exists) {
    const r3 = await c.query('SELECT * FROM migrations ORDER BY id');
    r3.rows.forEach(m => console.log('Migration:', m.id, m.name, m.applied_at));
  } else {
    console.log('No migrations table');
  }

  // Test the hadith query
  try {
    const r4 = await c.query('SELECT node_id FROM hadeeth LIMIT 1');
    console.log('hadeeth node_id values:', r4.rows.length > 0 ? r4.rows[0].node_id : 'empty table');
  } catch(e) {
    console.log('hadeeth query failed:', e.message);
  }

  // Count hadith with/without node_id
  const r5 = await c.query('SELECT COUNT(*) as total, COUNT(node_id) as with_node FROM hadeeth');
  console.log('Hadith total:', r5.rows[0].total, 'with node_id:', r5.rows[0].with_node);

  await c.release();
  await pool.end();
}
check().catch(e => console.error(e.message));
