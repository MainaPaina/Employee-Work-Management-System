const User = require('../../model/User');
const Role = require('../../model/Role');
const Department = require('../../model/Department');
const Policy = require('../../model/Policy');


exports.setDepartmentforUser = async (req, res, next) => {
    console.log('POST /admin/api/users/setdepartment called');
    try {
        console.log('req.body: ', req.body);
        const { user: _user, department: _department } = req.body;
        console.log('user: ', _user);
        console.log('department: ', _department);
        // Check if the user exists
        const user = await User.findById(_user);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // Check if the department exists
        const department = await Department.findById(_department);
        if (!department) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }
        // Update the user's department
        await User.findByIdAndUpdate(_user, { department: _department });
        return res.status(200).json({ success: true, message: 'Department updated successfully' });
    } catch (error) {
        console.error('Error setting department for user:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}