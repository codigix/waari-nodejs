// routes/couponRoutes.js
const express = require("express");
const router = express.Router();
const couponController = require("../controllers/admin/CouponController");

// ================== ROUTES ==================

// Add coupon
router.post("/coupons", couponController.addCoupon);

// List coupons (with pagination via query params)
router.get("/coupons", couponController.couponsList);

// Edit coupon
router.put("/coupons", couponController.editCouponInfo);

// Update coupon status
router.patch("/coupons/status", couponController.updateStatusCoupon);

// Get single coupon data
router.post("/coupons/data", couponController.couponData);

// Active coupons for a guest
router.post("/coupons/active", couponController.activeCouponList);

module.exports = router;

