const express = require('express');
const router = express.Router();
const TimeEntry = require('../model/TimeEntry');

// Dashboard route (main dashboard page, not /apply)
router.get("/", async (req, res) => {
    try {
        const user = req.session.user;
        if (!user || !user.id) {
            console.error('Dashboard access attempt without user ID.');
            req.flash('error', 'Authentication error. Please log in again.');
            return res.redirect('/login');
        }

        const employeeId = user.id;

        // Leave functionality has been removed

        // Fetch data using the helper method - this now includes aggregated hoursWorked
        /* const timesheetData = await this._fetchTimesheetStatusData(employeeId); */

        // Initialize variables
        let activeEntry = null;
        let recentEntries = [];
        let remainingHours = 0; /* timesheetData.remainingHours || 8; */ // Default to 8 hours if not calculated;

        // Fetch active entry (end_time is NULL)
        activeEntry = await TimeEntry.findActiveEntryByEmployeeId(employeeId);

        // Calculate remaining hours if there's an active entry
        if (activeEntry) {
            // Placeholder for your calculation logic
            // You can uncomment and implement this later

        }

        // Fetch last 3 completed entries
        recentEntries = await TimeEntry.findRecentEntriesByEmployeeId(employeeId, 5);

        // Render the dashboard with all data
        res.render("dashboard", {
            activePage: "dashboard",
            title: "User Dashboard",
            leaveData: {
                totalQuota: 25, // Default values for leave functionality
                leavesUsed: 5,
                leavesRemaining: 20
            },
            dashboardData: {
                activeEntry: activeEntry,
                remainingHours: typeof remainingHours === 'number' ? remainingHours.toFixed(1) : '0.0',
                recentEntries: recentEntries
            }
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).render('error', {
            message: 'Failed to load dashboard data.',
            activePage: 'error'
        });
    }
});

module.exports = router;

/* const startTime = new Date(activeEntry.start_time);
const now = new Date();
const elapsedMillis = now - startTime;
const elapsedMinutes = elapsedMillis / (1000 * 60);
const breakMinutes = activeEntry.total_break_duration || 0;
const workedMinutes = elapsedMinutes - breakMinutes;
remainingHours = Math.max(0, (480 - workedMinutes) / 60); // Assuming 8-hour day */

/*
router.get("/dashboard", async (req, res) => {
    try {
        const user = req.session.user;
        if (!user || !user.id) {
            // This case should be rare if checkAuth works correctly
            console.error('Dashboard access attempt without user ID after checkAuth.');
            req.flash('error', 'Authentication error. Please log in again.');
            return res.redirect('/login');
        }

        const employeeId = user.id;

        const summary = await Leave.getLeaveSummary(employeeId);
        activeEntry = await TimeEntry.findActiveEntryByEmployeeId(employeeId);
        recentEntries = await TimeEntry.findRecentEntriesByEmployeeId(employeeId, 3);


        res.render("dashboard", {
            activePage: "dashboard",
            title: "User Dashboard",
            leaveTypes: ["Vacation", "Sick", "Personal"],
            leaveData: {
                totalQuota: summary.totalQuota,
                leavesUsed: summary.usedLeaves,
                leavesRemaining: summary.totalQuota - summary.usedLeaves
            },
            dashboardData: {
                activeEntry: activeEntry, // Placeholder for active entry
                remainingHours: remainingHours.toFixed(1), // Placeholder for remaining hours
                recentEntries: recentEntries // Placeholder for recent entries
            }
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).render('error', { message: 'Failed to load dashboard data.', activePage: 'error' });
    }
});

module.exports = router; */