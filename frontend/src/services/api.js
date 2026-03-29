import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000/api",
  timeout: 10000,
});

// Attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Mock users — email determines role for demo
const MOCK_USERS = {
  "admin@demo.com": { id: "u1", name: "Alice Admin", email: "admin@demo.com", role: "ADMIN" },
  "manager@demo.com": { id: "u2", name: "Bob Manager", email: "manager@demo.com", role: "MANAGER" },
  "employee@demo.com": { id: "u3", name: "Carol Employee", email: "employee@demo.com", role: "EMPLOYEE" },
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isNetworkError = !error.response;
    const url = error.config?.url || "";

    // MOCK LOGIN — role depends on email entered
    if (isNetworkError && url.includes("/auth/login")) {
      const body = JSON.parse(error.config.data);
      const mockUser = MOCK_USERS[body.email] || {
        id: "u9",
        name: "Demo Employee",
        email: body.email,
        role: "EMPLOYEE", // default fallback
      };
      return Promise.resolve({
        data: {
          token: `mock-token-${mockUser.role.toLowerCase()}`,
          user: mockUser,
        },
      });
    }

    // MOCK SIGNUP — always creates as ADMIN for demo
    if (isNetworkError && url.includes("/auth/signup")) {
      const body = JSON.parse(error.config.data);
      return Promise.resolve({
        data: {
          token: "mock-token-admin",
          user: {
            id: "u10",
            name: body.name || "New User",
            email: body.email,
            role: "ADMIN",
          },
        },
      });
    }

    // Token expired / unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);