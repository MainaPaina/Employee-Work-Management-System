const supabase = require('../config/supabase/client');
const supabaseAdmin = require('../config/supabase/admin');

class Department {

    /// List all departments
    static async listAll(fields = 'id,name,name_alias,users!departments_manager_id_fkey(id,name),created_at') {
        try {
            const { data, error } = await supabase
                .from('departments')    // From table departments
                .select(fields)         // Select all columns
                .order('name');         // Order by name
            if (error) {
                console.error('Error fetching departments:', error.message);
                return null;
            }
            return data; // Return the department objects (or null if not found)
        }
        catch (error) {
            console.error('Exception fetching departments: ', error);
            return null;
        }
    }

    /// List all departments for a given manager
    static async listManagerDepartments(managerId, fields = 'id,name,name_alias,manager:users!departments_manager_id_fkey(id,name)') {
        if (!fields) {
            return null;
        }
        try {
            const { data, error } = await supabase
                .from('departments')                // From table departments
                .select(fields)                     // Select all columns
                .eq('manager_id', managerId)       // Filter by manager_id
                .order('name');                     // Order by name
            if (error) {
                console.error('Error fetching departments where user is manager:', error.message);
                return null;
            }
            return data; // Return the department objects (or null if not found)
        }
        catch (error) {
            console.error('Exception fetching departments where user is manager: ', error);
            return null;
        }
    }

}

// Export the class itself, not an instance
module.exports = Department;