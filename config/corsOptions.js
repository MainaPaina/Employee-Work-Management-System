const whitelist = ["https://thisSiteIsAllowed.com", "http://127.0.0.1:5500", "http://localhost:3500"];
const corsOption =
{
    origin: (origin, callback) =>
    {
        if (whitelist.indexOf(origin) !== -1 || !origin)
        {
            callback(null, true)
        }
        else
        {
            callback(new Error("CORS has blocked your meth!"))
        }
    }, optionsSuccessStatus: 200
};

module.exports = corsOption;