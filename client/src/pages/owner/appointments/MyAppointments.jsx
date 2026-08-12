import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useMemo, useState } from "react";

import ResourceListPage from "../../../components/owner/ResourceListPage";
import DateInput from "../../../components/common/DateInput";
import api from "../../../services/api";
import { Button, ConfirmDialog, formatDate, getId, petName, vetName } from "../ownerShared";

const MyAppointments = () => {
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("Cancelled by owner");
  const [cancelBusy, setCancelBusy] = useState(false);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (date) params.set("date", date);
    const query = params.toString();
    return query ? `/appointments?${query}` : "/appointments";
  }, [date, status]);

  const openCancelDialog = (appointment, refresh) => {
    setCancelTarget({ appointment, refresh });
    setCancelReason("Cancelled by owner");
  };

  const closeCancelDialog = () => {
    if (cancelBusy) return;
    setCancelTarget(null);
    setCancelReason("Cancelled by owner");
  };

  const cancel = async () => {
    if (!cancelTarget) return;
    setCancelBusy(true);
    try {
      await api.put(`/appointments/${getId(cancelTarget.appointment)}/cancel`, {
        cancellationReason: cancelReason.trim() || "Cancelled by owner",
      });
      toast.success("Appointment cancelled");
      cancelTarget.refresh();
      setCancelTarget(null);
      setCancelReason("Cancelled by owner");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel appointment");
    } finally {
      setCancelBusy(false);
    }
  };

  return (
    <>
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
            <DateInput
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition hover:border-white/25 focus:border-cyan-400"
            />
          </div>
        )}
        renderActions={(appointment, { refresh }) => {
          const normalizedStatus = String(appointment.status).toLowerCase();
          const vetId = getId(appointment.vetId);
          const appointmentId = getId(appointment);

          if (["pending", "accepted"].includes(normalizedStatus)) {
            return (
            <Button variant="danger" onClick={() => openCancelDialog(appointment, refresh)}>
              Cancel
            </Button>
            );
          }

          if (normalizedStatus === "completed" && vetId && appointmentId) {
            return (
              <Button
                as={Link}
                to={`/owner/veterinarians/${vetId}?appointmentId=${appointmentId}#vet-reviews`}
              >
                Review Vet
              </Button>
            );
          }

          return null;
        }}
      />
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel appointment"
        message="Please add a cancellation reason before cancelling this appointment."
        inputLabel="Cancellation reason"
        inputValue={cancelReason}
        onInputChange={setCancelReason}
        confirmText="Cancel Appointment"
        danger
        loading={cancelBusy}
        onConfirm={cancel}
        onClose={closeCancelDialog}
      />
    </>
  );
};

export default MyAppointments;

