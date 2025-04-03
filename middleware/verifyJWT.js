const jwt = require("jsonwebtoken");
require('dotenv').config(); // Ensure environment variables are loaded

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization; // Check both cases
    console.log('Received Auth Header:', authHeader);

    // Check if Authorization header exists and starts with 'Bearer '
    if (!authHeader?.startsWith('Bearer ')) {
        console.log('JWT Verify: No Bearer token found in header:', authHeader);
        // Return 401 Unauthorized if no token is provided
        return res.status(401).send('Unauthorized: Access Token Required.');
    }

    // Extract the token part
    const token = authHeader.split(' ')[1];
    console.log('Extracted Token:', token);

    // Verify the token
    jwt.verify(
        token,
        process.env.JWT_SECRET, // Use the secret from environment variables
        (err, decoded) => {
            if (err) {
                console.error('JWT Verify Error:', err.message);
                // Return 403 Forbidden if token is invalid (e.g., expired, wrong secret)
                // It could be 401 depending on security policy, but 403 implies token was present but bad
                return res.status(403).send('Forbidden: Invalid Access Token.');
            }
            // Token is valid, attach decoded payload to the request object
            // Common practice is to attach to req.user or req.auth
            // Ensure your payload includes necessary info like user ID and role during login/token creation
            req.user = decoded.UserInfo; // Assuming your JWT payload has a UserInfo object
            console.log('JWT Verify Success: User authenticated - ID:', req.user?.id, 'Role:', req.user?.role);
            next(); // Proceed to the next middleware or route handler
        }
    );
};

module.exports = verifyJWT;