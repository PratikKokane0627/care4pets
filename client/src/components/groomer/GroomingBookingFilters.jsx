import { CalendarDays, Check, ChevronDown, Search, SlidersHorizontal, Tags } from "lucide-react";
import DateInput from "../common/DateInput";
import { groomingStatuses } from "../../utils/groomingUtils";

const fieldShell = "group rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 transition hover:border-cyan-400/50 hover:bg-slate-950 focus-within:border-cyan-400 focus-within:shadow-[0_0_0_1px_rgba(34,211,238,0.2)]";
const labelClass = "mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 group-hover:text-cyan-300";
const controlClass = "h-7 w-full border-0 bg-transparent p-0 text-base font-semibold text-white outline-none placeholder:text-slate-600";

const SelectField = ({ icon: Icon, label, value, options, onChange }) => {
  const selected = options.find((option) => option.value === value) || options[0];

  return (
    <div className={`${fieldShell} relative`}>
      <span className={labelClass}><Icon size={15} /> {label}</span>
      <div className="group/select relative">
        <button
          type="button"
          className={`${controlClass} flex items-center justify-between gap-3 text-left`}
        >
          <span>{selected.label}</span>
          <ChevronDown size={18} className="shrink-0 text-slate-300 transition group-hover/select:text-cyan-300" />
        </button>
        <div className="invisible absolute left-0 right-0 top-full z-30 mt-3 overflow-hidden rounded-xl border border-cyan-400/30 bg-slate-950 opacity-0 shadow-2xl shadow-black/40 transition group-focus-within/select:visible group-focus-within/select:opacity-100 group-hover/select:visible group-hover/select:opacity-100">
          {options.map((option) => {
            const active = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold transition ${active ? "bg-cyan-400 text-slate-950" : "text-slate-200 hover:bg-white/10 hover:text-white"}`}
              >
                <span>{option.label}</span>
                {active && <Check size={16} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

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
      <SelectField
        icon={Tags}
        label="Status"
        value={filters.status}
        onChange={(value) => onChange("status", value)}
        options={[
          { value: "", label: "All statuses" },
          ...groomingStatuses.map((status) => ({ value: status, label: status })),
        ]}
      />
      <label className={fieldShell}>
        <span className={labelClass}><CalendarDays size={15} /> Date</span>
        <DateInput value={filters.bookingDate} onChange={(event) => onChange("bookingDate", event.target.value)} className={controlClass} />
      </label>
      <SelectField
        icon={SlidersHorizontal}
        label="Sort"
        value={filters.sort}
        onChange={(value) => onChange("sort", value)}
        options={[
          { value: "newest", label: "Newest" },
          { value: "oldest", label: "Oldest" },
        ]}
      />
    </div>
  </section>
);

export default GroomingBookingFilters;
