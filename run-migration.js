/**
 * Script to run the database migration
 */

console.log('Starting migration process...');

// Import and run the migration
require('./migrations/add_break_columns');

console.log('Migration script executed. Check logs for details.');
