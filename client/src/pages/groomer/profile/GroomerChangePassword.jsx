import { Bell, KeyRound, LogOut } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import GroomerPageHeader from "../../../components/groomer/GroomerPageHeader";
import { changeGroomerPassword } from "../../../services/groomerApi";

const inputClass = "w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 hover:border-white/25 focus:border-cyan-400";

const notificationOptions = [
  { key: "bookings", label: "Booking requests", description: "Available jobs, assigned work, and booking changes." },
  { key: "schedule", label: "Schedule updates", description: "Today and upcoming grooming visit reminders." },
  { key: "reviews", label: "Review alerts", description: "Owner ratings and feedback on completed grooming services." },
  { key: "earnings", label: "Earning updates", description: "Completed service and payment summary notifications." },
];

const SectionHeading = ({ icon: Icon, title, description }) => (
  <div className="mb-5 flex items-start gap-3">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
      <Icon size={21} />
    </span>
    <div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
    </div>
  </div>
);

const GroomerChangePassword = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    const saved = JSON.parse(localStorage.getItem("groomerNotificationPrefs") || "{}");
    return {
      bookings: saved.bookings ?? true,
      schedule: saved.schedule ?? true,
      reviews: saved.reviews ?? true,
      earnings: saved.earnings ?? true,
    };
  });
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

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  const toggleNotification = (key) => {
    setNotificationPrefs((current) => {
      const next = { ...current, [key]: !current[key] };
      localStorage.setItem("groomerNotificationPrefs", JSON.stringify(next));
      toast.success("Notification preference saved");
      return next;
    });
  };

  return (
    <main>
      <GroomerPageHeader title="Settings" description="Manage account security, notifications, and session controls." />
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-lg shadow-black/10">
          <SectionHeading icon={KeyRound} title="Change Password" description="Use a strong password to keep your groomer account protected." />
          <form onSubmit={submit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Current password</span>
              <input type="password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} className={inputClass} required />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">New password</span>
              <input type="password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} className={inputClass} required minLength={8} />
            </label>
            <button type="submit" disabled={saving} className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-cyan-400/45 disabled:text-slate-950/60 disabled:shadow-none">{saving ? "Saving..." : "Change Password"}</button>
          </form>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-lg shadow-black/10">
          <SectionHeading icon={LogOut} title="Session" description="Sign out from this groomer portal session." />
          <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
            <p className="text-sm font-semibold text-white">Current session</p>
            <p className="mt-1 text-sm text-slate-500">You are signed in to the groomer panel on this browser.</p>
          </div>
          <button type="button" onClick={logout} className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/30 px-5 py-3 text-sm font-semibold text-red-300 transition hover:-translate-y-0.5 hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-950/20">
            <LogOut size={18} />
            Logout
          </button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-lg shadow-black/10 xl:col-span-2">
          <SectionHeading icon={Bell} title="Notifications" description="Choose which groomer updates should stay visible for this browser." />
          <div className="grid gap-3 md:grid-cols-2">
            {notificationOptions.map((item) => (
              <button key={item.key} type="button" onClick={() => toggleNotification(item.key)} className="group flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-slate-950/80">
                <span>
                  <span className="block font-semibold text-white">{item.label}</span>
                  <span className="mt-1 block text-sm text-slate-500">{item.description}</span>
                </span>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${notificationPrefs[item.key] ? "bg-emerald-400/15 text-emerald-300" : "bg-slate-700 text-slate-300"}`}>
                  {notificationPrefs[item.key] ? "On" : "Off"}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default GroomerChangePassword;
