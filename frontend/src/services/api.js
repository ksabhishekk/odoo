import axios from "axios";

// Create Axios Instance
export const api = axios.create({
  baseURL: "http://localhost:3000/api",
  timeout: 10000,
});

// Request Interceptor to add JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for mock fallbacks or token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Implement mock fallback logic here for hackathon MVP purposes
    const isNetworkError = !error.response;
    
    // MOCK LOGIN
    if (isNetworkError && error.config.url.includes('/auth/login')) {
      return Promise.resolve({
        data: {
          token: "mock-jwt-token-abcd-1234",
          user: {
            id: 'u1',
            name: "Demo Admin",
            email: "admin@reimbursify.com",
            role: "ADMIN",
          }
        }
      });
    }

    // MOCK SIGNUP
    if (isNetworkError && error.config.url.includes('/auth/signup')) {
      return Promise.resolve({
        data: {
          token: "mock-jwt-token-abcd-1234",
          user: {
            id: 'u2',
            name: JSON.parse(error.config.data).name || "New User",
            email: JSON.parse(error.config.data).email,
            role: "ADMIN",
          }
        }
      });
    }
    
    // Auth failures
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);
