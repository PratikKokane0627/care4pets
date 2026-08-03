import { Scissors } from "lucide-react";

const GroomerEmptyState = ({ title = "Nothing here yet", description }) => (
  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/60 p-8 text-center">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
      <Scissors size={24} />
    </div>
    <h2 className="mt-4 text-lg font-bold text-white">{title}</h2>
    {description && <p className="mt-2 text-sm text-slate-400">{description}</p>}
  </div>
);

export default GroomerEmptyState;
