const express = require("express");
const asyncHandler = require("../../middlewares/async-handler");
const nodesService = require("../nodes/nodes.service");
const hadeethService = require("../hadeeth/hadeeth.service");
const languagesService = require("../languages/languages.service");

const router = express.Router();

// -- Languages (unchanged) --
router.get(
  "/languages",
  asyncHandler(async (req, res) => {
    const languages = await languagesService.listLanguages(req.query);
    res.json(languages);
  })
);

// -- Nodes-based public API --
// Root nodes (books)
router.get(
  "/public/nodes",
  asyncHandler(async (req, res) => {
    const nodes = await nodesService.listNodes({
      parent_id: req.query.parent_id ?? "null",
      type: req.query.type,
      is_published: true
    });
    res.json(nodes);
  })
);

router.get(
  "/public/nodes/:id",
  asyncHandler(async (req, res) => {
    const node = await nodesService.getNodeById(req.params.id);
    if (!node || !node.is_published) {
      return res.status(404).json({ message: "Node not found." });
    }
    return res.json(node);
  })
);

router.get(
  "/public/nodes/:id/children",
  asyncHandler(async (req, res) => {
    const node = await nodesService.getNodeById(req.params.id);
    if (!node || !node.is_published) {
      return res.status(404).json({ message: "Node not found." });
    }
    const children = await nodesService.getNodeChildren(req.params.id, {
      is_published: true,
      type: req.query.type
    });
    res.json(children);
  })
);

router.get(
  "/public/nodes/:id/ancestors",
  asyncHandler(async (req, res) => {
    const ancestors = await nodesService.getNodeAncestors(req.params.id);
    res.json(ancestors);
  })
);

router.get(
  "/public/nodes/:id/hadeeth",
  asyncHandler(async (req, res) => {
    const node = await nodesService.getNodeById(req.params.id);
    if (!node || !node.is_published) {
      return res.status(404).json({ message: "Node not found." });
    }
    const hadiths = await hadeethService.listHadeeth({
      node_id: req.params.id,
      is_published: true
    });
    res.json(hadiths);
  })
);

// -- Legacy backward-compatible routes (delegate to nodes) --
router.get(
  "/public/books",
  asyncHandler(async (req, res) => {
    const nodes = await nodesService.listNodes({ parent_id: "null", type: "book", is_published: true });
    res.json(nodes.map(n => ({ id: n.id, title: n.title, is_published: n.is_published })));
  })
);

router.get(
  "/public/books/:bookId",
  asyncHandler(async (req, res) => {
    const node = await nodesService.getNodeById(req.params.bookId);
    if (!node || !node.is_published) {
      return res.status(404).json({ message: "Book not found." });
    }
    return res.json({ id: node.id, title: node.title, is_published: node.is_published });
  })
);

router.get(
  "/public/books/:bookId/kitabs",
  asyncHandler(async (req, res) => {
    const children = await nodesService.getNodeChildren(req.params.bookId, { type: "kitab", is_published: true });
    res.json(children.map(n => ({ id: n.id, book_id: n.parent_id, title: n.title, is_published: n.is_published })));
  })
);

router.get(
  "/public/chapters/:chapterId",
  asyncHandler(async (req, res) => {
    const node = await nodesService.getNodeById(req.params.chapterId);
    if (!node || !node.is_published) {
      return res.status(404).json({ message: "Chapter not found." });
    }
    return res.json({ id: node.id, kitab_id: node.parent_id, title: node.title, is_published: node.is_published });
  })
);

router.get(
  "/public/chapters/:chapterId/hadeeth",
  asyncHandler(async (req, res) => {
    const hadiths = await hadeethService.listHadeeth({
      node_id: req.params.chapterId,
      is_published: true
    });
    res.json(hadiths);
  })
);

router.get(
  "/public/hadeeth/:hadeethId",
  asyncHandler(async (req, res) => {
    const item = await hadeethService.getHadeethById(req.params.hadeethId);
    if (!item || !item.is_published) {
      return res.status(404).json({ message: "Hadeeth not found." });
    }
    return res.json(item);
  })
);

router.get(
  "/public/hadeeth",
  asyncHandler(async (req, res) => {
    const items = await hadeethService.listHadeeth({
      is_published: true
    });
    res.json(items);
  })
);

module.exports = router;
