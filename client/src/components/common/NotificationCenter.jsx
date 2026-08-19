import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import {
  deleteAllNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notificationApi";

const filterToParams = {
  all: {},
  unread: { isRead: "false" },
  read: { isRead: "true" },
};

const typeClasses = {
  Appointment: "bg-indigo-400/10 text-indigo-300 ring-indigo-300/20",
  Grooming: "bg-cyan-400/10 text-cyan-300 ring-cyan-300/20",
  Vaccination: "bg-amber-400/10 text-amber-300 ring-amber-300/20",
  Order: "bg-emerald-400/10 text-emerald-300 ring-emerald-300/20",
  Payment: "bg-violet-400/10 text-violet-300 ring-violet-300/20",
  System: "bg-slate-700/70 text-slate-300 ring-white/10",
};

const formatDateTime = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const StatPanel = ({ title, value, subtitle, icon: Icon, tone = "cyan" }) => {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-400/10 text-emerald-300"
      : tone === "indigo"
        ? "bg-indigo-400/10 text-indigo-300"
        : "bg-cyan-400/10 text-cyan-300";

  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <h2 className="mt-2 text-3xl font-bold text-white">{value}</h2>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>
        <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon size={23} />
        </span>
      </div>
    </article>
  );
};

const ActionButton = ({ children, variant = "ghost", className = "", ...props }) => {
  const variantClass =
    variant === "primary"
      ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-300"
      : variant === "danger"
        ? "border border-red-400/30 text-red-300 hover:bg-red-500/10 hover:text-red-200"
        : "border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white";

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const NotificationCenter = ({
  HeaderComponent,
  title = "Notifications",
  description = "Review alerts and account activity.",
  eventName = "notifications-updated",
  loadingText = "Fetching your latest alerts.",
  emptyDescription = "Notifications will appear here when activity happens.",
}) => {
  const [filter, setFilter] = useState("all");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState({ totalNotifications: 0, unreadCount: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const notifyCountChanged = useCallback(() => {
    window.dispatchEvent(new Event(eventName));
  }, [eventName]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getNotifications({
        limit: 50,
        ...(filterToParams[filter] || {}),
      });
      setNotifications(response.data.notifications || []);
      setSummary({
        totalNotifications: response.data.totalNotifications || 0,
        unreadCount: response.data.unreadCount || 0,
      });
      notifyCountChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load notifications");
    } finally {
      setLoading(false);
    }
  }, [filter, notifyCountChanged]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const readCount = useMemo(
    () => Math.max((summary.totalNotifications || 0) - (summary.unreadCount || 0), 0),
    [summary]
  );

  const markOneRead = async (item) => {
    if (item.isRead) return;
    setBusy(item._id);
    try {
      await markNotificationRead(item._id);
      toast.success("Notification marked as read");
      await loadNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update notification");
    } finally {
      setBusy("");
    }
  };

  const markAllRead = async () => {
    setBusy("read-all");
    try {
      await markAllNotificationsRead();
      toast.success("All notifications marked as read");
      await loadNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not mark notifications as read");
    } finally {
      setBusy("");
    }
  };

  const removeOne = async (id) => {
    setBusy(id);
    try {
      await deleteNotification(id);
      toast.success("Notification deleted");
      await loadNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete notification");
    } finally {
      setBusy("");
    }
  };

  const removeAll = async () => {
    setBusy("delete-all");
    try {
      await deleteAllNotifications();
      toast.success("Notifications deleted");
      setConfirmOpen(false);
      await loadNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete notifications");
    } finally {
      setBusy("");
    }
  };

  const Header = HeaderComponent;

  return (
    <main>
      {Header ? (
        <Header title={title} description={description} icon={Bell} />
      ) : (
        <div className="mb-7">
          <p className="mb-2 text-sm font-bold text-cyan-400">Notifications</p>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-400">{description}</p>
        </div>
      )}

      <section className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <StatPanel title="Unread" value={summary.unreadCount || 0} subtitle="Notifications pending" icon={Bell} />
        <StatPanel title="Read" value={readCount} subtitle="Already reviewed" icon={CheckCheck} tone="emerald" />
        <StatPanel title="Total" value={summary.totalNotifications || 0} subtitle="All notifications" icon={CheckCheck} tone="indigo" />
      </section>

      <section className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-slate-900 p-5">
        {["all", "unread", "read"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold capitalize transition ${
              filter === item
                ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20"
                : "border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            {item}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap gap-3">
          <ActionButton onClick={markAllRead} disabled={busy === "read-all" || !summary.unreadCount}>
            <CheckCheck size={16} /> Mark all read
          </ActionButton>
          <ActionButton variant="danger" onClick={() => setConfirmOpen(true)} disabled={!summary.totalNotifications}>
            <Trash2 size={16} /> Delete all
          </ActionButton>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950 p-10 text-center">
            <Bell className="mx-auto text-cyan-300" size={34} />
            <h2 className="mt-4 text-lg font-bold text-white">Loading notifications...</h2>
            <p className="mt-2 text-sm text-slate-500">{loadingText}</p>
          </div>
        ) : notifications.length ? (
          <div className="space-y-3">
            {notifications.map((item) => (
              <article
                key={item._id}
                className={`rounded-xl border p-4 transition hover:border-cyan-300/30 ${
                  item.isRead ? "border-white/10 bg-slate-950" : "border-cyan-300/20 bg-cyan-400/5"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-white">{item.title}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${typeClasses[item.type] || typeClasses.System}`}>
                        {item.type || "System"}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.isRead ? "bg-slate-700 text-slate-300" : "bg-cyan-400/10 text-cyan-300"}`}>
                        {item.isRead ? "Read" : "Unread"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.message}</p>
                    <p className="mt-3 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!item.isRead && (
                      <ActionButton onClick={() => markOneRead(item)} disabled={busy === item._id}>
                        Read
                      </ActionButton>
                    )}
                    <ActionButton variant="danger" onClick={() => removeOne(item._id)} disabled={busy === item._id}>
                      <Trash2 size={15} />
                    </ActionButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950 p-10 text-center">
            <Bell className="mx-auto text-cyan-300" size={34} />
            <h2 className="mt-4 text-lg font-bold text-white">No notifications yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{emptyDescription}</p>
          </div>
        )}
      </section>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40">
            <h2 className="text-xl font-bold text-white">Delete notifications</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              This will permanently delete all notifications from your account.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <ActionButton onClick={() => setConfirmOpen(false)} disabled={busy === "delete-all"}>
                Cancel
              </ActionButton>
              <ActionButton variant="danger" onClick={removeAll} disabled={busy === "delete-all"}>
                Delete all
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default NotificationCenter;
