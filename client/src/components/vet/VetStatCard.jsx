const colors = {
  cyan: "bg-cyan-500/15 text-cyan-400",
  indigo: "bg-indigo-500/15 text-indigo-400",
  emerald: "bg-emerald-500/15 text-emerald-400",
  amber: "bg-amber-500/15 text-amber-400",
  rose: "bg-rose-500/15 text-rose-400",
};

const VetStatCard = ({ title, value, subtitle, icon: Icon, color = "cyan" }) => (
  <article className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-lg transition hover:-translate-y-1 hover:border-cyan-400/40">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-slate-400">{title}</p>
        <h2 className="mt-2 text-3xl font-bold text-white">{value}</h2>
        {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {Icon && <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors[color] || colors.cyan}`}><Icon size={23} /></div>}
    </div>
  </article>
);

export default VetStatCard;
