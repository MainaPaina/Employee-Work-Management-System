
const supabase = require('../config/supabase/client');
const supabaseAdmin = require('../config/supabase/admin');

class Role {
    /// Static method to find role by Id
    static async findById(id) {
        if (!id) return null; // Prevent query with null/undefined ID
        try {
            const { data, error } = await supabase
                .from('roles')   // From table roles
                .select('name,id,created_at')  // Select name column
                .eq('id', id)    // Where id = id
                .single();       // Get single record

            if (error && error.code !== 'PGRST116') { // Ignore 'No rows found' error, return null
                console.error('Error fetching role by ID:', error.message);
                return null;
            }
            return data; // Return the role object (or null if not found)
        } catch (error) {
            console.error('Exception fetching role by Id: ', error);
            return null;
        }
    }

    /// Static method to list all roles
    static async list() {
        try {
            const { data, error } = await supabase
                .from('roles')   // From table roles
                .select('id,name,created_at');    // Select all columns
            if (error) {
                console.error('Error fetching roles:', error.message);
                return null;
            }
            return data; // Return the role objects (or null if not found)
        } catch (error) {
            console.error('Exception fetching roles: ', error);
            return null;
        }
    }

    /// Static method to find roles by user id
    static async listUserRoles(userId) {
        try {
            const { data, error } = await supabase
                .from('user_roles')  // From table user_roles
                .select('roles ( name ) ')   // Select role_id column
                .eq('user_id', userId); // Where user_id = userId
            if (error) {
                console.error('Error fetching user roles:', error.message);
                return null;
            }
            if (data != null) {
                //console.log(data);
                return data.map((item) => item.roles.name); // Extract role names from the data
            }
            return data; // Return the role objects (or null if not found)
        }
        catch (error) {
            console.error('Exception fetching user roles: ', error);
            return null;
        }
    }

    static async listRoleUsers(roleId) {
        try {
            console.log('listRoleUsers called with roleId:', roleId);
            const { data, error } = await supabaseAdmin
                .from('user_roles')  // From table user_roles
                //.select('user ( * ) ')   // Select role_id column
                .select('users ( username ) ')
                .eq('role_id', roleId); // Where id = userId

            if (error) {
                console.error('Error fetching users in role:', error.message);
                return null;
            }

            return data; // Return the role objects (or null if not found)
        }
        catch (error) {

            console.error('Exception fetching user roles: ', error);
            return null;

        }
    }
}

module.exports = Role;
// Export the Role class for use in other modules