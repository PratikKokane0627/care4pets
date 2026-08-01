import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, FileCheck, X } from "lucide-react";
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
  const [completeForm, setCompleteForm] = useState({ diagnosis: "", prescription: "", vetNotes: "" });

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
      setCompleteForm({ diagnosis: "", prescription: "", vetNotes: "" });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update appointment");
    } finally {
      setBusy(false);
    }
  };

  const actionButtons = (appointment) => {
    const status = String(appointment.status).toLowerCase();
    return (
      <>
        {status === "pending" && <button type="button" onClick={() => setModal({ type: "accept", appointment })} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 px-4 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10"><Check size={16} /> Accept</button>}
        {status === "pending" && <button type="button" onClick={() => setModal({ type: "reject", appointment })} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/30 px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/10"><X size={16} /> Reject</button>}
        {status === "accepted" && <button type="button" onClick={() => setModal({ type: "complete", appointment })} className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 px-4 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/10"><FileCheck size={16} /> Complete</button>}
      </>
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
      <VetConfirmModal open={modal?.type === "complete"} title="Complete appointment" message="Add diagnosis and prescription before completing." confirmText="Complete" loading={busy} onConfirm={runAction} onClose={() => setModal(null)}>
        <PrescriptionForm form={completeForm} setForm={setCompleteForm} />
      </VetConfirmModal>
    </main>
  );
};

export default VetAppointments;
