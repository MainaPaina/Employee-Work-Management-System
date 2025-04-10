const express = require('express');
const router = express.Router();


// Terms of Service - accessible to all
router.get('/terms', (req, res) => {
    res.render('legal/terms', { activePage: 'terms' });
});

// Privacy Policy - accessible to all
router.get('/privacy', (req, res) => {
    res.render('legal/privacy', { activePage: 'privacy' });
});

// Cookies Policy - accessible to all
router.get('/cookies', (req, res) => {
    res.render('legal/cookies', { activePage: 'cookies' });
});

module.exports = router;