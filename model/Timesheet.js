const mongoose = require('mongoose');

const timesheetSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    hoursWorked: {
        type: Number,
        required: true
    },
    leaveApplied: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Timesheet = mongoose.model('Timesheet', timesheetSchema);

module.exports = Timesheet;