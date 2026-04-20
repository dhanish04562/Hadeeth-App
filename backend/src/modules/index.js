const express = require("express");
const publicRoutes = require("./public/public.routes");
const adminRoutes = require("./admin/admin.routes");

const router = express.Router();

router.use("/", publicRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
