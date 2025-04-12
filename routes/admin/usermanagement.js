const express = require('express');

const router = express.Router();
const { createClient } = require('@supabase/supabase-js'); // Import createClient

// Anon key client (for general reads, respecting RLS)
const supabase = require('../../config/supabase/client');
const supabaseAdmin = require('../../config/supabase/admin');

const verifyRoles = require('../../middleware/verifyRoles');

const User = require('../../model/User');
const Role = require('../../model/Role');

router.get('/', verifyRoles(['admin']), async (req, res) => {
    try {
        console.log('GET /admin/usermanagement called');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, username, name, role, active, email')
            .order('name');

        if (usersError) {
            console.error('Supabase error fetching users for admin page:', usersError);
            throw usersError;
        }

        // Fetch roles for each user
        for (let i = 0; i < users.length; i++) {
            let roles = await Role.listUserRoles(users[i].id);
            users[i].roles = roles;
        }

        res.render('admin/usermanagement/index', {
            users: users || [],
            activePage: 'admin',
            currentUser: req.session.user
        });
    } catch (error) {
        console.error('Error fetching admin data:', error);
        res.render('admin', {
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
        if (selectedUser) {
            // Fetch roles for the user
            let roles = await Role.listUserRoles(selectedUser.id);
            selectedUser.roles = roles;
        }
        else {
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