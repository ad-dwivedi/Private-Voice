import { apiRequest } from "./apiClient";
import { socket } from "./socket";

export const pollService = {
  getPolls: () => apiRequest("/api/polls"),

  createPoll: (data) =>
    apiRequest("/api/polls", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  votePoll: (pollId, optionId) =>
    apiRequest(`/api/polls/${pollId}/vote`, {
      method: "POST",
      body: JSON.stringify({ optionId }),
    }),

  closePoll: (pollId) =>
    apiRequest(`/api/polls/${pollId}/close`, { method: "PUT" }),

  getAdminPolls: () => apiRequest("/api/polls/admin"),
};

export const subscribeToNewPoll = (callback) => {
  socket.on("poll:new", callback);
  return () => socket.off("poll:new", callback);
};

export const subscribeToPollVoted = (callback) => {
  socket.on("poll:voted", callback);
  return () => socket.off("poll:voted", callback);
};

export const subscribeToPollClosed = (callback) => {
  socket.on("poll:closed", callback);
  return () => socket.off("poll:closed", callback);
};