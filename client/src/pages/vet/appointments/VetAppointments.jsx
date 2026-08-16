import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import AppointmentCard from "../../../components/vet/AppointmentCard";
import AppointmentFilters from "../../../components/vet/AppointmentFilters";
import PrescriptionForm from "../../../components/vet/PrescriptionForm";
import VetConfirmModal from "../../../components/vet/VetConfirmModal";
import VetDataTable from "../../../components/vet/VetDataTable";
import VetErrorState from "../../../components/vet/VetErrorState";
import VetLoader from "../../../components/vet/VetLoader";
import VetPageHeader from "../../../components/vet/VetPageHeader";
import VetPagination from "../../../components/vet/VetPagination";
import VetStatusBadge from "../../../components/vet/VetStatusBadge";
import { acceptAppointment, completeAppointment, getVetAppointments, rejectAppointment } from "../../../services/vetApi";
import { formatDate } from "../../../utils/dateUtils";
import { getId, normalizePagination, ownerName, petName } from "../../../utils/appointmentUtils";

const initialFilters = { page: 1, limit: 10, sort: "newest" };

const VetAppointments = () => {
  const params = new URLSearchParams(window.location.search);
  const [filters, setFilters] = useState({ ...initialFilters, status: params.get("status") || "" });
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [completeForm, setCompleteForm] = useState({ symptoms: "", diagnosis: "", prescription: "", vetNotes: "" });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getVetAppointments(filters);
      setAppointments(response.data.appointments || []);
      setPagination(normalizePagination(response.data));
    } catch (err) {
      const message = err.response?.data?.message || "Could not load appointments";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const runAction = async () => {
    if (!modal) return;
    setBusy(true);
    try {
      if (modal.type === "accept") await acceptAppointment(getId(modal.appointment));
      if (modal.type === "reject") {
        if (!reason.trim()) return toast.error("Rejection reason is required");
        await rejectAppointment(getId(modal.appointment), reason.trim());
      }
      if (modal.type === "complete") {
        if (!completeForm.diagnosis.trim()) return toast.error("Diagnosis is required");
        if (!completeForm.prescription.trim()) return toast.error("Prescription is required");
        await completeAppointment(getId(modal.appointment), completeForm);
      }
      toast.success("Appointment updated");
      setModal(null);
      setReason("");
      setCompleteForm({ symptoms: "", diagnosis: "", prescription: "", vetNotes: "" });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update appointment");
    } finally {
      setBusy(false);
    }
  };

  const actionButtons = (appointment) => {
    const status = String(appointment.status).toLowerCase();
    const primaryActionClass = "whitespace-nowrap rounded-xl border border-emerald-400/30 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:-translate-y-0.5 hover:border-emerald-300/60 hover:bg-emerald-400/10 hover:text-emerald-200";
    const completeActionClass = "whitespace-nowrap rounded-xl border border-cyan-400/30 px-4 py-2.5 text-sm font-semibold text-cyan-300 transition hover:-translate-y-0.5 hover:border-cyan-300/60 hover:bg-cyan-400/10 hover:text-cyan-200";
    const viewActionClass = "whitespace-nowrap rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-white/5 hover:text-white";
    const dangerActionClass = "whitespace-nowrap rounded-xl border border-red-400/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:-translate-y-0.5 hover:border-red-300/60 hover:bg-red-500/10 hover:text-red-200";

    return (
      <div className="flex min-w-max flex-nowrap items-center gap-2">
        <Link
          to={`/vet/appointments/${getId(appointment)}`}
          className={viewActionClass}
        >
          View
        </Link>
        {status === "pending" && (
          <button
            type="button"
            title="Accept appointment"
            onClick={() => setModal({ type: "accept", appointment })}
            className={primaryActionClass}
          >
            Accept
          </button>
        )}
        {status === "pending" && (
          <button
            type="button"
            title="Reject appointment"
            onClick={() => setModal({ type: "reject", appointment })}
            className={dangerActionClass}
          >
            Reject
          </button>
        )}
        {status === "accepted" && (
          <button
            type="button"
            title="Complete appointment"
            onClick={() => setModal({ type: "complete", appointment })}
            className={completeActionClass}
          >
            Complete
          </button>
        )}
      </div>
    );
  };

  const columns = useMemo(() => [
    { header: "Pet", render: (item) => <><p className="font-semibold text-white">{petName(item.petId)}</p><p className="mt-1 text-xs text-slate-500">{ownerName(item.ownerId)}</p></> },
    { header: "Reason", render: (item) => item.reason || "Visit" },
    { header: "Date", render: (item) => `${formatDate(item.appointmentDate)} ${item.appointmentTime || ""}` },
    { header: "Payment", render: (item) => <VetStatusBadge status={item.paymentStatus || "pending"} /> },
    { header: "Status", render: (item) => <VetStatusBadge status={item.status || "pending"} /> },
    { header: "Actions", render: actionButtons },
  ], []);

  return (
    <main>
      <VetPageHeader title="Appointments" description="Manage veterinary appointments assigned to you." />
      <AppointmentFilters filters={filters} setFilters={setFilters} />
      {loading ? <VetLoader text="Loading appointments..." /> : error ? <VetErrorState message={error} onRetry={load} /> : (
        <>
          <div className="hidden lg:block"><VetDataTable columns={columns} data={appointments} emptyTitle="No appointments found" emptyDescription="Appointments assigned to you will appear here." /></div>
          <div className="grid gap-4 lg:hidden">{appointments.length ? appointments.map((appointment) => <AppointmentCard key={getId(appointment)} appointment={appointment} actions={actionButtons(appointment)} />) : <VetDataTable data={[]} emptyTitle="No appointments found" emptyDescription="Appointments assigned to you will appear here." />}</div>
          <VetPagination pagination={pagination} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} />
        </>
      )}
      <VetConfirmModal open={modal?.type === "accept"} title="Accept appointment" message="Accept this pending appointment request?" confirmText="Accept" loading={busy} onConfirm={runAction} onClose={() => setModal(null)} />
      <VetConfirmModal open={modal?.type === "reject"} title="Reject appointment" message="Please provide a rejection reason." confirmText="Reject" danger loading={busy} onConfirm={runAction} onClose={() => setModal(null)}>
        <textarea value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} className="min-h-28 w-full resize-y rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400" />
      </VetConfirmModal>
      <VetConfirmModal open={modal?.type === "complete"} title="Complete appointment" message="Add symptoms, diagnosis and prescription before completing." confirmText="Complete" loading={busy} size="lg" onConfirm={runAction} onClose={() => setModal(null)}>
        <PrescriptionForm form={completeForm} setForm={setCompleteForm} />
      </VetConfirmModal>
    </main>
  );
};

export default VetAppointments;
