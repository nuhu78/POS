import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
});

client.interceptors.request.use((config) => {
  const token = window.__access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = window.__refresh_token;
        const { data } = await axios.post(
          `${client.defaults.baseURL}/auth/refresh/`,
          { refresh }
        );
        window.__access_token = data.access;
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return client(originalRequest);
      } catch {
        window.__access_token = null;
        window.__refresh_token = null;
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default client;
