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

  const { loading, error } = useFetch(async () => {
    const response = await api.get(`/vets/${id}`);
    setVet(response.data.vet || response.data.veterinarian || response.data);
  }, id);

  if (loading) return <Loader label="Loading veterinarian" />;

  return (
    <main>
      <PageHeader
        title={vetName(vet)}
        description={vet?.specialization || "Veterinarian profile"}
        actions={
          <Button as={Link} to="/owner/appointments/book">
            Book Appointment
          </Button>
        }
      />
      <ErrorState message={error} />
      {!vet ? (
        <EmptyState title="Veterinarian not found" />
      ) : (
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
      )}
    </main>
  );
};

export default VetDetails;

