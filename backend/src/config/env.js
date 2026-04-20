const dotenv = require("dotenv");

dotenv.config();

function parseBoolean(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  return value === "true";
}

const env = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL,
  useMockApi: parseBoolean(process.env.USE_MOCK_API, true)
};

if (!env.useMockApi && !env.databaseUrl) {
  throw new Error("DATABASE_URL is required when USE_MOCK_API is false.");
}

module.exports = env;
