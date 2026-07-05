require('dotenv').config();
const pool = require('../src/db/pool');
async function check() {
  const c = await pool.connect();
  const cols = await c.query(
    `SELECT column_name, data_type FROM information_schema.columns 
     WHERE table_name = 'hadeeth' ORDER BY ordinal_position`
  );
  console.log('hadeeth columns:');
  cols.rows.forEach(r => console.log(' ', r.column_name, r.data_type));

  const cols2 = await c.query(
    `SELECT column_name, data_type FROM information_schema.columns 
     WHERE table_name = 'nodes' ORDER BY ordinal_position`
  );
  console.log('nodes columns:');
  cols2.rows.forEach(r => console.log(' ', r.column_name, r.data_type));
  
  await c.release();
  await pool.end();
}
check().catch(e => console.error(e.message));
