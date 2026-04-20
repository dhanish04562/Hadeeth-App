const { z, optionalBoolean } = require("../../utils/validation");

const bookIdParamSchema = z.object({
  id: z.string().length(24)
});

const bookQuerySchema = z.object({
  author: z.string().trim().min(1).optional(),
  lang_code: z.string().trim().min(1).max(6).optional(),
  is_published: optionalBoolean
});

const createBookSchema = z.object({
  title: z.string().trim().min(1).max(255),
  author: z.string().trim().max(255).optional(),
  notes: z.string().trim().optional(),
  is_published: z.boolean().optional().default(false),
  lang_code: z.string().trim().max(6).optional()
});

const updateBookSchema = createBookSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required for update." }
);

module.exports = {
  bookIdParamSchema,
  bookQuerySchema,
  createBookSchema,
  updateBookSchema
};
