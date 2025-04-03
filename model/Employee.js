const supabase = require('../config/supabaseClient'); // Use Supabase client

class Employee {
  /**
   * Create a new employee record linked to a user
   * @param {Object} employeeData - Employee information (including user_id)
   * @returns {Promise<Object>} - Newly created employee data
   */
  static async create(employeeData) {
    // Assuming employeeData includes user_id, leave_quota, etc.
    // Remove fields not directly in the employees table if needed
    const { user_id, leave_quota, ...otherData } = employeeData; // Example structure

    try {
      const { data, error } = await supabase
        .from('employees')
        .insert({
          user_id: user_id, // Link to the users table
          leave_quota: leave_quota, // Set initial quota
          // ... add other relevant employee fields from your table
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  /**
   * Get employee by Employee ID (the primary key of the employees table)
   * @param {number} id - Employee ID
   * @returns {Promise<Object>} - Employee data
   */
  static async getById(id) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*') // Select specific columns or related data if needed
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting employee by ID:', error);
      throw error;
    }
  }

  /**
   * Get all employees (consider pagination for large datasets)
   * @returns {Promise<Array>} - Array of employees
   */
  static async getAll() {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('* , users ( id, username, name, email, role, active ) '); // Example: Join with users table
        // Add .order() or .range() for sorting/pagination if needed

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting all employees:', error);
      throw error;
    }
  }

  /**
   * Get employee by the associated User ID
   * @param {number} userId - User ID from the users table
   * @returns {Promise<Object>} - Employee data
   */
  static async getByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('* , users ( id, username, name, email, role, active ) ') // Join with users table
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting employee by user ID:', error);
      throw error;
    }
  }

  /**
   * Update employee information
   * @param {number} id - Employee ID (primary key of employees table)
   * @param {Object} employeeData - Updated employee data
   * @returns {Promise<boolean>} - Success status
   */
  static async update(id, employeeData) {
    // Destructure only the fields relevant to the 'employees' table
    const { leave_quota, ...otherUpdatableFields } = employeeData;

    try {
      const { error } = await supabase
        .from('employees')
        .update({
            leave_quota: leave_quota,
            // ...otherUpdatableFields
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  /**
   * Get employee timesheets (assuming a 'timesheets' table exists)
   * @param {number} employeeId - Employee ID (from employees table)
   * @returns {Promise<Array>} - Array of timesheets
   */
  static async getTimesheets(employeeId) {
    try {
      // Assuming the timesheets table has an 'employee_id' foreign key
      const { data, error } = await supabase
        .from('timesheets')
        .select('*')
        .eq('employee_id', employeeId)
        .order('date', { ascending: false }); // Example ordering

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting employee timesheets:', error);
      throw error;
    }
  }

  /**
   * Get employee leave requests (delegated to Leave model)
   * @param {number} employeeId - User ID (since Leave model uses user ID)
   * @returns {Promise<Array>} - Array of leave requests
   */
  static async getLeaveRequests(employeeId) {
    // Delegate to the already refactored Leave model method
    // Note: Leave model uses user_id, ensure consistency
    const Leave = require('./Leave'); // May need relative path adjustment
    try {
        return await Leave.getByEmployeeId(employeeId);
    } catch (error) {
        console.error('Error getting employee leaves via Leave model:', error);
        throw error;
    }
  }
}

module.exports = Employee;