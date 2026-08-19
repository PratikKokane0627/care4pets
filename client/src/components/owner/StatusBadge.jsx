const statusClasses = {
  completed: "bg-emerald-400/15 text-emerald-300",
  confirmed: "bg-emerald-400/15 text-emerald-300",
  active: "bg-emerald-400/15 text-emerald-300",
  read: "bg-slate-700 text-slate-300",
  unread: "bg-cyan-400/15 text-cyan-300",
  pending: "bg-amber-400/15 text-amber-300",
  upcoming: "bg-cyan-400/15 text-cyan-300",
  cancelled: "bg-red-400/15 text-red-300",
  canceled: "bg-red-400/15 text-red-300",
  overdue: "bg-red-400/15 text-red-300",
};

const StatusBadge = ({ status, value, className = "" }) => {
  const label = status || value || "Pending";
  const key = String(label).toLowerCase();

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold capitalize ${
        statusClasses[key] || "bg-slate-700 text-slate-300"
      } ${className}`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
