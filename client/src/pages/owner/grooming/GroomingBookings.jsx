import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

import ResourceListPage from "../../../components/owner/ResourceListPage";
import api from "../../../services/api";
import { Button, formatDate, getId, money, petName } from "../ownerShared";

const GroomingBookings = () => {
  const cancel = async (booking, refresh) => {
    try {
      await api.put(`/grooming-bookings/${getId(booking)}/cancel`);
      toast.success("Grooming booking cancelled");
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel booking");
    }
  };

  return (
    <ResourceListPage
      title="Grooming"
      description="Book grooming services and review booking history."
      endpoint="/grooming-bookings"
      dataKeys={["bookings"]}
      searchPlaceholder="Search grooming bookings"
      getTitle={(booking) => booking.serviceId?.serviceName || "Grooming service"}
      getSubtitle={(booking) => petName(booking.petId)}
      getMeta={(booking) => [
        `${formatDate(booking.bookingDate)} at ${booking.bookingTime || "Time not set"}`,
        money(booking.price),
        booking.groomerId?.name ? `Groomer: ${booking.groomerId.name}` : "Groomer not assigned",
      ]}
      getStatus={(booking) => booking.status || "pending"}
      emptyTitle="No grooming bookings yet"
      emptyMessage="Book a grooming service for your pet."
      action={
        <Button as={Link} to="/owner/grooming/book">
          Book Grooming
        </Button>
      }
      renderActions={(booking, { refresh }) =>
        ["pending", "accepted"].includes(String(booking.status).toLowerCase()) ? (
          <Button variant="danger" onClick={() => cancel(booking, refresh)}>
            Cancel
          </Button>
        ) : null
      }
    />
  );
};

export default GroomingBookings;

