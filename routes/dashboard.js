const express = require('express');
const router = express.Router();
const Leave = require('../model/Leave');
const TimeEntry = require('../model/TimeEntry');
const verifyRoles = require('../middleware/verifyRoles');

// Dashboard route (main dashboard page, not /apply)
router.get("/", verifyRoles(['employee']), async (req, res) => {
    try {
        const user = req.session.user;
        if (!user || !user.id) {
            console.error('Dashboard access attempt without user ID.');
            req.flash('error', 'Authentication error. Please log in again.');
            return res.redirect('/account/login');
        }

        const employeeId = user.id;

        // Get leave summary
        const summary = await Leave.getLeaveSummary(employeeId);

        // Fetch data using the helper method - this now includes aggregated hoursWorked
        /* const timesheetData = await this._fetchTimesheetStatusData(employeeId); */

        // Initialize variables
        let activeEntry = null;
        let recentEntries = [];

        // Fetch active entry (end_time is NULL)
        activeEntry = await TimeEntry.findActiveEntryByEmployeeId(employeeId);

        // Calculate remaining hours if there's an active entry
        if (activeEntry) {
            // Placeholder for your calculation logic
            // You can uncomment and implement this later

        }

        // Fetch last 3 completed entries
        recentEntries = await TimeEntry.findRecentEntriesByEmployeeId(employeeId, 5);

        // Calculate total worked time for today
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const entriesToday = await TimeEntry.findEntriesByEmployeeAndDate(employeeId, today);

        let totalMinutesWorked = 0;

        entriesToday.forEach(entry => {
            if (entry.start_time && (entry.end_time || activeEntry?.id === entry.id)) {
                const start = new Date(entry.start_time);
                const end = entry.end_time ? new Date(entry.end_time) : new Date();
                const diffMs = end - start;
                const diffMin = diffMs / 1000 / 60;
                totalMinutesWorked += diffMin;
            }
        });

        const hoursWorkedToday = totalMinutesWorked / 60;
        const remainingHours = Math.max(0, 8 - hoursWorkedToday);


        // Render the dashboard with all data
        res.render("dashboard", {
            activePage: "dashboard",
            title: "User Dashboard",
            leaveData: {
                totalQuota: summary.totalQuota,
                leavesUsed: summary.usedLeaves,
                leavesRemaining: summary.totalQuota - summary.usedLeaves
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