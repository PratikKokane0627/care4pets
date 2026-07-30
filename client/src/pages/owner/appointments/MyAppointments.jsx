import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useMemo, useState } from "react";

import ResourceListPage from "../../../components/owner/ResourceListPage";
import api from "../../../services/api";
import { Button, formatDate, getId, petName, vetName } from "../ownerShared";

const MyAppointments = () => {
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (date) params.set("date", date);
    const query = params.toString();
    return query ? `/appointments?${query}` : "/appointments";
  }, [date, status]);

  const cancel = async (appointment, refresh) => {
    const reason = window.prompt("Cancellation reason", "Cancelled by owner");
    if (reason === null) return;
    try {
      await api.put(`/appointments/${getId(appointment)}/cancel`, {
        cancellationReason: reason,
      });
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
      endpoint={endpoint}
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
      emptyAction={
        <Button as={Link} to="/owner/appointments/book">
          Book Appointment
        </Button>
      }
      action={
        <Button as={Link} to="/owner/appointments/book">
          Book Appointment
        </Button>
      }
      renderBeforeList={() => (
        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition hover:border-white/25 focus:border-cyan-400"
          >
            <option value="">All statuses</option>
            {["pending", "accepted", "rejected", "cancelled", "completed"].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition hover:border-white/25 focus:border-cyan-400"
          />
        </div>
      )}
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

