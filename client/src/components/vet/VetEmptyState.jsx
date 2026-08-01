import { Stethoscope } from "lucide-react";

const VetEmptyState = ({ title = "Nothing here yet", description = "Records will appear here when available.", action }) => (
  <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950/50 p-8 text-center">
    <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300"><Stethoscope size={26} /></span>
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default VetEmptyState;
