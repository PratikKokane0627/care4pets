import { useState } from "react";
import { toast } from "react-hot-toast";

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

const BookGrooming = () => {
  const [pets, setPets] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(initialGroomingForm);
  const [saving, setSaving] = useState(false);

  const { loading, error } = useFetch(async () => {
    const [petsRes, servicesRes] = await Promise.all([api.get("/pets"), api.get("/grooming-services")]);
    setPets(toArray(petsRes.data, ["pets"]));
    setServices(toArray(servicesRes.data, ["services", "groomingServices"]));
  }, "book-grooming");

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/grooming-bookings", {
        petId: form.petId,
        serviceId: form.serviceId,
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
      <PageHeader title="Book Grooming" description="Choose a pet, service, date, and time." />
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

