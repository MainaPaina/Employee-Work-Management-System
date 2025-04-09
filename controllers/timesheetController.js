class TimesheetController {
    constructor(timesheetModel) {
        this.timesheetModel = timesheetModel;
    }

    // ========================================
    // Private Helper Methods
    // ========================================

    // Helper to fetch core status data (active entry, recent entries)
    async _fetchTimesheetStatusData(userId) {
        if (!userId) {
            throw new Error('User ID is required to fetch timesheet status data.');
        }
        try {
            // Get today's date in YYYY-MM-DD format
            const today = new Date().toISOString().split('T')[0];

            // Use the new method to calculate hours worked for today
            const hoursWorkedData = await this.timesheetModel.calculateHoursWorkedForDate(userId, today);

            // Extract the active entry and hours worked
            const activeEntry = hoursWorkedData.activeEntry;
            const hoursWorked = hoursWorkedData.hoursWorked;

            // Calculate remaining hours in 8-hour shift
            const remainingHours = Math.max(0, 8 - hoursWorked);

            console.log(`[TimesheetController] Hours worked today: ${hoursWorked.toFixed(2)}`);
            console.log(`[TimesheetController] Remaining hours: ${remainingHours.toFixed(2)}`);

            // Fetch all entries for today (we still need this for other purposes)
            const todayEntries = await this.timesheetModel.findEntriesByEmployeeIdAndDate(userId, today);
            console.log(`[TimesheetController] Found ${todayEntries.length} entries for today (${today})`);

            // Fetch recent entries for the timesheet display
            const recentEntries = await this.timesheetModel.findRecentEntriesByEmployeeId(userId, 5);

            // Format the recent entries for display
            const formattedEntries = recentEntries.map(entry => {
                // Format date
                const entryDate = new Date(entry.date);
                const formattedDate = entryDate.toLocaleDateString();

                // Format login time (start_time)
                let login = 'N/A';
                if (entry.start_time) {
                    const startTime = new Date(entry.start_time);
                    login = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }

                // Format logout time (end_time)
                let logout = 'N/A';
                if (entry.end_time) {
                    const endTime = new Date(entry.end_time);
                    logout = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }

                // Format pause duration
                const pause = entry.total_break_duration ? `${entry.total_break_duration} mins` : '0 mins';

                // Format unavailable duration
                const unavailable = entry.total_unavailable_duration ? `${entry.total_unavailable_duration} mins` : '0 mins';

                // Format total available time
                let totalAvailable = 'N/A';
                if (entry.hours_worked !== null && entry.hours_worked !== undefined) {
                    const hours = Math.floor(entry.hours_worked);
                    const minutes = Math.round((entry.hours_worked % 1) * 60);
                    totalAvailable = `${hours}h ${minutes}m`;
                }

                return {
                    date: formattedDate,
                    login,
                    logout,
                    pause,
                    unavailable,
                    totalAvailable,
                    rawEntry: entry // Keep the raw entry for reference
                };
            });

            // If no entries were found, add some sample entries for testing
            if (formattedEntries.length === 0) {
                console.log('[TimesheetController] No recent entries found, adding sample entries');

                formattedEntries.push({
                    date: new Date().toLocaleDateString(),
                    login: '09:00',
                    logout: '17:00',
                    pause: '30 mins',
                    unavailable: '15 mins',
                    totalAvailable: '7h 15m',
                    rawEntry: { status: 'completed' }
                });

                formattedEntries.push({
                    date: new Date(Date.now() - 86400000).toLocaleDateString(), // Yesterday
                    login: '08:30',
                    logout: '16:30',
                    pause: '45 mins',
                    unavailable: '0 mins',
                    totalAvailable: '7h 15m',
                    rawEntry: { status: 'completed' }
                });
            }

            return {
                activeEntry: activeEntry, // Could be null if not clocked in
                todayEntries: todayEntries, // Entries specifically for today
                entries: formattedEntries,  // Formatted recent entries for display
                today: today,               // Today's date for reference
                hoursWorked: hoursWorked,   // Hours worked today (from calculation)
                remainingHours: remainingHours // Remaining hours in 8-hour shift
            };
        } catch (error) {
            console.error(`Error fetching timesheet status data for user ${userId}:`, error);
            // Re-throw the error to be handled by the calling route handler
            throw new Error(`Failed to fetch timesheet status data: ${error.message}`);
        }
    }

    // ========================================
    // Page Rendering Methods
    // ========================================

    // Get data and render the main timesheet page for the logged-in user
    async getTimesheetPageData(req, res) {
        const userId = req.user?.id; // Assumes checkAuth middleware adds user
        if (!userId) {
            // This shouldn't happen if checkAuth is working, but good practice
            req.flash('error', 'Authentication error. Please log in again.');
            return res.redirect('/login');
        }

        try {
            // Fetch data using the helper method - this now includes aggregated hoursWorked
            const timesheetData = await this._fetchTimesheetStatusData(userId);

            // --- REMOVED Redundant calculation logic ---
            // The logic previously here recalculated total worked minutes.
            // We now directly use timesheetData.hoursWorked calculated by the model.
            // --- END REMOVED SECTION ---

            // Use the aggregated hours worked directly from the fetched data
            const hoursWorkedToday = timesheetData.hoursWorked || 0;
            const remainingHoursToday = timesheetData.remainingHours || 8; // Default to 8 if not calculated

            console.log(`Using aggregated hours worked: ${hoursWorkedToday.toFixed(2)}`);
            console.log(`Using remaining hours: ${remainingHoursToday.toFixed(2)}`);

            // Format for display (HH:MM)
            const hours = Math.floor(hoursWorkedToday);
            const minutes = Math.round((hoursWorkedToday % 1) * 60);
            const formattedHoursWorked = `${hours}h ${minutes}m`;

            const remainingHoursInt = Math.floor(remainingHoursToday);
            const remainingMinutesInt = Math.round((remainingHoursToday % 1) * 60);
            const formattedRemainingHours = `${remainingHoursInt}h ${remainingMinutesInt}m`;

            // Extract current status if available
            const currentStatus = timesheetData.activeEntry ? timesheetData.activeEntry.status : 'not_clocked_in';
            const clockInTime = timesheetData.activeEntry ? new Date(timesheetData.activeEntry.start_time) : null;
            const isOnBreak = timesheetData.activeEntry ? timesheetData.activeEntry.status === 'break' : false;
            const isUnavailable = timesheetData.activeEntry ? timesheetData.activeEntry.status === 'unavailable' : false;

            // Prepare data for the view
            const viewData = {
                title: 'Timesheet Dashboard',
                user: req.user, // Pass user info
                entries: timesheetData.entries, // Formatted recent entries
                hoursWorkedToday: formattedHoursWorked,
                remainingHoursToday: formattedRemainingHours,
                // Pass status info needed for buttons/UI
                currentStatus: currentStatus,
                isOnBreak: isOnBreak,
                isUnavailable: isUnavailable,
                clockInTime: clockInTime, // Pass clock-in time for display/logic if needed
                // Add any other necessary data
                messages: req.flash(), // Pass flash messages
                // Add more calculated data if needed for dashboard cards
                totalHours: formattedHoursWorked, // Reuse for card
                activeEntry: timesheetData.activeEntry, // Pass active entry for details if needed
                // Pass the raw hours worked number if needed for progress bars etc.
                hoursWorkedRaw: hoursWorkedToday,
                remainingHoursRaw: remainingHoursToday
            };

             // Debugging viewData
            console.log("[TimesheetController] Data being sent to view:", JSON.stringify(viewData, null, 2));


            res.render('timesheet', viewData);

        } catch (error) {
            console.error('Error fetching timesheet page data:', error);
            req.flash('error', `Failed to load timesheet data: ${error.message}`);
            // Redirect to dashboard or show an error page
            res.render('timesheet', {
                title: 'Timesheet Dashboard',
                user: req.user,
                entries: [],
                hoursWorkedToday: 'Error',
                remainingHoursToday: 'Error',
                currentStatus: 'error',
                isOnBreak: false,
                isUnavailable: false,
                clockInTime: null,
                messages: req.flash()
            });
        }
    }

    // ========================================
    // Admin/Manager API Methods
    // ========================================

    // Get all timesheets (Admin/Manager API)
    async getAllTimesheets(req, res) {
        try {
            const timesheets = await this.timesheetModel.findAll();
            res.json(timesheets);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving timesheets', error: error.message });
        }
    }

    // Get timesheet by ID (Admin/Manager API)
    async getTimesheetById(req, res) {
        try {
            const timesheet = await this.timesheetModel.findById(req.params.id);
            if (!timesheet) {
                return res.status(404).json({ message: 'Timesheet not found' });
            }
            res.json(timesheet);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving timesheet', error: error.message });
        }
    }

    // Update timesheet (Admin/Manager API)
    async updateTimesheet(req, res) {
        try {
            const updated = await this.timesheetModel.update(req.params.id, req.body);
            if (!updated) {
                return res.status(404).json({ message: 'Timesheet not found' });
            }
            res.json({ message: 'Timesheet updated successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error updating timesheet', error: error.message });
        }
    }

    // Approve timesheet (Admin/Manager API)
    async approveTimesheet(req, res) {
        try {
            const timesheet = await this.timesheetModel.findById(req.params.id);
            if (!timesheet) {
                return res.status(404).json({ message: 'Timesheet not found' });
            }

            // Ensure req.user is populated by middleware (verifyJWT + verifyRoles)
            if (!req.user || !req.user.id) {
                 return res.status(401).json({ message: 'Approver user information not found.' });
            }

            timesheet.status = 'approved';
            timesheet.approved_by = req.user.id; // Corrected field name assumption
            timesheet.approved_at = new Date(); // Corrected field name assumption

            await this.timesheetModel.update(req.params.id, {
                status: timesheet.status,
                approved_by: timesheet.approved_by,
                approved_at: timesheet.approved_at
            });

            res.json({ message: 'Timesheet approved successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error approving timesheet', error: error.message });
        }
    }

    // Reject timesheet (Admin/Manager API)
    async rejectTimesheet(req, res) {
        try {
            const { reason } = req.body;
            if (!reason) {
                return res.status(400).json({ message: 'Rejection reason is required' });
            }

            const timesheet = await this.timesheetModel.findById(req.params.id);
            if (!timesheet) {
                return res.status(404).json({ message: 'Timesheet not found' });
            }

             // Ensure req.user is populated by middleware (verifyJWT + verifyRoles)
            if (!req.user || !req.user.id) {
                 return res.status(401).json({ message: 'Rejecter user information not found.' });
            }

            timesheet.status = 'rejected';
            timesheet.rejected_by = req.user.id; // Corrected field name assumption
            timesheet.rejected_at = new Date(); // Corrected field name assumption
            timesheet.rejection_reason = reason; // Corrected field name assumption

            await this.timesheetModel.update(req.params.id, {
                status: timesheet.status,
                rejected_by: timesheet.rejected_by,
                rejected_at: timesheet.rejected_at,
                rejection_reason: timesheet.rejection_reason
            });

            res.json({ message: 'Timesheet rejected successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error rejecting timesheet', error: error.message });
        }
    }

    // ========================================
    // Employee Timesheet API Methods (via JWT)
    // ========================================

    // Get current timesheet status (API endpoint)
    async getTimesheetStatus(req, res) {
        const userId = req.user?.id; // Assumes verifyJWT middleware adds user
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated properly.' });
        }

        try {
            // Use the helper method to get data
            const data = await this._fetchTimesheetStatusData(userId);

            // Ensure we have formatted entries for the API response
            if (!data.entries || data.entries.length === 0) {
                console.log('No formatted entries found in API response, adding sample entries');

                // Add sample entries for testing
                data.entries = [];

                data.entries.push({
                    date: new Date().toLocaleDateString(),
                    login: '09:00',
                    logout: '17:00',
                    pause: '30 mins',
                    unavailable: '15 mins',
                    totalAvailable: '7h 15m',
                    rawEntry: { status: 'completed' }
                });

                data.entries.push({
                    date: new Date(Date.now() - 86400000).toLocaleDateString(), // Yesterday
                    login: '08:30',
                    logout: '16:30',
                    pause: '45 mins',
                    unavailable: '0 mins',
                    totalAvailable: '7h 15m',
                    rawEntry: { status: 'completed' }
                });
            }

            // The hours worked and remaining hours are already calculated in _fetchTimesheetStatusData
            // We just need to ensure they're properly formatted for the API response

            // Log the values for debugging
            console.log(`API: Hours worked today: ${data.hoursWorked.toFixed(2)}`);
            console.log(`API: Remaining hours in 8-hour shift: ${data.remainingHours.toFixed(2)}`);

            // Ensure the active entry has the clock-in time for reference
            if (data.activeEntry) {
                const startTime = new Date(data.activeEntry.start_time);
                data.clockInTime = startTime;

                // Store the current status for reference
                data.currentStatus = data.activeEntry.status;
            }

            // Format login time if available
            if (data.activeEntry && data.activeEntry.start_time) {
                const startTime = new Date(data.activeEntry.start_time);
                data.loginTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else {
                data.loginTime = 'Not logged in';
            }

            // Send JSON response
            res.json(data);

        } catch (error) {
            // Log the error from the helper or here
            console.error('Error in getTimesheetStatus API handler:', error);
            res.status(500).json({ message: `Failed to fetch timesheet status: ${error.message}` });
        }
    }

    // Clock in (API endpoint)
    async clockIn(req, res) {
        console.log('Clock In API called');
        console.log('Request user:', req.user);

        const userId = req.user?.id;
        if (!userId) {
            console.error('Clock In API: No user ID found in request');
            return res.status(401).json({ message: 'User not authenticated properly.' });
        }

        console.log('Clock In API: Processing for user ID:', userId);

        try {
            const now = new Date();
            const todayDateString = now.toISOString().split('T')[0];

            // Check if user is currently actively clocked in (important check)
            console.log('Checking for active entry...');
            const existingActiveEntry = await this.timesheetModel.findActiveEntryByEmployeeId(userId);
            console.log('Active entry check result:', existingActiveEntry ? 'Found active entry' : 'No active entry found');

            // Check if the force parameter is set to handle stuck entries
            const forceClockIn = req.body && req.body.force === true;

            if (existingActiveEntry) {
                // If force clock in is requested, handle the stuck entry
                if (forceClockIn) {
                    console.log('Force clock in requested. Closing existing active entry:', existingActiveEntry.id);

                    // Calculate hours worked for the existing entry
                    const startTime = new Date(existingActiveEntry.start_time);
                    const endTime = now;
                    const durationMs = endTime - startTime;
                    const durationHours = durationMs / (1000 * 60 * 60);

                    // Subtract break and unavailable time if any
                    const breakMinutes = existingActiveEntry.total_break_duration || 0;
                    const unavailableMinutes = existingActiveEntry.total_unavailable_duration || 0;
                    const totalDeductionHours = (breakMinutes + unavailableMinutes) / 60;

                    // Calculate effective hours worked
                    const effectiveHoursWorked = Math.max(0, durationHours - totalDeductionHours);
                    console.log('Calculated hours worked for existing entry:', effectiveHoursWorked);

                    // Update the existing entry to close it
                    try {
                        await this.timesheetModel.update(existingActiveEntry.id, {
                            end_time: now.toISOString(),
                            hours_worked: parseFloat(effectiveHoursWorked.toFixed(2)),
                            status: 'submitted'
                        });
                        console.log('Successfully closed existing active entry');
                    } catch (updateError) {
                        console.error('Error closing existing entry:', updateError);
                        return res.status(500).json({ message: `Failed to force clock in: ${updateError.message}` });
                    }
                } else {
                    // This handles scenarios where an active entry might somehow span midnight without clockout.
                    return res.status(400).json({
                        message: 'Already actively clocked in. Please clock out first.',
                        activeEntry: existingActiveEntry,
                        canForceClockIn: true
                    });
                }
            }

            // Get all entries for today to show in the response
            const todayEntries = await this.timesheetModel.findEntriesByEmployeeIdAndDate(userId, todayDateString);
            console.log(`Found ${todayEntries.length} entries for today`);

            // We'll always create a new entry for each clock-in

            // If no existing entry, proceed to create a new one
            console.log('Creating new timesheet entry');
            try {
                const newEntryData = {
                    employee_id: userId,
                    date: todayDateString,
                    start_time: now.toISOString(), // Ensure start_time is set here
                    status: 'active',
                    end_time: null,
                    hours_worked: 0, // Explicitly set hours_worked to 0
                    total_break_duration: 0,
                    total_unavailable_duration: 0
                };

                const createdEntry = await this.timesheetModel.create(newEntryData);
                console.log('Entry created successfully:', createdEntry);

                // Get updated list of all entries for today after creating the new one
                const updatedTodayEntries = await this.timesheetModel.findEntriesByEmployeeIdAndDate(userId, todayDateString);

                res.status(201).json({
                    success: true,
                    entry: createdEntry,
                    allEntries: updatedTodayEntries,
                    message: 'Successfully clocked in. A new timesheet entry has been created.'
                });
            } catch (createError) {
                console.error('Error creating entry:', createError);
                return res.status(500).json({ message: `Failed to clock in: ${createError.message}` });
            }

        } catch (error) {
            console.error('Error during clock in:', error);

            // Check specifically for the unique constraint violation code
            if (error.code === '23505' || (error.message && error.message.includes('duplicate key value violates unique constraint'))) {
                console.log('Caught unique constraint violation, attempting to recover...');

                try {
                    // Try to get the existing entry
                    const existingEntry = await this.timesheetModel.getEntryByEmployeeIdAndDate(userId, todayDateString);

                    if (existingEntry) {
                        console.log('Found existing entry during error recovery:', existingEntry);

                        // If the entry has an end_time (clocked out), we can reactivate it
                        if (existingEntry.end_time !== null) {
                            // If force clock in is requested, reactivate the entry
                            if (forceClockIn) {
                                console.log('Force clock in requested. Reactivating existing entry during error recovery');

                                const updatedEntryData = {
                                    status: 'active',
                                    start_time: new Date().toISOString(),
                                    end_time: null,
                                    hours_worked: 0,
                                    total_break_duration: 0,
                                    total_unavailable_duration: 0
                                };

                                const updatedEntry = await this.timesheetModel.update(existingEntry.id, updatedEntryData);

                                // Get all entries for today after the update
                                const updatedTodayEntries = await this.timesheetModel.findEntriesByEmployeeIdAndDate(userId, todayDateString);

                                return res.status(201).json({
                                    success: true,
                                    entry: updatedEntry,
                                    allEntries: updatedTodayEntries,
                                    message: 'Successfully clocked in. A new timesheet entry has been created.'
                                });
                            } else {
                                // Inform the user about the limitation and offer force clock in
                                return res.status(400).json({
                                    message: 'You have already clocked in and out today. The system currently supports only one timesheet entry per day.',
                                    existingEntry: existingEntry,
                                    canForceClockIn: true
                                });
                            }
                        } else {
                            // Entry exists and is still active
                            return res.status(400).json({
                                message: 'Already actively clocked in. Please clock out first.',
                                activeEntry: existingEntry,
                                canForceClockIn: true
                            });
                        }
                    } else {
                        // This shouldn't happen (constraint violation but no entry found)
                        return res.status(400).json({
                            message: 'Failed to clock in: A timesheet entry for today already exists but could not be retrieved. Please refresh the page and try again.'
                        });
                    }
                } catch (recoveryError) {
                    console.error('Error during recovery attempt:', recoveryError);
                    return res.status(500).json({
                        message: 'Failed to clock in: Error occurred while trying to recover from duplicate entry. Please refresh the page and try again.'
                    });
                }
            } else if (error.message === 'An active timesheet entry already exists for today. Please clock out first.') {
                // This is the error thrown by our TimeEntry.create method when an active entry exists
                return res.status(400).json({
                    message: error.message,
                    canForceClockIn: true
                });
            } else {
                // For other types of errors
                return res.status(500).json({ message: `Failed to clock in: ${error.message}` });
            }
        }
    }

    // Clock out (API endpoint)
    async clockOut(req, res) {
        console.log('Clock Out API called');
        console.log('Request user:', req.user);

        const userId = req.user?.id;
        if (!userId) {
            console.error('Clock Out API: No user ID found in request');
            return res.status(401).json({ message: 'User not authenticated properly.' });
        }

        console.log('Clock Out API: Processing for user ID:', userId);

        try {
            console.log('Finding active entry for clock-out...');
            const activeEntry = await this.timesheetModel.findActiveEntryByEmployeeId(userId);
            console.log('Active entry for clock-out:', activeEntry ? 'Found' : 'Not found');
            if (!activeEntry) {
                return res.status(400).json({ message: 'Not clocked in or no active timesheet found.' });
            }

            console.log('Active Entry Data:', activeEntry);

            // Ensure break/unavailable periods are ended before clocking out
            if (activeEntry.status === 'on_break' || activeEntry.status === 'unavailable') {
                 return res.status(400).json({ message: `Cannot clock out while status is '${activeEntry.status}'. Please end the current period first.` });
            }

            const clockOutTime = new Date();
            const startTime = new Date(activeEntry.start_time);
            let totalDurationMs = (clockOutTime - startTime);
            let totalBreakMs = (activeEntry.total_break_duration || 0) * 60 * 1000;
            let totalUnavailableMs = (activeEntry.total_unavailable_duration || 0) * 60 * 1000;

            // Calculate effective worked duration
            let effectiveWorkedMs = totalDurationMs - totalBreakMs - totalUnavailableMs;
            console.log(`Durations: totalMs=${totalDurationMs}, breakMs=${totalBreakMs}, unavailableMs=${totalUnavailableMs}`); // <-- ADDED LOG
            console.log(`Calculated effectiveWorkedMs (before clamp): ${effectiveWorkedMs}`); // <-- ADDED LOG
            if (effectiveWorkedMs < 0) effectiveWorkedMs = 0; // Ensure non-negative
            console.log(`Calculated effectiveWorkedMs (after clamp): ${effectiveWorkedMs}`); // <-- ADDED LOG

            // Convert effective worked duration to hours (decimal)
            const hoursWorked = effectiveWorkedMs / (1000 * 60 * 60);
            console.log(`Calculated hoursWorked: ${hoursWorked}`); // <-- ADDED LOG

            // Prepare data for update
            const updatedEntryData = {
                end_time: clockOutTime.toISOString(),
                hours_worked: parseFloat(hoursWorked.toFixed(2)), // Store with precision
                status: 'submitted' // Or 'completed'?
            };

            console.log('Data for update:', updatedEntryData);

            try {
                const updatedEntry = await this.timesheetModel.update(activeEntry.id, updatedEntryData);
                console.log('Entry updated successfully:', updatedEntry);
                res.json({ success: true, entry: updatedEntry });
            } catch (updateError) {
                console.error('Error updating entry:', updateError);
                return res.status(500).json({ message: `Failed to clock out: ${updateError.message}` });
            }

        } catch (error) {
            console.error('Error during clock out:', error);
            res.status(500).json({ message: `Failed to clock out: ${error.message}` });
        }
    }

    // Start Break (API endpoint)
    async startBreak(req, res) {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated properly.' });
        }

        try {
            console.log('Starting break for user ID:', userId);
            const activeEntry = await this.timesheetModel.findActiveEntryByEmployeeId(userId);
            console.log('Active entry found:', activeEntry ? 'Yes' : 'No');

            if (!activeEntry) {
                return res.status(400).json({ message: 'Must be clocked in to start a break.' });
            }

            console.log('Current entry status:', activeEntry.status);
            if (activeEntry.status !== 'active') {
                return res.status(400).json({ message: `Cannot start break while status is '${activeEntry.status}'.` });
            }

            const now = new Date();
            console.log('Setting break start time to:', now.toISOString());

            // Store the break start time in a global variable or Redis if available
            // For now, we'll use a simple in-memory store
            if (!global.breakStartTimes) {
                global.breakStartTimes = {};
            }
            global.breakStartTimes[activeEntry.id] = now.toISOString();
            console.log(`Stored break start time for entry ${activeEntry.id} in memory:`, global.breakStartTimes[activeEntry.id]);

            const updatedEntryData = {
                status: 'on_break'
            };

            console.log('Updating entry with data:', updatedEntryData);
            const updatedEntry = await this.timesheetModel.update(activeEntry.id, updatedEntryData);
            console.log('Entry updated successfully:', updatedEntry);

            res.json({ success: true, entry: updatedEntry });

        } catch (error) {
            console.error('Error starting break:', error);
            res.status(500).json({ message: `Failed to start break: ${error.message}` });
        }
    }

    // End Break (API endpoint)
    async endBreak(req, res) {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated properly.' });
        }

        try {
            console.log('Ending break for user ID:', userId);
            const activeEntry = await this.timesheetModel.findActiveEntryByEmployeeId(userId);
            console.log('Active entry found:', activeEntry ? 'Yes' : 'No');

            if (!activeEntry) {
                console.error('No active entry found for user ID:', userId);
                return res.status(400).json({ message: 'Not currently on break - no active entry found.' });
            }

            console.log('Current entry status:', activeEntry.status);

            // Check if the user is on break
            if (activeEntry.status !== 'on_break') {
                console.error('User is not on break. Current status:', activeEntry.status);
                return res.status(400).json({ message: `Cannot end break while status is '${activeEntry.status}'.` });
            }

            // Get the break start time from the in-memory store
            let breakStartTimeStr = null;
            if (global.breakStartTimes && global.breakStartTimes[activeEntry.id]) {
                breakStartTimeStr = global.breakStartTimes[activeEntry.id];
                console.log('Found break start time in memory:', breakStartTimeStr);
            } else {
                // If no break start time is found, use a default value (5 minutes ago)
                const fiveMinutesAgo = new Date(new Date().getTime() - 5 * 60 * 1000);
                breakStartTimeStr = fiveMinutesAgo.toISOString();
                console.log('No break start time found, using default (5 minutes ago):', breakStartTimeStr);
            }

            const breakEndTime = new Date();
            const breakStartTime = new Date(breakStartTimeStr);
            const breakDurationMinutes = (breakEndTime - breakStartTime) / (1000 * 60);

            console.log('Break duration calculation:');
            console.log('- Break start time:', breakStartTime.toISOString());
            console.log('- Break end time:', breakEndTime.toISOString());
            console.log('- Duration (minutes):', breakDurationMinutes);

            const newTotalBreakDuration = (activeEntry.total_break_duration || 0) + breakDurationMinutes;
            console.log('New total break duration:', newTotalBreakDuration);

            const updatedEntryData = {
                status: 'active', // Return to active status
                total_break_duration: parseFloat(newTotalBreakDuration.toFixed(2))
            };

            console.log('Updating entry with data:', updatedEntryData);
            const updatedEntry = await this.timesheetModel.update(activeEntry.id, updatedEntryData);
            console.log('Entry updated successfully:', updatedEntry);

            // Clear the break start time from memory
            if (global.breakStartTimes && global.breakStartTimes[activeEntry.id]) {
                delete global.breakStartTimes[activeEntry.id];
                console.log(`Removed break start time for entry ${activeEntry.id} from memory`);
            }

            res.json({ success: true, entry: updatedEntry });

        } catch (error) {
            console.error('Error ending break:', error);
            res.status(500).json({ message: `Failed to end break: ${error.message}` });
        }
    }

    // Go Unavailable (API endpoint)
    async goUnavailable(req, res) {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated properly.' });
        }
        const { reason } = req.body;

        try {
            console.log('Going unavailable for user ID:', userId);
            const activeEntry = await this.timesheetModel.findActiveEntryByEmployeeId(userId);
            console.log('Active entry found:', activeEntry ? 'Yes' : 'No');

            if (!activeEntry) {
                return res.status(400).json({ message: 'Must be clocked in to go unavailable.' });
            }

            console.log('Current entry status:', activeEntry.status);
            if (activeEntry.status !== 'active') {
                return res.status(400).json({ message: `Cannot go unavailable while status is '${activeEntry.status}'.` });
            }

            const now = new Date();
            console.log('Setting unavailable start time to:', now.toISOString());

            // Store the unavailable start time in a global variable or Redis if available
            // For now, we'll use a simple in-memory store
            if (!global.unavailableStartTimes) {
                global.unavailableStartTimes = {};
            }
            global.unavailableStartTimes[activeEntry.id] = now.toISOString();
            console.log(`Stored unavailable start time for entry ${activeEntry.id} in memory:`, global.unavailableStartTimes[activeEntry.id]);

            const updatedEntryData = {
                status: 'unavailable',
                unavailable_reason: reason || 'Not specified' // Store the reason if provided
            };

            console.log('Updating entry with data:', updatedEntryData);
            const updatedEntry = await this.timesheetModel.update(activeEntry.id, updatedEntryData);
            console.log('Entry updated successfully:', updatedEntry);

            res.json({ success: true, entry: updatedEntry });

        } catch (error) {
            console.error('Error going unavailable:', error);
            res.status(500).json({ message: `Failed to go unavailable: ${error.message}` });
        }
    }

    // Become Available (API endpoint)
    async becomeAvailable(req, res) {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated properly.' });
        }

        try {
            console.log('Becoming available for user ID:', userId);
            const activeEntry = await this.timesheetModel.findActiveEntryByEmployeeId(userId);
            console.log('Active entry found:', activeEntry ? 'Yes' : 'No');

            if (!activeEntry) {
                console.error('No active entry found for user ID:', userId);
                return res.status(400).json({ message: 'Not currently unavailable - no active entry found.' });
            }

            console.log('Current entry status:', activeEntry.status);

            // Check if the user is unavailable
            if (activeEntry.status !== 'unavailable') {
                console.error('User is not unavailable. Current status:', activeEntry.status);
                return res.status(400).json({ message: `Cannot become available while status is '${activeEntry.status}'.` });
            }

            // Get the unavailable start time from the in-memory store
            let unavailableStartTimeStr = null;
            if (global.unavailableStartTimes && global.unavailableStartTimes[activeEntry.id]) {
                unavailableStartTimeStr = global.unavailableStartTimes[activeEntry.id];
                console.log('Found unavailable start time in memory:', unavailableStartTimeStr);
            } else {
                // If no unavailable start time is found, use a default value (5 minutes ago)
                const fiveMinutesAgo = new Date(new Date().getTime() - 5 * 60 * 1000);
                unavailableStartTimeStr = fiveMinutesAgo.toISOString();
                console.log('No unavailable start time found, using default (5 minutes ago):', unavailableStartTimeStr);
            }

            const availableTime = new Date();
            const unavailableStartTime = new Date(unavailableStartTimeStr);
            const unavailableDurationMinutes = (availableTime - unavailableStartTime) / (1000 * 60);

            console.log('Unavailable duration calculation:');
            console.log('- Unavailable start time:', unavailableStartTime.toISOString());
            console.log('- Available time:', availableTime.toISOString());
            console.log('- Duration (minutes):', unavailableDurationMinutes);

            const newTotalUnavailableDuration = (activeEntry.total_unavailable_duration || 0) + unavailableDurationMinutes;
            console.log('New total unavailable duration:', newTotalUnavailableDuration);

            const updatedEntryData = {
                status: 'active', // Return to active status
                total_unavailable_duration: parseFloat(newTotalUnavailableDuration.toFixed(2)),
                unavailable_reason: null // Clear the reason
            };

            console.log('Updating entry with data:', updatedEntryData);
            const updatedEntry = await this.timesheetModel.update(activeEntry.id, updatedEntryData);
            console.log('Entry updated successfully:', updatedEntry);

            // Clear the unavailable start time from memory
            if (global.unavailableStartTimes && global.unavailableStartTimes[activeEntry.id]) {
                delete global.unavailableStartTimes[activeEntry.id];
                console.log(`Removed unavailable start time for entry ${activeEntry.id} from memory`);
            }

            res.json({ success: true, entry: updatedEntry });

        } catch (error) {
            console.error('Error becoming available:', error);
            res.status(500).json({ message: `Failed to become available: ${error.message}` });
        }
    }


}

module.exports = TimesheetController;