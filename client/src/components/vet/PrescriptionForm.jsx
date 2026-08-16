const inputClass = "w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/25 focus:border-cyan-400";
const labelClass = "mb-2 block text-sm font-semibold text-slate-300";

const PrescriptionForm = ({ form, setForm }) => (
  <div className="grid gap-4 md:grid-cols-2">
    <label className="block md:col-span-2">
      <span className={labelClass}>Symptoms</span>
      <textarea value={form.symptoms || ""} maxLength={1000} onChange={(event) => setForm((current) => ({ ...current, symptoms: event.target.value }))} className={`${inputClass} min-h-20 resize-y`} placeholder="Observed symptoms, owner-reported issues, or exam findings" />
    </label>
    <label className="block">
      <span className={labelClass}>Diagnosis *</span>
      <textarea value={form.diagnosis} maxLength={1000} onChange={(event) => setForm((current) => ({ ...current, diagnosis: event.target.value }))} className={`${inputClass} min-h-36 resize-y`} placeholder="Diagnosis summary" />
    </label>
    <label className="block">
      <span className={labelClass}>Prescription *</span>
      <textarea value={form.prescription} maxLength={2000} onChange={(event) => setForm((current) => ({ ...current, prescription: event.target.value }))} className={`${inputClass} min-h-36 resize-y`} placeholder="Medicines, dosage, and care instructions" />
    </label>
    <label className="block md:col-span-2">
      <span className={labelClass}>Vet notes</span>
      <textarea value={form.vetNotes} maxLength={2000} onChange={(event) => setForm((current) => ({ ...current, vetNotes: event.target.value }))} className={`${inputClass} min-h-24 resize-y`} placeholder="Follow-up advice or private clinical notes" />
    </label>
  </div>
);

export default PrescriptionForm;
