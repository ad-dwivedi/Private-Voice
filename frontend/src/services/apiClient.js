// =====================================================
// SHARED API CLIENT
// =====================================================
//
// Centralizes:
// - auth headers (token from sessionStorage)
// - JSON parsing
// - 401 handling (session expired -> clear + redirect to
//   login with a clear message, instead of every page
//   silently showing a confusing "Database error")
//
// Every service file should route its requests through this
// instead of calling fetch() directly.
// =====================================================

const API_BASE = "http://localhost:5000";

function getToken() {
  return sessionStorage.getItem("privatevoice_token");
}

function clearSessionAndRedirect() {
  sessionStorage.removeItem("privatevoice_user_id");
  sessionStorage.removeItem("privatevoice_full_name");
  sessionStorage.removeItem("privatevoice_organization_id");
  sessionStorage.removeItem("privatevoice_organization_name");
  sessionStorage.removeItem("privatevoice_organization_description");
  sessionStorage.removeItem("privatevoice_organization_code");
  sessionStorage.removeItem("privatevoice_role");
  sessionStorage.removeItem("privatevoice_approval_status");
  sessionStorage.removeItem("privatevoice_anonymous_id");
  sessionStorage.removeItem("privatevoice_token");

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export async function apiRequest(path, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearSessionAndRedirect();
    throw new Error("Your session has expired. Please login again.");
  }

  let data = null;

  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}