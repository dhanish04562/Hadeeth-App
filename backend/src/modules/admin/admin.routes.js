const express = require("express");
const asyncHandler = require("../../middlewares/async-handler");
const nodesService = require("../nodes/nodes.service");
const hadeethService = require("../hadeeth/hadeeth.service");
const languagesService = require("../languages/languages.service");
const pool = require("../../db/pool");
const { importCollection, isCollectionImport } = require("../../utils/import-collection");
const { importKitab, isKitabImport } = require("../../utils/import-kitab");

const fs = require("fs").promises;
const path = require("path");

const router = express.Router();

// =====================================================================
// Nodes CRUD (the unified hierarchy)
// =====================================================================

router.get(
  "/nodes",
  asyncHandler(async (req, res) => {
    const nodes = await nodesService.listNodes({
      ...req.query,
      parent_id: req.query.parentId ?? req.query.parent_id
    });
    res.json(nodes);
  })
);

router.post(
  "/nodes",
  asyncHandler(async (req, res) => {
    const node = await nodesService.createNode(req.body);
    res.status(201).json(node);
  })
);

router.get(
  "/nodes/:id",
  asyncHandler(async (req, res) => {
    const node = await nodesService.getNodeById(req.params.id);
    if (!node) {
      return res.status(404).json({ message: "Node not found." });
    }
    return res.json(node);
  })
);

async function updateNode(req, res) {
  const node = await nodesService.updateNode(req.params.id, req.body);
  if (!node) {
    return res.status(404).json({ message: "Node not found." });
  }
  return res.json(node);
}

router.patch("/nodes/:id", asyncHandler(updateNode));
router.put("/nodes/:id", asyncHandler(updateNode));

router.delete(
  "/nodes/:id",
  asyncHandler(async (req, res) => {
    try {
      const removed = await nodesService.deleteNode(req.params.id);
      return removed ? res.status(204).send() : res.status(404).json({ message: "Node not found." });
    } catch (err) {
      return res.status(err.statusCode || 500).json({ message: err.message });
    }
  })
);

router.get(
  "/nodes/:id/children",
  asyncHandler(async (req, res) => {
    const children = await nodesService.getNodeChildren(req.params.id, req.query);
    res.json(children);
  })
);

router.get(
  "/nodes/:id/ancestors",
  asyncHandler(async (req, res) => {
    const ancestors = await nodesService.getNodeAncestors(req.params.id);
    res.json(ancestors);
  })
);

// =====================================================================
// Hadeeth CRUD
// =====================================================================

router.get(
  "/hadeeth",
  asyncHandler(async (req, res) => {
    const records = await hadeethService.listHadeeth({
      ...req.query,
      node_id: req.query.nodeId ?? req.query.node_id ?? req.query.chapterId ?? req.query.chapter_id
    });
    res.json(records);
  })
);

router.post(
  "/hadeeth",
  asyncHandler(async (req, res) => {
    const record = await hadeethService.createHadeeth({
      ...req.body,
      node_id: req.body.node_id ?? req.body.chapter_id
    });
    res.status(201).json(record);
  })
);

router.get(
  "/hadeeth/:id",
  asyncHandler(async (req, res) => {
    const record = await hadeethService.getHadeethById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Hadeeth not found." });
    }
    return res.json(record);
  })
);

async function updateHadeeth(req, res) {
  const payload = { ...req.body };
  if (payload.chapter_id && !payload.node_id) payload.node_id = payload.chapter_id;
  delete payload.chapter_id;

  const record = await hadeethService.updateHadeeth(req.params.id, payload);
  if (!record) {
    return res.status(404).json({ message: "Hadeeth not found." });
  }
  return res.json(record);
}

router.patch("/hadeeth/:id", asyncHandler(updateHadeeth));
router.put("/hadeeth/:id", asyncHandler(updateHadeeth));

router.delete(
  "/hadeeth/:id",
  asyncHandler(async (req, res) => {
    const removed = await hadeethService.deleteHadeeth(req.params.id);
    return removed
      ? res.status(204).send()
      : res.status(404).json({ message: "Hadeeth not found." });
  })
);

// =====================================================================
// Languages CRUD
// =====================================================================

router.get(
  "/languages",
  asyncHandler(async (req, res) => {
    const records = await languagesService.listLanguages(req.query);
    res.json(records);
  })
);

router.post(
  "/languages",
  asyncHandler(async (req, res) => {
    const record = await languagesService.createLanguage(req.body);
    res.status(201).json(record);
  })
);

router.get(
  "/languages/:code",
  asyncHandler(async (req, res) => {
    const record = await languagesService.getLanguageByCode(req.params.code);
    if (!record) {
      return res.status(404).json({ message: "Language not found." });
    }
    return res.json(record);
  })
);

async function updateLanguage(req, res) {
  const record = await languagesService.updateLanguage(req.params.code, req.body);
  if (!record) {
    return res.status(404).json({ message: "Language not found." });
  }
  return res.json(record);
}

router.patch("/languages/:code", asyncHandler(updateLanguage));
router.put("/languages/:code", asyncHandler(updateLanguage));

