import express from "express";  // ← était require(), incompatible avec les autres import
import path from "path";
import"dotenv/config";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import bcrypt from "bcrypt";

// Db.js désactivé temporairement
const createUser = null;
const findUser = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || "http://localhost:8000" },
});

app.use(express.static(path.join(__dirname, "../..")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/base.html"));
});

io.on("connection", (socket) => {
  console.log("Nouvelle connexion :", socket.id);
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

const port = Number(process.env.PORT) || 8000;
httpServer.listen(port, "0.0.0.0", () => {
  console.log(`server is running on http://0.0.0.0:${port}`);
});