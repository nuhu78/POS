import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      const role = JSON.parse(atob(window.__access_token.split(".")[1])).role;
      navigate(role === "admin" ? "/admin" : "/cashier", { replace: true });
    } catch {
      setError("Invalid email or password.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>POS Login</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
