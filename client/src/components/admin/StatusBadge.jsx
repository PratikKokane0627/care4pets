const statusStyles = {
  active: "bg-emerald-500/15 text-emerald-400",
  approved: "bg-emerald-500/15 text-emerald-400",
  completed: "bg-emerald-500/15 text-emerald-400",
  delivered: "bg-emerald-500/15 text-emerald-400",

  pending: "bg-amber-500/15 text-amber-400",
  upcoming: "bg-cyan-500/15 text-cyan-400",
  scheduled: "bg-cyan-500/15 text-cyan-400",
  confirmed: "bg-cyan-500/15 text-cyan-400",

  inactive: "bg-slate-500/15 text-slate-400",
  blocked: "bg-red-500/15 text-red-400",
  rejected: "bg-red-500/15 text-red-400",
  cancelled: "bg-red-500/15 text-red-400",
  overdue: "bg-red-500/15 text-red-400",

  processing: "bg-indigo-500/15 text-indigo-400",
  shipped: "bg-violet-500/15 text-violet-400",
  product: "bg-cyan-500/15 text-cyan-300",
  vet: "bg-indigo-500/15 text-indigo-300",
};

const StatusBadge = ({ status = "Unknown" }) => {
  const normalizedStatus = String(status).toLowerCase();

  const style =
    statusStyles[normalizedStatus] ||
    "bg-slate-500/15 text-slate-300";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${style}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
