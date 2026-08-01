const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const inputClass = "rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition hover:border-white/25 focus:border-cyan-400";

const defaultSlot = (day) => ({ day, startTime: "09:00", endTime: "17:00", isAvailable: false });

const AvailabilityEditor = ({ value = [], onChange }) => {
  const slots = days.map((day) => value.find((slot) => slot.day === day) || defaultSlot(day));
  const updateSlot = (day, changes) => {
    const next = slots.map((slot) => slot.day === day ? { ...slot, ...changes } : slot);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {slots.map((slot) => (
        <div key={slot.day} className="grid gap-3 rounded-xl border border-white/10 bg-slate-950 p-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
          <label className="flex items-center gap-3 font-semibold text-white">
            <input type="checkbox" checked={slot.isAvailable} onChange={(event) => updateSlot(slot.day, { isAvailable: event.target.checked })} className="h-4 w-4 accent-cyan-400" />
            {slot.day}
          </label>
          <input type="time" value={slot.startTime} onChange={(event) => updateSlot(slot.day, { startTime: event.target.value })} disabled={!slot.isAvailable} className={inputClass} />
          <input type="time" value={slot.endTime} onChange={(event) => updateSlot(slot.day, { endTime: event.target.value })} disabled={!slot.isAvailable} className={inputClass} />
          <span className={`text-xs font-semibold ${slot.isAvailable ? "text-emerald-300" : "text-slate-500"}`}>{slot.isAvailable ? "Available" : "Off"}</span>
        </div>
      ))}
    </div>
  );
};

export default AvailabilityEditor;
