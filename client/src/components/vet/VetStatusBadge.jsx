const statusStyles = {
  active: "bg-emerald-500/15 text-emerald-400",
  approved: "bg-emerald-500/15 text-emerald-400",
  accepted: "bg-emerald-500/15 text-emerald-400",
  completed: "bg-emerald-500/15 text-emerald-400",
  paid: "bg-emerald-500/15 text-emerald-400",
  pending: "bg-amber-500/15 text-amber-400",
  rejected: "bg-red-500/15 text-red-400",
  cancelled: "bg-red-500/15 text-red-400",
  failed: "bg-red-500/15 text-red-400",
  refunded: "bg-indigo-500/15 text-indigo-400",
};

const VetStatusBadge = ({ status = "Unknown" }) => {
  const normalized = String(status).toLowerCase();
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[normalized] || "bg-slate-500/15 text-slate-300"}`}>{status}</span>;
};

export default VetStatusBadge;
