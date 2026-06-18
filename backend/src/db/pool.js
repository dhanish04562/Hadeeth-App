const { Pool } = require("pg");

function shouldUseSsl(connectionString) {
  if (process.env.PGSSLMODE === "disable" || process.env.DB_SSL === "false") {
    return false;
  }

  if (process.env.DB_SSL === "true") {
    return true;
  }

  try {
    const host = new URL(connectionString).hostname;
    return !["localhost", "127.0.0.1", "::1"].includes(host);
  } catch {
    return false;
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: shouldUseSsl(process.env.DATABASE_URL) ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
