const session = require('express-session');

module.exports = session({
    secret: process.env.SESSION_SECRET || 'averysecretkey',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', 
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
});