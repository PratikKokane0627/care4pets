import { groomingStatuses } from "../../utils/groomingUtils";
import GroomerFilterPanel from "./GroomerFilterPanel";
import GroomerSearchBar from "./GroomerSearchBar";

const GroomingBookingFilters = ({ filters, onChange }) => (
  <GroomerFilterPanel>
    <GroomerSearchBar value={filters.search} onChange={(value) => onChange("search", value)} placeholder="Search booking, owner, pet or service" />
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">Status</span>
      <select value={filters.status} onChange={(event) => onChange("status", event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400">
        <option value="">All statuses</option>
        {groomingStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
    </label>
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">Date</span>
      <input type="date" value={filters.bookingDate} onChange={(event) => onChange("bookingDate", event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400" />
    </label>
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">Sort</span>
      <select value={filters.sort} onChange={(event) => onChange("sort", event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400">
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
      </select>
    </label>
  </GroomerFilterPanel>
);

export default GroomingBookingFilters;
