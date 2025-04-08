const express = require('express');
const app = express();

// Import the auth routes
const authRoutes = require('./routes/auth');

// Register the auth routes
app.use('/auth', authRoutes);

// Get all registered routes
const listEndpoints = require('express-list-endpoints');
console.log(listEndpoints(app));
