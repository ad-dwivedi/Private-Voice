import { apiRequest } from "./apiClient";
import { socket } from "./socket";

export const notificationService = {
  getNotifications: () => apiRequest("/api/notifications"),

  getUnreadCount: () => apiRequest("/api/notifications/count"),

  markAsRead: (id) =>
    apiRequest(`/api/notifications/${id}/read`, { method: "PATCH" }),

  markAllAsRead: () =>
    apiRequest("/api/notifications/read-all", { method: "PATCH" }),
};

export const subscribeToNewNotification = (callback) => {
  socket.on("notification:new", callback);
  return () => socket.off("notification:new", callback);
};