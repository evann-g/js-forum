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
import { authentification, addUser, userExists } from "./services/auth.js";
import { closeDb } from '../database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: config.corsOrigin },
});

app.use(express.static(path.join(__dirname, '../public')));

applyBodyParsing(app);
applyLogger(app);

app.use("/api", router);

// Page routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/forum.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/login.html"));
});

app.get("/inscription", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/inscription.html"));
});

// Login handler
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await authentification(username, password);
        if (result.success) {
            res.redirect("/");
        } else {
            res.redirect(`/login?error=${encodeURIComponent(result.message)}`);
        }
    } catch (err) {
        res.redirect(`/login?error=${encodeURIComponent("Erreur serveur : " + err.message)}`);
    }
});

// Registration handler
app.post("/inscription", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const exists = await userExists(username);
        if (exists) {
            res.redirect(`/inscription?error=${encodeURIComponent("Ce nom d'utilisateur est déjà pris !")}`);
        } else {
            await addUser(username, email, password);
            res.redirect("/login?error=" + encodeURIComponent("Compte créé ! Vous pouvez vous connecter."));
        }
    } catch (err) {
        res.redirect(`/inscription?error=${encodeURIComponent("Erreur serveur : " + err.message)}`);
    }
});

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
            path.join(__dirname, '../database/forum.db'),
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