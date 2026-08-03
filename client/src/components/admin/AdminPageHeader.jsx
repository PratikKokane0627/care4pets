const AdminPageHeader = ({
  eyebrow = "Admin Panel",
  title,
  description,
  icon: Icon,
  action,
  actions = action,
}) => (
  <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow && <p className="mb-2 text-sm font-bold text-cyan-400">{eyebrow}</p>}
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/20">
            <Icon size={25} />
          </span>
        )}
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{title}</h1>
      </div>
      {description && <p className="mt-3 max-w-3xl text-sm text-slate-400">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
  </div>
);

export default AdminPageHeader;
