require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const TimeEntry = require('../model/TimeEntry');
const jwt = require('jsonwebtoken');

// Create a test JWT token
function createTestToken(userId = '24cb7904-c0fa-4d20-8c11-b58b8daa3189') {
    const payload = {
        "UserInfo": {
            "id": userId,
            "username": "testuser",
            "role": "employee"
        }
    };
    
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('JWT_SECRET not found in environment variables');
        return null;
    }
    
    try {
        const token = jwt.sign(
            payload,
            secret,
            { expiresIn: '1d' }
        );
        return token;
    } catch (error) {
        console.error('Error creating token:', error);
        return null;
    }
}

// Mock request and response objects
function createMockReq(userId) {
    return {
        user: {
            id: userId
        }
    };
}

function createMockRes() {
    const res = {
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            this.data = data;
            return this;
        }
    };
    return res;
}

// Test the clock-in functionality
async function testClockIn() {
    try {
        const userId = '24cb7904-c0fa-4d20-8c11-b58b8daa3189';
        
        // Create mock request and response objects
        const req = createMockReq(userId);
        const res = createMockRes();
        
        console.log('Testing clock-in for user ID:', userId);
        
        // Get current date
        const now = new Date();
        const todayDateString = now.toISOString().split('T')[0];
        
        console.log('Today\'s date:', todayDateString);
        
        // Check if there's already an active entry
        console.log('Checking for active entry...');
        const activeEntry = await TimeEntry.findActiveEntryByEmployeeId(userId);
        
        if (activeEntry) {
            console.log('Already clocked in:', activeEntry);
            return;
        }
        
        // Check if there's already an entry for today
        console.log('Checking for existing entry for today...');
        const existingEntry = await TimeEntry.getEntryByEmployeeIdAndDate(userId, todayDateString);
        
        if (existingEntry) {
            console.log('Found existing entry for today:', existingEntry);
            
            // If the entry is not active, update it
            if (existingEntry.status !== 'active' && existingEntry.end_time !== null) {
                console.log('Reactivating existing entry...');
                
                const updatedEntry = await TimeEntry.update(existingEntry.id, {
                    status: 'active',
                    start_time: now.toISOString(),
                    end_time: null
                });
                
                console.log('Entry updated successfully:', updatedEntry);
            } else {
                console.log('Entry is already active');
            }
        } else {
            console.log('No existing entry found, creating new entry...');
            
            // Create a new entry
            const newEntryData = {
                employee_id: userId,
                date: todayDateString,
                start_time: now.toISOString(),
                status: 'active',
                end_time: null,
                hours_worked: 0,
                total_break_duration: 0,
                total_unavailable_duration: 0
            };
            
            const newEntry = await TimeEntry.create(newEntryData);
            console.log('New entry created successfully:', newEntry);
        }
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

// Run the test
testClockIn();
