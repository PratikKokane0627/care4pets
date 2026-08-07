import { CalendarDays, Search, SlidersHorizontal, Tags } from "lucide-react";
import { groomingStatuses } from "../../utils/groomingUtils";

const fieldShell = "group rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 transition hover:border-cyan-400/50 hover:bg-slate-950 focus-within:border-cyan-400 focus-within:shadow-[0_0_0_1px_rgba(34,211,238,0.2)]";
const labelClass = "mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 group-hover:text-cyan-300";
const controlClass = "h-7 w-full border-0 bg-transparent p-0 text-base font-semibold text-white outline-none placeholder:text-slate-600";

const GroomingBookingFilters = ({ filters, onChange }) => (
  <section className="mb-6 rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.25fr_1fr_1fr_1fr]">
      <label className={fieldShell}>
        <span className={labelClass}><Search size={15} /> Search</span>
        <input
          value={filters.search}
          onChange={(event) => onChange("search", event.target.value)}
          placeholder="Booking, owner, pet or service"
          className={controlClass}
        />
      </label>
      <label className={fieldShell}>
        <span className={labelClass}><Tags size={15} /> Status</span>
        <select value={filters.status} onChange={(event) => onChange("status", event.target.value)} className={`${controlClass} cursor-pointer`}>
          <option value="">All statuses</option>
          {groomingStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </label>
      <label className={fieldShell}>
        <span className={labelClass}><CalendarDays size={15} /> Date</span>
        <input type="date" value={filters.bookingDate} onChange={(event) => onChange("bookingDate", event.target.value)} className={`${controlClass} cursor-pointer`} />
      </label>
      <label className={fieldShell}>
        <span className={labelClass}><SlidersHorizontal size={15} /> Sort</span>
        <select value={filters.sort} onChange={(event) => onChange("sort", event.target.value)} className={`${controlClass} cursor-pointer`}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </label>
    </div>
  </section>
);

export default GroomingBookingFilters;
