const express = require("express");
const asyncHandler = require("../../middlewares/async-handler");
const booksService = require("../books/books.service");
const chaptersService = require("../chapters/chapters.service");
const hadeethService = require("../hadeeth/hadeeth.service");
const languagesService = require("../languages/languages.service");

const router = express.Router();

function getLangCode(query) {
  return query.lang || query.lang_code;
}

router.get(
  "/languages",
  asyncHandler(async (req, res) => {
    const languages = await languagesService.listLanguages(req.query);
    res.json(languages);
  })
);

router.get(
  "/public/books",
  asyncHandler(async (req, res) => {
    const books = await booksService.listBooks({
      lang_code: getLangCode(req.query),
      is_published: true
    });
    res.json(books);
  })
);

router.get(
  "/public/books/:bookId",
  asyncHandler(async (req, res) => {
    const book = await booksService.getBookById(req.params.bookId);
    if (!book || !book.is_published) {
      return res.status(404).json({ message: "Book not found." });
    }
    return res.json(book);
  })
);

router.get(
  "/public/books/:bookId/chapters",
  asyncHandler(async (req, res) => {
    const chapters = await chaptersService.listChapters({
      book_id: req.params.bookId,
      lang_code: getLangCode(req.query),
      is_published: true
    });
    res.json(chapters);
  })
);

router.get(
  "/public/chapters/:chapterId",
  asyncHandler(async (req, res) => {
    const chapter = await chaptersService.getChapterById(req.params.chapterId);
    if (!chapter || !chapter.is_published) {
      return res.status(404).json({ message: "Chapter not found." });
    }
    return res.json(chapter);
  })
);

router.get(
  "/public/chapters/:chapterId/hadeeth",
  asyncHandler(async (req, res) => {
    const hadeeth = await hadeethService.listHadeeth({
      chapter_id: req.params.chapterId,
      lang_code: getLangCode(req.query),
      is_published: true
    });
    res.json(hadeeth);
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
      lang_code: getLangCode(req.query),
      is_published: true
    });
    res.json(items);
  })
);

module.exports = router;