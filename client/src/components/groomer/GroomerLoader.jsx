const GroomerLoader = ({ text = "Loading..." }) => (
  <div className="flex min-h-[320px] items-center justify-center">
    <div className="text-center">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-400" />
      <p className="mt-4 text-sm font-semibold text-slate-400">{text}</p>
    </div>
  </div>
);

export default GroomerLoader;
