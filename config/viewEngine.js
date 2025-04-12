// Imports
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

module.exports = function(app) {
    // View engine setup
    app.use(expressLayouts);
    app.set('layout', 'layout'); // Default layout file
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '..', 'views'));
    app.set('started', Date.now());
}