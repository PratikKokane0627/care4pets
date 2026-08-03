import { groomingDays } from "../../utils/groomingUtils";

const defaultSlot = (day) => ({ day, startTime: "09:00", endTime: "17:00", isAvailable: false });

const GroomerAvailabilityEditor = ({ value = [], onChange, disabled = false }) => {
  const slots = groomingDays.map((day) => value.find((slot) => slot.day === day) || defaultSlot(day));
  const setSlot = (day, patch) => {
    onChange(slots.map((slot) => (slot.day === day ? { ...slot, ...patch } : slot)));
  };

  return (
    <div className="space-y-3">
      {slots.map((slot) => (
        <div key={slot.day} className="grid gap-3 rounded-xl border border-white/10 bg-slate-950 p-4 md:grid-cols-[160px_1fr_1fr] md:items-center">
          <label className="flex items-center gap-3 font-semibold text-white">
            <input type="checkbox" checked={slot.isAvailable} disabled={disabled} onChange={(event) => setSlot(slot.day, { isAvailable: event.target.checked })} className="h-4 w-4 accent-cyan-400" />
            {slot.day}
          </label>
          <input type="time" value={slot.startTime} disabled={disabled || !slot.isAvailable} onChange={(event) => setSlot(slot.day, { startTime: event.target.value })} className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400 disabled:opacity-50" />
          <input type="time" value={slot.endTime} disabled={disabled || !slot.isAvailable} onChange={(event) => setSlot(slot.day, { endTime: event.target.value })} className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400 disabled:opacity-50" />
        </div>
      ))}
    </div>
  );
};

export default GroomerAvailabilityEditor;
