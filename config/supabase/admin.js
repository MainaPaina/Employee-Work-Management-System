require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

function initializeSupabaseAdmin() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
        console.warn('Supabase Admin client not initialized: Missing environment variables');
        return null;
    }

    try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { 
                autoRefreshToken: false, 
                persistSession: false 
            }
        });
        
        console.log('Supabase Admin client initialized successfully');
        return supabaseAdmin;
    } catch (error) {
        console.error('Failed to initialize Supabase Admin client:', error.message);
        return null;
    }
}

module.exports = initializeSupabaseAdmin();