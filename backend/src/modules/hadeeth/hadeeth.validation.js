const { z, optionalBoolean, optionalInt } = require("../../utils/validation");

const hadeethIdParamSchema = z.object({
  id: z.string().length(24)
});

const hadeethQuerySchema = z.object({
  chapter_id: z.string().length(24).optional(),
  reference_number: optionalInt,
  is_published: optionalBoolean
});

const createHadeethSchema = z.object({
  chapter_id: z.string().length(24).optional(),
  reference_number: z.number().int().optional(),
  arabic: z.string().trim().optional(),
  english: z.string().trim().optional(),
  reported_by: z.string().trim().max(255).optional(),
  grade: z.string().trim().max(64).optional(),
  is_published: z.boolean().optional().default(true)
});

const updateHadeethSchema = createHadeethSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required for update." }
);

const importHadithSchema = z.object({
  reference_number: z.coerce.number().int().positive(),
  arabic: z.string().trim().optional().default(""),
  english: z.string().trim().optional().default(""),
  reported_by: z.string().trim().optional().default(""),
  grade: z.string().trim().optional().default("")
});

const importChapterSchema = z.object({
  title: z.string().trim().min(1).max(255),
  lang_code: z.string().trim().max(20).optional(),
  hadiths: z.array(importHadithSchema).optional().default([])
});

const importKitabSchema = z.object({
  title: z.string().trim().min(1).max(255),
  lang_code: z.string().trim().max(20).optional(),
  chapters: z.array(importChapterSchema).optional().default([])
});

const importCollectionSchema = z.object({
  book_title: z.string().trim().min(1).max(255),
  kitabs: z.array(importKitabSchema).min(1)
});

module.exports = {
  hadeethIdParamSchema,
  hadeethQuerySchema,
  createHadeethSchema,
  updateHadeethSchema,
  importCollectionSchema
};
