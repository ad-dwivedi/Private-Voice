// =====================================================
// AUTH SERVICE
// PrivateVoice
// =====================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

// =====================================================
// TOKEN
// =====================================================

export const getToken = () => {
  return localStorage.getItem("token");
};

export const setToken = (token) => {
  if (token) {
    localStorage.setItem(
      "token",
      token
    );
  }
};

export const removeToken = () => {
  localStorage.removeItem("token");
};

// =====================================================
// AUTH HEADERS
// =====================================================

export const getAuthHeaders = () => {
  const token = getToken();

  return {
    "Content-Type":
      "application/json",

    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
};

// =====================================================
// REGISTER
// =====================================================

export const register = async ({
  fullName,
  email,
  password,
}) => {
  const response = await fetch(
    `${API_URL}/api/auth/register`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        fullName,
        email,
        password,
      }),
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Registration failed"
    );
  }

  if (data.token) {
    setToken(data.token);
  }

  return data;
};

// =====================================================
// LOGIN
// =====================================================

export const login = async ({
  email,
  password,
  organizationCode,
}) => {
  const body = {
    email,
    password,
  };

  if (organizationCode) {
    body.organizationCode =
      organizationCode;
  }

  const response = await fetch(
    `${API_URL}/api/auth/login`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(body),
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    const error = new Error(
      data.message ||
        "Login failed"
    );

    error.status =
      data.status;

    error.organization =
      data.organization;

    throw error;
  }

  if (data.token) {
    setToken(data.token);
  }

  if (
    data.sessionAnonymousId
  ) {
    localStorage.setItem(
      "sessionAnonymousId",
      data.sessionAnonymousId
    );
  }

  if (data.user) {
    localStorage.setItem(
      "user",
      JSON.stringify(
        data.user
      )
    );
  }

  if (data.organization) {
    localStorage.setItem(
      "organization",
      JSON.stringify(
        data.organization
      )
    );
  }

  return data;
};

// =====================================================
// LOGOUT
// =====================================================

export const logout = () => {
  removeToken();

  localStorage.removeItem(
    "sessionAnonymousId"
  );

  localStorage.removeItem(
    "user"
  );

  localStorage.removeItem(
    "organization"
  );
};

// =====================================================
// CURRENT USER
// =====================================================

export const getCurrentUser = () => {
  const user =
    localStorage.getItem(
      "user"
    );

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

// =====================================================
// CURRENT ORGANIZATION
// =====================================================

export const getCurrentOrganization =
  () => {
    const organization =
      localStorage.getItem(
        "organization"
      );

    if (!organization) {
      return null;
    }

    try {
      return JSON.parse(
        organization
      );
    } catch {
      return null;
    }
  };

// =====================================================
// ANONYMOUS ID
// =====================================================

export const getAnonymousId = () => {
  return localStorage.getItem(
    "sessionAnonymousId"
  );
};

// =====================================================
// AUTH STATUS
// =====================================================

export const isAuthenticated =
  () => {
    return Boolean(
      getToken()
    );
  };

// =====================================================
// AUTH FETCH
// =====================================================

export const authFetch = async (
  endpoint,
  options = {}
) => {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
  };

  // =================================================
  // JSON BODY
  // =================================================

  if (
    options.body &&
    typeof options.body !==
      "string"
  ) {
    headers[
      "Content-Type"
    ] =
      "application/json";

    options = {
      ...options,
      body: JSON.stringify(
        options.body
      ),
    };
  }

  // If body is already JSON.stringify(...)
  // still set Content-Type.
  if (
    options.body &&
    typeof options.body ===
      "string" &&
    !headers["Content-Type"]
  ) {
    headers[
      "Content-Type"
    ] =
      "application/json";
  }

  // =================================================
  // JWT
  // =================================================

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  let data = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error =
      new Error(
        data?.message ||
          "Request failed"
      );

    error.statusCode =
      response.status;

    error.status =
      data?.status;

    error.organization =
      data?.organization;

    throw error;
  }

  return data;
};

// =====================================================
// CHECK ORGANIZATION
// =====================================================

export const checkOrganization =
  async (
    organizationCode
  ) => {
    const code = String(
      organizationCode || ""
    )
      .trim()
      .toUpperCase();

    if (!code) {
      throw new Error(
        "Organization code is required"
      );
    }

    return authFetch(
      `/api/organizations/check?code=${encodeURIComponent(
        code
      )}`
    );
  };

// =====================================================
// CREATE ORGANIZATION
// =====================================================

export const createOrganization =
  async ({
    name,
    description,
  }) => {
    return authFetch(
      "/api/organizations/create",
      {
        method: "POST",

        body: {
          name,
          description,
        },
      }
    );
  };

// =====================================================
// JOIN ORGANIZATION
// =====================================================

export const joinOrganization =
  async (
    organizationCode
  ) => {
    return authFetch(
      "/api/organizations/join",
      {
        method: "POST",

        body: {
          organizationCode,
        },
      }
    );
  };

// =====================================================
// GET MY MEMBERSHIP
// =====================================================

export const getMyMembership =
  async (
    organizationCode
  ) => {
    const code = String(
      organizationCode || ""
    )
      .trim()
      .toUpperCase();

    if (!code) {
      throw new Error(
        "Organization code is required"
      );
    }

    return authFetch(
      `/api/organizations/membership?code=${encodeURIComponent(
        code
      )}`
    );
  };

// =====================================================
// DEFAULT EXPORT
// =====================================================

const authService = {
  getToken,
  setToken,
  removeToken,
  getAuthHeaders,

  register,
  login,
  logout,

  getCurrentUser,
  getCurrentOrganization,
  getAnonymousId,

  isAuthenticated,
  authFetch,

  checkOrganization,
  createOrganization,
  joinOrganization,
  getMyMembership,
};

export default authService;