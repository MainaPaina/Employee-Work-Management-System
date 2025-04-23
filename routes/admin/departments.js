const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

// Anon key client (for general reads, respecting RLS)
const supabase = require('../../config/supabase/client');
const supabaseAdmin = require('../../config/supabase/admin');

const verifyRoles = require('../../middleware/verifyRoles');

//const User = require('../../model/User');
//const Role = require('../../model/Role');
const Department = require('../../model/Department');

const { postCreateDepartment, getCreateDepartment } = require('../../controllers/admin/departmentController');

router.use(bodyParser.json());

/// ROUTE START: /admin/api
router.route('/create')
    .get(getCreateDepartment, verifyRoles(['admin']))
    .post(postCreateDepartment, verifyRoles(['admin']));

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

router.get('/create', verifyRoles(['admin']), async (req, res) => {
    try {
        res.render('admin/departments/create', {
            activePage: 'admin',
            activeSubPage: 'departments',
            currentUser: req.session.user
        });
    } catch (error) {
        console.error('Error rendering create department page:', error);
        res.status(500).send('Internal Server Error');
    }
})

// Export the router directly
module.exports = router;