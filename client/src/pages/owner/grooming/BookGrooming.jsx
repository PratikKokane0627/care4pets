import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

import EmptyState from "../../../components/owner/EmptyState";
import Loader from "../../../components/owner/Loader";
import PageHeader from "../../../components/owner/PageHeader";
import useFetch from "../../../hooks/useFetch";
import api from "../../../services/api";
import {
  Button,
  ErrorState,
  Field,
  Panel,
  getId,
  initialGroomingForm,
  money,
  petName,
  toArray,
} from "../ownerShared";

const availableSlots = (availability = []) =>
  availability.filter((slot) => slot.isAvailable && slot.startTime && slot.endTime);

const BookGrooming = () => {
  const [searchParams] = useSearchParams();
  const initialServiceId = searchParams.get("serviceId") || "";
  const initialPetId = searchParams.get("petId") || "";
  const initialGroomerId = searchParams.get("groomerId") || "";
  const [pets, setPets] = useState([]);
  const [services, setServices] = useState([]);
  const [groomers, setGroomers] = useState([]);
  const [groomersLoading, setGroomersLoading] = useState(false);
  const [form, setForm] = useState({
    ...initialGroomingForm,
    petId: initialPetId,
    serviceId: initialServiceId,
    groomerId: initialGroomerId,
  });
  const [saving, setSaving] = useState(false);

  const { loading, error } = useFetch(async () => {
    const [petsRes, servicesRes, groomersRes] = await Promise.all([
      api.get("/pets"),
      api.get("/grooming-services"),
      api.get("/groomers/available").catch(() => ({ data: { groomers: [] } })),
    ]);
    setPets(toArray(petsRes.data, ["pets"]));
    setServices(toArray(servicesRes.data, ["services", "groomingServices"]));
    setGroomers(toArray(groomersRes.data, ["groomers"]));
  }, "book-grooming");

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  useEffect(() => {
    if (!form.bookingDate) return;

    const date = new Date(form.bookingDate);
    if (Number.isNaN(date.getTime())) return;

    const day = date.toLocaleDateString("en-US", { weekday: "long" });

    setGroomersLoading(true);
    api.get(`/groomers/available?day=${encodeURIComponent(day)}`)
      .then((res) => {
        const nextGroomers = toArray(res.data, ["groomers"]);
        setGroomers(nextGroomers);
        setForm((current) =>
          current.groomerId && !nextGroomers.some((groomer) => getId(groomer.userId) === current.groomerId)
            ? { ...current, groomerId: "" }
            : current
        );
      })
      .catch(() => setGroomers([]))
      .finally(() => setGroomersLoading(false));
  }, [form.bookingDate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/grooming-bookings", {
        petId: form.petId,
        serviceId: form.serviceId,
        groomerId: form.groomerId,
        bookingDate: form.bookingDate,
        bookingTime: form.bookingTime,
        specialInstructions: form.notes,
      });
      toast.success("Grooming booked");
      setForm(initialGroomingForm);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not book grooming");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading grooming form" />;

  return (
    <main>
      <PageHeader title="Book Grooming" description="Choose a pet, service, Groomer, date, and time." />
      <ErrorState message={error} />
      {!pets.length || !services.length ? (
        <EmptyState title="Booking needs pets and services" message="Add a pet and make sure grooming services are available first." />
      ) : (
        <Panel>
          <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
            <Field label="Pet" as="select" value={form.petId} onChange={(value) => setField("petId", value)} options={[{ value: "", label: "Select pet" }, ...pets.map((pet) => ({ value: getId(pet), label: petName(pet) }))]} required />
            <Field label="Service" as="select" value={form.serviceId} onChange={(value) => setField("serviceId", value)} options={[{ value: "", label: "Select service" }, ...services.map((service) => ({ value: getId(service), label: `${service.serviceName || service.name} - ${money(service.price)}` }))]} required />
            <Field label="Date" type="date" value={form.bookingDate} onChange={(value) => setField("bookingDate", value)} required />
            <Field label="Time" type="time" value={form.bookingTime} onChange={(value) => setField("bookingTime", value)} required />
            <div className="md:col-span-2">
              <Field
                label="Groomer"
                as="select"
                value={form.groomerId}
                onChange={(value) => setField("groomerId", value)}
                options={[
                  { value: "", label: groomersLoading ? "Loading groomers..." : "Auto assign groomer" },
                  ...groomers.map((groomer) => ({
                    value: getId(groomer.userId),
                    label: `${groomer.userId?.name || "Groomer"} - ${groomer.experience || 0} years`,
                  })),
                ]}
              />
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {groomers.slice(0, 6).map((groomer) => {
                  const user = groomer.userId || {};
                  const selected = form.groomerId === getId(user);
                  return (
                    <button
                      key={getId(groomer)}
                      type="button"
                      onClick={() => setField("groomerId", selected ? "" : getId(user))}
                      className={`rounded-2xl border p-4 text-left transition hover:-translate-y-1 hover:border-cyan-300/40 ${selected ? "border-cyan-300/60 bg-cyan-400/10" : "border-white/10 bg-slate-950"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-xl bg-cyan-400/10">
                          {user.profileImage ? <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" /> : null}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{user.name || "Groomer"}</p>
                          <p className="text-sm text-slate-400">{groomer.experience || 0} years experience</p>
                        </div>
                      </div>
                      {!!groomer.skills?.length && (
                        <p className="mt-3 line-clamp-2 text-sm text-slate-500">{groomer.skills.join(", ")}</p>
                      )}
                      {availableSlots(groomer.availability).length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {availableSlots(groomer.availability).slice(0, 3).map((slot) => (
                            <span key={slot.day} className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                              {slot.day.slice(0, 3)} {slot.startTime}-{slot.endTime}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-500">No availability added.</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="md:col-span-2">
              <Field label="Notes" as="textarea" value={form.notes} onChange={(value) => setField("notes", value)} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={saving}>{saving ? "Booking..." : "Book Grooming"}</Button>
            </div>
          </form>
        </Panel>
      )}
    </main>
  );
};

export default BookGrooming;
