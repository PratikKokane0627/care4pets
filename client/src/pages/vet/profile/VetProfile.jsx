import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import ProfileImageUploader from "../../../components/vet/ProfileImageUploader";
import VetErrorState from "../../../components/vet/VetErrorState";
import VetLoader from "../../../components/vet/VetLoader";
import VetPageHeader from "../../../components/vet/VetPageHeader";
import VetStatusBadge from "../../../components/vet/VetStatusBadge";
import { deleteVetImage, getMyVetProfile, updateMyVetProfile, uploadVetImage } from "../../../services/vetApi";

const inputClass = "w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 hover:border-white/25 focus:border-cyan-400";
const specializations = ["General Veterinary", "Surgery", "Dermatology", "Dentistry", "Cardiology", "Orthopedics", "Emergency Care", "Other"];

const vetFormFrom = (vet = {}) => ({
  name: vet.userId?.name || "",
  email: vet.userId?.email || "",
  phone: vet.userId?.phone || "",
  qualification: vet.qualification || "",
  specialization: vet.specialization || "General Veterinary",
  experience: vet.experience ?? 0,
  clinicName: vet.clinicName || "",
  clinicAddress: {
    street: vet.clinicAddress?.street || "",
    city: vet.clinicAddress?.city || "",
    state: vet.clinicAddress?.state || "",
    postalCode: vet.clinicAddress?.postalCode || "",
  },
  consultationFee: vet.consultationFee ?? 0,
  about: vet.about || "",
});

const Info = ({ label, value, className = "" }) => (
  <div className={className}>
    <p className="mb-2 text-sm font-medium text-slate-300">{label}</p>
    <div className="min-h-14 rounded-xl border border-white/10 bg-slate-950 px-5 py-4 text-sm font-semibold leading-6 text-white transition hover:border-cyan-300/25">
      {value || "Not set"}
    </div>
  </div>
);

const Field = ({ label, children, className = "" }) => (
  <label className={`block ${className}`}>
    <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
    {children}
  </label>
);

const VetProfile = () => {
  const [vet, setVet] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
      setForm(vetFormFrom(response.data.vet));
    } catch (err) {
      const message = err.response?.data?.message || "Could not load profile";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const setAddress = (field, value) => {
    setForm((current) => ({
      ...current,
      clinicAddress: {
        ...current.clinicAddress,
        [field]: value,
      },
    }));
  };

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
    setUploadLoading(true);
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
      setUploadLoading(false);
    }
  };

  const removeImage = async () => {
    setDeleteLoading(true);
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
      setDeleteLoading(false);
    }
  };

  const resetForm = () => {
    setForm(vetFormFrom(vet));
    setSelectedImage(null);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.qualification.trim() || !form.clinicName.trim()) {
      toast.error("Required profile fields are missing");
      return;
    }

    setSaving(true);
    try {
      const response = await updateMyVetProfile({
        ...form,
        experience: Number(form.experience),
        consultationFee: Number(form.consultationFee),
      });
      const nextVet = response.data.vet;
      setVet(nextVet);
      setForm(vetFormFrom(nextVet));
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({
        ...currentUser,
        name: nextVet.userId?.name || currentUser.name,
        email: nextVet.userId?.email || currentUser.email,
        phone: nextVet.userId?.phone || currentUser.phone,
      }));
      window.dispatchEvent(new Event("vet-profile-updated"));
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <VetLoader text="Loading profile..." />;
  if (error) return <VetErrorState message={error} onRetry={load} />;

  return (
    <main>
      <VetPageHeader
        title={form?.name || vet?.userId?.name || "Veterinarian Profile"}
        description="Your veterinarian account and profile details."
      />

      <form onSubmit={saveProfile} className="grid gap-7 rounded-2xl border border-white/10 bg-slate-900 p-6 lg:grid-cols-[340px_1fr]">
        <div>
          <ProfileImageUploader
            title="Profile Image"
            preview={preview}
            selectedName={selectedImage?.name}
            onChoose={chooseImage}
            onUpload={uploadImage}
            onDelete={removeImage}
            uploadLoading={uploadLoading}
            deleteLoading={deleteLoading}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <button type="submit" disabled={saving} className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">
              {saving ? "Saving..." : "Save Profile"}
            </button>
            <button type="button" onClick={resetForm} disabled={saving} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-60">
              Cancel
            </button>
          </div>
        </div>

        <div className="content-start">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">Profile Details</h2>
              <p className="mt-1 text-sm text-slate-500">Information owners and admins use for appointment bookings.</p>
            </div>
            <VetStatusBadge status={vet?.status} />
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Name *"><input className={inputClass} value={form?.name || ""} onChange={(event) => setField("name", event.target.value)} /></Field>
            <Field label="Email *"><input type="email" className={inputClass} value={form?.email || ""} onChange={(event) => setField("email", event.target.value)} /></Field>
            <Field label="Phone"><input className={inputClass} value={form?.phone || ""} onChange={(event) => setField("phone", event.target.value)} /></Field>
            <Field label="Qualification *"><input className={inputClass} value={form?.qualification || ""} onChange={(event) => setField("qualification", event.target.value)} /></Field>
            <Field label="Specialization"><select className={inputClass} value={form?.specialization || "General Veterinary"} onChange={(event) => setField("specialization", event.target.value)}>{specializations.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
            <Field label="Experience"><input type="number" min="0" className={inputClass} value={form?.experience ?? 0} onChange={(event) => setField("experience", event.target.value)} /></Field>
            <Info label="Registration" value={vet?.registrationNumber} />
            <Field label="Clinic *"><input className={inputClass} value={form?.clinicName || ""} onChange={(event) => setField("clinicName", event.target.value)} /></Field>
            <Field label="Fee"><input type="number" min="0" className={inputClass} value={form?.consultationFee ?? 0} onChange={(event) => setField("consultationFee", event.target.value)} /></Field>
            <Info label="Rating" value={`${vet?.averageRating || 0} / 5 (${vet?.totalReviews || 0} reviews)`} />
            <Info label="Account Status" value={vet?.isActive ? "Active" : "Inactive"} />
            <div className="md:col-span-2 xl:col-span-3 border-t border-white/10 pt-5">
              <h2 className="text-lg font-bold text-white">Clinic Address</h2>
              <p className="mt-1 text-sm text-slate-500">Shown to owners when they book appointments.</p>
            </div>
            <Field className="md:col-span-2 xl:col-span-3" label="Street"><input className={inputClass} value={form?.clinicAddress?.street || ""} onChange={(event) => setAddress("street", event.target.value)} /></Field>
            <Field label="City"><input className={inputClass} value={form?.clinicAddress?.city || ""} onChange={(event) => setAddress("city", event.target.value)} /></Field>
            <Field label="State"><input className={inputClass} value={form?.clinicAddress?.state || ""} onChange={(event) => setAddress("state", event.target.value)} /></Field>
            <Field label="Postal Code"><input className={inputClass} value={form?.clinicAddress?.postalCode || ""} onChange={(event) => setAddress("postalCode", event.target.value)} /></Field>
            <Field className="md:col-span-2 xl:col-span-3" label="About"><textarea maxLength={1000} className={`${inputClass} min-h-32 resize-y`} value={form?.about || ""} onChange={(event) => setField("about", event.target.value)} /></Field>
          </div>
        </div>
      </form>
    </main>
  );
};

export default VetProfile;
