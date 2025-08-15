// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const SalesController = require('../controllers/sales/SalesController');

// Example routes
router.post('/sales/login', SalesController.salesLogin);
router.get('/sales/profile', SalesController.salesProfile);
router.put('/sales/profile', SalesController.editSalesProfile);

module.exports = router;
