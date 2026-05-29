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
import { authentification } from "./services/auth.js";

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

app.use(errorHandler);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/login.html"));
});

app.get("/inscription", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/inscription.html"));
});

app.get("/index", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/index.html"));
})
console.log("test authentification", await authentification("alice" ,"admin" ))
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
      console.log("test faux compte")
    }
  } catch (err) {
    res.status(500).send("Erreur serveur : " + err.message);
  }
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  socket.on("error", (err) => {
    console.log("Erreur socket:", err.message);
  });
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise Rejection:", reason);
})

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
});

httpServer.listen(config.port, "0.0.0.0", () => {
  console.log('Server running on http://0.0.0.0:' + config.port);
});