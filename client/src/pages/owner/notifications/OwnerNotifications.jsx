import { useState } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import EmptyState from "../../../components/owner/EmptyState";
import PageHeader from "../../../components/owner/PageHeader";
import StatusBadge from "../../../components/owner/StatusBadge";
import { Button, ConfirmDialog, Panel, formatDate } from "../ownerShared";

const OwnerNotifications = () => {
  const [filter, setFilter] = useState("all");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const notifications = [];
  const visibleNotifications =
    filter === "all"
      ? notifications
      : notifications.filter((item) => (filter === "unread" ? !item.isRead : item.isRead));

  const disabledAction = () => toast("Notification backend will be connected later.");

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
              <h2 className="mt-2 text-3xl font-bold text-white">0</h2>
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
              <p className="text-sm text-slate-400">Total</p>
              <h2 className="mt-2 text-3xl font-bold text-white">0</h2>
              <p className="mt-2 text-sm text-slate-500">All notifications</p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300">
              <CheckCheck size={23} />
            </span>
          </div>
        </Panel>
      </section>

      <section className="mb-5 flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-slate-900 p-5">
        {["all", "unread", "read"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold capitalize transition ${
              filter === item
                ? "bg-cyan-400 text-slate-950"
                : "border border-white/10 text-slate-300 hover:bg-white/5"
            }`}
          >
            {item}
          </button>
        ))}
        <Button variant="ghost" onClick={disabledAction}>
          Mark all read
        </Button>
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>
          <Trash2 size={16} /> Delete all
        </Button>
      </section>

      <Panel>
        {visibleNotifications.length ? (
          <div className="space-y-3">
            {visibleNotifications.map((item) => (
              <article key={item._id || item.id} className="rounded-xl border border-white/10 bg-slate-950 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-white">{item.title}</h2>
                    <p className="mt-1 text-sm text-slate-400">{item.message}</p>
                    <p className="mt-2 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                  </div>
                  <StatusBadge status={item.isRead ? "read" : "unread"} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No notifications yet"
            description="Booking, reminder, and shop notifications will appear here after notification backend is enabled."
          />
        )}
      </Panel>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete notifications"
        message="Notification backend is not enabled yet. This action is currently unavailable."
        confirmText="Okay"
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => setConfirmOpen(false)}
      />
    </main>
  );
};

export default OwnerNotifications;
