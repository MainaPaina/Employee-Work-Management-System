const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js'); // Import createClient

// Anon key client (for general reads, respecting RLS)
const supabase = require('../config/supabaseClient');

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

const bcrypt = require('bcrypt'); // Keep temporarily, remove usage later

let userTimeEntries = {};

function setUserTimeEntries(entries) {
    userTimeEntries = entries;
}

const checkAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        if (req.originalUrl.startsWith('/admin/api')) {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }
        return res.status(403).render('error', {
            message: 'Access denied. Admin privileges required.',
            activePage: 'error'
        });
    }
    next();
};

async function getTimesheetData() {
    try {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const thirtyDaysAgoISO = thirtyDaysAgo.toISOString().split('T')[0];

        const { data: employees, error: employeesError } = await supabase
            .from('users')
            .select('id, name, username, email')
            .eq('role', 'employee')
            .eq('active', true);

        if (employeesError) {
            console.error('Supabase error fetching employees:', employeesError);
            throw employeesError;
        }

        const { data: leaves, error: leavesError } = await supabase
            .from('leaves')
            .select('employee_id, start_date, end_date')
            .eq('status', 'approved')
            .gte('end_date', thirtyDaysAgoISO);

        if (leavesError) {
            console.error('Supabase error fetching leaves:', leavesError);
            throw leavesError;
        }

        const { data: submittedTimesheets, error: tsError } = await supabase
            .from('timesheets')
            .select('employee_id, date, hours_worked')
            .gte('date', thirtyDaysAgoISO);

        if (tsError) {
            console.error('Supabase error fetching timesheets:', tsError);
            console.warn('Could not fetch timesheets, proceeding without them.');
        }

        const timesheetData = submittedTimesheets || [];

        const allTimesheets = [];
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        for (let i = 0; i < 30; i++) {
            const date = new Date(currentYear, currentMonth, today.getDate() - i);
            if (date.getDay() === 0 || date.getDay() === 6) continue;
            const dateString = date.toISOString().split('T')[0];
            const checkDate = new Date(date);
            checkDate.setUTCHours(0, 0, 0, 0);

            (employees || []).forEach(employee => {
                const onLeave = (leaves || []).some(leave => {
                    const startDate = new Date(leave.start_date);
                    const endDate = new Date(leave.end_date);
                    startDate.setUTCHours(0, 0, 0, 0);
                    endDate.setUTCHours(0, 0, 0, 0);

                    return leave.employee_id === employee.id &&
                           checkDate >= startDate &&
                           checkDate <= endDate;
                });

                const submitted = timesheetData.find(ts =>
                    ts.employee_id === employee.id &&
                    ts.date === dateString
                );

                let status, hoursWorked, missing;

                if (onLeave) {
                    status = 'leave';
                    hoursWorked = 0;
                    missing = false;
                } else if (submitted) {
                    status = 'submitted';
                    hoursWorked = submitted.hours_worked;
                    missing = false;
                } else {
                    status = 'missing';
                    hoursWorked = 0;
                    missing = true;
                }

                allTimesheets.push({
                    employeeId: employee.id,
                    employeeName: employee.name,
                    employeeEmail: employee.email,
                    date: date,
                    hoursWorked: hoursWorked || 0,
                    status: status,
                    missing: missing
                });
            });
        }

        console.log(`Generated ${allTimesheets.length} aggregated timesheet entries.`);
        return allTimesheets;
    } catch (error) {
        console.error('Error generating timesheet data:', error.message);
        return [];
    }
}

router.get('/timesheets', checkAdmin, async (req, res) => {
    try {
        console.log('GET /admin/timesheets called');
        const timesheets = await getTimesheetData();
        res.json(timesheets);
    } catch (error) {
        console.error('Error fetching timesheets:', error);
        res.status(500).json({ message: 'Server error fetching timesheet data' });
    }
});

router.get('/', checkAdmin, async (req, res) => {
    try {
        console.log('GET /admin called');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, username, name, role, active, email')
            .order('name');

        if (usersError) {
            console.error('Supabase error fetching users for admin page:', usersError);
            throw usersError;
        }

        const timesheets = await getTimesheetData();

        res.render('admin', {
            users: users || [],
            timesheets: timesheets || [],
            activePage: 'admin',
            currentUser: req.session.user
        });
    } catch (error) {
        console.error('Error fetching admin data:', error);
        res.render('admin', {
            users: [],
            timesheets: [],
            activePage: 'admin',
            currentUser: req.session.user,
            error: `Failed to load admin data: ${error.message}`
        });
    }
});

