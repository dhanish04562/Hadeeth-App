const express = require("express");
const fs = require("fs");
const path = require("path");
const modulesRouter = require("./modules");
const errorHandler = require("./middlewares/error-handler");
const notFound = require("./middlewares/not-found");

const app = express();
const distPath = path.resolve(process.cwd(), "dist");
const hasClientBuild = fs.existsSync(distPath);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({
    message: "API is running"
  });
});

const pool = require("./db/pool");

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use("/api", modulesRouter);


app.use(notFound);
app.use(errorHandler);

module.exports = app;