router.delete(
  "/languages/:code",
  asyncHandler(async (req, res) => {
    const removed = await languagesService.deleteLanguage(req.params.code);
    return removed
      ? res.status(204).send()
      : res.status(404).json({ message: "Language not found." });
  })
);

// =====================================================================
// Import handlers
// =====================================================================

router.post(
  "/cleanup-trial-data",
  asyncHandler(async (req, res) => {
    const cleanupTrialData = require("../../utils/cleanup-trial-data");
    const result = await cleanupTrialData(pool);
    res.json(result);
  })
);

router.post(
  "/import-collection",
  asyncHandler(async (req, res) => {
    const stats = await importCollection(req.body);
    res.status(201).json({
      message: "Collection imported",
      stats
    });
  })
);

router.post(
  "/import-kitab",
  asyncHandler(async (req, res) => {
    const result = await importKitab(req.body);
    res.status(201).json({ message: "Kitab imported", result });
  })
);

router.get(
  "/cleanup-trial-data/preview",
  asyncHandler(async (req, res) => {
    const cleanupTrialData = require("../../utils/cleanup-trial-data");
    const result = await cleanupTrialData.previewTrialDataCleanup(pool);
    res.json(result);
  })
);

// POST /admin/import-json — unified recursive node importer (handles all shapes)
router.post(
  "/import-json",
  asyncHandler(async (req, res) => {
    const data = req.body;
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ message: "Empty JSON body" });
    }

    const filename = (req.query.filename || `upload-${Date.now()}.json`).replace(/[^a-zA-Z0-9-_.]/g, "_");
    const outDir = path.resolve(process.cwd(), "sample_imports");
    await fs.mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, filename);
    await fs.writeFile(outPath, JSON.stringify(data, null, 2), "utf8");

    const stats = { nodes_created: 0, hadiths_created: 0, duplicates_skipped: 0, errors: [] };

    async function importNode(jsonObj, parentId) {
      if (!jsonObj || typeof jsonObj !== "object") return;

      const title = jsonObj.title || jsonObj.name || jsonObj.book_title || jsonObj.book_name_ar || "";
      if (!title) return;

      const type = jsonObj.type || (parentId === null ? "book" : "chapter");
      const sortOrder = jsonObj.sort_order ?? jsonObj.order ?? 0;

      let node;
      try {
        node = await nodesService.createNode({
          parent_id: parentId,
          type,
          title,
          is_published: jsonObj.is_published ?? true,
          sort_order: sortOrder
        });
        stats.nodes_created++;
      } catch (err) {
        stats.errors.push({ title, error: err.message });
        return;
      }

      for (const key of Object.keys(jsonObj)) {
        if (Array.isArray(jsonObj[key])) {
          if (key === "hadiths" || key === "hadeeth") {
            for (const h of jsonObj[key]) {
              try {
                await hadeethService.createHadeeth({
                  node_id: node.id,
                  reference_number: Number(h.number ?? h.reference_number ?? h.reference ?? 0),
                  arabic: String(h.arabic ?? ""),
                  tamil: String(h.tamil ?? ""),
                  english: String(h.english ?? h.hadeeth ?? h.content ?? ""),
                  reported_by: String(h.reported_by ?? h.reportedBy ?? ""),
                  grade: String(h.grade ?? ""),
                  is_published: h.is_published ?? true
                });
                stats.hadiths_created++;
              } catch (err) {
                stats.errors.push({ hadith: h.number || "?", error: err.message });
              }
            }
          } else {
            for (const child of jsonObj[key]) {
              await importNode(child, node.id);
            }
          }
        }
      }
    }

    await importNode(data, null);

    res.status(201).json({
      message: "Imported via recursive node walk",
      file: `sample_imports/${filename}`,
      stats
    });
  })
);

// =====================================================================
// Legacy backward-compat admin routes (delegate to nodes)
// =====================================================================

router.get(
  "/books",
  asyncHandler(async (req, res) => {
    const nodes = await nodesService.listNodes({ parent_id: "null", type: "book" });
    res.json(nodes);
  })
);

router.post(
  "/books",
  asyncHandler(async (req, res) => {
    const node = await nodesService.createNode({
      parent_id: null,
      type: "book",
      title: req.body.title,
      is_published: req.body.is_published ?? req.body.isPublished ?? false
    });
    res.status(201).json(node);
  })
);

router.get(
  "/books/:id",
  asyncHandler(async (req, res) => {
    const node = await nodesService.getNodeById(req.params.id);
    if (!node) return res.status(404).json({ message: "Book not found." });
    return res.json(node);
  })
);

async function updateBook(req, res) {
  const node = await nodesService.updateNode(req.params.id, {
    title: req.body.title,
    is_published: req.body.is_published ?? req.body.isPublished
  });
  if (!node) return res.status(404).json({ message: "Book not found." });
  return res.json(node);
}

router.patch("/books/:id", asyncHandler(updateBook));
router.put("/books/:id", asyncHandler(updateBook));

router.delete(
  "/books/:id",
  asyncHandler(async (req, res) => {
    try {
      const removed = await nodesService.deleteNode(req.params.id);
      return removed ? res.status(204).send() : res.status(404).json({ message: "Book not found." });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  })
);

module.exports = router;
