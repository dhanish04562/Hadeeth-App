const { z } = require("../../utils/validation");

const hadeethIdParamSchema = z.object({
  id: z.string().trim().min(1)
});

const hadeethQuerySchema = z.object({
  node_id: z.string().trim().optional(),
  chapter_id: z.string().trim().optional(),
  reference_number: z.coerce.number().int().optional(),
  is_published: z.union([z.boolean(), z.string()]).optional()
});

const createHadeethSchema = z.object({
  node_id: z.string().trim().nullable().optional(),
  chapter_id: z.string().trim().nullable().optional(),
  reference_number: z.number().int().nullable().optional(),
  arabic: z.string().optional(),
  tamil: z.string().optional(),
  english: z.string().optional(),
  reported_by: z.string().optional(),
  grade: z.string().optional(),
  is_published: z.boolean().optional()
});

const updateHadeethSchema = z.object({
  node_id: z.string().trim().nullable().optional(),
  chapter_id: z.string().trim().nullable().optional(),
  reference_number: z.number().int().nullable().optional(),
  arabic: z.string().optional(),
  tamil: z.string().optional(),
  english: z.string().optional(),
  reported_by: z.string().optional(),
  grade: z.string().optional(),
  is_published: z.boolean().optional()
});

module.exports = {
  hadeethIdParamSchema,
  hadeethQuerySchema,
  createHadeethSchema,
  updateHadeethSchema
};
