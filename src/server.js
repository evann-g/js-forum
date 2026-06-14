import "dotenv/config";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from "express";
import db from '../database/db.js';
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { config } from "./config/config.js";
import { applyBodyParsing } from "./middleware/parseBody.js";
import { applyLogger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import router from "./router/index.js";
import session from 'express-session';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: config.corsOrigin },
});

// Body parsing first
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session
if (config.nodeEnv === 'production' && !process.env.SESSION_SECRET) {
  console.error('[FATAL] SESSION_SECRET environment variable is not set. Aborting.');
  process.exit(1);
}
app.use(session({
  secret: process.env.SESSION_SECRET || 'change_this_secret_in_production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === 'production',
    httpOnly: true,
    sameSite: 'lax',
  }
}));

applyBodyParsing(app);
applyLogger(app);

// API routes
app.use("/api", router);

// Static files (public folder) — don't auto-serve an index
app.use(express.static(path.join(__dirname, '../public'), { index: false }));

// Page routes — redirect to static paths that express.static can serve directly
app.get("/", (req, res) => res.redirect('/templates/forum.html'));
app.get("/login", (req, res) => res.redirect('/templates/login.html'));
app.get("/inscription", (req, res) => res.redirect('/templates/inscription.html'));
app.get("/co", (req, res) => res.redirect('/templates/forum_co.html'));
app.get("/me", (req, res) => res.redirect('/templates/profil.html'));
app.get("/post", (req, res) => res.redirect('/templates/post.html'));

app.use(errorHandler);

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  socket.on("error", (err) => {
    console.error("Erreur socket:", err.message);
  });
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err.message);
});

httpServer.listen(config.port, "0.0.0.0", () => {
  console.log('Server running on http://localhost:' + config.port);
});

process.on('SIGINT', () => {
  console.log('\n[INFO] Arret du serveur. Nettoyage en cours...');
  db.close((err) => {
    if (err) {
      console.log('[ERREUR] Fermeture DB:', err.message);
    } else {
      console.log('[OK] Base de donnees fermee.');
    }
    const filesToDelete = [
      path.join(__dirname, '../nodemon-debug.log'),
    ];
    for (const file of filesToDelete) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          console.log(`[OK] ${file} supprime.`);
        }
      } catch (e) {
        console.log(`[ERREUR] ${file}: ${e.message}`);
      }
    }
    console.log('[INFO] Nettoyage termine.');
    process.exit(0);
  });
});