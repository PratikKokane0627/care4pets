const styles = {
  active: "border-emerald-300/20 bg-emerald-500/15 text-emerald-300",
  accepted: "border-emerald-300/20 bg-emerald-500/15 text-emerald-300",
  completed: "border-emerald-300/20 bg-emerald-500/15 text-emerald-300",
  paid: "border-emerald-300/20 bg-emerald-500/15 text-emerald-300",
  pending: "border-amber-300/20 bg-amber-500/15 text-amber-300",
  inactive: "border-slate-300/15 bg-slate-500/15 text-slate-300",
  rejected: "border-red-300/20 bg-red-500/15 text-red-300",
  cancelled: "border-red-300/20 bg-red-500/15 text-red-300",
  failed: "border-red-300/20 bg-red-500/15 text-red-300",
  refunded: "border-indigo-300/20 bg-indigo-500/15 text-indigo-300",
};

const GroomerStatusBadge = ({ status = "Unknown" }) => {
  const normalized = String(status).toLowerCase();
  return (
    <span className={`inline-flex h-7 shrink-0 items-center rounded-full border px-3 text-xs font-bold capitalize leading-none whitespace-nowrap ${styles[normalized] || "border-slate-300/15 bg-slate-500/15 text-slate-300"}`}>
      {status}
    </span>
  );
};

export default GroomerStatusBadge;
