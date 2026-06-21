const express = require("express");
const asyncHandler = require("../../middlewares/async-handler");
const validate = require("../../middlewares/validate");
const controller = require("./nodes.controller");
const {
  nodeIdParamSchema,
  nodeQuerySchema,
  createNodeSchema,
  updateNodeSchema
} = require("./nodes.validation");

const router = express.Router();

router.get("/", validate({ query: nodeQuerySchema }), asyncHandler(controller.listNodes));
router.get("/:id", validate({ params: nodeIdParamSchema }), asyncHandler(controller.getNode));
router.get("/:id/children", validate({ params: nodeIdParamSchema }), asyncHandler(controller.getNodeChildren));
router.get("/:id/ancestors", validate({ params: nodeIdParamSchema }), asyncHandler(controller.getNodeAncestors));
router.post("/", validate({ body: createNodeSchema }), asyncHandler(controller.createNode));
router.patch("/:id", validate({ params: nodeIdParamSchema, body: updateNodeSchema }), asyncHandler(controller.updateNode));
router.put("/:id", validate({ params: nodeIdParamSchema, body: updateNodeSchema }), asyncHandler(controller.updateNode));
router.delete("/:id", validate({ params: nodeIdParamSchema }), asyncHandler(controller.deleteNode));

module.exports = router;
