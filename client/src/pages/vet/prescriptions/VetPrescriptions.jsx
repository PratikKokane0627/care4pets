import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarDays, FileText } from "lucide-react";

import DateInput from "../../../components/common/DateInput";
import VetDataTable from "../../../components/vet/VetDataTable";
import VetErrorState from "../../../components/vet/VetErrorState";
import VetLoader from "../../../components/vet/VetLoader";
import VetPageHeader from "../../../components/vet/VetPageHeader";
import VetPagination from "../../../components/vet/VetPagination";
import VetSearchBar from "../../../components/vet/VetSearchBar";
import { getVetPrescriptions } from "../../../services/vetApi";
import { formatDate } from "../../../utils/dateUtils";
import { getId, normalizePagination, ownerName, petName } from "../../../utils/appointmentUtils";

const VetPrescriptions = () => {
  const [filters, setFilters] = useState({ page: 1, limit: 10, search: "", date: "" });
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getVetPrescriptions({ page: filters.page, limit: filters.limit, date: filters.date });
      setItems(response.data.prescriptions || []);
      setPagination(normalizePagination(response.data));
    } catch (err) {
      const message = err.response?.data?.message || "Could not load prescriptions";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filters.date, filters.limit, filters.page]);

  useEffect(() => { load(); }, [load]);

  const visibleItems = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    if (!search) return items;
    return items.filter((item) => [petName(item.petId), ownerName(item.ownerId), item.prescription, item.diagnosis].filter(Boolean).join(" ").toLowerCase().includes(search));
  }, [filters.search, items]);

  const columns = [
    { header: "Patient", render: (item) => <><p className="font-semibold text-white">{petName(item.petId)}</p><p className="text-xs text-slate-500">{ownerName(item.ownerId)}</p></> },
    { header: "Date", render: (item) => formatDate(item.completedAt || item.appointmentDate) },
    { header: "Diagnosis", render: (item) => item.diagnosis },
    { header: "Prescription", render: (item) => <p className="max-w-md whitespace-pre-wrap">{item.prescription}</p> },
    {
      header: "Actions",
      render: (item) => (
        <div className="flex min-w-max flex-nowrap items-center gap-2">
          <Link
            to={`/vet/appointments/${getId(item)}`}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-cyan-400/30 px-3.5 py-2 text-sm font-semibold text-cyan-300 transition hover:-translate-y-0.5 hover:border-cyan-300/60 hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            <FileText size={16} /> Appointment
          </Link>
        </div>
      ),
    },
  ];

  return (
    <main>
      <VetPageHeader title="Prescriptions" description="Completed consultations with prescription records." />
      <section className="mb-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr] xl:max-w-4xl">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Search</span>
            <VetSearchBar value={filters.search} onChange={(search) => setFilters((current) => ({ ...current, search }))} placeholder="Search prescriptions" />
          </label>
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300"><CalendarDays size={16} /> Date</span>
            <DateInput
              value={filters.date}
              onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value, page: 1 }))}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition hover:border-white/25 focus:border-cyan-400"
            />
          </label>
        </div>
      </section>
      {loading ? <VetLoader text="Loading prescriptions..." /> : error ? <VetErrorState message={error} onRetry={load} /> : <>
        <VetDataTable columns={columns} data={visibleItems} emptyTitle="No prescriptions found" emptyDescription="Completed consultations with prescriptions will appear here." />
        <VetPagination pagination={pagination} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} />
      </>}
    </main>
  );
};

export default VetPrescriptions;
