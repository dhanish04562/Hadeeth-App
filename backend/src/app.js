const express = require("express");
const fs = require("fs");
const path = require("path");
const modulesRouter = require("./modules");
const errorHandler = require("./middlewares/error-handler");
const notFound = require("./middlewares/not-found");
const env = require("./config/env");

const app = express();
const distPath = path.resolve(process.cwd(), "dist");
const hasClientBuild = fs.existsSync(distPath);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const defaultOrigins = ["http://localhost:8080", "http://localhost:5173"];
const allowedOrigins = new Set([...defaultOrigins, ...env.allowedOrigins]);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Credentials", "true");
  }

  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  return next();
});

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
