const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Created data directory at ${dataDir}`);
}

// Connect to database
const dbPath = path.join(dataDir, 'timemanagement.db');
console.log(`Connecting to database at: ${dbPath}`);

const dbInstance = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Create a wrapper with promise-based methods
const db = {
    all: function(sql, params = []) {
        return new Promise((resolve, reject) => {
            dbInstance.all(sql, params, function(err, rows) {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    get: function(sql, params = []) {
        return new Promise((resolve, reject) => {
            dbInstance.get(sql, params, function(err, row) {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },

    run: function(sql, params = []) {
        return new Promise((resolve, reject) => {
            dbInstance.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    },

    close: function() {
        return new Promise((resolve, reject) => {
            dbInstance.close(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
};

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON;").catch(err => {
    console.error("Error enabling foreign keys:", err);
});

// Create tables
dbInstance.serialize(() => {
  // Users table
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      password TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      department TEXT,
      manager_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      FOREIGN KEY (manager_id) REFERENCES users(id)
    )
  `, function(err) {
    if (err) console.error("Error creating users table:", err.message);
  });

  // NFC codes table
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS nfc_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      code TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, function(err) {
    if (err) console.error("Error creating nfc_codes table:", err.message);
  });

  // Timesheets table
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS timesheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date DATE NOT NULL,
      check_in DATETIME,
      check_out DATETIME,
      hours_worked REAL,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_break_start_time DATETIME,
      last_unavailable_start_time DATETIME,
      total_break_duration REAL DEFAULT 0,
      total_unavailable_duration REAL DEFAULT 0,
      start_time DATETIME,
      end_time DATETIME,
      FOREIGN KEY (employee_id) REFERENCES users(id),
      UNIQUE(employee_id, date)
    )
  `, function(err) {
    if (err) console.error("Error creating timesheets table:", err.message);
  });

  // Breaks table
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS breaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timesheet_id INTEGER NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      duration INTEGER,
      break_type TEXT DEFAULT 'lunch',
      FOREIGN KEY (timesheet_id) REFERENCES timesheets(id)
    )
  `, function(err) {
    if (err) console.error("Error creating breaks table:", err.message);
  });

  // Leaves table
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      leave_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      reason TEXT,
      approved_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    )
  `, function(err) {
    if (err) console.error("Error creating leaves table:", err.message);
  });

  // Projects table
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, function(err) {
    if (err) console.error("Error creating projects table:", err.message);
  });

  // Time entries for project work
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS time_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timesheet_id INTEGER NOT NULL,
      project_id INTEGER,
      task TEXT,
      hours REAL NOT NULL,
      description TEXT,
      FOREIGN KEY (timesheet_id) REFERENCES timesheets(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `, function(err) {
    if (err) console.error("Error creating time_entries table:", err.message);
  });

  // Create indexes for performance
  dbInstance.run(`CREATE INDEX IF NOT EXISTS idx_timesheets_employee ON timesheets(employee_id)`, function(err) {
    if (err) console.error("Error creating index idx_timesheets_employee:", err.message);
  });
  dbInstance.run(`CREATE INDEX IF NOT EXISTS idx_leaves_employee ON leaves(employee_id)`, function(err) {
    if (err) console.error("Error creating index idx_leaves_employee:", err.message);
  });
  dbInstance.run(`CREATE INDEX IF NOT EXISTS idx_timesheets_date ON timesheets(date)`, function(err) {
    if (err) console.error("Error creating index idx_timesheets_date:", err.message);
  });

  // Check if admin user exists first
  dbInstance.get(`SELECT id FROM users WHERE username = 'admin'`, [], async (err, row) => {
    if (err) {
      console.error("Error checking for admin user:", err);
      return;
    }

    // If no admin user exists, create one with hashed password
    if (!row) {
      try {
        // Hash password with bcrypt (10 rounds)
        const hashedPassword = await bcrypt.hash('admin123', 10);

        dbInstance.run(`
          INSERT INTO users (username, name, email, role, password)
          VALUES (?, ?, ?, ?, ?)
        `, ['admin', 'Administrator', 'admin@example.com', 'admin', hashedPassword], function(err) {
          if (err) {
            console.error("Error creating admin user:", err);
          } else {
            console.log("Default admin user created");
          }
        });
      } catch (error) {
        console.error("Error creating admin user:", error);
      }
    }
  });
});

module.exports = db;