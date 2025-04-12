const express = require('express');

const router = express.Router();
const { createClient } = require('@supabase/supabase-js'); // Import createClient

// Anon key client (for general reads, respecting RLS)
const supabase = require('../../config/supabase/client');
const supabaseAdmin = require('../../config/supabase/admin');

const verifyRoles = require('../../middleware/verifyRoles');

const User = require('../../model/User');
const Role = require('../../model/Role');

router.get('/', verifyRoles(['admin']), async (req, res) => res.render('admin/policies/index'));
/* {
    try {
        console.log('GET /admin/policies called');
        const { data: users, error: usersError } = await supabase
            .from('policies')
            .select('id, name')
            .order('name');

        if (usersError) {
            console.error('Supabase error fetching users for admin page:', usersError);
            throw usersError;
        }

        res.render('admin/policies/index', {
            users: users || [],
            activePage: 'admin',
            currentUser: req.session.user
        });
    } catch (error) {
        console.error('Error fetching admin data:', error);
        res.render('admin/policies/index', {
            users: [],
            timesheets: [],
            activePage: 'admin',
            currentUser: req.session.user,
            error: `Failed to load admin data: ${error.message}`
        });
    }
});*/

// Export the router directly
module.exports = router;