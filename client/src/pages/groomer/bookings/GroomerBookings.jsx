import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import GroomerConfirmModal from "../../../components/groomer/GroomerConfirmModal";
import GroomerDataTable from "../../../components/groomer/GroomerDataTable";
import GroomerErrorState from "../../../components/groomer/GroomerErrorState";
import GroomerLoader from "../../../components/groomer/GroomerLoader";
import GroomerPageHeader from "../../../components/groomer/GroomerPageHeader";
import GroomerPagination from "../../../components/groomer/GroomerPagination";
import GroomerStatusBadge from "../../../components/groomer/GroomerStatusBadge";
import GroomingBookingCard from "../../../components/groomer/GroomingBookingCard";
import GroomingBookingFilters from "../../../components/groomer/GroomingBookingFilters";
import GroomingCompletionForm from "../../../components/groomer/GroomingCompletionForm";
import { acceptGroomingBooking, completeGroomingBooking, getAvailableGroomingBookings, getGroomerBookings, rejectGroomingBooking } from "../../../services/groomerApi";
import { formatDate, getId, money, normalizePagination, personName, petName, serviceName } from "../../../utils/groomingUtils";

const buttonClass = "rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-300 hover:border-cyan-300/40";

const GroomerBookings = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState("assigned");
  const [filters, setFilters] = useState({ search: "", status: searchParams.get("status") || "", bookingDate: "", sort: "newest" });
  const [page, setPage] = useState(1);
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFilters((current) => ({ ...current, status: searchParams.get("status") || "" }));
    setPage(1);
  }, [searchParams]);

  const apiParams = useMemo(() => ({
    page,
    limit: 10,
    sort: filters.sort,
    ...(filters.status && { status: filters.status }),
    ...(filters.bookingDate && { bookingDate: filters.bookingDate }),
  }), [filters.bookingDate, filters.sort, filters.status, page]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = mode === "available"
        ? await getAvailableGroomingBookings(apiParams)
        : await getGroomerBookings(apiParams);
      setBookings(res.data.bookings || []);
      setPagination(normalizePagination(res.data, 10));
    } catch (err) {
      const message = err.response?.data?.message || "Could not load grooming bookings";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [apiParams, mode]);

  useEffect(() => { load(); }, [load]);

  const filteredBookings = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    if (!query) return bookings;
    return bookings.filter((booking) =>
      [
        getId(booking),
        personName(booking.ownerId),
        petName(booking.petId),
        serviceName(booking.serviceId),
      ].join(" ").toLowerCase().includes(query)
    );
  }, [bookings, filters.search]);

  const runAction = async () => {
    if (!modal?.booking) return;
    setBusy(true);
    try {
      if (modal.type === "accept") await acceptGroomingBooking(getId(modal.booking));
      if (modal.type === "reject") {
        if (!reason.trim()) {
          toast.error("Rejection reason is required");
          setBusy(false);
          return;
        }
        await rejectGroomingBooking(getId(modal.booking), reason.trim());
      }
      if (modal.type === "complete") await completeGroomingBooking(getId(modal.booking), notes.trim());
      toast.success("Booking updated");
      setModal(null);
      setReason("");
      setNotes("");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update booking");
    } finally {
      setBusy(false);
    }
  };

  const actions = (booking) => (
    <>
      {booking.status === "pending" && <button type="button" onClick={() => setModal({ type: "accept", booking })} className={buttonClass}>Accept</button>}
      {booking.status === "pending" && <button type="button" onClick={() => setModal({ type: "reject", booking })} className="rounded-xl border border-red-400/30 px-3 py-2 text-sm font-semibold text-red-300">Reject</button>}
      {booking.status === "accepted" && <button type="button" onClick={() => setModal({ type: "complete", booking })} className="rounded-xl bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950">Complete</button>}
    </>
  );

  return (
    <main>
      <GroomerPageHeader
        title="Grooming Bookings"
        description="Manage assigned bookings and accept available pending grooming jobs."
        actions={
          <div className="flex rounded-xl border border-white/10 bg-slate-900 p-1">
            {["assigned", "available"].map((item) => (
              <button key={item} type="button" onClick={() => { setMode(item); setPage(1); }} className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize ${mode === item ? "bg-cyan-400 text-slate-950" : "text-slate-300"}`}>{item}</button>
            ))}
          </div>
        }
      />
      <GroomingBookingFilters filters={filters} onChange={(key, value) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1); }} />
      {loading ? <GroomerLoader text="Loading bookings..." /> : error ? <GroomerErrorState message={error} onRetry={load} /> : (
        <>
          <div className="hidden xl:block">
            <GroomerDataTable
              data={filteredBookings}
              emptyTitle="No grooming bookings found"
              columns={[
                { header: "Booking", render: (b) => <><p className="font-semibold text-white">{serviceName(b.serviceId)}</p><p className="text-xs text-slate-500">#{String(getId(b)).slice(-8)}</p></> },
                { header: "Owner", render: (b) => personName(b.ownerId) },
                { header: "Pet", render: (b) => petName(b.petId) },
                { header: "Date", render: (b) => `${formatDate(b.bookingDate)} ${b.bookingTime}` },
                { header: "Price", render: (b) => money(b.price) },
                { header: "Status", render: (b) => <GroomerStatusBadge status={b.status} /> },
                { header: "Actions", render: (b) => <div className="flex flex-wrap gap-2"><Link to={`/groomer/bookings/${getId(b)}`} className={buttonClass}>View</Link>{actions(b)}</div> },
              ]}
            />
          </div>
          <div className="grid gap-4 xl:hidden">
            {filteredBookings.length ? filteredBookings.map((booking) => <GroomingBookingCard key={getId(booking)} booking={booking} actions={actions(booking)} />) : null}
          </div>
          {!filteredBookings.length && <div className="xl:hidden"><GroomerDataTable data={[]} emptyTitle="No grooming bookings found" /></div>}
          <GroomerPagination pagination={pagination} onPageChange={setPage} />
        </>
      )}
      <GroomerConfirmModal open={Boolean(modal)} title={modal?.type === "reject" ? "Reject booking" : modal?.type === "complete" ? "Complete booking" : "Accept booking"} message={modal?.type === "accept" ? "Accept this pending grooming booking?" : undefined} confirmText={modal?.type === "reject" ? "Reject" : modal?.type === "complete" ? "Complete" : "Accept"} danger={modal?.type === "reject"} loading={busy} onConfirm={runAction} onClose={() => setModal(null)}>
        {modal?.type === "reject" && <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for rejection" maxLength={500} className="min-h-24 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400" />}
        {modal?.type === "complete" && <GroomingCompletionForm notes={notes} onNotesChange={setNotes} />}
      </GroomerConfirmModal>
    </main>
  );
};

export default GroomerBookings;
