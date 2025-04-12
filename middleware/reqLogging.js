const { logEvents } = require('./logEvents');

// Request logging middleware - only if NODE_ENV is set to development
const reqLogger = (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        // Log to console
        console.log(`${req.method} ${req.path}`);
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        
        // Log to file
        logEvents(
            `${req.method}\t${req.path}\t${req.headers.origin}`,
            'reqLog.txt'
        );
    }
    next();
};

module.exports = reqLogger;