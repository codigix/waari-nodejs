const express = require('express');
const router = express.Router();
const WebsiteController = require('../controllers/waarWebsite/WebsiteController'); // Correct controller path

// =====================
// Home / Test
// =====================
router.get('/', (req, res) => {
    res.send('<h1>Welcome to Tour API</h1>');
});

router.get('/test', (req, res) => {
    res.send('API is working!');
});

// =====================
// State List
// =====================
router.get('/state-list', WebsiteController.getStateList);

// =====================
// City Wise Tour List
// =====================
router.get('/city-wise-tour-list', WebsiteController.getCityWiseTourList);

// =====================
// Contact Us
// =====================
router.post('/contact-us', WebsiteController.contactUs);

// =====================
// Office Details List
// =====================
router.get('/office-details-list', WebsiteController.getOfficeDetailsList);

module.exports = router;
