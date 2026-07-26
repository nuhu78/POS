import { useState, useEffect } from "react";
import { getSettings, updateSettings } from "../../api/shopSettings";

export default function SettingsPage() {
  const [form, setForm] = useState({ shop_name: "", tax_percentage: "", currency: "", receipt_footer: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await getSettings();
      setForm(data);
    })();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    await updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSave}>
      <h1>Shop Settings</h1>
      <div><label>Shop name: <input name="shop_name" value={form.shop_name} onChange={handleChange} required /></label></div>
      <div><label>Tax %: <input name="tax_percentage" type="number" step="0.01" value={form.tax_percentage} onChange={handleChange} /></label></div>
      <div><label>Currency: <input name="currency" value={form.currency} onChange={handleChange} /></label></div>
      <div><label>Receipt footer:<br /><textarea name="receipt_footer" value={form.receipt_footer} onChange={handleChange} rows={3} style={{ width: "300px" }} /></label></div>
      <button type="submit">Save</button>
      {saved && <span style={{ color: "green", marginLeft: "0.5rem" }}>Saved!</span>}
    </form>
  );
}
