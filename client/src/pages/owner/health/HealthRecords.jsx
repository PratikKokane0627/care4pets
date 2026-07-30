import { Link } from "react-router-dom";

import ResourceListPage from "../../../components/owner/ResourceListPage";
import { Button, formatDate, getId, petName, vetName } from "../ownerShared";

const HealthRecords = () => (
  <ResourceListPage
    title="Health Records"
    description="Medical history, diagnosis, prescriptions, and reports from completed visits."
    endpoint="/appointments?status=completed"
    dataKeys={["appointments"]}
    searchPlaceholder="Search health records"
    getTitle={(record) => petName(record.petId)}
    getSubtitle={(record) => record.diagnosis || "Completed appointment"}
    getMeta={(record) => [
      `Vet: ${vetName(record.vetId)}`,
      `Date: ${formatDate(record.appointmentDate)}`,
      `Prescription: ${record.prescription || "Not added"}`,
    ]}
    getStatus={() => "completed"}
    detailPath={(record) => `/owner/appointments/${getId(record)}`}
    emptyTitle="No health records yet"
    emptyMessage="Completed veterinary appointments will create health records."
    emptyAction={
      <Button as={Link} to="/owner/appointments/book">
        Book Appointment
      </Button>
    }
  />
);

export default HealthRecords;

