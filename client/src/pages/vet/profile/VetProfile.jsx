import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import VetErrorState from "../../../components/vet/VetErrorState";
import VetLoader from "../../../components/vet/VetLoader";
import VetPageHeader from "../../../components/vet/VetPageHeader";
import VetStatusBadge from "../../../components/vet/VetStatusBadge";
import { getMyVetProfile } from "../../../services/vetApi";
import { money } from "../../../utils/appointmentUtils";

const Info = ({ label, value }) => <div className="rounded-xl border border-white/10 bg-slate-950 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><div className="mt-2 text-sm font-semibold text-white">{value || "Not set"}</div></div>;

const VetProfile = () => {
  const [vet, setVet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getMyVetProfile();
      setVet(response.data.vet);
    } catch (err) {
      const message = err.response?.data?.message || "Could not load profile";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <VetLoader text="Loading profile..." />;
  if (error) return <VetErrorState message={error} onRetry={load} />;

  return (
    <main>
      <VetPageHeader title={vet?.userId?.name || "Veterinarian Profile"} description="Your public veterinarian profile and approval information." action={<Link to="/vet/profile/edit" className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950">Edit Profile</Link>} />
      <section className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <div className="mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-2xl bg-slate-950 text-cyan-300">
            {vet?.profileImage?.url ? <img src={vet.profileImage.url} alt={vet.userId?.name} className="h-full w-full object-cover" /> : "No image"}
          </div>
          <div className="mt-5 text-center">
            <h2 className="text-xl font-bold text-white">{vet?.userId?.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{vet?.specialization}</p>
            <div className="mt-3"><VetStatusBadge status={vet?.status} /></div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Info label="Email" value={vet?.userId?.email} />
          <Info label="Phone" value={vet?.userId?.phone} />
          <Info label="Qualification" value={vet?.qualification} />
          <Info label="Experience" value={`${vet?.experience || 0} years`} />
          <Info label="Registration" value={vet?.registrationNumber} />
          <Info label="Clinic" value={vet?.clinicName} />
          <Info label="Fee" value={money(vet?.consultationFee)} />
          <Info label="Rating" value={`${vet?.averageRating || 0} / 5 (${vet?.totalReviews || 0} reviews)`} />
          <Info label="Status" value={vet?.isActive ? "Active" : "Inactive"} />
          <div className="md:col-span-2 xl:col-span-3"><Info label="Clinic Address" value={[vet?.clinicAddress?.street, vet?.clinicAddress?.city, vet?.clinicAddress?.state, vet?.clinicAddress?.postalCode].filter(Boolean).join(", ")} /></div>
          <div className="md:col-span-2 xl:col-span-3"><Info label="About" value={vet?.about} /></div>
        </div>
      </section>
    </main>
  );
};

export default VetProfile;
