const express = require("express");
const router = express.Router();
const refreshController = require("../controllers/refreshController");

// Corrected typo in the function name
router.post("/", refreshController.handleRefreshToken);

module.exports = router;