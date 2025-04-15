class AdminController {
    constructor(Timesheet, Leave) {
        this.Timesheet = Timesheet;
        this.Leave = Leave;
    }

    async getAllTimesheets(req, res) {
        try {
            const timesheets = await this.Timesheet.find().populate('employeeId');
            const leaves = await this.Leave.find();

            const timesheetData = timesheets.map(timesheet => {
                const leaveDays = leaves.filter(leave => 
                    leave.employeeId.toString() === timesheet.employeeId.toString() &&
                    leave.startDate <= timesheet.date &&
                    leave.endDate >= timesheet.date
                );

                return {
                    ...timesheet.toObject(),
                    isMissing: leaveDays.length === 0 && !timesheet.hoursWorked
                };
            });

            res.render('admin', { timesheetData });
        } catch (error) {
            console.error(error);
            res.status(500).send('Server Error');
        }
    }
}

module.exports = AdminController;