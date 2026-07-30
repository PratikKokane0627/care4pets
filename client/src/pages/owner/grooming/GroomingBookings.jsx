import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useMemo, useState } from "react";

import ResourceListPage from "../../../components/owner/ResourceListPage";
import EmptyState from "../../../components/owner/EmptyState";
import useFetch from "../../../hooks/useFetch";
import api from "../../../services/api";
import { Button, SearchBox, formatDate, getId, itemImage, money, petName, toArray } from "../ownerShared";

const GroomingBookings = () => {
  const [services, setServices] = useState([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [status, setStatus] = useState("");
  const [bookingDate, setBookingDate] = useState("");

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

  const cancel = async (booking, refresh) => {
    const reason = window.prompt("Cancellation reason", "Cancelled by owner");
    if (reason === null) return;
    try {
      await api.put(`/grooming-bookings/${getId(booking)}/cancel`, {
        cancellationReason: reason,
      });
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
      endpoint={endpoint}
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
      emptyAction={
        <Button as={Link} to="/owner/grooming/book">
          Book Grooming
        </Button>
      }
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
      renderBeforeList={() => (
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
        </div>
      )}
    />
  );
};

export default GroomingBookings;

