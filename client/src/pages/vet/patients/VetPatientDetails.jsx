import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import VetErrorState from "../../../components/vet/VetErrorState";
import VetLoader from "../../../components/vet/VetLoader";
import VetPageHeader from "../../../components/vet/VetPageHeader";
import VetStatusBadge from "../../../components/vet/VetStatusBadge";
import { getVetPatient } from "../../../services/vetApi";
import { formatDate } from "../../../utils/dateUtils";
import { getId, imageUrl, ownerName, petName } from "../../../utils/appointmentUtils";

const Info = ({ label, value }) => (
  <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-sm font-semibold text-white">{value || "Not set"}</p>
  </div>
);

const ConsultationList = ({ title, items }) => (
  <section className="rounded-2xl border border-white/10 bg-slate-900 p-5">
    <h2 className="text-lg font-bold text-white">{title}</h2>
    {items.length ? <div className="mt-4 space-y-3">{items.map((item) => <Link key={getId(item)} to={`/vet/appointments/${getId(item)}`} className="block rounded-xl border border-white/10 bg-slate-950 p-4 hover:border-cyan-300/30"><div className="flex flex-wrap justify-between gap-3"><p className="font-semibold text-white">{item.reason || "Consultation"}</p><VetStatusBadge status={item.status} /></div><p className="mt-2 text-sm text-slate-400">{formatDate(item.appointmentDate)} {item.appointmentTime || ""}</p><p className="mt-2 text-sm text-slate-500">{item.diagnosis || item.prescription || "Medical notes not added yet"}</p></Link>)}</div> : <p className="mt-4 text-sm text-slate-500">No records found.</p>}
  </section>
);

const VetPatientDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getVetPatient(id);
      setData(response.data);
    } catch (err) {
      const message = err.response?.data?.message || "Could not load patient";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <VetLoader text="Loading patient..." />;
  if (error) return <VetErrorState message={error} onRetry={load} />;
  const patient = data?.patient;

  return (
    <main>
      <VetPageHeader title={petName(patient)} description="Patient profile, owner contact, and consultation history." action={<Link to="/vet/patients" className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5">Back to patients</Link>} />
      <section className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
          <div className="aspect-square bg-slate-950">{imageUrl(patient) && <img src={imageUrl(patient)} alt={petName(patient)} className="h-full w-full object-cover" />}</div>
          <div className="p-5"><h2 className="text-xl font-bold text-white">{petName(patient)}</h2><p className="mt-1 text-sm text-cyan-200">{patient?.species} - {patient?.breed}</p></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Info label="Owner" value={ownerName(patient?.ownerId)} />
          <Info label="Owner email" value={patient?.ownerId?.email} />
          <Info label="Owner phone" value={patient?.ownerId?.phone} />
          <Info label="Gender" value={patient?.gender} />
          <Info label="Age" value={patient?.age ? `${patient.age} years` : ""} />
          <Info label="Weight" value={patient?.weight ? `${patient.weight} kg` : ""} />
          <Info label="Colour" value={patient?.color} />
          <Info label="Date of birth" value={formatDate(patient?.dateOfBirth)} />
          <Info label="Vaccination status" value={patient?.vaccinationStatus} />
          <div className="md:col-span-2 xl:col-span-3"><Info label="Medical history" value={patient?.medicalHistory} /></div>
        </div>
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <ConsultationList title="Past Consultations" items={data?.consultations || []} />
        <ConsultationList title="Upcoming Appointments" items={data?.upcomingAppointments || []} />
      </section>
    </main>
  );
};

export default VetPatientDetails;
