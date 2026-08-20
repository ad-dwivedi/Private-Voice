import { apiRequest } from "./apiClient";
import { socket } from "./socket";

export const complaintService = {
  getComplaints: () => apiRequest("/api/complaints"),

  createComplaint: (data) =>
    apiRequest("/api/complaints", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAdminComplaints: () => apiRequest("/api/complaints/admin"),

  updateComplaintStatus: (id, status, responseText) =>
    apiRequest(`/api/complaints/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, response: responseText }),
    }),
};

export const subscribeToNewComplaint = (callback) => {
  socket.on("complaint:new", callback);
  return () => socket.off("complaint:new", callback);
};

export const subscribeToComplaintUpdated = (callback) => {
  socket.on("complaint:updated", callback);
  return () => socket.off("complaint:updated", callback);
};