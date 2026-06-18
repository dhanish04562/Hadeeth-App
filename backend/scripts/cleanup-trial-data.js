require("dotenv").config();

const pool = require("../src/db/pool");
const cleanupTrialData = require("../src/utils/cleanup-trial-data");

cleanupTrialData(pool)
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
