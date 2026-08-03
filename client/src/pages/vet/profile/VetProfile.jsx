import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import ProfileImageUploader from "../../../components/vet/ProfileImageUploader";
import VetErrorState from "../../../components/vet/VetErrorState";
import VetLoader from "../../../components/vet/VetLoader";
import VetPageHeader from "../../../components/vet/VetPageHeader";
import VetStatusBadge from "../../../components/vet/VetStatusBadge";
import { deleteVetImage, getMyVetProfile, uploadVetImage } from "../../../services/vetApi";
import { money } from "../../../utils/appointmentUtils";

const Info = ({ label, value, className = "" }) => (
  <div className={className}>
    <p className="mb-2 text-sm font-medium text-slate-300">{label}</p>
    <div className="min-h-14 rounded-xl border border-white/10 bg-slate-950 px-5 py-4 text-sm font-semibold leading-6 text-white transition hover:border-cyan-300/25">
      {value || "Not set"}
    </div>
  </div>
);

const VetProfile = () => {
  const [vet, setVet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState("");
  const preview = useMemo(
    () => (selectedImage ? URL.createObjectURL(selectedImage) : vet?.profileImage?.url || ""),
    [selectedImage, vet?.profileImage?.url]
  );

  useEffect(() => () => {
    if (selectedImage) URL.revokeObjectURL(preview);
  }, [preview, selectedImage]);

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

  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be 5 MB or smaller");
    setSelectedImage(file);
  };

  const uploadImage = async () => {
    if (!selectedImage) return toast.error("Choose an image first");

    const body = new FormData();
    body.append("image", selectedImage);
    setImageLoading(true);
    try {
      const response = await uploadVetImage(body);
      const nextImage = response.data.image;
      setVet((current) => ({ ...current, profileImage: nextImage }));
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...currentUser, profileImage: nextImage?.url || "" }));
      window.dispatchEvent(new Event("vet-profile-updated"));
      setSelectedImage(null);
      toast.success("Profile image uploaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not upload image");
    } finally {
      setImageLoading(false);
    }
  };

  const removeImage = async () => {
    setImageLoading(true);
    try {
      const response = await deleteVetImage();
      setVet((current) => ({ ...current, profileImage: response.data.image }));
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...currentUser, profileImage: "" }));
      window.dispatchEvent(new Event("vet-profile-updated"));
      setSelectedImage(null);
      toast.success("Profile image deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete image");
    } finally {
      setImageLoading(false);
    }
  };

  if (loading) return <VetLoader text="Loading profile..." />;
  if (error) return <VetErrorState message={error} onRetry={load} />;

  return (
    <main>
      <VetPageHeader title={vet?.userId?.name || "Veterinarian Profile"} description="Your public veterinarian profile and approval information." action={<Link to="/vet/profile/edit" className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950">Edit Profile</Link>} />
      <section className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div>
          <ProfileImageUploader
            title="Vet Profile Image"
            preview={preview}
            selectedName={selectedImage?.name}
            onChoose={chooseImage}
            onUpload={uploadImage}
            onDelete={removeImage}
            loading={imageLoading}
          />
          <div className="mt-5 text-center">
            <h2 className="text-xl font-bold text-white">{vet?.userId?.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{vet?.specialization}</p>
            <div className="mt-3"><VetStatusBadge status={vet?.status} /></div>
          </div>
        </div>
        <div className="grid gap-5 rounded-2xl border border-white/10 bg-slate-900 p-5 md:grid-cols-2 xl:grid-cols-3">
          <Info label="Email" value={vet?.userId?.email} />
          <Info label="Phone" value={vet?.userId?.phone} />
          <Info label="Qualification" value={vet?.qualification} />
          <Info label="Experience" value={`${vet?.experience || 0} years`} />
          <Info label="Registration" value={vet?.registrationNumber} />
          <Info label="Clinic" value={vet?.clinicName} />
          <Info label="Fee" value={money(vet?.consultationFee)} />
          <Info label="Rating" value={`${vet?.averageRating || 0} / 5 (${vet?.totalReviews || 0} reviews)`} />
          <Info label="Status" value={vet?.isActive ? "Active" : "Inactive"} />
          <Info className="md:col-span-2 xl:col-span-3" label="Clinic Address" value={[vet?.clinicAddress?.street, vet?.clinicAddress?.city, vet?.clinicAddress?.state, vet?.clinicAddress?.postalCode].filter(Boolean).join(", ")} />
          <Info className="md:col-span-2 xl:col-span-3" label="About" value={vet?.about} />
        </div>
      </section>
    </main>
  );
};

export default VetProfile;
