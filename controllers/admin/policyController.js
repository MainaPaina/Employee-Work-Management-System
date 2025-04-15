const Policy = require('../../model/Policy');

// @desc    Get all policies
// @route   GET /admin/policies
// @access  Private
exports.getPolicies = async (req, res) => {
    try {
        console.log('GET /admin/policies called');
        const policies = await Policy.listAll();
        res.render('admin/policies/index', {
            policies: policies || [],
            activePage: 'admin',
            activeSubPage: 'policies',
            currentUser: req.session.user
        });


    } catch (error) {
        console.error('Error fetching admin data:', error);
        res.render('admin/policies/index', {
            policies: [],
            activePage: 'admin',
            activeSubPage: 'policies',
            currentUser: req.session.user,
            error: `Failed to load admin data: ${error.message}`
        });
    }
};

