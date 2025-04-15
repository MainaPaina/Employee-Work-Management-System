const express = require('express');
const router = express.Router();

// Anon key client (for general reads, respecting RLS)
const supabase = require('../../config/supabase/client');
const supabaseAdmin = require('../../config/supabase/admin');

const verifyRoles = require('../../middleware/verifyRoles');

//const User = require('../../model/User');
//const Role = require('../../model/Role');
const Department = require('../../model/Department');

router.get('/', verifyRoles(['admin']), async (req, res) => {
    try {
        let data = await Department.listAll();
        console.log(data);
        
        if (!data) {
            console.error('Supabase error fetching departments for admin page:');
            return res.status(400);
        }

        res.render('admin/departments/index', {
            departments: data || [],
            activePage: 'admin',
            activeSubPage: 'departments',
            currentUser: req.session.user
        });

    } catch (error) {
        console.error('Error fetching admin data:', error);
        res.render('admin/departments/index', {
            departments: [],
            activePage: 'admin',
            activeSubPage: 'departments',
            currentUser: req.session.user,
            error: `Failed to load admin data: ${error.message}`
        });
    }
});

// Export the router directly
module.exports = router;