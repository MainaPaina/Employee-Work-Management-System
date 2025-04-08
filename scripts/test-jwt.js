require('dotenv').config();
const jwt = require('jsonwebtoken');

// Function to create a test JWT token
function createTestToken() {
    const payload = {
        "UserInfo": {
            "id": "test-user-id",
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

// Function to verify a JWT token
function verifyToken(token) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('JWT_SECRET not found in environment variables');
        return null;
    }
    
    try {
        const decoded = jwt.verify(token, secret);
        return decoded;
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
}

// Create a test token
console.log('Creating test token...');
const token = createTestToken();
if (token) {
    console.log('Test token created successfully:');
    console.log(token);
    
    // Verify the token
    console.log('\nVerifying test token...');
    const decoded = verifyToken(token);
    if (decoded) {
        console.log('Token verified successfully:');
        console.log(JSON.stringify(decoded, null, 2));
    } else {
        console.log('Token verification failed');
    }
} else {
    console.log('Failed to create test token');
}

// Test the JWT_SECRET from .env
console.log('\nTesting JWT_SECRET from .env file:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Found' : 'Not found');
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
