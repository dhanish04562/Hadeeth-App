const express = require("express");
const asyncHandler = require("../../middlewares/async-handler");
const validate = require("../../middlewares/validate");
const controller = require("./chapters.controller");
const {
  chapterIdParamSchema,
  chapterQuerySchema,
  createChapterSchema,
  updateChapterSchema
} = require("./chapters.validation");

const router = express.Router();

router.get("/", validate({ query: chapterQuerySchema }), asyncHandler(controller.listChapters));
router.get("/:id", validate({ params: chapterIdParamSchema }), asyncHandler(controller.getChapter));
router.post("/", validate({ body: createChapterSchema }), asyncHandler(controller.createChapter));
router.patch(
  "/:id",
  validate({ params: chapterIdParamSchema, body: updateChapterSchema }),
  asyncHandler(controller.updateChapter)
);
router.delete(
  "/:id",
  validate({ params: chapterIdParamSchema }),
  asyncHandler(controller.deleteChapter)
);

module.exports = router;
