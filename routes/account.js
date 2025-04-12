const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase/client'); // Import Supabase client
const supabaseAdmin = require('../config/supabase/admin'); // Import Supabase admin client
const User = require('../model/User'); // Import User model
const Role = require('../model/Role'); // Import Role model
// // Middleware for handling user role checks
const verifyRoles = require('../middleware/verifyRoles');
const { upload, processUpload } = require('../middleware/uploadProfileImage');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Ensure JWT_SECRET is loaded

// Login and Register GET routes (handled by authRoutes now, but keep GET for direct access)
// GET /account/login
router.get('/login', (req, res) => {
    const returnUrl = req.query.return || '/dashboard'; // Default to dashboard if no return URL is provided
    // If user is already logged in, redirect them from the login page
    if (req.session.user) {
        return res.redirect(returnUrl);
    }
    res.render('account/login', { activePage: 'login', return: returnUrl }); // Pass activePage
});

// Login Route (POST)
// POST /account/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const returnUrl = req.query.return || '/dashboard'; // Default to dashboard if no return URL is provided

    if (!username || !password) {
        // Using flash messages for server-rendered forms is common
        req.flash('error', 'Username and password are required.');
        // Redirect back or send error? For API-like response expected by potential JS:
        return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    try {
        // 1. First, look up the user by username to get their email
        
        const userData = await User.findByUsername(username);
        if (!userData) {
            req.flash('error', 'Invalid username or password.');
            return res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }
        // 2. Authenticate with Supabase using the email associated with the username
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: userData.email,
            password: password,
        });

        if (authError) {
            console.error("Supabase Auth Error:", authError.message);
            console.error("Auth Error Details:", authError);
            req.flash('error', 'Invalid credentials. Please try again.');
            // Consistent JSON response for potential JS handlers
            return res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }

        // Ensure user data is returned
        if (!authData || !authData.user) {
            console.error("Supabase Auth: No user data returned after successful sign in.");
            req.flash('error', 'Invalid username or password.');
            return res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }

        const user = authData.user;

        // 2. Fetch user profile/role (using the 'users' table linked by user.id)
        // Load user by using the model/User class
        let profileData = await User.findById(user.id); // This should be a method to fetch user profile by ID)
        // verify that profileData has data
        if (!profileData) {
            console.error("Could not find user with ID:", user.id);
            // consistent error
            req.flash('error', 'Invalid username or password.');
            return res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }
        // Adjust table/column names as needed
        //const { data: profileData, error: profileError } = await supabase
        //    .from('users') // Changed 'profiles' to 'users'
        //    .select('id, username, profile_image, lastlogin_at') // Select necessary fields, especially 'role'
        //    .eq('id', user.id)
        //    .single();

        //if (profileError || !profileData) {
        //    console.error("Supabase User Table Fetch Error:", profileError?.message || "User data not found in users table"); // Updated error message
        //    // Decide if login should fail or proceed with default role
        //    req.flash('error', 'Could not retrieve user profile.');
        //    // Log out the Supabase session if profile is critical
        //    await supabase.auth.signOut();
        //    return res.status(500).json({ success: false, error: 'Could not retrieve user profile.' });
        //}
        // update last login date
        //const { error: updateLogin } = await supabase
        //    .from('users')
        //    .update({ lastlogin_at: new Date().toISOString() })
        //    .eq('id', user.id);
        //if (updateLogin) {
        //    console.error("Supabase User Table Update Error:", updateLogin.message);
        //}
        console.log('User profile data:', profileData); // Log profile data for debugging)

        // Fetch roles for the user
        const roles = await Role.listUserRoles(authData.user.id);

        if (!roles) {
            //console.warn('No roles found for user:', authData.user.id);
            req.flash('error', 'Login failed: No roles assigned user.');
        } else {
            //console.log('User roles:', roles); // Log roles for debugging
        }

        // 3. Set up session
        const sessionUser = {
            id: user.id,
            email: user.email,
            username: profileData.username, // From users table
            profile_image: profileData.profile_image, // Ensure role exists, default if necessary
            roles: roles || [],
        };
        console.log('Session user:', sessionUser); // Log session user for debugging)
        req.session.user = sessionUser; // Store user info in session

        // 4. Create JWT
        const accessToken = jwt.sign(
            {
                "UserInfo": {
                    "id": sessionUser.id,
                    "username": sessionUser.username,
                    "role": sessionUser.role,
                    "roles": sessionUser.roles
                }
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Token expiry (e.g., 1 day)
        );

        // 5. Send success response with JWT
        //console.log('Generated Token:', accessToken); // <-- ADDED LOGGING
        //console.log(`User logged in: ${sessionUser.email}, Roles: ${sessionUser.roles}`);
        // Redirect for traditional forms is handled differently than sending JSON
        // For JS handling fetch: Send JSON including the token
        res.json({
            success: true,
            message: 'Login successful!',
            accessToken: accessToken, // Send token to client
            user: sessionUser, // Send user info (optional, but useful)
            redirectUrl: returnUrl // Suggest redirect URL
        });
        // If handling traditional form POST without JS, you'd use:
        // req.flash('success', 'Login successful!');
        // res.redirect('/dashboard');

    } catch (error) {
        console.error('Login process error:', error);
        req.flash('error', 'An unexpected error occurred during login.');
        res.status(500).json({ success: false, error: 'Server error during login.' });
        // If handling traditional form POST without JS:
        // res.redirect('/login');
    }
});

