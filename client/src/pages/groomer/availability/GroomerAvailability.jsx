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
  return <main><GroomerPageHeader title="Availability" description="Manage your weekly grooming availability." actions={<><button type="button" disabled={!changed || saving} onClick={() => setAvailability(initial)} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 disabled:opacity-50">Reset</button><button type="button" disabled={!changed || saving} onClick={save} className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button></>} /><section className="rounded-2xl border border-white/10 bg-slate-900 p-5"><GroomerAvailabilityEditor value={availability} onChange={setAvailability} disabled={saving} />{changed && <p className="mt-4 text-sm text-amber-300">You have unsaved changes.</p>}</section></main>;
};

export default GroomerAvailability;
