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

app.use("/api", modulesRouter);

if (hasClientBuild) {
  app.use(express.static(distPath));

  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
