import { apiRequest } from "./apiClient";
import { socket } from "./socket";

export const announcementService = {
  getAnnouncements: () => apiRequest("/api/announcements"),

  createAnnouncement: (data) =>
    apiRequest("/api/announcements", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStatus: (id, status) =>
    apiRequest(`/api/announcements/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getAdminAnnouncements: () => apiRequest("/api/announcements/admin"),
};

export const subscribeToNewAnnouncement = (callback) => {
  socket.on("announcement:new", callback);
  return () => socket.off("announcement:new", callback);
};

export const subscribeToAnnouncementUpdated = (callback) => {
  socket.on("announcement:updated", callback);
  return () => socket.off("announcement:updated", callback);
};