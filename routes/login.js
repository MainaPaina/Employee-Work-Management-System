const supabase = require('../config/supabaseClient');
const User = require('../model/User');

const express = require('express');
const router = express.Router();

// Login and Register GET routes (handled by authRoutes now, but keep GET for direct access)
router.get('/', (req, res) => {
    // If user is already logged in, redirect them from the login page
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('login', { activePage: 'login' }); // Pass activePage
});

module.exports = router;
