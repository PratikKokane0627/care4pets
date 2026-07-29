import { PawPrint } from "lucide-react";

const EmptyState = ({
  title = "Nothing here yet",
  message,
  description,
  action,
}) => {
  const text =
    message ||
    description ||
    "New information will appear here when it is available.";

  return (
  <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950/50 p-8 text-center transition duration-300 hover:border-cyan-300/30 hover:bg-slate-950">
    <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300">
      <PawPrint size={26} />
    </span>
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    <p className="mt-2 max-w-md text-sm text-slate-500">{text}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
  );
};

export default EmptyState;
