import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import PatientCard from "../../../components/vet/PatientCard";
import VetErrorState from "../../../components/vet/VetErrorState";
import VetFilterPanel from "../../../components/vet/VetFilterPanel";
import VetLoader from "../../../components/vet/VetLoader";
import VetPageHeader from "../../../components/vet/VetPageHeader";
import VetPagination from "../../../components/vet/VetPagination";
import VetSearchBar from "../../../components/vet/VetSearchBar";
import { getVetPatients } from "../../../services/vetApi";
import { normalizePagination } from "../../../utils/appointmentUtils";

const speciesOptions = ["Dog", "Cat", "Bird", "Rabbit", "Fish", "Other"];

const VetPatients = () => {
  const [filters, setFilters] = useState({ page: 1, limit: 10, search: "", species: "" });
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getVetPatients(filters);
      setPatients(response.data.patients || []);
      setPagination(normalizePagination(response.data));
    } catch (err) {
      const message = err.response?.data?.message || "Could not load patients";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  return (
    <main>
      <VetPageHeader title="Patients" description="Unique pets that have appointments assigned to you." />
      <VetFilterPanel>
        <VetSearchBar value={filters.search} onChange={(search) => setFilters((current) => ({ ...current, search, page: 1 }))} placeholder="Search patients" />
        <select value={filters.species} onChange={(event) => setFilters((current) => ({ ...current, species: event.target.value, page: 1 }))} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400">
          <option value="">All species</option>
          {speciesOptions.map((species) => <option key={species} value={species}>{species}</option>)}
        </select>
      </VetFilterPanel>
      {loading ? <VetLoader text="Loading patients..." /> : error ? <VetErrorState message={error} onRetry={load} /> : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {patients.length ? patients.map((row) => <PatientCard key={row.pet?._id || row._id} row={row} />) : <div className="md:col-span-2 xl:col-span-3"><VetErrorState title="No patients found" message="Patients appear after pet owners book appointments with you." /></div>}
          </div>
          <VetPagination pagination={pagination} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} />
        </>
      )}
    </main>
  );
};

export default VetPatients;
