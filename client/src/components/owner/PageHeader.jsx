const PageHeader = ({
  eyebrow = "Owner Portal",
  title,
  description,
  action,
  actions = action,
}) => (
  <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow && (
        <p className="mb-2 text-sm font-bold text-cyan-400">{eyebrow}</p>
      )}
      <h1 className="text-3xl font-bold text-white sm:text-4xl">{title}</h1>
      {description && (
        <p className="mt-3 max-w-3xl text-sm text-slate-400 sm:text-base">
          {description}
        </p>
      )}
    </div>
    {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
  </div>
);

export default PageHeader;
