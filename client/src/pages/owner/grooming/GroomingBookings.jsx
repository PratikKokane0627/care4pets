import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useMemo, useState } from "react";

import EmptyState from "../../../components/owner/EmptyState";
import PageHeader from "../../../components/owner/PageHeader";
import StatusBadge from "../../../components/owner/StatusBadge";
import useFetch from "../../../hooks/useFetch";
import api from "../../../services/api";
import { Button, ConfirmDialog, ErrorState, Panel, SearchBox, formatDate, getId, itemImage, money, petName, toArray } from "../ownerShared";

const GroomingBookings = () => {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");
  const [status, setStatus] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("Cancelled by owner");
  const [cancelBusy, setCancelBusy] = useState(false);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (bookingDate) params.set("bookingDate", bookingDate);
    const query = params.toString();
    return query ? `/grooming-bookings?${query}` : "/grooming-bookings";
  }, [bookingDate, status]);

  useFetch(async () => {
    const response = await api.get("/grooming-services");
    setServices(toArray(response.data, ["services", "groomingServices"]));
  }, "grooming-services");

  const { loading: bookingLoading, error: bookingError } = useFetch(async () => {
    const response = await api.get(endpoint);
    setBookings(toArray(response.data, ["bookings"]));
  }, endpoint);

  const visibleServices = useMemo(() => {
    const search = serviceSearch.trim().toLowerCase();
    if (!search) return services;
    return services.filter((service) =>
      [
        service.serviceName,
        service.name,
        service.category,
        service.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [serviceSearch, services]);

  const visibleBookings = useMemo(() => {
    const search = bookingSearch.trim().toLowerCase();
    if (!search) return bookings;
    return bookings.filter((booking) =>
      [
        booking.serviceId?.serviceName,
        petName(booking.petId),
        booking.status,
        booking.groomerId?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [bookingSearch, bookings]);

  const refreshBookings = async () => {
    const response = await api.get(endpoint);
    setBookings(toArray(response.data, ["bookings"]));
  };

  const openCancelDialog = (booking) => {
    setCancelTarget({ booking });
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
      await api.put(`/grooming-bookings/${getId(cancelTarget.booking)}/cancel`, {
        cancellationReason: cancelReason.trim() || "Cancelled by owner",
      });
      toast.success("Grooming booking cancelled");
      await refreshBookings();
      setCancelTarget(null);
      setCancelReason("Cancelled by owner");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel booking");
    } finally {
      setCancelBusy(false);
    }
  };

  return (
    <>
      <main>
        <PageHeader
          title="Grooming"
          description="Book grooming services and review booking history."
          actions={
            <Button as={Link} to="/owner/grooming/book">
              Book Grooming
            </Button>
          }
        />
        <Panel>
          <div className="space-y-5">
            <div>
              <h2 className="mb-3 text-xl font-bold text-white">Grooming Services</h2>
              <SearchBox
                value={serviceSearch}
                onChange={setServiceSearch}
                placeholder="Search grooming services"
              />
            </div>
            {visibleServices.length === 0 ? (
              <EmptyState
                title="No grooming services"
                description="Available grooming services will appear here."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleServices.slice(0, 6).map((service) => (
                  <article
                    key={getId(service)}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950 transition hover:-translate-y-1 hover:border-cyan-300/30"
                  >
                    {(itemImage(service) || service.image?.url) && (
                      <img
                        src={itemImage(service) || service.image?.url}
                        alt={service.serviceName || service.name}
                        className="h-36 w-full object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-white">{service.serviceName || service.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">{service.category || "Grooming"}</p>
                      <p className="mt-3 text-sm font-semibold text-cyan-300">{money(service.price)}</p>
                      <Button
                        as={Link}
                        to={`/owner/grooming/book?serviceId=${getId(service)}`}
                        className="mt-4 w-full"
                      >
                        Book Service
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="border-t border-white/10 pt-5">
              <h2 className="text-xl font-bold text-white">Booking History</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
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
                  value={bookingDate}
                  onChange={(event) => setBookingDate(event.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition hover:border-white/25 focus:border-cyan-400"
                />
              </div>
            </div>

            <ErrorState message={bookingError} />
            <SearchBox
              value={bookingSearch}
              onChange={setBookingSearch}
              placeholder="Search grooming bookings"
            />

            {bookingLoading ? (
              <EmptyState title="Loading bookings" description="Fetching your grooming booking history." />
            ) : visibleBookings.length === 0 ? (
              <EmptyState
                title="No grooming bookings yet"
                description="Book a grooming service for your pet."
                action={
                  <Button as={Link} to="/owner/grooming/book">
                    Book Grooming
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleBookings.map((booking) => (
                  <article
                    key={getId(booking)}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950 p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:shadow-2xl hover:shadow-cyan-950/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {booking.serviceId?.serviceName || "Grooming service"}
                        </h3>
                        <p className="mt-1 text-sm text-cyan-200">
                          {petName(booking.petId)}
                        </p>
                      </div>
                      <StatusBadge status={booking.status || "pending"} />
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-slate-400">
                      <p>{formatDate(booking.bookingDate)} at {booking.bookingTime || "Time not set"}</p>
                      <p>{money(booking.price)}</p>
                      <p>{booking.groomerId?.name ? `Groomer: ${booking.groomerId.name}` : "Groomer not assigned"}</p>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2 max-sm:[&>*]:w-full">
                      <Button as={Link} to={`${getId(booking)}`} variant="ghost">
                        View Details
                      </Button>
                      {["pending", "accepted"].includes(String(booking.status).toLowerCase()) && (
                        <Button variant="danger" onClick={() => openCancelDialog(booking)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </Panel>
      </main>
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel grooming booking"
        message="Please add a cancellation reason before cancelling this grooming booking."
        inputLabel="Cancellation reason"
        inputValue={cancelReason}
        onInputChange={setCancelReason}
        confirmText="Cancel Booking"
        danger
        loading={cancelBusy}
        onConfirm={cancel}
        onClose={closeCancelDialog}
      />
    </>
  );
};

export default GroomingBookings;

