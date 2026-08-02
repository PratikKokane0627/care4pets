import { useMemo, useState } from "react";

const specializations = [
  "General Veterinary",
  "Surgery",
  "Dermatology",
  "Dentistry",
  "Cardiology",
  "Orthopedics",
  "Emergency Care",
  "Other",
];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const initialAvailability = days.map((day, index) => ({
  day,
  startTime: "09:00",
  endTime: "17:00",
  isAvailable: index < 5,
}));

const initialVetRegistrationForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  qualification: "",
  specialization: "General Veterinary",
  experience: "",
  registrationNumber: "",
  clinicName: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  consultationFee: "",
  about: "",
  availability: initialAvailability,
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/25 focus:border-cyan-400";

const Field = ({ label, className = "", children }) => (
  <label className={`block ${className}`}>
    <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
    {children}
  </label>
);

const VetRegistrationForm = ({
  title,
  description,
  submitText,
  successNote,
  onSubmit,
  initialForm = initialVetRegistrationForm,
}) => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const selectedDays = useMemo(
    () => form.availability.filter((slot) => slot.isAvailable).length,
    [form.availability]
  );

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateAvailability = (day, updates) => {
    setForm((current) => ({
      ...current,
      availability: current.availability.map((slot) =>
        slot.day === day ? { ...slot, ...updates } : slot
      ),
    }));
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    phone: form.phone.trim(),
    password: form.password,
    qualification: form.qualification.trim(),
    specialization: form.specialization,
    experience: Number(form.experience),
    registrationNumber: form.registrationNumber.trim(),
    clinicName: form.clinicName.trim(),
    clinicAddress: {
      street: form.street.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
    },
    consultationFee: Number(form.consultationFee),
    about: form.about.trim(),
    availability: form.availability.filter((slot) => slot.isAvailable),
  });

  const submit = async (event) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      await onSubmit(buildPayload());
      setForm(initialVetRegistrationForm);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-lg shadow-black/10">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Veterinarian onboarding</p>
        <h1 className="mt-2 text-3xl font-bold text-white">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
      </div>

      <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
        <Field label="Full name">
          <input className={inputClass} value={form.name} onChange={(event) => update("name", event.target.value)} required />
        </Field>
        <Field label="Email">
          <input className={inputClass} type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
        </Field>
        <Field label="Phone">
          <input className={inputClass} value={form.phone} onChange={(event) => update("phone", event.target.value.replace(/\D/g, ""))} maxLength={10} required />
        </Field>
        <Field label="Password">
          <input className={inputClass} type="password" minLength={8} value={form.password} onChange={(event) => update("password", event.target.value)} required />
        </Field>
        <Field label="Qualification">
          <input className={inputClass} placeholder="BVSc, MVSc, DVM..." value={form.qualification} onChange={(event) => update("qualification", event.target.value)} required />
        </Field>
        <Field label="Specialization">
          <select className={inputClass} value={form.specialization} onChange={(event) => update("specialization", event.target.value)} required>
            {specializations.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Experience">
          <input className={inputClass} type="number" min="0" value={form.experience} onChange={(event) => update("experience", event.target.value)} required />
        </Field>
        <Field label="Registration number">
          <input className={inputClass} value={form.registrationNumber} onChange={(event) => update("registrationNumber", event.target.value)} required />
        </Field>
        <Field label="Clinic name">
          <input className={inputClass} value={form.clinicName} onChange={(event) => update("clinicName", event.target.value)} required />
        </Field>
        <Field label="Consultation fee">
          <input className={inputClass} type="number" min="0" value={form.consultationFee} onChange={(event) => update("consultationFee", event.target.value)} required />
        </Field>
        <Field label="Street">
          <input className={inputClass} value={form.street} onChange={(event) => update("street", event.target.value)} />
        </Field>
        <Field label="City">
          <input className={inputClass} value={form.city} onChange={(event) => update("city", event.target.value)} required />
        </Field>
        <Field label="State">
          <input className={inputClass} value={form.state} onChange={(event) => update("state", event.target.value)} required />
        </Field>
        <Field label="Postal code">
          <input className={inputClass} value={form.postalCode} onChange={(event) => update("postalCode", event.target.value)} />
        </Field>
        <Field label="About" className="md:col-span-2">
          <textarea className={`${inputClass} min-h-28 resize-y`} value={form.about} onChange={(event) => update("about", event.target.value)} placeholder="Short clinic or professional bio" />
        </Field>

        <div className="md:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-white">Availability</h2>
              <p className="mt-1 text-sm text-slate-500">{selectedDays} days selected</p>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {form.availability.map((slot) => (
              <div key={slot.day} className="rounded-xl border border-white/10 bg-slate-950 p-4 transition hover:border-cyan-300/30">
                <label className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-white">{slot.day}</span>
                  <input type="checkbox" className="h-4 w-4 accent-cyan-400" checked={slot.isAvailable} onChange={(event) => updateAvailability(slot.day, { isAvailable: event.target.checked })} />
                </label>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <input type="time" className={inputClass} value={slot.startTime} disabled={!slot.isAvailable} onChange={(event) => updateAvailability(slot.day, { startTime: event.target.value })} />
                  <input type="time" className={inputClass} value={slot.endTime} disabled={!slot.isAvailable} onChange={(event) => updateAvailability(slot.day, { endTime: event.target.value })} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:items-center">
          <button type="submit" disabled={loading} className="inline-flex justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "Submitting..." : submitText}
          </button>
          {successNote && <p className="text-sm text-slate-500">{successNote}</p>}
        </div>
      </form>
    </section>
  );
};

export default VetRegistrationForm;
