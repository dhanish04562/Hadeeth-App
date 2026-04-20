const express = require("express");
const asyncHandler = require("../../middlewares/async-handler");
const validate = require("../../middlewares/validate");
const controller = require("./languages.controller");
const {
  languageCodeParamSchema,
  languageQuerySchema,
  createLanguageSchema,
  updateLanguageSchema
} = require("./languages.validation");

const router = express.Router();

router.get("/", validate({ query: languageQuerySchema }), asyncHandler(controller.listLanguages));
router.get(
  "/:code",
  validate({ params: languageCodeParamSchema }),
  asyncHandler(controller.getLanguage)
);
router.post("/", validate({ body: createLanguageSchema }), asyncHandler(controller.createLanguage));
router.patch(
  "/:code",
  validate({ params: languageCodeParamSchema, body: updateLanguageSchema }),
  asyncHandler(controller.updateLanguage)
);
router.delete(
  "/:code",
  validate({ params: languageCodeParamSchema }),
  asyncHandler(controller.deleteLanguage)
);

module.exports = router;
