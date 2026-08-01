const VetFilterPanel = ({ children }) => (
  <section className="mb-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
    <div className="grid gap-3 md:grid-cols-4">{children}</div>
  </section>
);

export default VetFilterPanel;
