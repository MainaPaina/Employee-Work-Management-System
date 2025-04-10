const supabase = require('../config/supabaseClient');
const supabaseAdmin = require('../config/supabaseAdmin'); // Import Supabase admin client

class User {
    // Static method to find user profile data by ID (e.g., from users table)
    static async findById(id) {
        if (!id) return null; // Prevent query with null/undefined ID
        try {
            const { data, error } = await supabase
                .from('users') // Changed from 'employees'
                .select('*')       // Select necessary profile fields (adjust as needed)
                .eq('id', id)      // Match Supabase Auth user ID
                .single();

            if (error && error.code !== 'PGRST116') { // Ignore 'No rows found' error, return null
                console.error('Error fetching user profile by ID:', error.message);
                return null;
            }
            return data; // Return the profile object (or null if not found)
        } catch (error) {
            console.error('Exception fetching user profile by ID:', error);
            return null;
        }
    }

    // Static method to find user profile data by email (useful for checking duplicates)
    static async findByEmail(email) {
        if (!email) return null;
         try {
            // Use the admin client if available to bypass RLS
            const client = supabaseAdmin || supabase;

            const { data, error } = await client
                .from('users') // Changed from 'employees'
                .select('id, email') // Select only necessary fields
                .eq('email', email)
                .maybeSingle(); // Use maybeSingle as email might not exist

            if (error && error.code !== 'PGRST116') { // Ignore 'No rows found'
                console.error('Error fetching user profile by email:', error.message);
                return null;
            }
            return data; // Return the minimal profile object or null
        } catch (error) {
            console.error('Exception fetching user profile by email:', error);
            return null;
        }
    }

    // Static method to find user profile data by username
    static async findByUsername(username) {
        if (!username) return null;
        try {
            //console.log('Searching for user with username:', username);

            // Use the admin client if available to bypass RLS
            const client = supabaseAdmin || supabase;
            //console.log('Using', supabaseAdmin ? 'admin client (bypasses RLS)' : 'regular client (respects RLS)');

            // First, try to get all users to see what's in the database
            const { data: allUsers, error: allUsersError } = await client
                .from('users')
                .select('id, email, username, role');

            if (allUsersError) {
                console.error('Error fetching all users:', allUsersError.message);
            } else {
                //console.log('All users in database:', JSON.stringify(allUsers, null, 2));
            }

            // Now try to find the specific user by username
            const { data, error } = await client
                .from('users')
                .select('id, email, username, role')
                .eq('username', username)
                .maybeSingle(); // Use maybeSingle as username might not exist

            if (error) {
                console.error('Error fetching user profile by username:', error.message);
                return null;
            }

            if (data) {
                console.log('Found user by username:', username);
                return data;
            }

            // If no user found by username, try by email as a fallback
            console.log('No user found by username, trying email as fallback...');
            const { data: emailData, error: emailError } = await client
                .from('users')
                .select('id, email, username, role')
                .eq('email', username) // Try the username as an email
                .maybeSingle();

            if (emailError) {
                console.error('Error fetching user profile by email:', emailError.message);
                return null;
            }

            console.log('User lookup by email result:', emailData ? 'Found user' : 'No user found');
            return emailData; // Return the profile object or null
        } catch (error) {
            console.error('Exception fetching user profile by username:', error);
            return null;
        }
    }

    // Static method to create a user profile entry (e.g., in users table)
    // Called *after* successful supabase.auth.signUp
    static async createProfile(profileData) {
        // Ensure profileData includes the Supabase Auth user ID and other required fields
        if (!profileData || !profileData.id || !profileData.email) {
            console.error('Cannot create profile without required data (id, email, etc.).');
            return null;
        }

        // Add default values if necessary (e.g., role)
        profileData.role = profileData.role || 'employee'; // Example default role
        // profileData.full_name = profileData.full_name || profileData.email; // Example default name

        try {
             const { data, error } = await supabase
                .from('users') // Changed from 'employees'
                .insert([profileData]) // Insert the data
                .select()            // Optionally select the created profile
                .single();           // Assuming insertion of one profile

            if (error) {
                console.error('Error creating user profile:', error.message);
                // Handle specific errors like duplicate email if needed
                // Supabase might throw a specific error code for unique constraint violations
                return null;
            }
            return data; // Return the created profile data
        } catch (error) {
            console.error('Exception creating user profile:', error);
            return null;
        }
    }

    // Static method to update user profile data
    static async updateProfile(id, updateData) {
        if (!id || !updateData) {
             console.error('Cannot update profile without ID and data.');
             return null;
        }
        try {
            const { data, error } = await supabase
                .from('users') // Changed from 'employees'
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error updating user profile:', error.message);
                return null;
            }
            return data;
        } catch (error) {
             console.error('Exception updating user profile:', error);
             return null;
        }
    }
    static async updateProfileImage(id, image) {
        if (!id || !image) {
            console.error('Cannot update profile image without ID and image.');
            return null;
        }
        try {
            // Use admin client if available to bypass RLS
            const client = supabaseAdmin || supabase;
            
            // Update the profile_image column
            const { data, error } = await client
                .from('users')
                .update({ profile_image: image })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error updating user profile image:', error.message);
                return null;
            }
            
            return data;
        } catch (error) {
            console.error('Exception updating user profile image:', error);
            return null;
        }
    }
    // Add other static methods if needed for profile management
 }

 // Export the class itself, not an instance
module.exports = User;