import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import AvailabilityEditor from "../../../components/vet/AvailabilityEditor";
import VetErrorState from "../../../components/vet/VetErrorState";
import VetLoader from "../../../components/vet/VetLoader";
import VetPageHeader from "../../../components/vet/VetPageHeader";
import { getMyVetProfile, updateVetAvailability } from "../../../services/vetApi";

const VetAvailability = () => {
  const [availability, setAvailability] = useState([]);
  const [savedAvailability, setSavedAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dirty = JSON.stringify(availability) !== JSON.stringify(savedAvailability);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getMyVetProfile();
      const slots = response.data.vet?.availability || [];
      setAvailability(slots);
      setSavedAvailability(slots);
    } catch (err) {
      const message = err.response?.data?.message || "Could not load availability";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    const invalid = availability.find((slot) => slot.isAvailable && slot.endTime <= slot.startTime);
    if (invalid) return toast.error(`${invalid.day}: end time must be later than start time`);
    setSaving(true);
    try {
      const response = await updateVetAvailability(availability);
      setAvailability(response.data.availability || availability);
      setSavedAvailability(response.data.availability || availability);
      toast.success("Availability saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save availability");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <VetLoader text="Loading availability..." />;
  if (error) return <VetErrorState message={error} onRetry={load} />;

  return (
    <main>
      <VetPageHeader title="Availability" description="Set weekly days and hours owners can book." />
      {dirty && <div className="mb-5 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">You have unsaved availability changes.</div>}
      <section className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <AvailabilityEditor value={availability} onChange={setAvailability} />
        <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-5">
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-300 hover:shadow-cyan-500/30 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-cyan-400/45 disabled:text-slate-950/60 disabled:shadow-none"
          >
            {saving ? "Saving..." : "Save Availability"}
          </button>
          <button
            type="button"
            onClick={() => setAvailability(savedAvailability)}
            disabled={!dirty || saving}
            className="rounded-xl border border-cyan-300/20 px-5 py-3 text-sm font-semibold text-cyan-200 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/45 hover:bg-cyan-400/10 hover:text-white disabled:translate-y-0 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-slate-600"
          >
            Reset Changes
          </button>
        </div>
      </section>
    </main>
  );
};

export default VetAvailability;
