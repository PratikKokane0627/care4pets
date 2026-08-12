import DateInput from "../common/DateInput";
import VetFilterPanel from "./VetFilterPanel";
import VetSearchBar from "./VetSearchBar";

const statuses = ["pending", "accepted", "rejected", "completed", "cancelled"];
const paymentStatuses = ["pending", "paid", "failed", "refunded"];

const fieldClass = "rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition hover:border-white/25 focus:border-cyan-400";

const AppointmentFilters = ({ filters, setFilters }) => {
  const update = (field, value) => setFilters((current) => ({ ...current, [field]: value, page: 1 }));

  return (
    <VetFilterPanel>
      <VetSearchBar value={filters.search || ""} onChange={(value) => update("search", value)} placeholder="Search appointments" />
      <select value={filters.status || ""} onChange={(event) => update("status", event.target.value)} className={fieldClass}>
        <option value="">All statuses</option>
        {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
      <select value={filters.paymentStatus || ""} onChange={(event) => update("paymentStatus", event.target.value)} className={fieldClass}>
        <option value="">All payments</option>
        {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
      <select value={filters.sort || "newest"} onChange={(event) => update("sort", event.target.value)} className={fieldClass}>
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </select>
      <DateInput value={filters.startDate || ""} onChange={(event) => update("startDate", event.target.value)} className={fieldClass} />
      <DateInput value={filters.endDate || ""} onChange={(event) => update("endDate", event.target.value)} className={fieldClass} />
      <button type="button" onClick={() => setFilters({ page: 1, limit: 10, sort: "newest" })} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5">Reset</button>
    </VetFilterPanel>
  );
};

export default AppointmentFilters;
