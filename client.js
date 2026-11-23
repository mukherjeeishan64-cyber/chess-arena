import { Chess } from "chess.js";

const game = new Chess();
const board = document.querySelector(".chessboard");
const status = document.getElementById("status");

let selected = null;

const symbols = {
  wp:"♙", wr:"♖", wn:"♘", wb:"♗", wq:"♕", wk:"♔",
  bp:"♟", br:"♜", bn:"♞", bb:"♝", bq:"♛", bk:"♚"
};

function render() {
  board.innerHTML = "";

  game.board().forEach((row, r) => {
    row.forEach((piece, c) => {
      const square = document.createElement("div");
      const pos = String.fromCharCode(97+c) + (8-r);

      square.className = "square " +
        ((r+c)%2===0 ? "light" : "dark");

      if (piece) {
        square.textContent =
          symbols[piece.color + piece.type];
      }

      square.onclick = () => move(pos);
      board.appendChild(square);
    });
  });

  status.textContent = game.isCheckmate()
    ? "CHECKMATE!"
    : game.isDraw()
    ? "DRAW!"
    : game.isCheck()
    ? "CHECK!"
    : game.turn() === "w"
    ? "WHITE'S TURN"
    : "BLACK'S TURN";
}

function move(pos) {
  if (!selected) {
    const piece = game.get(pos);
    if (!piece || piece.color !== game.turn()) return;
    selected = pos;
  } else {
    try {
      game.move({
        from: selected,
        to: pos,
        promotion: "q"
      });
    } catch (e) {}

    selected = null;
  }

  render();
}

render();
