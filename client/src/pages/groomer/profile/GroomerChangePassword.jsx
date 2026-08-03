import { useState } from "react";
import toast from "react-hot-toast";

import GroomerPageHeader from "../../../components/groomer/GroomerPageHeader";
import { changeGroomerPassword } from "../../../services/groomerApi";

const inputClass = "w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400";

const GroomerChangePassword = () => {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (form.newPassword.length < 8) return toast.error("New password must contain at least 8 characters");
    setSaving(true);
    try {
      const res = await changeGroomerPassword(form);
      if (res.data.token) localStorage.setItem("token", res.data.token);
      toast.success("Password changed");
      setForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change password");
    } finally {
      setSaving(false);
    }
  };
  return <main><GroomerPageHeader title="Change Password" description="Update your account password." /><form onSubmit={submit} className="max-w-xl rounded-2xl border border-white/10 bg-slate-900 p-5"><label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Current password</span><input type="password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} className={inputClass} required /></label><label className="mt-4 block"><span className="mb-2 block text-sm font-medium text-slate-300">New password</span><input type="password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} className={inputClass} required /></label><button type="submit" disabled={saving} className="mt-6 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60">{saving ? "Saving..." : "Change Password"}</button></form></main>;
};

export default GroomerChangePassword;
