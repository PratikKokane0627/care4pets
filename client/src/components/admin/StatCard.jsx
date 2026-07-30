const StatCard = ({
  title,
  value = 0,
  subtitle,
  icon: Icon,
  color = "cyan",
}) => {
  const colors = {
    cyan: {
      icon: "bg-cyan-500/15 text-cyan-400",
      border: "hover:border-cyan-500/40",
    },
    indigo: {
      icon: "bg-indigo-500/15 text-indigo-400",
      border: "hover:border-indigo-500/40",
    },
    emerald: {
      icon: "bg-emerald-500/15 text-emerald-400",
      border: "hover:border-emerald-500/40",
    },
    amber: {
      icon: "bg-amber-500/15 text-amber-400",
      border: "hover:border-amber-500/40",
    },
    rose: {
      icon: "bg-rose-500/15 text-rose-400",
      border: "hover:border-rose-500/40",
    },
    violet: {
      icon: "bg-violet-500/15 text-violet-400",
      border: "hover:border-violet-500/40",
    },
  };

  const selectedColor = colors[color] || colors.cyan;

  return (
    <article
      className={`rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-1 ${selectedColor.border}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">
            {title}
          </p>

          <h2 className="mt-3 text-3xl font-bold text-white">
            {Number(value || 0).toLocaleString("en-IN")}
          </h2>

          {subtitle && (
            <p className="mt-2 text-xs text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${selectedColor.icon}`}
          >
            <Icon size={23} />
          </div>
        )}
      </div>
    </article>
  );
};

export default StatCard;