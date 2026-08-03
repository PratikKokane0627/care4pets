import { RefreshCw } from "lucide-react";

const GroomerErrorState = ({ title = "Something went wrong", message, onRetry }) => (
  <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
    <h2 className="text-lg font-bold text-white">{title}</h2>
    <p className="mt-2 text-sm text-red-300">{message || "Could not load data"}</p>
    {onRetry && (
      <button type="button" onClick={onRetry} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white">
        <RefreshCw size={16} /> Retry
      </button>
    )}
  </section>
);

export default GroomerErrorState;
