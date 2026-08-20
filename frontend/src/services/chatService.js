import {
  socket,
  subscribeToConnectError,
  subscribeToConnect,
} from "./socket";

const CHAT_BASE_URL = "http://localhost:5000/api/chat";

const getHeaders = () => {
  const token = sessionStorage.getItem("privatevoice_token");
  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : ""
  };
};

// =====================================================
// SEND MESSAGE (SOCKET)
// =====================================================
//
// Hardened against a silent-hang bug: if the socket never
// connects (e.g. bad/expired JWT rejected during handshake),
// this used to wait forever for an ack that would never come.
// Now it rejects immediately if not connected, and rejects
// after a timeout if the server never acknowledges.
// =====================================================

export const sendMessage = (receiverId, message) => {
  return new Promise((resolve, reject) => {
    if (!socket.connected) {
      reject(
        new Error(
          "Not connected to chat server. Please check your connection and try again."
        )
      );
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(
        new Error(
          "Message send timed out. Please try again."
        )
      );
    }, 10000);

    socket.emit(
      "chat:send",
      {
        receiverId,
        message,
      },
      (response) => {
        clearTimeout(timeoutId);
        resolve(response);
      }
    );
  });
};

// =====================================================
// DELETE MESSAGE (SOCKET)
// =====================================================

export const deleteMessage = (messageId) => {
  return new Promise((resolve, reject) => {
    if (!socket.connected) {
      reject(
        new Error(
          "Not connected to chat server. Please check your connection and try again."
        )
      );
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(
        new Error(
          "Delete request timed out. Please try again."
        )
      );
    }, 10000);

    socket.emit(
      "chat:delete",
      {
        messageId,
      },
      (response) => {
        clearTimeout(timeoutId);
        resolve(response);
      }
    );
  });
};

// =====================================================
// RECEIVE MESSAGE (SOCKET)
// =====================================================

export const subscribeToMessages = (callback) => {
  socket.on("chat:message", callback);

  return () => {
    socket.off("chat:message", callback);
  };
};

// =====================================================
// RECEIVE MESSAGE DELETION (SOCKET)
// =====================================================

export const subscribeToMessageDeleted = (callback) => {
  socket.on("chat:message_deleted", callback);

  return () => {
    socket.off("chat:message_deleted", callback);
  };
};

// =====================================================
// ONLINE (SOCKET)
// =====================================================

export const subscribeToOnline = (callback) => {
  socket.on("user:online", callback);

  return () => {
    socket.off("user:online", callback);
  };
};

// =====================================================
// OFFLINE (SOCKET)
// =====================================================

export const subscribeToOffline = (callback) => {
  socket.on("user:offline", callback);

  return () => {
    socket.off("user:offline", callback);
  };
};

// =====================================================
// CONNECTION STATE (SOCKET) — re-exported for UI use
// =====================================================

export const subscribeToConnectionError = subscribeToConnectError;
export const subscribeToConnectionSuccess = subscribeToConnect;

// =====================================================
// CHAT HISTORY (HTTP)
// =====================================================

export const getChatHistory = async (otherUserId) => {
  const res = await fetch(`${CHAT_BASE_URL}/history/${otherUserId}`, {
    headers: getHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch chat history");
  return res.json();
};

// =====================================================
// CONVERSATIONS (HTTP) - AUTHORITY/ADMIN ONLY
// =====================================================

export const getConversations = async () => {
  const res = await fetch(`${CHAT_BASE_URL}/conversations`, {
    headers: getHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch conversations");
  return res.json();
};