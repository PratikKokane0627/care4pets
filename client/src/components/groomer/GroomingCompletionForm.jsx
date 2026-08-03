const GroomingCompletionForm = ({ notes, onNotesChange }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium text-slate-300">Completion notes</span>
    <textarea value={notes} onChange={(event) => onNotesChange(event.target.value)} placeholder="Add grooming notes for this completed service" className="min-h-28 w-full resize-y rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400" />
  </label>
);

export default GroomingCompletionForm;
