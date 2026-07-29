import { useState } from "react";
import { useParams } from "react-router-dom";

import EmptyState from "../../../components/owner/EmptyState";
import Loader from "../../../components/owner/Loader";
import PageHeader from "../../../components/owner/PageHeader";
import StatusBadge from "../../../components/owner/StatusBadge";
import useFetch from "../../../hooks/useFetch";
import api from "../../../services/api";
import { ErrorState, InfoBlock, Panel, formatDate, petName, vetName } from "../ownerShared";

const AppointmentDetails = () => {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);

  const { loading, error } = useFetch(async () => {
    const response = await api.get(`/appointments/${id}`);
    setAppointment(response.data.appointment || response.data);
  }, id);

  if (loading) return <Loader label="Loading appointment" />;

  return (
    <main>
      <PageHeader title="Appointment Details" description="Review appointment status, vet, and notes." />
      <ErrorState message={error} />
      {!appointment ? (
        <EmptyState title="Appointment not found" />
      ) : (
        <Panel>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">{petName(appointment.petId)}</h2>
            <StatusBadge status={appointment.status} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <InfoBlock label="Veterinarian" value={vetName(appointment.vetId)} />
            <InfoBlock label="Date" value={formatDate(appointment.appointmentDate)} />
            <InfoBlock label="Time" value={appointment.appointmentTime} />
            <InfoBlock label="Reason" value={appointment.reason} />
            <InfoBlock label="Diagnosis" value={appointment.diagnosis} />
            <InfoBlock label="Prescription" value={appointment.prescription} />
          </div>
        </Panel>
      )}
    </main>
  );
};

export default AppointmentDetails;

