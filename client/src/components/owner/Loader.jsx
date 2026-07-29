const Loader = ({ label = "Loading" }) => (
  <div className="flex min-h-52 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 p-8">
    <div className="flex items-center gap-3 text-sm font-semibold text-slate-300">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
      {label}
    </div>
  </div>
);

export default Loader;
