const express = require('express');
const router = express.Router();
// Anon key client (for general reads, respecting RLS)
const supabase = require('../../config/supabase/client');
const supabaseAdmin = require('../../config/supabase/admin');

const User = require('../../model/User');
const Role = require('../../model/Role');

/// GET: /admin/users
router.get('/', async (req, res) => {
    console.log('GET /admin/users called');
    try {
        const { data: users, error: usersError } = await supabaseAdmin
            .from('users')
            .select('id, username, name, active, email, lastlogin_at, department:departments!users_department_fkey' +
                '(id, name, name_alias,manager:users!departments_manager_id_fkey(id,name))' +
                ', roles:user_roles(role:roles(id,name))')
            .order('name');

        //console.log(JSON.stringify(users, null, 2));
        if (usersError) {
            console.error('Supabase error fetching users for admin page:', usersError);
            throw usersError;
        }

        res.render('admin/users/index', {
            users: users || [],
            activePage: 'admin',
            activeSubPage: 'users',
            currentUser: req.session.user
        });
    } catch (error) {
        console.error('Error fetching admin data:', error);
        res.render('admin/index', {
            users: [],
            activePage: 'admin',
            activeSubPage: '',
            currentUser: req.session.user,
            error: `Failed to load admin data: ${error.message}`
        });
    }
});

router.get('/view/:id', async (req, res) => {
    try {
        console.log('GET /admin/users/:id called');
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

        res.render('admin/users/view', {
            selectedUser: selectedUser || {},
            activePage: 'admin',
            activeSubPage: 'users',
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
    try {
        console.log('GET /admin/users/create called');

        //fetch the roles
        const { data: roles, error: rolesError } = await supabaseAdmin
            .from('roles')
            .select('id, name')
            .order('name');

        //fetch the departments
        const { data: departments, error: departmentsError } = await supabaseAdmin
            .from('departments')
            .select('id, name, name_alias')
            .order('name');

        res.render('admin/users/create', {
            roles: roles || [],
            departments: departments || [],
            activePage: 'admin',
            activeSubPage: 'users',
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
})


// Export the router directly
module.exports = router;