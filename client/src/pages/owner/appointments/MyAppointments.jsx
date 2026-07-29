import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

import ResourceListPage from "../../../components/owner/ResourceListPage";
import api from "../../../services/api";
import { Button, formatDate, getId, petName, vetName } from "../ownerShared";

const MyAppointments = () => {
  const cancel = async (appointment, refresh) => {
    try {
      await api.put(`/appointments/${getId(appointment)}/cancel`);
      toast.success("Appointment cancelled");
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel appointment");
    }
  };

  return (
    <ResourceListPage
      title="Appointments"
      description="Book, list, view, cancel, and track appointment status."
      endpoint="/appointments"
      dataKeys={["appointments"]}
      searchPlaceholder="Search appointments"
      getTitle={(appointment) => petName(appointment.petId)}
      getSubtitle={(appointment) => vetName(appointment.vetId)}
      getMeta={(appointment) => [
        `${formatDate(appointment.appointmentDate)} at ${appointment.appointmentTime || "Time not set"}`,
        appointment.reason || "Reason not set",
      ]}
      getStatus={(appointment) => appointment.status || "pending"}
      emptyTitle="No appointments yet"
      emptyMessage="Book your first veterinary appointment."
      action={
        <Button as={Link} to="/owner/appointments/book">
          Book Appointment
        </Button>
      }
      renderActions={(appointment, { refresh }) =>
        ["pending", "accepted"].includes(String(appointment.status).toLowerCase()) ? (
          <Button variant="danger" onClick={() => cancel(appointment, refresh)}>
            Cancel
          </Button>
        ) : null
      }
    />
  );
};

export default MyAppointments;

