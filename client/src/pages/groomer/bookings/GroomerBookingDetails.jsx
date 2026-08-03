import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import GroomerConfirmModal from "../../../components/groomer/GroomerConfirmModal";
import GroomerErrorState from "../../../components/groomer/GroomerErrorState";
import GroomerLoader from "../../../components/groomer/GroomerLoader";
import GroomerPageHeader from "../../../components/groomer/GroomerPageHeader";
import GroomerStatusBadge from "../../../components/groomer/GroomerStatusBadge";
import GroomingCompletionForm from "../../../components/groomer/GroomingCompletionForm";
import { acceptGroomingBooking, completeGroomingBooking, getGroomingBooking, rejectGroomingBooking, updateGroomerNotes } from "../../../services/groomerApi";
import { formatDate, money, personName, petName, serviceName } from "../../../utils/groomingUtils";

const Info = ({ label, value }) => <div className="rounded-xl border border-white/10 bg-slate-950 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-sm font-semibold text-white">{value || "Not set"}</p></div>;

const GroomerBookingDetails = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getGroomingBooking(id);
      setBooking(res.data.booking);
      setNotes(res.data.booking?.groomerNotes || "");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load booking");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const runAction = async () => {
    setBusy(true);
    try {
      if (modal === "accept") await acceptGroomingBooking(id);
      if (modal === "reject") {
        if (!reason.trim()) {
          toast.error("Rejection reason is required");
          setBusy(false);
          return;
        }
        await rejectGroomingBooking(id, reason.trim());
      }
      if (modal === "complete") await completeGroomingBooking(id, notes.trim());
      if (modal === "notes") await updateGroomerNotes(id, notes.trim());
      toast.success("Booking updated");
      setModal(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update booking");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <GroomerLoader text="Loading booking..." />;
  if (error) return <GroomerErrorState message={error} onRetry={load} />;

  return (
    <main>
      <GroomerPageHeader title={serviceName(booking?.serviceId)} description={`Booking #${String(id).slice(-8)}`} actions={<Link to="/groomer/bookings" className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300">Back</Link>} />
      <section className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-white">Booking Details</h2>
          <GroomerStatusBadge status={booking.status} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Info label="Owner" value={personName(booking.ownerId)} />
          <Info label="Owner phone" value={booking.ownerId?.phone} />
          <Info label="Pet" value={petName(booking.petId)} />
          <Info label="Species" value={booking.petId?.species} />
          <Info label="Breed" value={booking.petId?.breed} />
          <Info label="Gender" value={booking.petId?.gender} />
          <Info label="Weight" value={booking.petId?.weight} />
          <Info label="Service" value={serviceName(booking.serviceId)} />
          <Info label="Category" value={booking.serviceId?.category} />
          <Info label="Date" value={formatDate(booking.bookingDate)} />
          <Info label="Time" value={booking.bookingTime} />
          <Info label="Duration" value={`${booking.duration || 0} min`} />
          <Info label="Price" value={money(booking.price)} />
          <Info label="Payment" value={<GroomerStatusBadge status={booking.paymentStatus} />} />
          <Info label="Created" value={formatDate(booking.createdAt)} />
          <Info label="Completed" value={formatDate(booking.completedAt)} />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Info label="Special instructions" value={booking.specialInstructions} />
          <Info label="Rejection reason" value={booking.rejectionReason} />
          <Info label="Cancellation reason" value={booking.cancellationReason} />
          <Info label="Groomer notes" value={booking.groomerNotes} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {booking.status === "pending" && <button type="button" onClick={() => setModal("accept")} className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950">Accept</button>}
          {booking.status === "pending" && <button type="button" onClick={() => setModal("reject")} className="rounded-xl border border-red-400/30 px-4 py-2.5 text-sm font-semibold text-red-300">Reject</button>}
          {booking.status === "accepted" && <button type="button" onClick={() => setModal("complete")} className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950">Complete</button>}
          {["accepted", "completed"].includes(booking.status) && <button type="button" onClick={() => setModal("notes")} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300">Update Notes</button>}
        </div>
      </section>
      <GroomerConfirmModal open={Boolean(modal)} title={modal === "reject" ? "Reject booking" : modal === "complete" ? "Complete booking" : modal === "notes" ? "Update notes" : "Accept booking"} message={modal === "accept" ? "Accept this pending booking?" : undefined} confirmText={modal === "reject" ? "Reject" : modal === "complete" ? "Complete" : "Save"} danger={modal === "reject"} loading={busy} onConfirm={runAction} onClose={() => setModal(null)}>
        {modal === "reject" && <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for rejection" maxLength={500} className="min-h-24 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400" />}
        {["complete", "notes"].includes(modal) && <GroomingCompletionForm notes={notes} onNotesChange={setNotes} />}
      </GroomerConfirmModal>
    </main>
  );
};

export default GroomerBookingDetails;
