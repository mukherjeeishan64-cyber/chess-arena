const socket = io();

const statusText = document.getElementById("status");

socket.on("connect", () => {
  statusText.textContent = "Connected to Chess Arena!";
});

socket.on("disconnect", () => {
  statusText.textContent = "Server disconnected!";
});

document.getElementById("create").onclick = () => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  socket.emit("createRoom", code);
  document.getElementById("roomCode").value = code;
  statusText.textContent = "Room: " + code;
};

document.getElementById("join").onclick = () => {
  const code = document.getElementById("roomCode").value.trim().toUpperCase();
  if (!code) {
    statusText.textContent = "Enter room code!";
    return;
  }
  socket.emit("joinRoom", code);
  statusText.textContent = "Joining: " + code;
};

socket.on("playerJoined", () => {
  statusText.textContent = "Opponent joined!";
});
