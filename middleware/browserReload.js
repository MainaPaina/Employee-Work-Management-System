/// ===================================================
/// RELOAD BROWSER - only if env == development
/// ==================================================


const reloadBrowser = (req, res, next) => {

    if (process.env.NODE_ENV == 'development')
        {
        console.log("registering /reload route for automatic reload of browser when app is restarted");
        // register route /reload
        app.get('/reload', (req, res) => {
            // response -> json { started: js-date-object }
            res.json({ 'started': app.get('started') });
        });
    }
}


module.exports = reloadBrowser;