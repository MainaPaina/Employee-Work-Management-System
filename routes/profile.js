const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const verifyJWT = require('../middleware/verifyJWT');

// Create a Supabase client with the service role key to bypass RLS
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only create the admin client if the service key is available
const supabaseAdmin = supabaseServiceKey ?
    createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    }) : null;

// Apply JWT verification to all profile routes
router.use(verifyJWT);

// POST /profile/change-password
router.post('/change-password', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated properly.' });
        }

        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
        }

        // First, verify the current password
        console.log('Verifying current password for user ID:', userId);

        // Get the user's email from the auth database
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

        if (authError) {
            console.error('Error fetching user from auth:', authError.message);
            return res.status(500).json({ success: false, message: 'Error fetching user data.' });
        }

        if (!authUser || !authUser.user) {
            console.error('User not found in auth with ID:', userId);
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const userEmail = authUser.user.email;
        if (!userEmail) {
            console.error('User email not found for ID:', userId);
            return res.status(500).json({ success: false, message: 'User email not found.' });
        }

        console.log('Found user email:', userEmail);

        // Verify current password using signInWithPassword
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password: currentPassword
        });

        if (signInError) {
            console.error('Current password verification failed:', signInError.message);
            return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        }

        // If we get here, the current password is correct, so update the password
        console.log('Current password verified, updating password for user ID:', userId);

        // Use the admin client to update the password
        if (!supabaseAdmin) {
            console.error('Admin client not available for password update');
            return res.status(500).json({ success: false, message: 'Server configuration error.' });
        }

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (updateError) {
            console.error('Error updating password:', updateError.message);
            return res.status(500).json({ success: false, message: `Failed to update password: ${updateError.message}` });
        }

        console.log('Password updated successfully for user ID:', userId);
        return res.status(200).json({ success: true, message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Unexpected error in change-password:', error);
        return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
    }
});

module.exports = router;
