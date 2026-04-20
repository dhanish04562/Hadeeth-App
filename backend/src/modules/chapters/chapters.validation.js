const { z, optionalBoolean } = require("../../utils/validation");

const chapterIdParamSchema = z.object({
  id: z.string().length(24)
});

const chapterQuerySchema = z.object({
  book_id: z.string().length(24).optional(),
  parent_id: z.string().length(24).optional(),
  lang_code: z.string().trim().min(1).max(6).optional(),
  is_published: optionalBoolean
});

const createChapterSchema = z.object({
  title: z.string().trim().min(1).max(255),
  parent_id: z.string().length(24).optional(),
  book_id: z.string().length(24).optional(),
  is_published: z.boolean().optional().default(false),
  notes: z.string().trim().optional(),
  lang_code: z.string().trim().max(6).optional()
});

const updateChapterSchema = createChapterSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required for update." }
);

module.exports = {
  chapterIdParamSchema,
  chapterQuerySchema,
  createChapterSchema,
  updateChapterSchema
};
