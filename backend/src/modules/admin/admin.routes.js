const express = require("express");
const asyncHandler = require("../../middlewares/async-handler");
const booksService = require("../books/books.service");
const chaptersService = require("../chapters/chapters.service");
const hadeethService = require("../hadeeth/hadeeth.service");
const languagesService = require("../languages/languages.service");
const cleanupTrialData = require("../../utils/cleanup-trial-data");
const pool = require("../../db/pool");
const { importKitab, isKitabImport } = require("../../utils/import-kitab");

const fs = require("fs").promises;
const path = require("path");

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

router.post(
  "/cleanup-trial-data",
  asyncHandler(async (req, res) => {
    const result = await cleanupTrialData(pool);
    res.json(result);
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
    const result = await cleanupTrialData.previewTrialDataCleanup(pool);
    res.json(result);
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

// POST /admin/import-json
// Accepts JSON body, writes it to sample_imports/<filename>.json and attempts
// to import contained records into the running mock or database-backed API.
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

    if (isKitabImport(data)) {
      const result = await importKitab(data);
      return res.status(201).json({
        message: "Kitab imported",
        file: `sample_imports/${filename}`,
        result
      });
    }

    // Attempt to import into running backend state
    try {
      const env = require("../../config/env");

      // Helper to map created IDs when importing relational data
      const idMap = { books: new Map(), chapters: new Map() };

      // Import languages
      if (Array.isArray(data.languages) && data.languages.length) {
        if (env.useMockApi) {
          const mock = require("../../mock/store");
          for (const lang of data.languages) {
            try {
              mock.createLanguage({ code: lang.code || String(lang), name: lang.name || lang.code || String(lang) });
            } catch (e) {
              // ignore individual failures
            }
          }
        } else {
          for (const lang of data.languages) {
            try {
              await languagesService.createLanguage({
                code: String(lang.code || "").trim().toLowerCase(),
                name: String(lang.name || lang.code || "").trim(),
                nativeName: String(lang.nativeName || lang.name || "").trim(),
                direction: lang.direction || "ltr"
              });
            } catch (e) {}
          }
        }
      }

      // Import books
      if (Array.isArray(data.books) && data.books.length) {
        for (const book of data.books) {
          try {
            if (env.useMockApi) {
              const mock = require("../../mock/store");
              const payload = {
                slug: book.slug,
                collectionNumber: book.collectionNumber,
                author: book.author || "",
                isPublished: book.is_published ?? book.isPublished ?? true,
                translations: {
                  en: { title: book.title || book.name || "", summary: book.summary || book.notes || "" }
                }
              };
              const created = mock.createBook(payload);
              if (book.id) idMap.books.set(book.id, created.id);
            } else {
              const created = await booksService.createBook({
                title: book.title || book.name || "",
                author: book.author || "",
                notes: book.summary || book.notes || null,
                is_published: book.is_published ?? book.isPublished ?? true,
                lang_code: book.lang_code || book.langCode || null
              });
              if (book.id) idMap.books.set(book.id, created.id);
            }
          } catch (e) {
            // ignore individual failures
          }
        }
      }

      // Import chapters (map book ids)
      if (Array.isArray(data.chapters) && data.chapters.length) {
        for (const chapter of data.chapters) {
          try {
            const bookId = chapter.bookId || chapter.book_id;
            const mappedBookId = bookId && idMap.books.has(bookId) ? idMap.books.get(bookId) : bookId;

            if (env.useMockApi) {
              const mock = require("../../mock/store");
              const payload = {
                bookId: mappedBookId || chapter.bookId || chapter.book_id || null,
                parentId: chapter.parentId || chapter.parent_id || null,
                chapterNumber: chapter.chapterNumber || chapter.number || null,
                isPublished: chapter.is_published ?? chapter.isPublished ?? true,
                translations: { en: { title: chapter.title || "", introduction: chapter.introduction || chapter.content || "" } }
              };
              const created = mock.createChapter(payload);
              if (chapter.id) idMap.chapters.set(chapter.id, created.id);
            } else {
              const created = await chaptersService.createChapter({
                title: chapter.title || "",
                book_id: mappedBookId || chapter.bookId || chapter.book_id || null,
                parent_id: chapter.parentId || chapter.parent_id || null,
                chapterNumber: chapter.chapterNumber || chapter.number || null,
                is_published: chapter.is_published ?? chapter.isPublished ?? true,
                notes: chapter.notes || chapter.summary || null,
                lang_code: chapter.lang_code || chapter.langCode || null
              });
              if (chapter.id) idMap.chapters.set(chapter.id, created.id);
            }
          } catch (e) {}
        }
      }

      // Import hadeeth (map chapter ids)
      if (Array.isArray(data.hadeeth) && data.hadeeth.length) {
        for (const item of data.hadeeth) {
          try {
            const chapterId = item.chapterId || item.chapter_id;
            const mappedChapterId = chapterId && idMap.chapters.has(chapterId) ? idMap.chapters.get(chapterId) : chapterId;

            if (env.useMockApi) {
              const mock = require("../../mock/store");
              const payload = {
                chapterId: mappedChapterId || item.chapterId || item.chapter_id || null,
                hadithNumber: item.hadithNumber || item.number || null,
                referenceNumber: item.referenceNumber || item.reference || null,
                reportedBy: item.reportedBy || item.reported_by || "",
                grade: item.grade || null,
                isPublished: item.is_published ?? item.isPublished ?? true,
                translations: { en: { text: item.english || item.hadeeth || item.content || "", notes: item.notes || "" } }
              };
              mock.createHadeeth(payload);
            } else {
              await hadeethService.createHadeeth({
                chapter_id: mappedChapterId || item.chapterId || item.chapter_id || null,
                hadeeth: item.english || item.hadeeth || item.content || "",
                refernce_number: item.referenceNumber || item.reference || null,
                reported_by: item.reportedBy || item.reported_by || "",
                is_published: item.is_published ?? item.isPublished ?? true,
                notes: item.notes || null,
                lang_code: item.lang_code || item.langCode || null
              });
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      // Non-fatal — file was saved; import attempt failed for some entries
      console.warn("Import attempt failed:", err && err.message);
    }

    return res.status(201).json({ message: "Imported", file: `sample_imports/${filename}` });
  })
);

module.exports = router;
