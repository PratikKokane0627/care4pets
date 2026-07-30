import { useState } from "react";
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

  const handleSubmit = async (event) => {
    event.preventDefault();
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

