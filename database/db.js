'use strict';

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'uno.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Impossible d'ouvrir la base de données:", err.message);
  } else {
    console.log('Base de données connectée:', DB_PATH);
  }
});



module.exports = db;