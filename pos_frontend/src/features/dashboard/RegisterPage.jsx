import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../../api/client";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await client.post("/auth/register/", { ...form, role: "cashier" });
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.error?.message || "Registration failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Create Account</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input name="name" value={form.name} onChange={handleChange} placeholder="Full name" required />
      <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" required />
      <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password (min 8 chars)" minLength={8} required />
      <button type="submit" disabled={loading}>{loading ? "Registering..." : "Register"}</button>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </form>
  );
}
