const app = require("./app");
const env = require("./config/env");
const pool = require("./db/pool");

async function startServer() {
  try {
    if (!env.useMockApi) {
      await pool.query("SELECT 1");
    }

    app.listen(env.port, () => {
      console.log(
        `Server is running on port ${env.port} (${env.useMockApi ? "mock API mode" : "database mode"})`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
