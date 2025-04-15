const express = require('express');
const router = express.Router();7
/// MIDDLEWARE
const verifyRoles = require('../middleware/verifyRoles');

// Manager routes - Require login AND manager role
router.use('/leaves', verifyRoles(['manager']), require('./manager/leaves'));
router.use('/entries', verifyRoles(['manager']), require('./manager/entries'));

// GET /manager/ - Render the manager dashboard
// This route is protected and requires the user to be a manager
router.get('/', verifyRoles(['manager']), async (req, res) => res.render('manager/index'));



module.exports = router;