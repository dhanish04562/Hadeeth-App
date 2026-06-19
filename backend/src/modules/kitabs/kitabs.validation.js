const { z, optionalBoolean } = require("../../utils/validation");

const kitabIdParamSchema = z.object({
  id: z.string().length(24)
});

const kitabQuerySchema = z.object({
  book_id: z.string().length(24).optional(),
  lang_code: z.string().trim().min(1).max(20).optional(),
  is_published: optionalBoolean
});

const createKitabSchema = z.object({
  title: z.string().trim().min(1).max(255),
  book_id: z.string().length(24),
  is_published: z.boolean().optional().default(true),
  notes: z.string().trim().optional(),
  lang_code: z.string().trim().max(20).optional()
});

const updateKitabSchema = createKitabSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required for update." }
);

module.exports = {
  kitabIdParamSchema,
  kitabQuerySchema,
  createKitabSchema,
  updateKitabSchema
};
