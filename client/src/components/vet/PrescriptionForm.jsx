const inputClass = "w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 hover:border-white/25 focus:border-cyan-400";

const PrescriptionForm = ({ form, setForm }) => (
  <div className="space-y-4">
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">Diagnosis *</span>
      <textarea value={form.diagnosis} maxLength={1000} onChange={(event) => setForm((current) => ({ ...current, diagnosis: event.target.value }))} className={`${inputClass} min-h-24 resize-y`} />
    </label>
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">Prescription *</span>
      <textarea value={form.prescription} maxLength={2000} onChange={(event) => setForm((current) => ({ ...current, prescription: event.target.value }))} className={`${inputClass} min-h-28 resize-y`} />
    </label>
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">Vet notes</span>
      <textarea value={form.vetNotes} maxLength={2000} onChange={(event) => setForm((current) => ({ ...current, vetNotes: event.target.value }))} className={`${inputClass} min-h-24 resize-y`} />
    </label>
  </div>
);

export default PrescriptionForm;
