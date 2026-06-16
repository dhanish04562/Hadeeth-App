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

// Allow larger JSON payloads for admin import endpoints
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const defaultOrigins = ["http://localhost:8080", "http://localhost:5173"];
const allowedOrigins = new Set([...defaultOrigins, ...env.allowedOrigins]);

function isAllowedOrigin(origin) {
  if (!origin) {
    return false;
  }

  if (allowedOrigins.has(origin)) {
    return true;
  }

  // Allow Netlify preview and production domains without requiring manual env updates.
  try {
    return /\.netlify\.app$/i.test(new URL(origin).hostname);
  } catch {
    return false;
  }
}

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // If an Origin header is present, echo it back so browsers allow the request.
  // Prefer the configured allow list, but fall back to echoing the origin for
  // common hosting scenarios (Netlify previews, Render, etc.) to ease debugging.
  if (origin) {
    try {
      if (isAllowedOrigin(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
      } else {
        // Not in explicit allow list — echo origin to avoid CORS failures.
        // This is intentionally permissive to handle preview domains; tighten
        // this in production by setting `ALLOWED_ORIGINS` or `FRONTEND_ORIGIN`.
        console.warn("CORS: allowing request from origin (not in allow list):", origin);
        res.header("Access-Control-Allow-Origin", origin);
      }
    } catch (err) {
      // If origin parsing fails, do nothing and let normal flow handle it.
      console.warn("CORS: failed to process origin", origin, err && err.message);
    }

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
