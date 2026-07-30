export const SkeletonCards = ({ count = 3 }) => (
  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950"
      >
        <div className="h-44 animate-pulse bg-slate-800" />
        <div className="space-y-3 p-5">
          <div className="h-5 w-2/3 animate-pulse rounded bg-slate-800" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-800" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-slate-800" />
        </div>
      </div>
    ))}
  </div>
);

const Loader = ({ label = "Loading" }) => (
  <div className="flex min-h-52 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 p-8">
    <div className="flex items-center gap-3 text-sm font-semibold text-slate-300">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
      {label}
    </div>
  </div>
);

export default Loader;
