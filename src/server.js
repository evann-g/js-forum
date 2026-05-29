import "dotenv/config";
import path from 'path';
import { fileURLToPath } from 'url';
import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { config } from "./config/config.js";
import { applyBodyParsing } from "./middleware/parseBody.js";
import { applyLogger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import router from "./router/index.js";
import db from "../database/db.js";
import { authentification , adduser} from "./services/auth.js";

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
  res.sendFile(path.join(__dirname, "../public/templates/login.html"));
});

app.get("/inscription", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/inscription.html"));
});

app.get("/index", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/index.html"));
});

// Login handler
app.post("/", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await authentification(username, password);
    console.log("test try")
    if (result == true) {
      res.send(`Bienvenue, ${result.username} !`);
      console.log("test bon compte")
    } else {
      res.status(401).send(`Erreur : ${result.message}`);
    }
  } catch (err) {
    res.status(500).send("Erreur serveur : " + err.message);
  }
});

app.post("/inscription", async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const result = await authentification(username, password);
    console.log("test try")
    if (result == true) {
      res.send(`compte existent !`);
      console.log("test mauvais")
    } else {
      const add = adduser(username, password);
      res.send(`compte créé !`);
    }
  } catch (err) {
    res.status(500).send("Erreur serveur : " + err.message);
  }
});


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
  console.log('Server running on http://0.0.0.0:' + config.port);
});
