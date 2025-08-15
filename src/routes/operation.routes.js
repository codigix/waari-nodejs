const express = require("express");
const router = express.Router();

// ===== Controllers =====
const customizeTourController = require("../controllers/operations/CustomizeTourController");
const authController = require("../controllers/operations/AuthController");
const groupController = require("../controllers/operations/GroupController");

/* ------------------- CustomizeTour Routes ------------------- */
router.get("/customize-tours", customizeTourController.listTours);
router.post("/customize-tour", customizeTourController.createTour);
router.put("/customize-tour/:id", customizeTourController.updateTour);
router.delete("/customize-tour/:id", customizeTourController.deleteTour);

/* ------------------- Auth Routes ------------------- */
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/profile", authController.getProfile);

/* ------------------- Group Routes ------------------- */
router.get("/groups", groupController.listGroups);
router.post("/group", groupController.createGroup);
router.put("/group/:id", groupController.updateGroup);
router.delete("/group/:id", groupController.deleteGroup);

module.exports = router;
