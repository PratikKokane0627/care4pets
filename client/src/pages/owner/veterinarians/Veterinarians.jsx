import { Link } from "react-router-dom";
import { useMemo, useState } from "react";

import ResourceListPage from "../../../components/owner/ResourceListPage";
import { Button, getId, money, vetName } from "../ownerShared";

const Veterinarians = () => {
  const [filters, setFilters] = useState({
    specialization: "",
    city: "",
    minExperience: "",
    maxFee: "",
    availableDay: "",
  });

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const query = params.toString();
    return query ? `/vets?${query}` : "/vets";
  }, [filters]);

  const setFilter = (field, value) =>
    setFilters((current) => ({ ...current, [field]: value }));

  return (
    <ResourceListPage
      title="Veterinarians"
      description="Search vets, filter availability, view profiles, and book appointments."
      endpoint={endpoint}
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
      renderBeforeList={() => (
        <div className="grid gap-3 md:grid-cols-5">
          <input
            value={filters.specialization}
            onChange={(event) => setFilter("specialization", event.target.value)}
            placeholder="Specialization"
            className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 hover:border-white/25 focus:border-cyan-400"
          />
          <input
            value={filters.city}
            onChange={(event) => setFilter("city", event.target.value)}
            placeholder="City"
            className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 hover:border-white/25 focus:border-cyan-400"
          />
          <input
            type="number"
            value={filters.minExperience}
            onChange={(event) => setFilter("minExperience", event.target.value)}
            placeholder="Min exp"
            className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 hover:border-white/25 focus:border-cyan-400"
          />
          <input
            type="number"
            value={filters.maxFee}
            onChange={(event) => setFilter("maxFee", event.target.value)}
            placeholder="Max fee"
            className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 hover:border-white/25 focus:border-cyan-400"
          />
          <select
            value={filters.availableDay}
            onChange={(event) => setFilter("availableDay", event.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition hover:border-white/25 focus:border-cyan-400"
          >
            <option value="">Any day</option>
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>
      )}
      renderActions={(vet) => (
        <Button as={Link} to={`/owner/appointments/book?vetId=${getId(vet)}`}>
          Book
        </Button>
      )}
    />
  );
};

export default Veterinarians;

