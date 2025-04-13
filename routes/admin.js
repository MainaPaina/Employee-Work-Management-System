const express = require('express');
const router = express.Router();
/// MIDDLEWARE
const verifyRoles = require('../middleware/verifyRoles');

// Anon key client (for general reads, respecting RLS)
const supabase = require('../config/supabase/client');
const supabaseAdmin = require('../config/supabase/admin');

// Admin routes - Require login AND admin role
router.use('/users', verifyRoles(['admin']), require('./admin/users'));
router.use('/policies', verifyRoles(['admin']), require('./admin/policies'));
router.use('/departments', verifyRoles(['admin']), require('./admin/departments'));
router.use('/roles', verifyRoles(['admin']), require('./admin/roles'));

// GET /admin
router.get('/', verifyRoles(['admin']), async (req, res) => res.render('admin/index'));

// Export the router directly
module.exports = router;