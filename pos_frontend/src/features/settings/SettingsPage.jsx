import { useState, useEffect } from "react";
import { useToast } from "../../components/Toast";
import Button from "../../components/Button";
import { getSettings, updateSettings } from "../../api/shopSettings";

export default function SettingsPage() {
  const showToast = useToast();
  const [form, setForm] = useState({ shop_name: "", tax_percentage: "", currency: "", receipt_footer: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getSettings();
        setForm(data);
      } catch {
        setError("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await updateSettings(form);
      showToast("Settings saved.", "success");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to save.");
    }
  };

  if (loading) return <div className="text-gray-500 p-8">Loading settings...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Shop Settings</h1>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSave} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shop name</label>
          <input name="shop_name" value={form.shop_name} onChange={handleChange} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:shadow-[0_0_0_2px_rgba(245,158,11,0.2)]" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax %</label>
            <input name="tax_percentage" type="number" step="0.01" value={form.tax_percentage} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:shadow-[0_0_0_2px_rgba(245,158,11,0.2)]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <input name="currency" value={form.currency} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:shadow-[0_0_0_2px_rgba(245,158,11,0.2)]" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Receipt footer</label>
          <textarea name="receipt_footer" value={form.receipt_footer} onChange={handleChange} rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:shadow-[0_0_0_2px_rgba(245,158,11,0.2)]" />
        </div>
        <Button type="submit">Save</Button>
      </form>
    </div>
  );
}
