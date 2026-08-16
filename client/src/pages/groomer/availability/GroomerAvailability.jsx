import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import GroomerAvailabilityEditor from "../../../components/groomer/GroomerAvailabilityEditor";
import GroomerErrorState from "../../../components/groomer/GroomerErrorState";
import GroomerLoader from "../../../components/groomer/GroomerLoader";
import GroomerPageHeader from "../../../components/groomer/GroomerPageHeader";
import { getMyGroomerProfile, updateGroomerAvailability } from "../../../services/groomerApi";

const GroomerAvailability = () => {
  const [initial, setInitial] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const changed = JSON.stringify(initial) !== JSON.stringify(availability);
  useEffect(() => {
    getMyGroomerProfile().then((res) => { setInitial(res.data.profile?.availability || []); setAvailability(res.data.profile?.availability || []); }).catch((err) => setError(err.response?.data?.message || "Could not load availability")).finally(() => setLoading(false));
  }, []);
  const save = async () => {
    const invalid = availability.find((slot) => slot.isAvailable && slot.endTime <= slot.startTime);
    if (invalid) return toast.error(`${invalid.day} end time must be later than start time`);
    setSaving(true);
    try {
      const res = await updateGroomerAvailability(availability);
      setInitial(res.data.availability || availability);
      toast.success("Availability updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update availability");
    } finally {
      setSaving(false);
    }
  };
  if (loading) return <GroomerLoader text="Loading availability..." />;
  if (error) return <GroomerErrorState message={error} />;
  return (
    <main>
      <GroomerPageHeader
        title="Availability"
        description="Manage your weekly grooming availability."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              disabled={!changed || saving}
              onClick={() => setAvailability(initial)}
              className="rounded-xl border border-cyan-300/20 px-5 py-3 text-sm font-semibold text-cyan-200 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/45 hover:bg-cyan-400/10 hover:text-white disabled:translate-y-0 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-slate-600"
            >
              Reset Changes
            </button>
            <button
              type="button"
              disabled={!changed || saving}
              onClick={save}
              className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-300 hover:shadow-cyan-500/30 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-cyan-400/45 disabled:text-slate-950/60 disabled:shadow-none"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        }
      />
      <section className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <GroomerAvailabilityEditor value={availability} onChange={setAvailability} disabled={saving} />
        {changed && <p className="mt-4 text-sm text-amber-300">You have unsaved changes.</p>}
      </section>
    </main>
  );
};

export default GroomerAvailability;
