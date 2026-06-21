const { z } = require("../../utils/validation");

const nodeIdParamSchema = z.object({
  id: z.string().trim().min(1)
});

const nodeQuerySchema = z.object({
  parent_id: z.string().trim().optional(),
  type: z.string().trim().optional(),
  is_published: z.union([z.boolean(), z.string()]).optional()
});

const createNodeSchema = z.object({
  parent_id: z.string().trim().nullable().optional(),
  type: z.string().trim().min(1).max(32).default("node"),
  title: z.string().trim().min(1),
  is_published: z.boolean().optional(),
  sort_order: z.number().int().optional()
});

const updateNodeSchema = z.object({
  parent_id: z.string().trim().nullable().optional(),
  type: z.string().trim().min(1).max(32).optional(),
  title: z.string().trim().optional(),
  is_published: z.boolean().optional(),
  sort_order: z.number().int().optional()
});

module.exports = {
  nodeIdParamSchema,
  nodeQuerySchema,
  createNodeSchema,
  updateNodeSchema
};