router.post('/api/users', checkAdmin, async (req, res) => {
    // Ensure admin client is available
    if (!supabaseAdmin) {
        return res.status(500).json({ message: 'Admin client not configured.' });
    }

    try {
        const { username, fullName, email, role, password } = req.body;
        console.log('POST /admin/api/users called with email:', email);

        // --- SUPABASE REFACTOR START ---
        // 1. Check if user already exists in public.users (using anon client respects RLS)
        const { data: existingProfile, error: profileError } = await supabase
            .from('users')
            .select('id')
            .or(`username.eq.${username},email.eq.${email}`)
            .maybeSingle();

        if (profileError) {
            console.error('Supabase error checking existing user profile:', profileError);
            return res.status(500).json({ message: 'Database error checking user existence.' });
        }

        if (existingProfile) {
             console.warn(`User profile already exists for username ${username} or email ${email}.`);
             return res.status(400).json({ message: 'Username or email already exists.' });
        }

        // 2. Create user in Supabase Auth using the ADMIN client
        console.log('Attempting to create user in Supabase Auth via Admin Client...');
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({ // Use supabaseAdmin
            email: email,
            password: password,
            email_confirm: true, // Auto-confirm user for simplicity here
            user_metadata: { name: fullName, role: role } // Store non-sensitive metadata
        });

        if (authError) {
            console.error('Supabase Auth error creating user:', authError);
            let message = 'Error creating user in authentication system.';
            if (authError.message.includes('already registered')) {
                message = 'Email address is already registered.';
            }
            return res.status(400).json({ message: message, details: authError.message });
        }

        if (!authData || !authData.user) {
            console.error('Supabase Auth user creation did not return user data.');
            return res.status(500).json({ message: 'User created in Auth, but failed to retrieve details.' });
        }

        const userId = authData.user.id;
        console.log('User created in Supabase Auth with ID:', userId);

        // 3. Insert corresponding profile into public.users (can use anon client if RLS allows admins)
        //    Or use supabaseAdmin for guaranteed write access.
        console.log('Inserting user profile into public.users using Admin Client...');
        const { data: profileData, error: insertError } = await supabaseAdmin // Use supabaseAdmin for insert
            .from('users')
            .insert({
                id: userId, // Link to the auth user
                username: username,
                name: fullName,
                email: email, // Match the auth email
                role: role,
                active: true // Default to active
            })
            .select() 
            .single();

        if (insertError) {
            console.error('Supabase error inserting user profile:', insertError);
            console.warn(`Profile insertion failed for Auth user ${userId}. Attempting to delete Auth user.`);
            // Use supabaseAdmin to delete the orphaned auth user
            const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
            if (deleteAuthError) {
                 console.error(`Failed to delete orphaned Auth user ${userId}:`, deleteAuthError);
            }
            return res.status(500).json({ message: 'Failed to save user profile after authentication.', details: insertError.message });
        }

        console.log('User profile created successfully:', profileData);
        // --- SUPABASE REFACTOR END ---

        res.status(201).json({
            message: 'User created successfully',
            userId: userId 
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: `Server error creating user: ${error.message}` });
    }
});

router.delete('/api/users/:id', checkAdmin, async (req, res) => {
    // Ensure admin client is available
    if (!supabaseAdmin) {
        return res.status(500).json({ message: 'Admin client not configured.' });
    }
    
    try {
        const { id } = req.params;
        console.log('DELETE /admin/api/users/:id called for ID:', id);

        if (!id || typeof id !== 'string' || id.length !== 36) {
            return res.status(400).json({ message: 'Invalid user ID format.' });
        }

        const sessionUserId = req.session.user?.id?.toString();
        if (sessionUserId && sessionUserId === id) {
            console.warn('Attempt to delete own account blocked for ID:', id);
            return res.status(400).json({ message: 'Cannot delete your own account.' });
        }

        // --- SUPABASE REFACTOR START ---
        // Delete the user from Supabase Auth using the ADMIN client
        // Cascade should handle public.users deletion.
        console.log('Attempting to delete user from Supabase Auth via Admin Client:', id);
        const { data: deleteData, error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id); // Use supabaseAdmin

        if (deleteError) {
            console.error(`Supabase Auth error deleting user ${id}:`, deleteError);
            if (deleteError.message.includes('User not found')) {
                return res.status(404).json({ message: 'User not found in authentication system.' });
            }
            return res.status(500).json({ message: 'Failed to delete user from authentication system.', details: deleteError.message });
        }

        console.log('User deleted successfully from Supabase Auth:', id);
        // --- SUPABASE REFACTOR END ---

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: `Server error deleting user: ${error.message}` });
    }
});

// Export the router directly
module.exports = router;