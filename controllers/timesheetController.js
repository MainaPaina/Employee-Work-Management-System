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
            const activeEntry = await this.timesheetModel.findActiveEntryByEmployeeId(userId);
            // Fetch a reasonable number of recent entries for context
            const recentEntries = await this.timesheetModel.findRecentEntriesByEmployeeId(userId, 5); // Example: fetch 5 recent

            // Format data slightly if needed for consistency in the view
            // Example: Ensure loginTime format, calculate duration if needed, etc.
            // For now, return raw data.

            return {
                activeEntry: activeEntry, // Could be null if not clocked in
                entries: recentEntries   // Could be an empty array
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
            // Fetch data using the helper method
            const timesheetData = await this._fetchTimesheetStatusData(userId);

            // Render the EJS template, passing the fetched data
            res.render('timesheet', {
                activePage: 'timesheet',
                title: 'My Timesheet',
                timesheetData: timesheetData // Pass the fetched data here
                // Add any other necessary local variables for the view
            });

        } catch (error) {
            console.error('Error rendering timesheet page:', error);
            req.flash('error', 'Could not load timesheet data. Please try again later.');
            // Redirect to dashboard or show an error page?
            res.redirect(req.session.returnTo || '/dashboard');
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
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated properly.' });
        }

        try {
            const now = new Date();
            const todayDateString = now.toISOString().split('T')[0];

            // Check if user is currently actively clocked in (important check)
            const existingActiveEntry = await this.timesheetModel.findActiveEntryByEmployeeId(userId);
            if (existingActiveEntry) {
                // This handles scenarios where an active entry might somehow span midnight without clockout.
                return res.status(400).json({ message: 'Already actively clocked in. Please clock out first.' });
            }

            // Check if there's already an entry for today
            const existingEntry = await this.timesheetModel.getEntryByEmployeeIdAndDate(userId, todayDateString);

            if (existingEntry) {
                console.log('Found existing entry for today:', existingEntry);

                // If the entry is not active (e.g., it was completed earlier), we can reactivate it
                if (existingEntry.status !== 'active' && existingEntry.end_time !== null) {
                    console.log('Reactivating existing entry');

                    // Update the existing entry to make it active again
                    const updatedEntryData = {
                        status: 'active',
                        start_time: now.toISOString(), // Update start time to now
                        end_time: null, // Clear end time
                        // Keep existing break and unavailable durations
                    };

                    const updatedEntry = await this.timesheetModel.update(existingEntry.id, updatedEntryData);
                    return res.status(200).json({
                        success: true,
                        entry: updatedEntry,
                        message: 'Reactivated existing timesheet entry for today.'
                    });
                } else {
                    // If the entry exists but is in an unexpected state, return an error
                    return res.status(400).json({
                        message: 'A timesheet entry for today already exists but is in an unexpected state. Please contact support.'
                    });
                }
            }

            // If no existing entry, proceed to create a new one
            console.log('Creating new timesheet entry');
            const newEntryData = {
                employee_id: userId,
                date: todayDateString,
                start_time: now.toISOString(), // Ensure start_time is set here
                status: 'active',
                end_time: null,
                hours_worked: 0, // Explicitly set hours_worked to 0
                total_break_duration: 0,
                last_break_start_time: null,
                total_unavailable_duration: 0,
                last_unavailable_start_time: null
            };

            const createdEntry = await this.timesheetModel.create(newEntryData);
            res.status(201).json({ success: true, entry: createdEntry });

        } catch (error) {
            console.error('Error during clock in:', error);
            // Check specifically for the unique constraint violation code
            if (error.code === '23505') {
                 return res.status(400).json({
                     message: 'Failed to clock in: A timesheet entry for today already exists. Please refresh the page to see your current status.'
                 });
            } else {
                return res.status(500).json({ message: `Failed to clock in: ${error.message}` });
            }
        }
    }

    // Clock out (API endpoint)
    async clockOut(req, res) {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated properly.' });
        }

        try {
            const activeEntry = await this.timesheetModel.findActiveEntryByEmployeeId(userId);
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

            const updatedEntry = await this.timesheetModel.update(activeEntry.id, updatedEntryData);
            res.json({ success: true, entry: updatedEntry });

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
            const activeEntry = await this.timesheetModel.findActiveEntryByEmployeeId(userId);
            if (!activeEntry) {
                return res.status(400).json({ message: 'Must be clocked in to start a break.' });
            }
            if (activeEntry.status !== 'active') {
                return res.status(400).json({ message: `Cannot start break while status is '${activeEntry.status}'.` });
            }

            const now = new Date();
            const updatedEntryData = {
                status: 'on_break',
                last_break_start_time: now.toISOString()
            };

            const updatedEntry = await this.timesheetModel.update(activeEntry.id, updatedEntryData);
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
            const activeEntry = await this.timesheetModel.findActiveEntryByEmployeeId(userId);
            if (!activeEntry || activeEntry.status !== 'on_break' || !activeEntry.last_break_start_time) {
                return res.status(400).json({ message: 'Not currently on break or break start time missing.' });
            }

            const breakEndTime = new Date();
            const breakStartTime = new Date(activeEntry.last_break_start_time);
            const breakDurationMinutes = (breakEndTime - breakStartTime) / (1000 * 60);

            const newTotalBreakDuration = (activeEntry.total_break_duration || 0) + breakDurationMinutes;

            const updatedEntryData = {
                status: 'active', // Return to active status
                total_break_duration: parseFloat(newTotalBreakDuration.toFixed(2)),
                last_break_start_time: null // Clear the start time
            };

            const updatedEntry = await this.timesheetModel.update(activeEntry.id, updatedEntryData);
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
            const activeEntry = await this.timesheetModel.findActiveEntryByEmployeeId(userId);
            if (!activeEntry) {
                return res.status(400).json({ message: 'Must be clocked in to go unavailable.' });
            }
            if (activeEntry.status !== 'active') {
                return res.status(400).json({ message: `Cannot go unavailable while status is '${activeEntry.status}'.` });
            }

            const now = new Date();
            const updatedEntryData = {
                status: 'unavailable',
                last_unavailable_start_time: now.toISOString(),
                unavailable_reason: reason || 'Not specified' // Store the reason if provided
            };

            const updatedEntry = await this.timesheetModel.update(activeEntry.id, updatedEntryData);
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
            const activeEntry = await this.timesheetModel.findActiveEntryByEmployeeId(userId);
            if (!activeEntry || activeEntry.status !== 'unavailable' || !activeEntry.last_unavailable_start_time) {
                return res.status(400).json({ message: 'Not currently unavailable or unavailable start time missing.' });
            }

            const availableTime = new Date();
            const unavailableStartTime = new Date(activeEntry.last_unavailable_start_time);
            const unavailableDurationMinutes = (availableTime - unavailableStartTime) / (1000 * 60);

            const newTotalUnavailableDuration = (activeEntry.total_unavailable_duration || 0) + unavailableDurationMinutes;

            const updatedEntryData = {
                status: 'active', // Return to active status
                total_unavailable_duration: parseFloat(newTotalUnavailableDuration.toFixed(2)),
                last_unavailable_start_time: null,
                unavailable_reason: null // Clear the reason
            };

            const updatedEntry = await this.timesheetModel.update(activeEntry.id, updatedEntryData);
            res.json({ success: true, entry: updatedEntry });

        } catch (error) {
            console.error('Error becoming available:', error);
            res.status(500).json({ message: `Failed to become available: ${error.message}` });
        }
    }


}

module.exports = TimesheetController;