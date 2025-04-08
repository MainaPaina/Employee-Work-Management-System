require('dotenv').config();
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

// Function to create a test JWT token
function createTestToken(userId = '24cb7904-c0fa-4d20-8c11-b58b8daa3189') { // Use a valid UUID from your database
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

// Function to test the timesheet API endpoints
async function testTimesheetAPI() {
    // Create a test token
    console.log('Creating test token...');
    const token = createTestToken();
    if (!token) {
        console.log('Failed to create test token');
        return;
    }

    console.log('Test token created successfully');

    // Test the status endpoint
    console.log('\nTesting /api/status endpoint...');
    try {
        const statusResponse = await fetch('http://localhost:3005/api/status', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Status response status:', statusResponse.status);
        const statusData = await statusResponse.json();
        console.log('Status response data:', JSON.stringify(statusData, null, 2));
    } catch (error) {
        console.error('Error testing status endpoint:', error);
    }

    // Test the clock-in endpoint
    console.log('\nTesting /api/clock-in endpoint...');
    try {
        const clockInResponse = await fetch('http://localhost:3005/api/clock-in', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Clock-in response status:', clockInResponse.status);
        const clockInData = await clockInResponse.json();
        console.log('Clock-in response data:', JSON.stringify(clockInData, null, 2));
    } catch (error) {
        console.error('Error testing clock-in endpoint:', error);
    }

    // Test the clock-out endpoint
    console.log('\nTesting /api/clock-out endpoint...');
    try {
        const clockOutResponse = await fetch('http://localhost:3005/api/clock-out', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Clock-out response status:', clockOutResponse.status);
        const clockOutData = await clockOutResponse.json();
        console.log('Clock-out response data:', JSON.stringify(clockOutData, null, 2));
    } catch (error) {
        console.error('Error testing clock-out endpoint:', error);
    }
}

// Run the test
testTimesheetAPI();
