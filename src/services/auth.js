import express from "express";
import db from "../../database/db.js";
import sqlite3 from 'sqlite3';

const auth = new express.Router();

const app = express();

function adduser(username, email, password) {
  const req = db.prepare("INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, NOW)");
  req.run(username, email, password, new Date().toISOString());
  req.finalize();
}

function authentification(user, password) {
    return new Promise((resolve, reject) => {
        db.get("SELECT username , password FROM users WHERE username ='" + user +"' AND password = '" + password + "'   ", (err, row) => {
            resolve(!!row); 
        });
    });
}
    

export { authentification }