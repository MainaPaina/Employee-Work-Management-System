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

router.get('/view/:id', verifyRoles(['admin']), async (req, res, next) => {
    try {
      const deptId = req.params.id;
  
      const { data: department, error: deptError } = await supabase
        .from('departments')
        .select('id, name, manager_id, users!manager_id(id, name, email), name_alias')
        .eq('id', deptId)
        .single();
  
      if (deptError || !department) {
        return next();
      }
  
      // Fetch users assigned to this department
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('department', deptId);
  
      if (usersError) {
        console.error('Error fetching users for department:', usersError.message);
        return next();
      }
  
      res.render('admin/departments/view', {
        department,
        users,
        activePage: 'admin',
        activeSubPage: 'departments',
      });
    } catch (err) {
      next(err);
    }
  });
  


router.post('/create', async (req, res) => {
    console.log('POST /admin/departments/create called');
    const { name, name_alias } = req.body;
    console.log('Form POST Body:', req.body);

    try {
        // Create a new department in the database
        const { data, error } = await supabaseAdmin
            .from('departments')
            .insert([{ name: name, name_alias: name_alias }])
            .select('*'); // Select all columns from the inserted row

            console.log('Insert result:', data);
            console.error('Insert error:', error);
        if (error) {
            console.error('Error creating department:', error.message);
            throw new Error('Failed to create department');
        }

        res.redirect('/admin/departments');
    } catch (error) {
        console.error('Error creating department:', error);
        res.render('admin/departments/create', {
            activePage: 'admin',
            activeSubPage: 'departments',
            currentUser: req.session.user,
            error: `Failed to create department: ${error.message}`
        });
    }
});


router.post('/:id/assign-manager', verifyRoles(['admin']), async (req, res, next) => {
    const deptId = req.params.id;
    const { manager_id } = req.body;
  
    try {
      const { data, error } = await supabaseAdmin
        .from('departments')
        .update({ manager_id: manager_id })
        .eq('id', deptId)
        .select('*');
  
      if (error) {
        console.error('Error assigning manager:', error.message);
        throw new Error('Failed to assign manager');
      }
  
      res.redirect(`/admin/departments/view/${deptId}`);
    } catch (err) {
      console.error('Error during manager assignment:', err);
      next(err);
    }
  });
  



/* 

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
              activeSubPage: 'roles',
              currentUser: req.session.user,
              error: `Failed to create role: ${error.message}`
          });
      }
  }); */
  

// Export the router directly
module.exports = router;