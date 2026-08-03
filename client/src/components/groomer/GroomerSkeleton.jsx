const GroomerSkeleton = () => (
  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="h-32 animate-pulse rounded-2xl border border-white/10 bg-slate-900" />
    ))}
  </div>
);

export default GroomerSkeleton;
