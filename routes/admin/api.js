const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

const Role = require('../../model/Role');
const User = require('../../model/User');

const { setDepartmentforUser } = require('../../controllers/admin/apiController');

router.use(bodyParser.json());

/// ROUTE START: /admin/api
router.route('/users/setdepartment').post(setDepartmentforUser);

// GET /api/status (handled by this router)
router.get('/status', (req, res) => res.json({ success: true }));

router.get('/roles/list', async (req, res) => {
    // fetch all the roles
    let roles = await Role.list() || [];
    res.json(roles);
});

/// POST /users/userexists
router.post('/users/userexists', async (req, res) => {
    let username = req.body.username;
    console.log('req.body: ', req.body);
    console.log('check if username exists: ', username);

    let user = await User.findByUsername(username);
    console.log('userexists: ', user);
    if (user) {
        return res.status(200).json({ success: true });
    }
    return res.status(400).json({ success: false });
});

/// POST /users/emailexists
router.post('/users/emailexists', async (req, res) => {
    let user = await User.findByEmail(req.body.email);
    console.log('emailexists: ', user);
    if (user) {
        return res.status(200).json({ success: true });
    }
    return res.status(400).json({ success: false });
});

/// POST /users/create
router.post('/users/create', async (req, res) => {
    let inUser = { username: req.body.username, email: req.body.email, name: req.body.name, password: req.body.password, roles: req.body.roles, department: req.body.department };

    console.log('create user: ', inUser);

    if (inUser.username === '') {
        return res.status(400).json({ success: false, message: 'Username is required' });
    }
    if (inUser.email === '') {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }
    if (inUser.name === '') {
        return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (inUser.password === '') {
        return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const existingUser = await User.findByEmail(inUser.email);
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    const existingUsername = await User.findByUsername(inUser.username);
    if (existingUsername) {
        return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    // Assumes all fields are OK, no proper validations done so far
    // TODO: Implement better validation rules
    let ret = await User.create(inUser);
    if (ret) {
        console.log('User created: ', ret);
        return res.status(200).json({ success: true });
    }
    console.log('User creation failed');
    return res.status(400).json({ success: false, message: 'User creation failed' });

});

// Add other API routes here (e.g., profile updates, etc.) if needed

module.exports = router;
