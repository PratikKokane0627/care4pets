import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import VetErrorState from "../../../components/vet/VetErrorState";
import VetLoader from "../../../components/vet/VetLoader";
import VetPageHeader from "../../../components/vet/VetPageHeader";
import VetStatusBadge from "../../../components/vet/VetStatusBadge";
import { getVetAppointment } from "../../../services/vetApi";
import { formatDate } from "../../../utils/dateUtils";
import { money, ownerName, petName } from "../../../utils/appointmentUtils";

const Info = ({ label, value }) => (
  <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <div className="mt-2 text-sm font-semibold text-white">{value || "Not set"}</div>
  </div>
);

const VetAppointmentDetails = () => {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getVetAppointment(id);
      setAppointment(response.data.appointment);
    } catch (err) {
      const message = err.response?.data?.message || "Could not load appointment";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <VetLoader text="Loading appointment details..." />;
  if (error) return <VetErrorState message={error} onRetry={load} />;
  if (!appointment) return <VetErrorState title="Appointment not found" message="This appointment could not be found." />;

  return (
    <main>
      <VetPageHeader title="Appointment Details" description="Owner, patient, visit, diagnosis and prescription information." action={<Link to="/vet/appointments" className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5">Back to appointments</Link>} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Info label="Appointment ID" value={appointment._id} />
        <Info label="Pet" value={petName(appointment.petId)} />
        <Info label="Owner" value={ownerName(appointment.ownerId)} />
        <Info label="Status" value={<VetStatusBadge status={appointment.status} />} />
        <Info label="Date" value={formatDate(appointment.appointmentDate)} />
        <Info label="Time" value={appointment.appointmentTime} />
        <Info label="Consultation Fee" value={money(appointment.consultationFee)} />
        <Info label="Payment" value={<VetStatusBadge status={appointment.paymentStatus} />} />
        <Info label="Reason" value={appointment.reason} />
        <Info label="Symptoms" value={appointment.symptoms} />
        <Info label="Diagnosis" value={appointment.diagnosis} />
        <Info label="Prescription" value={appointment.prescription} />
        <Info label="Vet Notes" value={appointment.vetNotes} />
        <Info label="Rejection Reason" value={appointment.rejectionReason} />
        <Info label="Created" value={formatDate(appointment.createdAt)} />
        <Info label="Completed" value={formatDate(appointment.completedAt)} />
      </section>
    </main>
  );
};

export default VetAppointmentDetails;
