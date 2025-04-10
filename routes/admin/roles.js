const express = require('express');

const router = express.Router();
const { createClient } = require('@supabase/supabase-js'); // Import createClient

// Anon key client (for general reads, respecting RLS)
const supabase = require('../../config/supabaseClient');
const supabaseAdmin = require('../../config/supabaseAdmin');

const verifyRoles = require('../../middleware/verifyRoles');

const Role = require('../../model/Role');

router.get('/', verifyRoles(['admin']), async (req, res) => {
    try {
        console.log('GET /admin/roles called');
        // Fetch all users from the database
        let roles = await Role.list(includeCountUsers = true);

        res.render('admin/roles/index', {
            roles: roles || [],
            activePage: 'admin',
            currentUser: req.session.user
        });
    } catch (error) {
        console.error('Error fetching admin data:', error);
        res.render('admin/index', {
            users: [],
            timesheets: [],
            activePage: 'admin',
            currentUser: req.session.user,
            error: `Failed to load admin data: ${error.message}`
        });
    }
});

router.get('/view/:id', verifyRoles(['admin']), async (req, res) => {
    try {
        console.log('GET /admin/usermanagement/:id called');
        const { id } = req.params;
        
        let selectedUser = await User.findById(id);
        if (selectedUser)
        {
            // Fetch roles for the user
            let roles = await Role.listUserRoles(selectedUser.id);
            selectedUser.roles = roles;
        }
        else 
        {
            console.error('User not found:', selectedUser);
            throw new Error('User not found');
        }

        res.render('admin/usermanagement/view', {
            selectedUser: selectedUser || {},
            activePage: 'admin',
            currentUser: req.session.user
        });
    } catch (error) {
        console.error('Error fetching admin data:', error);
        res.render('admin/index', {
            users: [],
            timesheets: [],
            activePage: 'admin',
            currentUser: req.session.user,
            error: `Failed to load admin data: ${error.message}`
        });
    }
});

// Export the router directly
module.exports = router;