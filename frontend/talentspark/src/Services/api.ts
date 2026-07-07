import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

const storedToken = localStorage.getItem("token");
if (storedToken) {
  api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
}

// Automatically attach the Bearer token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (!config.headers) {
    config.headers = {} as any;
  }
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem("token");
      delete api.defaults.headers.common.Authorization;
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };