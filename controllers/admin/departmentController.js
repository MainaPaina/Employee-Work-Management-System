const User = require('../../model/User');
const Role = require('../../model/Role');
const Department = require('../../model/Department');
const Policy = require('../../model/Policy');  // future feature x)

exports.getCreateDepartment = async (req, res, next) => {
    console.log('GET /admin/api/departments/create called');
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
}
exports.postCreateDepartment = async (req, res, next) => {
    console.log('POST /admin/api/departments/create');
    try {
        const { name, description } = req.body;
        console.log('name: ', name);
        console.log('description: ', description);
        // Check if the department already exists
        const existingDepartment = await Department.findOneByName( name );
        if (existingDepartment) {
            return res.status(400).json({ success: false, message: 'Department already exists' });
        }
        // Create a new department
        /* const newDepartment = new Department({ name, description });
        await newDepartment.save(); */
        return res.status(200).json({ success: true, message: 'Department created successfully' });
    } catch (error) {
        console.error('Error creating department:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}
    