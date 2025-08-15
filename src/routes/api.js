const express = require("express");
const router = express.Router();

// Import grouped routes
const adminRoutes = require("./routes/adminRoutes");
const salesRoutes = require("./routes/salesRoutes");
const operationsRoutes = require("./routes/operationsRoutes");
const accountsRoutes = require("./routes/accountsRoutes");
const customTourRoutes = require("./routes/customTourRoutes");

// Mount route groups
router.use("/admin", adminRoutes);
router.use("/sales", salesRoutes);
router.use("/operations", operationsRoutes);
router.use("/accounts", accountsRoutes);
router.use("/custom-tour", customTourRoutes);

module.exports = router;
