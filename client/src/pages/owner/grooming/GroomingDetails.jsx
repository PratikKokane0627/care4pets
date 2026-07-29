import { useState } from "react";
import { useParams } from "react-router-dom";

import EmptyState from "../../../components/owner/EmptyState";
import Loader from "../../../components/owner/Loader";
import PageHeader from "../../../components/owner/PageHeader";
import StatusBadge from "../../../components/owner/StatusBadge";
import useFetch from "../../../hooks/useFetch";
import api from "../../../services/api";
import { ErrorState, InfoBlock, Panel, formatDate, money, petName } from "../ownerShared";

const GroomingDetails = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);

  const { loading, error } = useFetch(async () => {
    const response = await api.get(`/grooming-bookings/${id}`);
    setBooking(response.data.booking || response.data);
  }, id);

  if (loading) return <Loader label="Loading grooming booking" />;

  return (
    <main>
      <PageHeader title="Grooming Details" description="Review service, schedule, groomer, and status." />
      <ErrorState message={error} />
      {!booking ? (
        <EmptyState title="Grooming booking not found" />
      ) : (
        <Panel>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">{booking.serviceId?.serviceName || "Grooming service"}</h2>
            <StatusBadge status={booking.status} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <InfoBlock label="Pet" value={petName(booking.petId)} />
            <InfoBlock label="Date" value={formatDate(booking.bookingDate)} />
            <InfoBlock label="Time" value={booking.bookingTime} />
            <InfoBlock label="Price" value={money(booking.price)} />
            <InfoBlock label="Groomer" value={booking.groomerId?.name} />
            <InfoBlock label="Notes" value={booking.specialInstructions} />
          </div>
        </Panel>
      )}
    </main>
  );
};

export default GroomingDetails;

