const express = require('express');
const router = express.Router();

// Import controllers
const CustomTourController = require('../controllers/sales/CustomTourController');
const GroupTourController = require('../controllers/sales/GroupTourController');
const SalesController = require('../controllers/sales/SalesController');
const SalesDashboardController = require('../controllers/sales/SalesDashboardController');
const TailorMadeController = require('../controllers/sales/TailorMadeController');

// Custom Tour Routes
router.get('/custom-tours', CustomTourController.getCustomTours);
router.post('/custom-tours', CustomTourController.createCustomTour);

// Group Tour Routes
router.get('/group-tours', GroupTourController.getGroupTours);
router.post('/group-tours', GroupTourController.createGroupTour);

// Sales Routes
router.post('/sales/login', SalesController.salesLogin);
router.get('/sales/list', SalesController.getSalesList);

// Dashboard
router.get('/sales-dashboard', SalesDashboardController.viewDashboard);

// Tailor Made Routes
router.get('/tailor-made', TailorMadeController.viewTailorMade);
router.post('/tailor-made', TailorMadeController.createTailorMade);

module.exports = router;
