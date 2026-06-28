const mysql = require('mysql2');
let sqlite3;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (e) {
  console.warn('sqlite3 module not found. SQLite fallback will be disabled.');
}
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let db;

// Create MySQL connection pool
const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'oxygen_sports',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Create a wrapper object that matches the mysql2 interface
// so we don't have to rewrite all our queries in server.js
const dbWrapper = {
  activeEngine: 'mysql',
  
  getConnection: (callback) => {
    // Test MySQL connection first
    mysqlPool.getConnection((err, connection) => {
      if (err) {
        console.warn('MySQL connection failed. Falling back to SQLite automatically...');
        
        // Initialize SQLite if not already done
        if (!db) {
          if (!sqlite3) {
            console.error('MySQL connection failed and sqlite3 is unavailable. Ensure DB credentials are correct.');
            return callback(new Error('No database available'));
          }
          const dbPath = process.env.VERCEL ? '/tmp/database.sqlite' : path.resolve(__dirname, 'database.sqlite');
          db = new sqlite3.Database(dbPath);
          dbWrapper.activeEngine = 'sqlite';
          
          // Setup SQLite schema
          db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS generations (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              primary_subject TEXT NOT NULL,
              specific_requirements TEXT,
              constraints TEXT,
              preferences TEXT,
              structured_prompt TEXT NOT NULL,
              ai_response TEXT NOT NULL,
              rating INTEGER DEFAULT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);
            db.run(`CREATE TABLE IF NOT EXISTS actions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              generation_id INTEGER,
              action_type TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (generation_id) REFERENCES generations(id) ON DELETE CASCADE
            )`);
          });
        }
        
        // Return a mock connection object for SQLite
        return callback(null, { release: () => {} });
      }
      
      // If MySQL connects successfully
      dbWrapper.activeEngine = 'mysql';
      callback(null, connection);
    });
  },
  
  query: (sql, params, callback) => {
    // Allow query to be called without params
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    if (dbWrapper.activeEngine === 'sqlite') {
      // Convert MySQL ? placeholders to SQLite format if needed, but SQLite also supports ?
      const isInsertOrUpdate = sql.trim().toUpperCase().startsWith('INSERT') || sql.trim().toUpperCase().startsWith('UPDATE');
      
      if (isInsertOrUpdate) {
        db.run(sql, params, function(err) {
          if (err) return callback(err);
          // Map SQLite's this.lastID to MySQL's result.insertId
          callback(null, { insertId: this.lastID, affectedRows: this.changes });
        });
      } else {
        db.all(sql, params, (err, rows) => {
          callback(err, rows);
        });
      }
    } else {
      // Execute standard MySQL query
      mysqlPool.query(sql, params, callback);
    }
  }
};

module.exports = { db: dbWrapper };
