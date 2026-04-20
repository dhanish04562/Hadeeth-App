const express = require("express");
const asyncHandler = require("../../middlewares/async-handler");
const validate = require("../../middlewares/validate");
const controller = require("./hadeeth.controller");
const {
  hadeethIdParamSchema,
  hadeethQuerySchema,
  createHadeethSchema,
  updateHadeethSchema
} = require("./hadeeth.validation");

const router = express.Router();

router.get("/", validate({ query: hadeethQuerySchema }), asyncHandler(controller.listHadeeth));
router.get("/:id", validate({ params: hadeethIdParamSchema }), asyncHandler(controller.getHadeeth));
router.post("/", validate({ body: createHadeethSchema }), asyncHandler(controller.createHadeeth));
router.patch(
  "/:id",
  validate({ params: hadeethIdParamSchema, body: updateHadeethSchema }),
  asyncHandler(controller.updateHadeeth)
);
router.delete(
  "/:id",
  validate({ params: hadeethIdParamSchema }),
  asyncHandler(controller.deleteHadeeth)
);

module.exports = router;
