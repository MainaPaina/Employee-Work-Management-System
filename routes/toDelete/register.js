const express = require("express");
const router = express.Router();
const registerController = require("../controllers/registerController");

//might be a problem
router.post("/", registerController.handleNewUser);

module.exports = router;