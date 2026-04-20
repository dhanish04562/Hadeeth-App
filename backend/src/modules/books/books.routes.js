const express = require("express");
const asyncHandler = require("../../middlewares/async-handler");
const validate = require("../../middlewares/validate");
const controller = require("./books.controller");
const {
  bookIdParamSchema,
  bookQuerySchema,
  createBookSchema,
  updateBookSchema
} = require("./books.validation");

const router = express.Router();

router.get("/", validate({ query: bookQuerySchema }), asyncHandler(controller.listBooks));
router.get("/:id", validate({ params: bookIdParamSchema }), asyncHandler(controller.getBook));
router.post("/", validate({ body: createBookSchema }), asyncHandler(controller.createBook));
router.patch(
  "/:id",
  validate({ params: bookIdParamSchema, body: updateBookSchema }),
  asyncHandler(controller.updateBook)
);
router.delete("/:id", validate({ params: bookIdParamSchema }), asyncHandler(controller.deleteBook));

module.exports = router;
