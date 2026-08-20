const BASE_URL = "http://localhost:5000/api/authorities";

const getHeaders = () => {
  const token = sessionStorage.getItem("privatevoice_token");
  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : ""
  };
};

export const authorityService = {
  getAuthorities: async () => {
    const res = await fetch(BASE_URL, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch authorities");
    return res.json();
  },

  getAdminAuthorities: async () => {
    const res = await fetch(`${BASE_URL}/admin`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch admin authorities");
    return res.json();
  },

  addAuthority: async (data) => {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to add authority");
    return res.json();
  },

  deactivateAuthority: async (id) => {
    const res = await fetch(`${BASE_URL}/${id}/deactivate`, {
      method: "PATCH",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to deactivate authority");
    return res.json();
  }
};
