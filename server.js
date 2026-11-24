const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { Chess } = require("chess.js");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const rooms = new Map();

app.get("/api/health", (req, res) => {
  res.json({ status: "online", game: "CHESS ARENA" });
});

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("createRoom", (requestedCode) => {
    let code = String(requestedCode || "")
      .trim().toUpperCase();

    if (!code || rooms.has(code)) {
      code = Math.random().toString(36)
        .substring(2, 8).toUpperCase();
    }

    const room = {
      game: new Chess(),
      players: {
        white: socket.id,
        black: null
      }
    };

    rooms.set(code, room);
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.color = "white";

    socket.emit("roomCreated", {
      roomCode: code,
      color: "white",
      fen: room.game.fen()
    });
  });

  socket.on("joinRoom", (code) => {
    code = String(code || "").trim().toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      socket.emit("roomError", "Room not found!");
      return;
    }

    if (room.players.black) {
      socket.emit("roomError", "Room is full!");
      return;
    }

    if (room.players.white === socket.id) {
      socket.emit("roomError", "You created this room!");
      return;
    }

    room.players.black = socket.id;
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.color = "black";

    socket.emit("roomJoined", {
      roomCode: code,
      color: "black",
      fen: room.game.fen()
    });

    io.to(code).emit("gameReady");
  });

  socket.on("makeMove", (data) => {
    if (!data || !data.roomCode) return;

    const code = String(data.roomCode).toUpperCase();
    const room = rooms.get(code);

    if (!room) return;

    const color = socket.data.color;
    if (
      socket.data.roomCode !== code ||
      room.players[color] !== socket.id ||
      room.game.turn() !== (color === "white" ? "w" : "b")
    ) {
      console.log("MOVE REJECTED:", {
        socketRoom: socket.data.roomCode,
        requestedRoom: code,
        color,
        turn: room.game.turn(),
        player: room.players[color],
        socket: socket.id
      });
      socket.emit("moveError", "Move rejected: turn or player mismatch");
      return;
    }

    try {
      const move = room.game.move({
        from: data.from,
        to: data.to,
        promotion: data.promotion || "q"
      });

      io.to(code).emit("moveMade", {
        move,
        fen: room.game.fen(),
        turn: room.game.turn(),
        checkmate: room.game.isCheckmate(),
        draw: room.game.isDraw(),
        check: room.game.isCheck()
      });
    } catch (error) {
      socket.emit("moveError", "Illegal move!");
    }
  });


  // Voice chat signaling
  socket.on("voiceOffer", (data) => {
    if (!data || data.roomCode !== socket.data.roomCode) return;
    socket.to(data.roomCode).emit("voiceOffer", data.offer);
  });

  socket.on("voiceAnswer", (data) => {
    if (!data || data.roomCode !== socket.data.roomCode) return;
    socket.to(data.roomCode).emit("voiceAnswer", data.answer);
  });

  socket.on("voiceIceCandidate", (data) => {
    if (!data || data.roomCode !== socket.data.roomCode) return;
    socket.to(data.roomCode).emit("voiceIceCandidate", data.candidate);
  });

  socket.on("disconnect", () => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);

    if (room) {
      io.to(code).emit("opponentDisconnected");

      if (room.players.white === socket.id) {
        room.players.white = null;
      }

      if (room.players.black === socket.id) {
        room.players.black = null;
      }

      if (!room.players.white && !room.players.black) {
        rooms.delete(code);
      }
    }

    console.log("Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("CHESS ARENA Multiplayer Server:", PORT);
});
