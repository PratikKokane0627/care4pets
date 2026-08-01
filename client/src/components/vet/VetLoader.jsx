const VetLoader = ({ text = "Loading veterinarian workspace..." }) => (
  <div className="flex min-h-[55vh] items-center justify-center">
    <div className="text-center">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
      <p className="mt-4 text-sm text-slate-400">{text}</p>
    </div>
  </div>
);

export default VetLoader;
