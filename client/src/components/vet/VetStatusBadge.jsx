const statusStyles = {
  active: "border-emerald-300/20 bg-emerald-500/15 text-emerald-300 ring-emerald-300/10",
  approved: "border-emerald-300/20 bg-emerald-500/15 text-emerald-300 ring-emerald-300/10",
  accepted: "border-emerald-300/20 bg-emerald-500/15 text-emerald-300 ring-emerald-300/10",
  completed: "border-emerald-300/20 bg-emerald-500/15 text-emerald-300 ring-emerald-300/10",
  paid: "border-emerald-300/20 bg-emerald-500/15 text-emerald-300 ring-emerald-300/10",
  pending: "border-amber-300/20 bg-amber-500/15 text-amber-300 ring-amber-300/10",
  inactive: "border-slate-300/15 bg-slate-500/15 text-slate-300 ring-slate-300/10",
  rejected: "border-red-300/20 bg-red-500/15 text-red-300 ring-red-300/10",
  cancelled: "border-red-300/20 bg-red-500/15 text-red-300 ring-red-300/10",
  failed: "border-red-300/20 bg-red-500/15 text-red-300 ring-red-300/10",
  refunded: "border-indigo-300/20 bg-indigo-500/15 text-indigo-300 ring-indigo-300/10",
};

const VetStatusBadge = ({ status = "Unknown" }) => {
  const normalized = String(status).toLowerCase();
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold capitalize shadow-sm ring-1 ${statusStyles[normalized] || "border-slate-300/15 bg-slate-500/15 text-slate-300 ring-slate-300/10"}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
};

export default VetStatusBadge;
