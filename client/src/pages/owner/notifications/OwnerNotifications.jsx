import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import EmptyState from "../../../components/owner/EmptyState";
import PageHeader from "../../../components/owner/PageHeader";
import StatusBadge from "../../../components/owner/StatusBadge";
import {
  deleteAllNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../../services/notificationApi";
import { Button, ConfirmDialog, Panel, formatDate } from "../ownerShared";

const filterToParams = {
  all: {},
  unread: { isRead: "false" },
  read: { isRead: "true" },
};

const typeClasses = {
  Appointment: "bg-indigo-400/10 text-indigo-300",
  Grooming: "bg-cyan-400/10 text-cyan-300",
  Vaccination: "bg-amber-400/10 text-amber-300",
  Order: "bg-emerald-400/10 text-emerald-300",
  Payment: "bg-violet-400/10 text-violet-300",
  System: "bg-slate-700 text-slate-300",
};

const notifyCountChanged = () => {
  window.dispatchEvent(new Event("owner-notifications-updated"));
};

const OwnerNotifications = () => {
  const [filter, setFilter] = useState("all");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState({ totalNotifications: 0, unreadCount: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

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
  }, [filter]);

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

  return (
    <main>
      <PageHeader
        icon={Bell}
        title="Notifications"
        description="Review owner account alerts, booking updates, reminders, and shop activity."
      />

      <section className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Panel>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Unread</p>
              <h2 className="mt-2 text-3xl font-bold text-white">{summary.unreadCount || 0}</h2>
              <p className="mt-2 text-sm text-slate-500">Notifications pending</p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
              <Bell size={23} />
            </span>
          </div>
        </Panel>

        <Panel>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Read</p>
              <h2 className="mt-2 text-3xl font-bold text-white">{readCount}</h2>
              <p className="mt-2 text-sm text-slate-500">Already reviewed</p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
              <CheckCheck size={23} />
            </span>
          </div>
        </Panel>

        <Panel>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Total</p>
              <h2 className="mt-2 text-3xl font-bold text-white">{summary.totalNotifications || 0}</h2>
              <p className="mt-2 text-sm text-slate-500">All notifications</p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300">
              <CheckCheck size={23} />
            </span>
          </div>
        </Panel>
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
          <Button variant="ghost" onClick={markAllRead} disabled={busy === "read-all" || !summary.unreadCount}>
            <CheckCheck size={16} /> Mark all read
          </Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)} disabled={!summary.totalNotifications}>
            <Trash2 size={16} /> Delete all
          </Button>
        </div>
      </section>

      <Panel>
        {loading ? (
          <EmptyState title="Loading notifications..." description="Fetching your latest owner alerts." />
        ) : notifications.length ? (
          <div className="space-y-3">
            {notifications.map((item) => (
              <article key={item._id} className={`rounded-xl border p-4 transition hover:border-cyan-300/30 ${item.isRead ? "border-white/10 bg-slate-950" : "border-cyan-300/20 bg-cyan-400/5"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-white">{item.title}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${typeClasses[item.type] || typeClasses.System}`}>
                        {item.type || "System"}
                      </span>
                      <StatusBadge status={item.isRead ? "read" : "unread"} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.message}</p>
                    <p className="mt-3 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!item.isRead && (
                      <Button variant="ghost" onClick={() => markOneRead(item)} disabled={busy === item._id}>
                        Read
                      </Button>
                    )}
                    <Button variant="danger" onClick={() => removeOne(item._id)} disabled={busy === item._id}>
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No notifications yet"
            description="Booking, reminder, and shop notifications will appear here when activity happens."
          />
        )}
      </Panel>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete notifications"
        message="This will permanently delete all notifications from your account."
        confirmText="Delete all"
        danger
        loading={busy === "delete-all"}
        onClose={() => setConfirmOpen(false)}
        onConfirm={removeAll}
      />
    </main>
  );
};

export default OwnerNotifications;
