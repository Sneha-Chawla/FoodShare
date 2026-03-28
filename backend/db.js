const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabases();
  }
});

function initializeDatabases() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'donor', -- donor, ngo, volunteer, admin
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Donations table
    db.run(`CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      donor_id INTEGER NOT NULL,
      food_type TEXT NOT NULL,
      quantity TEXT NOT NULL,
      expiry_time DATETIME NOT NULL,
      location TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- pending, accepted, picked, delivered
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(donor_id) REFERENCES users(id)
    )`);

    // Requests table / Status Tracking
    db.run(`CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ngo_id INTEGER NOT NULL,
      donation_id INTEGER NOT NULL,
      status TEXT DEFAULT 'requested', -- requested, accepted, rejected
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ngo_id) REFERENCES users(id),
      FOREIGN KEY(donation_id) REFERENCES donations(id)
    )`);
  });
}

module.exports = db;
