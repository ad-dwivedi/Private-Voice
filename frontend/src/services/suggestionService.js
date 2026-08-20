import { apiRequest } from "./apiClient";
import { socket } from "./socket";

export const suggestionService = {
  getSuggestions: () => apiRequest("/api/suggestions"),

  createSuggestion: (data) =>
    apiRequest("/api/suggestions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAdminSuggestions: () => apiRequest("/api/suggestions/admin"),

  updateSuggestionStatus: (id, status, responseText) =>
    apiRequest(`/api/suggestions/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, response: responseText }),
    }),
};

export const subscribeToNewSuggestion = (callback) => {
  socket.on("suggestion:new", callback);
  return () => socket.off("suggestion:new", callback);
};

export const subscribeToSuggestionUpdated = (callback) => {
  socket.on("suggestion:updated", callback);
  return () => socket.off("suggestion:updated", callback);
};