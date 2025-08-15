// src/routes/testRoutes.js
const express = require('express');
const router = express.Router();
const TestController = require('../controllers/TestController');

// =====================
// Predeparture Routes
// =====================
router.get('/test-predeparture', TestController.testPredeparture);
router.get('/generate-predeparture', TestController.generatePredeparture);

// =====================
// Printing Routes
// =====================
router.get('/test-print', TestController.testPrint);
router.get('/generate-print', TestController.generatePrint);

module.exports = router;
