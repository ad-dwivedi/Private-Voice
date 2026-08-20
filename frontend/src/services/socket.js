import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

export const connectSocket = (token) => {
  if (!token) {
    console.error("Socket token missing");
    return;
  }

  socket.auth = {
    token,
  };

  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

// =====================================================
// CONNECTION ERROR
// =====================================================
//
// Previously nothing listened for this. If the JWT fails
// server-side handshake auth (io.use middleware calling
// next(new Error(...))), the socket silently never connects.
// Any pending sendMessage()/deleteMessage() ack-callback then
// waits forever, which looks exactly like "message not
// sending" with no visible error. Surfacing this lets the UI
// show a real error instead of hanging indefinitely.
// =====================================================

export const subscribeToConnectError = (callback) => {
  socket.on("connect_error", callback);

  return () => {
    socket.off("connect_error", callback);
  };
};

export const subscribeToConnect = (callback) => {
  socket.on("connect", callback);

  return () => {
    socket.off("connect", callback);
  };
};