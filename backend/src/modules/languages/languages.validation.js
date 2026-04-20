const { z } = require("../../utils/validation");

const languageCodeParamSchema = z.object({
  code: z.string().trim().min(1).max(6)
});

const languageQuerySchema = z.object({
  name: z.string().trim().min(1).optional()
});

const createLanguageSchema = z.object({
  code: z.string().trim().min(1).max(6),
  name: z.string().trim().min(1).max(24)
});

const updateLanguageSchema = z.object({
  name: z.string().trim().min(1).max(24)
});

module.exports = {
  languageCodeParamSchema,
  languageQuerySchema,
  createLanguageSchema,
  updateLanguageSchema
};
