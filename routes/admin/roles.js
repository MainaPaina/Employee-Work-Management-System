const express = require('express');

const router = express.Router();
const { createClient } = require('@supabase/supabase-js'); // Import createClient

// Anon key client (for general reads, respecting RLS)
const supabase = require('../../config/supabaseClient');
const supabaseAdmin = require('../../config/supabaseAdmin');

const verifyRoles = require('../../middleware/verifyRoles');

const Role = require('../../model/Role');

//router.get('/', verifyRoles(['admin']), async (req, res) => {
router.get('/', async (req, res) => {
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

router.get('/view/:id', async (req, res) => {
//router.get('/view/:id', verifyRoles(['admin']), async (req, res) => {
    try {
        console.log('GET /admin/view/:id called');
        const { id } = req.params;

        let selectedRole = await Role.findById(id);
        let users = [];
        if (selectedRole)
        {
            // Fetch users for the role
            users = await Role.listRoleUsers(id);
        }
        else 
        {
            console.error('Role not found:', selectedRole);
            throw new Error('Role not found');
        }


        res.render('admin/roles/view', {
            role: selectedRole || {},
            users: users,
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

router.get('/create', async (req, res) => {
    console.log('GET /admin/roles/create called');
    res.render('admin/roles/create', {
        activePage: 'admin',
        currentUser: req.session.user
    });
});

router.post('/create', async (req, res) => {
    console.log('POST /admin/roles/create called');
    const { name } = req.body;

    try {
        // Create a new role in the database
        const { data, error } = await supabaseAdmin
            .from('roles')
            .insert([{ name: name }])
            .select('*'); // Select all columns from the inserted row

        if (error) {
            console.error('Error creating role:', error.message);
            throw new Error('Failed to create role');
        }

        res.redirect('/admin/roles');
    } catch (error) {
        console.error('Error creating role:', error);
        res.render('admin/roles/create', {
            activePage: 'admin',
            currentUser: req.session.user,
            error: `Failed to create role: ${error.message}`
        });
    }
});

// Export the router directly
module.exports = router;