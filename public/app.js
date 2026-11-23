window.socket = io();

const socket = window.socket;
const statusText = document.getElementById("status");
const roomInput = document.getElementById("roomCode");

socket.on("connect", () => {
  statusText.textContent = "Connected to Chess Arena!";
});

socket.on("disconnect", () => {
  statusText.textContent = "Server disconnected!";
});

document.getElementById("create").onclick = () => {
  socket.emit("createRoom", "");
  statusText.textContent = "Creating room...";
};

document.getElementById("join").onclick = () => {
  const code = roomInput.value.trim().toUpperCase();

  if (!code) {
    statusText.textContent = "Enter Room Code!";
    return;
  }

  socket.emit("joinRoom", code);
  statusText.textContent = "Joining room...";
};

socket.on("roomCreated", (data) => {
  roomInput.value = data.roomCode;
  statusText.textContent = "Room created: " + data.roomCode + " | You are White";
});

socket.on("roomJoined", (data) => {
  statusText.textContent = "Joined: " + data.roomCode + " | You are Black";
});

socket.on("roomError", (message) => {
  statusText.textContent = message;
});

socket.on("gameReady", () => {
  statusText.textContent = "Opponent connected! Game ready.";
});

socket.on("opponentDisconnected", () => {
  statusText.textContent = "Opponent disconnected!";
});
