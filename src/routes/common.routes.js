// src/routes/commonRoutes.js
const express = require('express');
const router = express.Router();
const CommonController = require('../controllers/CommonController');

// =====================
// Check Token
// =====================
router.get('/check-token', async (req, res) => {
    const token = req.headers['authorization'];
    const listId = req.query.listId;

    if (!listId) return res.status(400).json({ message: 'listId is required' });

    const result = await CommonController.checkToken(token, parseInt(listId));
    res.json(result);
});

// =====================
// Validate Token
// =====================
router.get('/validate-token', async (req, res) => {
    const token = req.headers['authorization'];
    const user = await CommonController.token(token);
    res.json(user);
});

// =====================
// Generate Guest ID
// =====================
router.get('/generate-guest-id', (req, res) => {
    const { firstName, lastName } = req.query;
    if (!firstName || !lastName)
        return res.status(400).json({ message: 'First and last name are required' });

    const guestId = CommonController.generateGuestId(firstName, lastName);
    res.json({ guestId });
});

module.exports = router;
