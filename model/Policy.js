const supabase = require('../config/supabase/client');
const supabaseAdmin = require('../config/supabase/admin');

/*
 * Model for Policy
 * This model is used to interact with the policies table in the database.
 * It contains methods for listing all policies.
 * 
 * DB-TABLE: policies
 * FIELDS: id (uuid), created_at (timestamptz), name (text), value (text)
 * 
 */
class Policy {

    /// List all policies
    static async listAll(fields = 'id,name,value,created_at') {
        try {
            const { data, error } = await supabase
                .from('policies')    // From table departments
                .select(fields)         // Select all columns
                .order('name');         // Order by name
            if (error) {
                throw error;
            }
            return data; // Return the department objects (or null if not found)
        }
        catch (error) {
            console.error('Exception fetching policies: ', error);
            return null;
        }
    }


}

// Export the class itself, not an instance
module.exports = Policy;