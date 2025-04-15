const User = require('../../models/user');

exports.getUsers = async (req, res) => {
    console.log('GET /admin/users called');
    try {

        const { data: users, error: usersError } = await supabaseAdmin
            .from('users')
            .select('id, username, name, active, email, lastlogin_at, department:departments!users_department_fkey' +
                '(id, name, name_alias,manager:users!departments_manager_id_fkey(id,name))' +
                ', roles:user_roles(role:roles(id,name))')
            .order('name');

        console.log(JSON.stringify(users, null, 2));
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
}