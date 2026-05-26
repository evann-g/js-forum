import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { config } from "./config/config.js";
import { applyBodyParsing } from "./middleware/parseBody.js";
import { applyLogger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import router from "./router/index.js";
import {openDb} from "../database/db.js";

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: { origin: config.corsOrigin },
});

applyBodyParsing(app);
applyLogger(app);

app.use("/api", router);

app.use(errorHandler);

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