const express = require("express");
const store = require("../../mock/store");

const router = express.Router();

router.get("/languages", (req, res) => {
  res.json(store.listLanguages());
});

router.get("/public/books", (req, res) => {
  res.json(store.listPublicBooks(req.query.lang || "ar"));
});

router.get("/public/books/:bookId", (req, res) => {
  const book = store.getPublicBook(req.params.bookId, req.query.lang || "ar");

  if (!book) {
    return res.status(404).json({ message: "Book not found." });
  }

  return res.json(book);
});

router.get("/public/books/:bookId/chapters", (req, res) => {
  res.json(store.listPublicChapters(req.params.bookId, req.query.lang || "ar"));
});

router.get("/public/chapters/:chapterId", (req, res) => {
  const chapter = store.getPublicChapter(req.params.chapterId, req.query.lang || "ar");

  if (!chapter) {
    return res.status(404).json({ message: "Chapter not found." });
  }

  return res.json(chapter);
});

router.get("/public/chapters/:chapterId/hadeeth", (req, res) => {
  res.json(store.listPublicHadeeth(req.params.chapterId, req.query.lang || "ar"));
});

router.get("/public/hadeeth/:hadeethId", (req, res) => {
  const item = store.getPublicHadeeth(req.params.hadeethId, req.query.lang || "ar");

  if (!item) {
    return res.status(404).json({ message: "Hadeeth not found." });
  }

  return res.json(item);
});


// ✅ NEW: GET ALL HADEETH
router.get("/public/hadeeth", (req, res) => {
  const books = store.listPublicBooks("en");

  let allHadeeth = [];

  books.forEach(book => {
    const chapters = store.listPublicChapters(book.id, "en");

    chapters.forEach(chapter => {
      const hadeeth = store.listPublicHadeeth(chapter.id, "en");
      allHadeeth = allHadeeth.concat(hadeeth);
    });
  });

  res.json(allHadeeth);
});

module.exports = router;