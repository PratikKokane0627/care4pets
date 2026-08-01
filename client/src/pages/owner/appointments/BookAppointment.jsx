import { useEffect, useMemo, useState } from "react";
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
  initialAppointmentForm,
  petName,
  toArray,
  vetName,
} from "../ownerShared";

const BookAppointment = () => {
  const [searchParams] = useSearchParams();
  const initialVetId = searchParams.get("vetId") || "";
  const initialPetId = searchParams.get("petId") || "";
  const [pets, setPets] = useState([]);
  const [vets, setVets] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [form, setForm] = useState({
    ...initialAppointmentForm,
    petId: initialPetId,
    vetId: initialVetId,
  });
  const [saving, setSaving] = useState(false);

  const { loading, error } = useFetch(async () => {
    const [petsRes, vetsRes] = await Promise.all([api.get("/pets"), api.get("/vets")]);
    setPets(toArray(petsRes.data, ["pets"]));
    setVets(toArray(vetsRes.data, ["vets", "veterinarians"]));
  }, "book-appointment");

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  useEffect(() => {
    let alive = true;

    const loadAvailability = async () => {
      if (!form.vetId) {
        setAvailability([]);
        return;
      }

      setAvailabilityLoading(true);
      try {
        const response = await api.get(`/vets/${form.vetId}/availability`);
        if (alive) setAvailability(response.data.availability || []);
      } catch {
        if (alive) setAvailability([]);
      } finally {
        if (alive) setAvailabilityLoading(false);
      }
    };

    loadAvailability();
    return () => {
      alive = false;
    };
  }, [form.vetId]);

  const selectedDayAvailability = useMemo(() => {
    if (!form.appointmentDate) return null;
    const date = new Date(form.appointmentDate);
    if (Number.isNaN(date.getTime())) return null;
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    return availability.find((slot) => slot.day === dayName);
  }, [availability, form.appointmentDate]);

  const selectedVet = vets.find((vet) => getId(vet) === form.vetId);
  const availableSlots = availability.filter((slot) => slot.isAvailable);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.appointmentDate && selectedDayAvailability && !selectedDayAvailability.isAvailable) {
      toast.error("Selected veterinarian is not available on this day");
      return;
    }
    if (form.appointmentDate && !selectedDayAvailability) {
      toast.error("No availability is configured for the selected day");
      return;
    }
    if (
      form.appointmentTime &&
      selectedDayAvailability?.isAvailable &&
      (form.appointmentTime < selectedDayAvailability.startTime ||
        form.appointmentTime >= selectedDayAvailability.endTime)
    ) {
      toast.error(`Choose a time between ${selectedDayAvailability.startTime} and ${selectedDayAvailability.endTime}`);
      return;
    }

    setSaving(true);
    try {
      await api.post("/appointments", form);
      toast.success("Appointment booked");
      setForm(initialAppointmentForm);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not book appointment");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading booking form" />;

  return (
    <main>
      <PageHeader title="Book Appointment" description="Select a pet, veterinarian, date, and time." />
      <ErrorState message={error} />
      {!pets.length || !vets.length ? (
        <EmptyState title="Booking needs pets and vets" message="Add a pet and make sure veterinarians are available first." />
      ) : (
        <Panel>
          <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
            <Field label="Pet" as="select" value={form.petId} onChange={(value) => setField("petId", value)} options={[{ value: "", label: "Select pet" }, ...pets.map((pet) => ({ value: getId(pet), label: petName(pet) }))]} required />
            <Field label="Veterinarian" as="select" value={form.vetId} onChange={(value) => setField("vetId", value)} options={[{ value: "", label: "Select vet" }, ...vets.map((vet) => ({ value: getId(vet), label: vetName(vet) }))]} required />
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">Veterinarian Availability</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedVet ? `Available schedule for ${vetName(selectedVet)}` : "Select a veterinarian to see available days and times."}
                  </p>
                </div>
                {availabilityLoading && <span className="text-sm text-cyan-300">Loading...</span>}
              </div>
              {form.vetId && !availabilityLoading && (
                availableSlots.length ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {availableSlots.map((slot) => (
                      <div key={`${slot.day}-${slot.startTime}-${slot.endTime}`} className="rounded-xl border border-cyan-300/15 bg-cyan-400/5 p-3">
                        <p className="font-semibold text-white">{slot.day}</p>
                        <p className="mt-1 text-sm text-cyan-200">{slot.startTime} - {slot.endTime}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                    This veterinarian has not added availability yet.
                  </p>
                )
              )}
              {form.appointmentDate && selectedDayAvailability && (
                <p className="mt-4 text-sm text-slate-400">
                  Selected day: {selectedDayAvailability.isAvailable
                    ? `${selectedDayAvailability.day}, ${selectedDayAvailability.startTime} - ${selectedDayAvailability.endTime}`
                    : `${selectedDayAvailability.day} is not available`}
                </p>
              )}
            </div>
            <Field label="Date" type="date" value={form.appointmentDate} onChange={(value) => setField("appointmentDate", value)} required />
            <Field label="Time" type="time" value={form.appointmentTime} onChange={(value) => setField("appointmentTime", value)} required />
            <Field label="Reason" value={form.reason} onChange={(value) => setField("reason", value)} required />
            <Field label="Notes" value={form.notes} onChange={(value) => setField("notes", value)} />
            <div className="md:col-span-2">
              <Button type="submit" disabled={saving}>{saving ? "Booking..." : "Book Appointment"}</Button>
            </div>
          </form>
        </Panel>
      )}
    </main>
  );
};

export default BookAppointment;

