import { Chess } from "chess.js";

const game = new Chess();
const board = document.querySelector(".chessboard");
const status = document.getElementById("status");
const socket = window.socket;

let selected = null;
let roomCode = null;
let playerColor = null;

const symbols = {
  wp:"♙", wr:"♖", wn:"♘", wb:"♗", wq:"♕", wk:"♔",
  bp:"♟", br:"♜", bn:"♞", bb:"♝", bq:"♛", bk:"♚"
};

function render() {
  board.innerHTML = "";

  game.board().forEach((row, r) => {
    row.forEach((piece, c) => {
      const square = document.createElement("div");
      const pos = String.fromCharCode(97 + c) + (8 - r);

      square.className = "square " +
        ((r + c) % 2 === 0 ? "light" : "dark");

      if (piece) {
        square.textContent = symbols[piece.color + piece.type];
      }

      square.onclick = () => handleSquare(pos);
      board.appendChild(square);
    });
  });
}

function handleSquare(pos) {
  if (!roomCode || !playerColor) {
    status.textContent = "Create or join a room first!";
    return;
  }

  if (game.turn() !== (playerColor === "white" ? "w" : "b")) {
    status.textContent = "Wait for your turn!";
    return;
  }

  if (!selected) {
    const piece = game.get(pos);

    if (!piece || piece.color !== game.turn()) return;

    selected = pos;
    status.textContent = "Select destination square";
    return;
  }

  socket.emit("makeMove", {
    roomCode,
    from: selected,
    to: pos,
    promotion: "q"
  });

  selected = null;
}

socket.on("roomCreated", data => {
  roomCode = data.roomCode;
  playerColor = data.color;
  game.load(data.fen);
  selected = null;
  render();
});

socket.on("roomJoined", data => {
  roomCode = data.roomCode;
  playerColor = data.color;
  game.load(data.fen);
  selected = null;
  render();
});

socket.on("moveMade", data => {
  game.load(data.fen);
  selected = null;
  render();

  status.textContent = data.checkmate
    ? "CHECKMATE!"
    : data.draw
    ? "DRAW!"
    : data.check
    ? "CHECK!"
    : game.turn() === "w"
    ? "WHITE'S TURN"
    : "BLACK'S TURN";
});

socket.on("moveError", message => {
  status.textContent = message;
});

socket.on("gameReady", () => {
  status.textContent = "Game ready! White vs Black";
});

render();
