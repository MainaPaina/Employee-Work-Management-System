const supabase = require('../config/supabaseClient');

// Create a Supabase client with the service role key to bypass RLS
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only create the admin client if the service key is available
const supabaseAdmin = supabaseServiceKey ?
    createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    }) : null;

class Role {
    /// Static method to find role by Id
    static async findById(id) {
        if (!id) return null; // Prevent query with null/undefined ID
        try {
            const { data, error } = await supabase
                .from('roles')   // From table roles
                .select('name')  // Select name column
                .eq('id', id)    // Where id = id
                .single();       // Get single record

            if (error && error.code !== 'PGRST116') { // Ignore 'No rows found' error, return null
                console.error('Error fetching user profile by ID:', error.message);
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
                .select('name');    // Select all columns
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
}

module.exports = Role;