import { Bell, KeyRound, LogOut, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../components/owner/PageHeader";
import api from "../../../services/api";
import { Button, ConfirmDialog, Field, Panel } from "../ownerShared";

const notificationOptions = [
  { key: "appointments", label: "Appointment updates", description: "Booking confirmations and appointment changes." },
  { key: "vaccinations", label: "Vaccination reminders", description: "Upcoming and overdue vaccine reminders." },
  { key: "grooming", label: "Grooming bookings", description: "Service confirmations and groomer updates." },
  { key: "orders", label: "Order updates", description: "Cart, checkout, and delivery notifications." },
];

const SectionHeading = ({ icon: Icon, title, description, danger = false }) => (
  <div className="mb-5 flex items-start gap-3">
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${danger ? "bg-red-500/10 text-red-300" : "bg-cyan-400/10 text-cyan-300"}`}>
      <Icon size={21} />
    </span>
    <div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
    </div>
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [deletePassword, setDeletePassword] = useState("");
  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    const saved = JSON.parse(localStorage.getItem("ownerNotificationPrefs") || "{}");
    return {
      appointments: saved.appointments ?? true,
      vaccinations: saved.vaccinations ?? true,
      grooming: saved.grooming ?? true,
      orders: saved.orders ?? true,
    };
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const changePassword = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/auth/change-password", form);
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
    navigate("/login", { replace: true });
  };

  const deleteAccount = async (event) => {
    event.preventDefault();
    setConfirmDeleteOpen(true);
  };

  const confirmDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete("/auth/account", { data: { password: deletePassword } });
      toast.success("Account deleted");
      setConfirmDeleteOpen(false);
      logout();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete account");
    } finally {
      setDeleting(false);
    }
  };

  const toggleNotification = (key) => {
    setNotificationPrefs((current) => {
      const next = { ...current, [key]: !current[key] };
      localStorage.setItem("ownerNotificationPrefs", JSON.stringify(next));
      toast.success("Notification preference saved");
      return next;
    });
  };

  return (
    <main>
      <PageHeader title="Settings" description="Manage account security, notifications, and session controls." />
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <SectionHeading icon={KeyRound} title="Change Password" description="Use a strong password to keep your owner account protected." />
          <form onSubmit={changePassword} className="space-y-5">
            <Field label="Current Password" type="password" value={form.currentPassword} onChange={(value) => setField("currentPassword", value)} required />
            <Field label="New Password" type="password" value={form.newPassword} onChange={(value) => setField("newPassword", value)} required minLength={8} />
            <Button type="submit" disabled={saving} className="px-5 py-3 font-bold">{saving ? "Saving..." : "Change Password"}</Button>
          </form>
        </Panel>

        <Panel>
          <SectionHeading icon={LogOut} title="Session" description="Sign out from this device when you are done managing your pets." />
          <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
            <p className="text-sm font-semibold text-white">Current session</p>
            <p className="mt-1 text-sm text-slate-500">You are signed in to the owner portal on this browser.</p>
          </div>
          <Button variant="danger" onClick={logout} className="mt-5 px-5 py-3">
            <LogOut size={18} />
            Logout
          </Button>
        </Panel>

        <Panel className="lg:col-span-2">
          <SectionHeading icon={Bell} title="Notifications" description="Choose which owner updates should stay visible for this browser." />
          <div className="grid gap-3 md:grid-cols-2">
            {notificationOptions.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleNotification(item.key)}
                className="group flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-slate-950/80"
              >
                <span>
                  <span className="block font-semibold text-white">{item.label}</span>
                  <span className="mt-1 block text-sm text-slate-500">{item.description}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
                    notificationPrefs[item.key]
                      ? "bg-emerald-400/15 text-emerald-300"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {notificationPrefs[item.key] ? "On" : "Off"}
                </span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="lg:col-span-2">
          <SectionHeading icon={ShieldAlert} title="Delete Account" description="Permanently delete this owner account and related owner data." danger />
          <form onSubmit={deleteAccount} className="grid gap-4 rounded-xl border border-red-400/15 bg-red-500/5 p-4 md:grid-cols-[1fr_auto] md:items-end">
            <Field
              label="Password"
              type="password"
              value={deletePassword}
              onChange={setDeletePassword}
              required
            />
            <Button type="submit" variant="danger" disabled={deleting} className="px-5 py-3">
              <Trash2 size={18} />
              {deleting ? "Deleting..." : "Delete Account"}
            </Button>
          </form>
        </Panel>
      </div>
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete account"
        message="This will permanently delete your owner account and related owner data."
        confirmText="Delete Account"
        danger
        loading={deleting}
        onConfirm={confirmDeleteAccount}
        onClose={() => setConfirmDeleteOpen(false)}
      />
    </main>
  );
};

export default Settings;

