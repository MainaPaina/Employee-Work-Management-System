const LeaveRequest = require('../model/LeaveRequest');

class LeaveController {
    constructor(leaveRequestModel) {
        this.leaveRequestModel = leaveRequestModel;
    }

    // Render the main leave request page
    async getLeavePage(req, res) {
        try {
            // Fetch necessary data for the view, e.g., employee's past requests
            const employeeId = req.user?.id; // Assuming verifyJWT sets req.user
            if (!employeeId) {
                return res.status(401).render('error', { message: 'User not authenticated.' });
            }

            const { data: requests, error } = await this.leaveRequestModel.findAllByEmployee(employeeId);
            
            if (error) {
                console.error('Error fetching employee requests for page:', error);
                // Render page with error or default state
                return res.status(500).render('leave', { 
                    requests: [], 
                    error: 'Could not load your leave requests.',
                    user: req.user // Pass user info if needed
                });
            }

            res.render('leave', { 
                requests: requests || [], 
                error: null,
                user: req.user // Pass user info if needed
            }); 

        } catch (err) {
            console.error('Error rendering leave page:', err);
            res.status(500).render('error', { message: 'Server error loading leave page.' });
        }
    }

    // API: Get all requests for the logged-in employee
    async getEmployeeRequests(req, res) {
        try {
            const employeeId = req.user?.id;
            if (!employeeId) {
                return res.status(401).json({ error: 'User not authenticated.' });
            }
            const { data, error } = await this.leaveRequestModel.findAllByEmployee(employeeId);
            if (error) throw error;
            res.status(200).json(data || []);
        } catch (err) {
            console.error('Error fetching employee requests (API):', err);
            res.status(500).json({ error: 'Failed to retrieve leave requests.' });
        }
    }

    // API: Submit a new leave request
    async submitRequest(req, res) {
        try {
            const employeeId = req.user?.id;
            const { startDate, endDate, leaveType, reason, totalLeaveDays } = req.body;

            if (!employeeId) {
                return res.status(401).json({ error: 'User not authenticated.' });
            }
            if (!startDate || !endDate || !leaveType) {
                return res.status(400).json({ error: 'Start date, end date, and leave type are required.' });
            }

            // Basic date validation
            if (new Date(endDate) < new Date(startDate)) {
                return res.status(400).json({ error: 'End date cannot be before start date.' });
            }

            const requestData = {
                employee_id: employeeId,
                start_date: startDate,
                end_date: endDate,
                leave_type: leaveType,
                reason: reason || null,
                total_leave_days: totalLeaveDays || null // Consider calculating this
            };

            const { data, error } = await this.leaveRequestModel.create(requestData);

            if (error) {
                console.error('Error creating leave request:', error);
                // Check for specific DB errors if needed
                return res.status(500).json({ error: 'Failed to submit leave request.' });
            }

            res.status(201).json({ message: 'Leave request submitted successfully.', request: data });

        } catch (err) {
            console.error('Server error submitting leave request:', err);
            res.status(500).json({ error: 'An unexpected error occurred.' });
        }
    }

    // API: Cancel a pending request (by employee)
    async cancelRequest(req, res) {
        try {
            const requestId = req.params.id;
            const employeeId = req.user?.id;

            if (!employeeId) {
                return res.status(401).json({ error: 'User not authenticated.' });
            }

            // 1. Fetch the request to verify ownership and status
            const { data: request, error: findError } = await this.leaveRequestModel.findById(requestId);
            
            if (findError || !request) {
                return res.status(404).json({ error: 'Leave request not found.' });
            }

            // 2. Check ownership and status
            if (request.employee_id !== employeeId) {
                return res.status(403).json({ error: 'You are not authorized to cancel this request.' });
            }
            if (request.status !== 'Pending') {
                return res.status(400).json({ error: 'Only pending requests can be cancelled.' });
            }

            // 3. Update status to 'Cancelled' (using a generic update method or a specific cancel method)
            // Using updateStatus here, assuming 'Cancelled' is an allowed status
            const { data, error } = await this.leaveRequestModel.updateStatus(requestId, 'Cancelled', employeeId, 'Cancelled by employee');

            if (error) {
                console.error('Error cancelling leave request:', error);
                return res.status(500).json({ error: 'Failed to cancel leave request.' });
            }

            res.status(200).json({ message: 'Leave request cancelled successfully.', request: data });

        } catch (err) {
            console.error('Server error cancelling leave request:', err);
            res.status(500).json({ error: 'An unexpected error occurred.' });
        }
    }

    // --- Admin/Manager Methods ---

    // API: Get all leave requests (Admin/Manager)
    async getAllRequests(req, res) {
        try {
            // TODO: Add filtering/pagination options? e.g., req.query.status
            const { data, error } = await this.leaveRequestModel.findAll(); 
            if (error) throw error;
            res.status(200).json(data || []);
        } catch (err) {
            console.error('Error fetching all leave requests (Admin):', err);
            res.status(500).json({ error: 'Failed to retrieve leave requests.' });
        }
    }

    // API: Approve a leave request (Admin/Manager)
    async approveRequest(req, res) {
        await this._handleApproval(req, res, 'Approved');
    }

    // API: Reject a leave request (Admin/Manager)
    async rejectRequest(req, res) {
        await this._handleApproval(req, res, 'Rejected');
    }

    // Private helper method for approving/rejecting
    async _handleApproval(req, res, status) {
        try {
            const requestId = req.params.id;
            const approverId = req.user?.id; // ID of the admin/manager
            const { comments } = req.body; // Optional comments from approver

            if (!approverId) {
                return res.status(401).json({ error: 'Approver not authenticated.' });
            }

            // Optional: Fetch request first to check if it's pending?
            // const { data: request, error: findError } = await this.leaveRequestModel.findById(requestId);
            // if (!request || request.status !== 'Pending') { ... }

            const { data, error } = await this.leaveRequestModel.updateStatus(requestId, status, approverId, comments);

            if (error) {
                // Handle specific errors, e.g., request not found (might be caught by findById check)
                console.error(`Error setting leave request status to ${status}:`, error);
                return res.status(500).json({ error: `Failed to ${status.toLowerCase()} leave request.` });
            }
            if (!data) {
                // This might happen if the request ID didn't exist or didn't match update criteria
                return res.status(404).json({ error: 'Leave request not found or already processed.' });
            }

            res.status(200).json({ message: `Leave request ${status.toLowerCase()} successfully.`, request: data });

        } catch (err) {
            console.error(`Server error handling leave ${status.toLowerCase()}:`, err);
            res.status(500).json({ error: 'An unexpected error occurred.' });
        }
    }
}

module.exports = LeaveController;
