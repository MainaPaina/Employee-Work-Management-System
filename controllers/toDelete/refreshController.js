const usersDB = 
{
    users : require("../model/users.json"),
    setUsers : function (data) {this.users = data}
}

const jwt = require("jsonwebtoken");

require("dotenv").config();

// Fixed function name: handleRefreshToken instead of handleRefeshToken
const handleRefreshToken = (req, res) =>
{
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);
    console.log(cookies.jwt);
    const refreshToken = cookies.jwt;

    const foundUser = usersDB.users.find(person => person.refreshToken === refreshToken);

    if(!foundUser) return res.sendStatus(403);

    jwt.verify
    (
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) =>
        {
            if (err || foundUser.username !== decoded.username) return res.sendStatus(403);
            const roles = Object.values(foundUser.Roles);
            const accessToken = jwt.sign
            ( 
                {"userInfo":
                {
                    "username" : decoded.username,
                    "roles" : roles
                }
            },
                process.env.ACCESS_TOKEN_SECRET,
                {expiresIn: "30s"}
            );
            // Fixed response to actually return the accessToken
            res.json({ accessToken });
        }
    )
};

// Fixed export name to match the function name
module.exports = { handleRefreshToken };