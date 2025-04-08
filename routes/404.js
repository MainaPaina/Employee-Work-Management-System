const express = require("express");
const path = require("path");
const router = express.Router();

router.all("*", (req, res) => {

    res.status(404)
    if (req.accepts("html")) {
        res.sendFile(path.join(__dirname, "view", "404.html"));
    }   
    else if (req.accepts("json")) {
        res.json({ error: "Not Found" });
    }
    else (req.accepts("txt"))
    {
        res.type({ error: "Not Found" });
    }

    res.status(404).sendFile(path.join(__dirname, "view", "404.html")); 
} )