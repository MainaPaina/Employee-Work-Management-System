require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// --- Service Role Client (for admin actions) ---
// Ensure environment variables are loaded (e.g., using dotenv in server.js)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin;
if (supabaseUrl && supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
    console.log('Supabase Admin client initialized.');
} else {
    console.error('Supabase URL or Service Role Key missing. Supabase Admin client not initialized.');
    // Optionally throw an error or handle this case appropriately
    // For now, routes requiring admin client might fail if not initialized.
}
// --- End Service Role Client ---

module.exports = supabaseAdmin;