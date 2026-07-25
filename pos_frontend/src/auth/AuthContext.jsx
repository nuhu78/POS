import { createContext, useContext, useState, useCallback } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await client.post("/auth/login/", { email, password });
      window.__access_token = data.access;
      window.__refresh_token = data.refresh;
      const payload = JSON.parse(atob(data.access.split(".")[1]));
      setUser({ email: payload.email, role: payload.role });
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await client.post("/auth/logout/", { refresh: window.__refresh_token });
    } catch {
    } finally {
      window.__access_token = null;
      window.__refresh_token = null;
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
