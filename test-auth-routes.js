// Import required modules
const express = require('express');
const app = express();

// Import the auth routes
const authRoutes = require('./routes/auth');

// Register the auth routes
app.use('/auth', authRoutes);

// Get all registered routes
console.log('Auth Routes:');
authRoutes.stack.forEach(route => {
  if (route.route) {
    console.log(`${route.route.path} - ${Object.keys(route.route.methods).join(', ')}`);
  }
});

console.log('\nAll Routes:');
function print(path, layer) {
  if (layer.route) {
    layer.route.stack.forEach(print.bind(null, path.concat(layer.route.path)));
  } else if (layer.name === 'router' && layer.handle.stack) {
    layer.handle.stack.forEach(print.bind(null, path.concat(layer.regexp)));
  } else if (layer.method) {
    console.log('%s /%s', layer.method.toUpperCase(), path.concat(layer.regexp).filter(Boolean).join('/'));
  }
}

app._router.stack.forEach(print.bind(null, []));
