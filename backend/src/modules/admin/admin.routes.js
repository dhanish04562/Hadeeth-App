const express = require("express");
const asyncHandler = require("../../middlewares/async-handler");
const booksService = require("../books/books.service");
const chaptersService = require("../chapters/chapters.service");
const hadeethService = require("../hadeeth/hadeeth.service");
const languagesService = require("../languages/languages.service");

const router = express.Router();

router.get(
  "/books",
  asyncHandler(async (req, res) => {
    const records = await booksService.listBooks(req.query);
    res.json(records);
  })
);

router.post(
  "/books",
  asyncHandler(async (req, res) => {
    const record = await booksService.createBook(req.body);
    res.status(201).json(record);
  })
);

router.get(
  "/books/:id",
  asyncHandler(async (req, res) => {
    const record = await booksService.getBookById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Book not found." });
    }
    return res.json(record);
  })
);

async function updateBook(req, res) {
  const record = await booksService.updateBook(req.params.id, req.body);
  if (!record) {
    return res.status(404).json({ message: "Book not found." });
  }
  return res.json(record);
}

router.patch("/books/:id", asyncHandler(updateBook));
router.put("/books/:id", asyncHandler(updateBook));

router.delete(
  "/books/:id",
  asyncHandler(async (req, res) => {
    const removed = await booksService.deleteBook(req.params.id);
    return removed ? res.status(204).send() : res.status(404).json({ message: "Book not found." });
  })
);

router.get(
  "/chapters",
  asyncHandler(async (req, res) => {
    const records = await chaptersService.listChapters({
      ...req.query,
      book_id: req.query.bookId || req.query.book_id
    });
    res.json(records);
  })
);

router.post(
  "/chapters",
  asyncHandler(async (req, res) => {
    const record = await chaptersService.createChapter(req.body);
    res.status(201).json(record);
  })
);

router.get(
  "/chapters/:id",
  asyncHandler(async (req, res) => {
    const record = await chaptersService.getChapterById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Chapter not found." });
    }
    return res.json(record);
  })
);

async function updateChapter(req, res) {
  const record = await chaptersService.updateChapter(req.params.id, req.body);
  if (!record) {
    return res.status(404).json({ message: "Chapter not found." });
  }
  return res.json(record);
}

router.patch("/chapters/:id", asyncHandler(updateChapter));
router.put("/chapters/:id", asyncHandler(updateChapter));

router.delete(
  "/chapters/:id",
  asyncHandler(async (req, res) => {
    const removed = await chaptersService.deleteChapter(req.params.id);
    return removed
      ? res.status(204).send()
      : res.status(404).json({ message: "Chapter not found." });
  })
);

router.get(
  "/hadeeth",
  asyncHandler(async (req, res) => {
    const records = await hadeethService.listHadeeth({
      ...req.query,
      chapter_id: req.query.chapterId || req.query.chapter_id
    });
    res.json(records);
  })
);

router.post(
  "/hadeeth",
  asyncHandler(async (req, res) => {
    const record = await hadeethService.createHadeeth(req.body);
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
  const record = await hadeethService.updateHadeeth(req.params.id, req.body);
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

module.exports = router;
