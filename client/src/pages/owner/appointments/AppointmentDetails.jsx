import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import EmptyState from "../../../components/owner/EmptyState";
import Loader from "../../../components/owner/Loader";
import PageHeader from "../../../components/owner/PageHeader";
import StatusBadge from "../../../components/owner/StatusBadge";
import useFetch from "../../../hooks/useFetch";
import api from "../../../services/api";
import { Button, ErrorState, InfoBlock, Panel, formatDate, getId, petName, vetName } from "../ownerShared";

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
          {String(appointment.status).toLowerCase() === "completed" && getId(appointment.vetId) && (
            <Button
              as={Link}
              to={`/owner/veterinarians/${getId(appointment.vetId)}?appointmentId=${getId(appointment)}#vet-reviews`}
              className="mt-5"
            >
              Review Vet
            </Button>
          )}
        </Panel>
      )}
    </main>
  );
};

export default AppointmentDetails;

