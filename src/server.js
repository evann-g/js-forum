import express from "express";  // ← était require(), incompatible avec les autres import
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import db from "../database/db.js";
const { createUser, findUser } = db;
import bcrypt from "bcrypt";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*" },
});

// Servir les fichiers statiques (CSS, JS, images) depuis le dossier public
app.use(express.static(path.join(__dirname, "../public")));

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/login.html"));
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).send("Nom d'utilisateur et mot de passe requis.");
  if (username.length > 15)
    return res.status(400).send("Nom d'utilisateur trop long (max 15 caractères).");
  if (password.length < 4)
    return res.status(400).send("Mot de passe trop court (min 4 caractères).");
  try {
    const hash = await bcrypt.hash(password, 10);
    await createUser(username, hash);
    res.redirect("/connection");
  } catch (err) {
    if (err.message && err.message.includes("UNIQUE constraint failed"))
      return res.status(409).send("Ce nom d'utilisateur est déjà pris.");
    console.error("Erreur register:", err.message);
    res.status(500).send("Erreur serveur lors de l'inscription.");
  }
});


process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

const port = Number(process.env.PORT) || 8000;
httpServer.listen(port, "0.0.0.0", () => {
  console.log(`server is running on http://0.0.0.0:${port}`);
});