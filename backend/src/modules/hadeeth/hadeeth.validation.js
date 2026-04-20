const { z, optionalBoolean, optionalInt } = require("../../utils/validation");

const hadeethIdParamSchema = z.object({
  id: z.string().length(24)
});

const hadeethQuerySchema = z.object({
  chapter_id: z.string().length(24).optional(),
  lang_code: z.string().trim().min(1).max(6).optional(),
  is_published: optionalBoolean,
  refernce_number: optionalInt
});

const createHadeethSchema = z.object({
  chapter_id: z.string().length(24).optional(),
  is_published: z.boolean().optional().default(false),
  notes: z.string().trim().optional(),
  hadeeth: z.string().trim().optional(),
  refernce_number: z.number().int().optional(),
  reported_by: z.string().trim().max(255).optional(),
  lang_code: z.string().trim().max(6).optional()
});

const updateHadeethSchema = createHadeethSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required for update." }
);

module.exports = {
  hadeethIdParamSchema,
  hadeethQuerySchema,
  createHadeethSchema,
  updateHadeethSchema
};
