const express = require("express");
const store = require("../../mock/store");

const router = express.Router();

router.get("/books", (req, res) => {
  res.json(store.adminList("books"));
});

router.post("/books", (req, res) => {
  res.status(201).json(store.createBook(req.body));
});

router.get("/books/:id", (req, res) => {
  const record = store.adminGet("books", req.params.id);

  if (!record) {
    return res.status(404).json({ message: "Book not found." });
  }

  return res.json(record);
});

router.put("/books/:id", (req, res) => {
  const record = store.updateBook(req.params.id, req.body);

  if (!record) {
    return res.status(404).json({ message: "Book not found." });
  }

  return res.json(record);
});

router.delete("/books/:id", (req, res) => {
  const removed = store.deleteBook(req.params.id);
  return removed ? res.status(204).send() : res.status(404).json({ message: "Book not found." });
});

router.get("/chapters", (req, res) => {
  res.json(store.adminList("chapters", req.query.bookId));
});

router.post("/chapters", (req, res) => {
  res.status(201).json(store.createChapter(req.body));
});

router.get("/chapters/:id", (req, res) => {
  const record = store.adminGet("chapters", req.params.id);

  if (!record) {
    return res.status(404).json({ message: "Chapter not found." });
  }

  return res.json(record);
});

router.put("/chapters/:id", (req, res) => {
  const record = store.updateChapter(req.params.id, req.body);

  if (!record) {
    return res.status(404).json({ message: "Chapter not found." });
  }

  return res.json(record);
});

router.delete("/chapters/:id", (req, res) => {
  const removed = store.deleteChapter(req.params.id);
  return removed ? res.status(204).send() : res.status(404).json({ message: "Chapter not found." });
});

router.get("/hadeeth", (req, res) => {
  res.json(store.adminList("hadeeth", req.query.chapterId));
});

router.post("/hadeeth", (req, res) => {
  res.status(201).json(store.createHadeeth(req.body));
});

router.get("/hadeeth/:id", (req, res) => {
  const record = store.adminGet("hadeeth", req.params.id);

  if (!record) {
    return res.status(404).json({ message: "Hadeeth not found." });
  }

  return res.json(record);
});

router.put("/hadeeth/:id", (req, res) => {
  const record = store.updateHadeeth(req.params.id, req.body);

  if (!record) {
    return res.status(404).json({ message: "Hadeeth not found." });
  }

  return res.json(record);
});

router.delete("/hadeeth/:id", (req, res) => {
  const removed = store.deleteHadeeth(req.params.id);
  return removed
    ? res.status(204).send()
    : res.status(404).json({ message: "Hadeeth not found." });
});

router.get("/languages", (req, res) => {
  res.json(store.adminList("languages"));
});

router.post("/languages", (req, res) => {
  res.status(201).json(store.createLanguage(req.body));
});

router.get("/languages/:code", (req, res) => {
  const record = store.adminGet("languages", req.params.code);

  if (!record) {
    return res.status(404).json({ message: "Language not found." });
  }

  return res.json(record);
});

router.patch("/languages/:code", (req, res) => {
  const record = store.updateLanguage(req.params.code, req.body);

  if (!record) {
    return res.status(404).json({ message: "Language not found." });
  }

  return res.json(record);
});

router.delete("/languages/:code", (req, res) => {
  const removed = store.deleteLanguage(req.params.code);
  return removed
    ? res.status(204).send()
    : res.status(404).json({ message: "Language not found." });
});

module.exports = router;
