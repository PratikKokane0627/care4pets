import { Link } from "react-router-dom";

import ResourceListPage from "../../../components/owner/ResourceListPage";
import { Button, money, vetName } from "../ownerShared";

const Veterinarians = () => (
  <ResourceListPage
    title="Veterinarians"
    description="Search vets, review clinic details, and book appointments."
    endpoint="/vets"
    dataKeys={["vets", "veterinarians"]}
    searchPlaceholder="Search by vet, specialization, or clinic"
    getTitle={vetName}
    getSubtitle={(vet) => vet.specialization || vet.qualification || "Veterinarian"}
    getMeta={(vet) => [
      vet.clinicName || "Clinic not set",
      `${vet.experience || 0} years experience`,
      money(vet.consultationFee),
    ]}
    getStatus={(vet) => vet.status || "Available"}
    imageFallback="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=80"
    emptyTitle="No veterinarians found"
    emptyMessage="Approved veterinarians will appear here."
    action={
      <Button as={Link} to="/owner/appointments/book">
        Book Appointment
      </Button>
    }
  />
);

export default Veterinarians;

