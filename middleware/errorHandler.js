const { logEvents } = require('./logEvents');

// 404 error handler
const notFound = (req, res, next) => {
    // Log 404 errors
    logEvents(`404 Not Found: ${req.method} ${req.url}`, 'errLog.txt');
    
    const error = new Error('Page Not Found');
    error.status = 404;
    error.description = `The requested URL ${req.url} was not found on this server.`;
    next(error);
};

// General error handler
const errorHandler = (err, req, res, next) => {
    // Log the error
    logEvents(`${err.name}: ${err.message}`, 'errLog.txt');
    console.error(err.stack);

    // Prepare error data for the view
    const errorData = {
        title: err.status === 404 ? 'Page Not Found' : 'Error',
        message: err.message || 'An unexpected error occurred',
        description: err.description || '',
        status: err.status || 500,
        stack: process.env.NODE_ENV === 'development' ? err.stack : '',
        activePage: 'error',
        url: req.url
    };

    // Set status and render error page
    res.status(errorData.status).render('error', errorData);
};

module.exports = {
    notFound,
    errorHandler
};