// Direct logout route for backward compatibility
// GET /account/logout
router.get('/logout', (req, res) => {
    console.log('Direct logout route called');
    try {
        // Clear Supabase session
        supabase.auth.signOut().catch(err => console.error("Supabase Sign Out Error:", err));

        // Destroy express session
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error("Session destruction error:", err);
                }
                // Clear the cookie explicitly
                res.clearCookie('connect.sid');
                console.log('User logged out directly.');
                // Redirect to login page after logout
                return res.redirect('/account/login');
            });
        } else {
            // If no session exists, just clear the cookie and redirect
            res.clearCookie('connect.sid');
            console.log('No session to destroy, user logged out directly.');
            return res.redirect('/account/login');
        }
    } catch (error) {
        console.error('Error during logout:', error);
        res.clearCookie('connect.sid');
        return res.redirect('/account/login');
    }
});

// Also allow a post request to /logout for compatibility with some clients
// redirects to the GET logout route
// POST /account/logout
router.post('/logout', async (req, res) => res.redirect('/account/logout'));

// Profile page route - Require login
router.get('/profile', verifyRoles(['employee', 'admin']), async (req, res) => {
    try {
        // Get user data from session
        const userId = req.session?.user?.id;
        if (!userId) {
            return res.redirect('/account/login');
        }

        // Get fresh user data from database to ensure we have the latest profile image
        const userData = await User.findById(userId) || req.session.user;
        userData.roles = await Role.listUserRoles(userId);

        // Render profile page
        res.render('account/profile', {
            activePage: 'profile',
            user: userData
        });
    } catch (error) {
        console.error('Error loading profile page:', error);
        res.status(500).render('error', { message: 'Failed to load profile data.', activePage: 'error' });
    }
});

// POST /account/change-password
router.post('/change-password', verifyRoles(['employee', 'manager', 'admin']), async (req, res) => {
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
        //console.log('Verifying current password for user ID:', userId);

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

        //console.log('Found user email:', userEmail);

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
        //console.log('Current password verified, updating password for user ID:', userId);

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

        //console.log('Password updated successfully for user ID:', userId);
        return res.status(200).json({ success: true, message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Unexpected error in change-password:', error);
        return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
    }
});

// POST /acount/upload-image - Upload profile image
// Simplified route without authentication middleware for troubleshooting
router.post('/upload-image', upload, processUpload, verifyRoles(['employee','manager','admin']), async (req, res) => {
    try {
        // Get user ID from session
        let userId = req.session?.user?.id;

        // If no user ID in session, try from JWT token
        if (!userId && req.user) {
            userId = req.user.id;
        }

        // If still no user ID, use a default for testing
        if (!userId) {
            console.error('No user ID found in request or session');
            res.status(400).json({ success: false, message: 'Logged in user is in limbo' });
        }

        //console.log('Session user:', req.session?.user);

        //console.log('Using user ID for profile image upload:', userId);

        //console.log('Attempting to update user profile with image URL:', req.profileImageUrl);

        try {
            // Update user profile with the new image URL
            const updatedUser = await User.updateProfileImage(userId, req.profileImageUrl);

            if (!updatedUser) {
                console.warn('User.updateProfileImage returned null or undefined');
                // Even if the database update fails, we can still return the image URL
                // since it was successfully uploaded to storage
                return res.status(200).json({
                    success: true,
                    message: 'Image uploaded successfully but profile not updated. Will try again later.',
                    imageUrl: req.profileImageUrl
                });
            }

            //console.log('Successfully updated user profile with new image URL');

            // Update the session with the new profile image URL if we have a session
            if (req.session && req.session.user) {
                req.session.user.profile_image = req.profileImageUrl;
                //console.log('Updated session with new profile image URL');
            }
        } catch (dbError) {
            console.error('Error updating user profile in database:', dbError);
            // Even if the database update fails, we can still return the image URL
            // since it was successfully uploaded to storage
            return res.status(200).json({
                success: true,
                message: 'Image uploaded successfully but profile not updated due to database error.',
                imageUrl: req.profileImageUrl
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Profile image updated successfully',
            imageUrl: req.profileImageUrl
        });
    } catch (error) {
        console.error('Error in profile image upload route:', error);
        return res.status(500).json({ success: false, message: 'An unexpected error occurred' });
    }
});



module.exports = router;