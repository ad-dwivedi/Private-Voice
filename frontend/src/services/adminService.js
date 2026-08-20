import { apiRequest } from "./apiClient";

// =====================================================
// ADMIN MEMBERSHIP MANAGEMENT
// =====================================================
//
// Previously these calls lived as raw fetch() calls directly
// inside AdminDashboard.jsx, with a hardcoded base URL and
// no shared 401-session-expiry handling. Centralizing them
// here matches every other feature's service pattern.
// =====================================================

export const adminService = {
  getPendingRequests: (organizationId) =>
    apiRequest(`/api/admin/organizations/${organizationId}/requests`),

  getMembers: (organizationId) =>
    apiRequest(`/api/admin/organizations/${organizationId}/members`),

  approveRequest: (requestId) =>
    apiRequest(`/api/admin/requests/${requestId}/approve`, {
      method: "PATCH",
    }),

  rejectRequest: (requestId) =>
    apiRequest(`/api/admin/requests/${requestId}/reject`, {
      method: "PATCH",
    }),
};