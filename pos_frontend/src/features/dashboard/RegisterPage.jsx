import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../../api/client";
import Button from "../../components/Button";

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
    <div className="min-h-screen flex items-center justify-center bg-amber-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">Create Account</h1>
        {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input name="name" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" value={form.name} onChange={handleChange} placeholder="Full name" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" value={form.email} onChange={handleChange} placeholder="Email" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password (min 8 chars)</label>
            <input name="password" type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" value={form.password} onChange={handleChange} placeholder="Password" minLength={8} required />
          </div>
          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            {loading ? "Registering..." : "Register"}
          </Button>
        </form>
        <p className="text-sm text-gray-500 text-center mt-4">
          Already have an account? <Link to="/login" className="text-amber-600 hover:text-amber-800">Login</Link>
        </p>
      </div>
    </div>
  );
}
