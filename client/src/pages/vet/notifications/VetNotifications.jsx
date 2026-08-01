import { useState } from "react";
import { Bell, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import VetConfirmModal from "../../../components/vet/VetConfirmModal";
import VetDataTable from "../../../components/vet/VetDataTable";
import VetPageHeader from "../../../components/vet/VetPageHeader";
import VetStatCard from "../../../components/vet/VetStatCard";
import VetStatusBadge from "../../../components/vet/VetStatusBadge";
import { formatDate } from "../../../utils/dateUtils";

const VetNotifications = () => {
  const [filter, setFilter] = useState("all");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const notifications = [];
  const visibleNotifications = filter === "all" ? notifications : notifications.filter((item) => filter === "unread" ? !item.isRead : item.isRead);

  const disabledAction = () => toast("Notification backend will be connected later.");

  return (
    <main>
      <VetPageHeader title="Notifications" description="Notification center UI. Backend connection will be enabled later." />
      <section className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <VetStatCard title="Unread" value={0} subtitle="Notifications pending" icon={Bell} color="cyan" />
        <VetStatCard title="Total" value={0} subtitle="All notifications" icon={Bell} color="indigo" />
      </section>
      <section className="mb-5 flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-slate-900 p-5">
        {["all", "unread", "read"].map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold capitalize ${filter === item ? "bg-cyan-400 text-slate-950" : "border border-white/10 text-slate-300 hover:bg-white/5"}`}>{item}</button>)}
        <button type="button" onClick={disabledAction} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5">Mark all read</button>
        <button type="button" onClick={() => setConfirmOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/10"><Trash2 size={16} /> Delete all</button>
      </section>
      <VetDataTable
        data={visibleNotifications}
        emptyTitle="No notifications yet"
        emptyDescription="Appointment and system notifications will appear here after notification backend is enabled."
        columns={[
          { header: "Title", render: (row) => row.title },
          { header: "Message", render: (row) => row.message },
          { header: "Status", render: (row) => <VetStatusBadge status={row.isRead ? "read" : "unread"} /> },
          { header: "Date", render: (row) => formatDate(row.createdAt) },
        ]}
      />
      <VetConfirmModal open={confirmOpen} title="Delete notifications" message="Notification backend is not enabled yet. This action is currently unavailable." confirmText="Okay" onClose={() => setConfirmOpen(false)} onConfirm={() => setConfirmOpen(false)} />
    </main>
  );
};

export default VetNotifications;
