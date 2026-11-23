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

// CHESS ARENA VOICE CHAT
let voiceRoomCode = null;
let voiceColor = null;
let localStream = null;
let peer = null;

const micButton = document.createElement("button");
micButton.id = "micButton";
micButton.textContent = "🎤 MIC OFF";
document.querySelector("main").appendChild(micButton);

const remoteAudio = document.createElement("audio");
remoteAudio.autoplay = true;
remoteAudio.playsInline = true;
document.body.appendChild(remoteAudio);

const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

async function getMic() {
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });
  }
  return localStream;
}

function createPeer() {
  if (peer) return peer;

  peer = new RTCPeerConnection(rtcConfig);

  peer.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("voiceIceCandidate", {
        roomCode: voiceRoomCode,
        candidate: event.candidate
      });
    }
  };

  peer.ontrack = event => {
    remoteAudio.srcObject = event.streams[0];
    remoteAudio.play().catch(() => {});
  };

  if (localStream) {
    localStream.getTracks().forEach(track => {
      peer.addTrack(track, localStream);
    });
  }

  return peer;
}

async function startVoice() {
  try {
    await getMic();
    localStream.getAudioTracks().forEach(track => {
      track.enabled = true;
    });

    micButton.textContent = "🎤 MIC ON";

    const connection = createPeer();

    if (voiceColor === "white" && !connection.localDescription) {
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);

      socket.emit("voiceOffer", {
        roomCode: voiceRoomCode,
        offer: offer
      });
    }
  } catch (error) {
    micButton.textContent = "MIC ERROR";
    alert("Microphone permission is required.");
  }
}

micButton.onclick = async () => {
  if (!voiceRoomCode) {
    alert("First create or join a room!");
    return;
  }

  if (!localStream) {
    await startVoice();
    return;
  }

  const track = localStream.getAudioTracks()[0];
  track.enabled = !track.enabled;
  micButton.textContent = track.enabled ? "🎤 MIC ON" : "🎤 MIC OFF";
};

socket.on("roomCreated", data => {
  voiceRoomCode = data.roomCode;
  voiceColor = data.color;
});

socket.on("roomJoined", data => {
  voiceRoomCode = data.roomCode;
  voiceColor = data.color;
});

socket.on("voiceOffer", async offer => {
  try {
    await getMic();
    const connection = createPeer();

    await connection.setRemoteDescription(offer);

    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);

    socket.emit("voiceAnswer", {
      roomCode: voiceRoomCode,
      answer: answer
    });

    micButton.textContent = "🎤 MIC ON";
  } catch (error) {
    micButton.textContent = "MIC ERROR";
  }
});

socket.on("voiceAnswer", async answer => {
  if (peer && !peer.currentRemoteDescription) {
    await peer.setRemoteDescription(answer);
  }
});

socket.on("voiceIceCandidate", async candidate => {
  if (peer && peer.remoteDescription) {
    try {
      await peer.addIceCandidate(candidate);
    } catch (error) {
      console.log(error);
    }
  }
});

socket.on("opponentDisconnected", () => {
  if (peer) peer.close();
  peer = null;
  remoteAudio.srcObject = null;
});
