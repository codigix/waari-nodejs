const express = require("express");
const { body } = require("express-validator");
const adminController = require("../controllers/admin/AdminController");

const router = express.Router();

// Admin login
router.post(
    "/login",
    [
        body("email").isEmail().withMessage("Invalid email").notEmpty().withMessage("Email is required"),
        body("password").notEmpty().withMessage("Password is required")
    ],
    adminController.adminLogin
);

// Add tour code
router.post(
    "/tour-code",
    [
        body("tourCodeName").notEmpty().withMessage("Tour code name is required"),
        body("tourCodeImage").notEmpty().withMessage("Tour code image is required")
    ],
    adminController.tourCode
);

// View all sales data
router.get("/view-sales-data", adminController.viewSalesData);

// Delete tour type
router.delete("/delete-tour-type/:id", adminController.deleteTourType);

module.exports = router;
