import { Search } from "lucide-react";

const VetSearchBar = ({ value, onChange, placeholder = "Search" }) => (
  <div className="relative">
    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
    <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-white/10 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/25 focus:border-cyan-400" />
  </div>
);

export default VetSearchBar;
