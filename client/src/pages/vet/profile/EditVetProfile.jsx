import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import ProfileImageUploader from "../../../components/vet/ProfileImageUploader";
import VetErrorState from "../../../components/vet/VetErrorState";
import VetLoader from "../../../components/vet/VetLoader";
import VetPageHeader from "../../../components/vet/VetPageHeader";
import { deleteVetImage, getMyVetProfile, updateMyVetProfile, uploadVetImage } from "../../../services/vetApi";

const inputClass = "w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 hover:border-white/25 focus:border-cyan-400";
const specializations = ["General Veterinary", "Surgery", "Dermatology", "Dentistry", "Cardiology", "Orthopedics", "Emergency Care", "Other"];

const Field = ({ label, children, className = "" }) => (
  <label className={`block ${className}`}>
    <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
    {children}
  </label>
);

const EditVetProfile = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [profileImage, setProfileImage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageSaving, setImageSaving] = useState(false);
  const [error, setError] = useState("");

  const preview = useMemo(
    () => (selectedImage ? URL.createObjectURL(selectedImage) : profileImage),
    [profileImage, selectedImage]
  );

  useEffect(() => () => {
    if (selectedImage) URL.revokeObjectURL(preview);
  }, [preview, selectedImage]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const setAddress = (field, value) =>
    setForm((current) => ({
      ...current,
      clinicAddress: { ...current.clinicAddress, [field]: value },
    }));

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getMyVetProfile();
      const vet = response.data.vet;
      setForm({
        name: vet.userId?.name || "",
        email: vet.userId?.email || "",
        phone: vet.userId?.phone || "",
        qualification: vet.qualification || "",
        specialization: vet.specialization || "General Veterinary",
        experience: vet.experience || 0,
        clinicName: vet.clinicName || "",
        clinicAddress: vet.clinicAddress || {},
        consultationFee: vet.consultationFee || 0,
        about: vet.about || "",
      });
      setProfileImage(vet.profileImage?.url || "");
    } catch (err) {
      const message = err.response?.data?.message || "Could not load profile";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const syncStoredUserImage = (imageUrl) => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({ ...currentUser, profileImage: imageUrl }));
    window.dispatchEvent(new Event("vet-profile-updated"));
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
    setImageSaving(true);
    try {
      const response = await uploadVetImage(body);
      const imageUrl = response.data.image?.url || "";
      setProfileImage(imageUrl);
      setSelectedImage(null);
      syncStoredUserImage(imageUrl);
      toast.success("Profile image uploaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not upload image");
    } finally {
      setImageSaving(false);
    }
  };

  const removeImage = async () => {
    setImageSaving(true);
    try {
      await deleteVetImage();
      setProfileImage("");
      setSelectedImage(null);
      syncStoredUserImage("");
      toast.success("Profile image deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete image");
    } finally {
      setImageSaving(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.qualification.trim() || !form.clinicName.trim()) {
      return toast.error("Required profile fields are missing");
    }

    setSaving(true);
    try {
      await updateMyVetProfile({
        ...form,
        experience: Number(form.experience),
        consultationFee: Number(form.consultationFee),
      });
      toast.success("Profile updated");
      navigate("/vet/profile");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <VetLoader text="Loading edit profile..." />;
  if (error) return <VetErrorState message={error} onRetry={load} />;

  return (
    <main>
      <VetPageHeader title="Edit Profile" description="Update your public veterinarian information." />
      <section className="grid gap-7 rounded-2xl border border-white/10 bg-slate-900 p-5 lg:grid-cols-[320px_1fr]">
        <ProfileImageUploader
          title="Vet Profile Image"
          preview={preview}
          selectedName={selectedImage?.name}
          onChoose={chooseImage}
          onUpload={uploadImage}
          onDelete={removeImage}
          loading={imageSaving}
        />

        <form onSubmit={save} className="grid content-start gap-5 md:grid-cols-2">
          <Field label="Name *"><input className={inputClass} value={form.name} onChange={(event) => setField("name", event.target.value)} /></Field>
          <Field label="Email *"><input type="email" className={inputClass} value={form.email} onChange={(event) => setField("email", event.target.value)} /></Field>
          <Field label="Phone"><input className={inputClass} value={form.phone} onChange={(event) => setField("phone", event.target.value)} /></Field>
          <Field label="Qualification *"><input className={inputClass} value={form.qualification} onChange={(event) => setField("qualification", event.target.value)} /></Field>
          <Field label="Specialization"><select className={inputClass} value={form.specialization} onChange={(event) => setField("specialization", event.target.value)}>{specializations.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
          <Field label="Experience"><input type="number" min="0" className={inputClass} value={form.experience} onChange={(event) => setField("experience", event.target.value)} /></Field>
          <Field label="Clinic Name *"><input className={inputClass} value={form.clinicName} onChange={(event) => setField("clinicName", event.target.value)} /></Field>
          <Field label="Consultation Fee"><input type="number" min="0" className={inputClass} value={form.consultationFee} onChange={(event) => setField("consultationFee", event.target.value)} /></Field>

          <div className="md:col-span-2 border-t border-white/10 pt-5">
            <h2 className="text-lg font-bold text-white">Clinic Address</h2>
            <p className="mt-1 text-sm text-slate-500">Shown to owners when they book appointments.</p>
          </div>
          <Field className="md:col-span-2" label="Street"><input className={inputClass} value={form.clinicAddress?.street || ""} onChange={(event) => setAddress("street", event.target.value)} /></Field>
          <Field label="City"><input className={inputClass} value={form.clinicAddress?.city || ""} onChange={(event) => setAddress("city", event.target.value)} /></Field>
          <Field label="State"><input className={inputClass} value={form.clinicAddress?.state || ""} onChange={(event) => setAddress("state", event.target.value)} /></Field>
          <Field label="Postal Code"><input className={inputClass} value={form.clinicAddress?.postalCode || ""} onChange={(event) => setAddress("postalCode", event.target.value)} /></Field>
          <Field className="md:col-span-2" label="About"><textarea maxLength={1000} className={`${inputClass} min-h-32 resize-y`} value={form.about} onChange={(event) => setField("about", event.target.value)} /></Field>

          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">{saving ? "Saving..." : "Save Profile"}</button>
            <button type="button" onClick={() => navigate("/vet/profile")} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5">Cancel</button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default EditVetProfile;
