const VetSkeleton = ({ cards = 4 }) => (
  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: cards }).map((_, index) => (
      <div key={index} className="h-32 animate-pulse rounded-2xl border border-white/10 bg-slate-900">
        <div className="m-5 h-4 w-24 rounded bg-slate-800" />
        <div className="mx-5 mt-4 h-8 w-16 rounded bg-slate-800" />
        <div className="mx-5 mt-4 h-3 w-36 rounded bg-slate-800" />
      </div>
    ))}
  </div>
);

export default VetSkeleton;
