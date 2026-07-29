import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../components/Button";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const role = await login(email, password);
      navigate(role === "admin" ? "/admin" : "/cashier", { replace: true });
    } catch (err) {
      if (err.isNetwork) {
        setError(err.message);
      } else {
        const msg = err.response?.data?.error?.message || "Invalid email or password.";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">POS Login</h1>
        {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>


        <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-2">
          <p className="text-amber-700 font-semibold">⚠️ Important</p>
          <p>The backend is hosted on Render Free Tier. On the first visit, it may take 30–60 seconds for the server to wake up.</p>
          <p className="font-semibold text-gray-600 mt-2">Demo Accounts</p>
          <div className="bg-amber-50 rounded-lg p-2 space-y-1">
            <p><span className="font-medium">Admin</span> — admin@pos.com / admin123</p>
            <p><span className="font-medium">Cashier</span> — cashier@pos.com / cashier123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
