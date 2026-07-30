import { Link, useParams } from "react-router-dom";
import { useState } from "react";

import EmptyState from "../../../components/owner/EmptyState";
import Loader from "../../../components/owner/Loader";
import PageHeader from "../../../components/owner/PageHeader";
import useFetch from "../../../hooks/useFetch";
import api from "../../../services/api";
import { Button, ErrorState, InfoBlock, Panel, itemImage, money, vetName } from "../ownerShared";

const VetDetails = () => {
  const { id } = useParams();
  const [vet, setVet] = useState(null);
  const [availability, setAvailability] = useState([]);

  const { loading, error } = useFetch(async () => {
    const [vetRes, availabilityRes] = await Promise.all([
      api.get(`/vets/${id}`),
      api.get(`/vets/${id}/availability`).catch(() => ({ data: { availability: [] } })),
    ]);
    const nextVet = vetRes.data.vet || vetRes.data.veterinarian || vetRes.data;
    setVet(nextVet);
    setAvailability(availabilityRes.data.availability || nextVet.availability || []);
  }, id);

  if (loading) return <Loader label="Loading veterinarian" />;

  return (
    <main>
      <PageHeader
        title={vetName(vet)}
        description={vet?.specialization || "Veterinarian profile"}
        actions={
          <Button as={Link} to={`/owner/appointments/book?vetId=${id}`}>
            Book Appointment
          </Button>
        }
      />
      <ErrorState message={error} />
      {!vet ? (
        <EmptyState title="Veterinarian not found" />
      ) : (
        <div className="space-y-6">
          <Panel className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <img
              src={itemImage(vet) || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=80"}
              alt={vetName(vet)}
              className="aspect-square w-full rounded-2xl object-cover"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoBlock label="Clinic" value={vet.clinicName} />
              <InfoBlock label="Qualification" value={vet.qualification} />
              <InfoBlock label="Experience" value={`${vet.experience || 0} years`} />
              <InfoBlock label="Fee" value={money(vet.consultationFee)} />
              <InfoBlock label="Phone" value={vet.userId?.phone || vet.phone} />
              <InfoBlock label="Email" value={vet.userId?.email || vet.email} />
            </div>
          </Panel>

          <Panel>
            <h2 className="mb-4 text-xl font-bold text-white">Availability</h2>
            {availability.length === 0 ? (
              <EmptyState title="No availability added" description="Availability will appear here when the veterinarian updates it." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {availability.map((slot) => (
                  <div
                    key={`${slot.day}-${slot.startTime}-${slot.endTime}`}
                    className="rounded-xl border border-white/10 bg-slate-950 p-4"
                  >
                    <p className="font-semibold text-white">{slot.day}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {slot.isAvailable ? `${slot.startTime} - ${slot.endTime}` : "Not available"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}
    </main>
  );
};

export default VetDetails;

