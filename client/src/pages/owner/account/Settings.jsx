import { LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../components/owner/PageHeader";
import api from "../../../services/api";
import { Button, Field, Panel } from "../ownerShared";

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
    if (!window.confirm("Delete your account permanently?")) return;
    setDeleting(true);
    try {
      await api.delete("/auth/account", { data: { password: deletePassword } });
      toast.success("Account deleted");
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
      <PageHeader title="Settings" description="Manage password and account session." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-5 text-xl font-bold text-white">Change Password</h2>
          <form onSubmit={changePassword} className="space-y-5">
            <Field label="Current Password" type="password" value={form.currentPassword} onChange={(value) => setField("currentPassword", value)} required />
            <Field label="New Password" type="password" value={form.newPassword} onChange={(value) => setField("newPassword", value)} required />
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Change Password"}</Button>
          </form>
        </Panel>

        <Panel>
          <h2 className="mb-3 text-xl font-bold text-white">Session</h2>
          <p className="mb-5 text-sm text-slate-400">Sign out from this owner portal session.</p>
          <Button variant="danger" onClick={logout}>
            <LogOut size={18} />
            Logout
          </Button>
        </Panel>

        <Panel className="lg:col-span-2">
          <h2 className="mb-3 text-xl font-bold text-white">Notifications</h2>
          <p className="mb-5 text-sm text-slate-400">
            Notification backend is planned for later; these owner preferences are saved locally for now.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { key: "appointments", label: "Appointment updates" },
              { key: "vaccinations", label: "Vaccination reminders" },
              { key: "grooming", label: "Grooming bookings" },
              { key: "orders", label: "Order updates" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleNotification(item.key)}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950 p-4 text-left transition hover:border-cyan-300/35"
              >
                <span className="font-semibold text-white">{item.label}</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
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
          <h2 className="mb-3 text-xl font-bold text-white">Delete Account</h2>
          <p className="mb-5 text-sm text-slate-400">
            Permanently delete this owner account and related owner data.
          </p>
          <form onSubmit={deleteAccount} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <Field
              label="Password"
              type="password"
              value={deletePassword}
              onChange={setDeletePassword}
              required
            />
            <Button type="submit" variant="danger" disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Account"}
            </Button>
          </form>
        </Panel>
      </div>
    </main>
  );
};

export default Settings;

