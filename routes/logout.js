const express = require("express");
const router = express.Router();
const logoutController = require("../controllers/logoutController");

//might be a problem
router.post("/", logoutController.handleLogout);

module.exports = router;