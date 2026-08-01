import { useState } from "react";
import toast from "react-hot-toast";

import VetPageHeader from "../../../components/vet/VetPageHeader";
import { changePassword } from "../../../services/vetApi";

const VetChangePassword = () => {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [saving, setSaving] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await changePassword(form);
      if (response.data.token) localStorage.setItem("token", response.data.token);
      toast.success("Password changed");
      setForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main>
      <VetPageHeader title="Change Password" description="Update your veterinarian account password." />
      <form onSubmit={save} className="max-w-xl space-y-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Current password</span><input type="password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400" required /></label>
        <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">New password</span><input type="password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400" required minLength={8} /></label>
        <button type="submit" disabled={saving} className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-60">{saving ? "Saving..." : "Change Password"}</button>
      </form>
    </main>
  );
};

export default VetChangePassword;
