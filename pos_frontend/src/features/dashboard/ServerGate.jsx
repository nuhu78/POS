import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";

export default function ServerGate() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  const ping = async () => {
    setError("");
    setChecking(true);
    try {
      const { data } = await client.get("/ping/", { timeout: 60000 });
      if (data?.status === "ok") {
        navigate("/login", { replace: true });
        return;
      }
      setError("Unexpected server response. Please try again.");
    } catch {
      setError("Server unreachable. It may be waking up — please try again.");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    ping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">POS System</h1>
          <p className="text-sm text-gray-500">Connecting to server…</p>
        </div>

        {checking ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600">Waking server, this may take a moment…</p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={ping}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition"
            >
              Retry
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
