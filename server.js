const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    game: "CHESS ARENA"
  });
});

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("createRoom", (roomCode) => {
    socket.join(roomCode);
    socket.emit("roomCreated", roomCode);
  });

  socket.on("joinRoom", (roomCode) => {
    socket.join(roomCode);
    socket.to(roomCode).emit("playerJoined");
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
  });
});

const PORT = 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`CHESS ARENA running on port ${PORT}`);
});
