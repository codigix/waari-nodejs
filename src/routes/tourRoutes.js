const express = require('express');
const router = express.Router();
const TourController = require('../controllers/TourController');

router.post('/add-tour', (req, res) => TourController.addTour(req, res));
router.post('/enquiry', (req, res) => TourController.enquiry(req, res));
router.post('/bookings', (req, res) => TourController.bookings(req, res));

module.exports = router; // ✅ export router, not controller
