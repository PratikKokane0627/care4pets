import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import ProfileImageUploader from "../../../components/vet/ProfileImageUploader";
import VetErrorState from "../../../components/vet/VetErrorState";
import VetLoader from "../../../components/vet/VetLoader";
import VetPageHeader from "../../../components/vet/VetPageHeader";
import { deleteVetImage, getMyVetProfile, updateMyVetProfile, uploadVetImage } from "../../../services/vetApi";

const inputClass = "w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition hover:border-white/25 focus:border-cyan-400";
const specializations = ["General Veterinary", "Surgery", "Dermatology", "Dentistry", "Cardiology", "Orthopedics", "Emergency Care", "Other"];

const Field = ({ label, children }) => <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>{children}</label>;

const EditVetProfile = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const setAddress = (field, value) => setForm((current) => ({ ...current, clinicAddress: { ...current.clinicAddress, [field]: value } }));

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
      setPreview(vet.profileImage?.url || "");
    } catch (err) {
      const message = err.response?.data?.message || "Could not load profile";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.qualification.trim() || !form.clinicName.trim()) return toast.error("Required profile fields are missing");
    setSaving(true);
    try {
      await updateMyVetProfile({ ...form, experience: Number(form.experience), consultationFee: Number(form.consultationFee) });
      toast.success("Profile updated");
      navigate("/vet/profile");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  const chooseImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be 5 MB or smaller");
    const body = new FormData();
    body.append("image", file);
    setSaving(true);
    try {
      const response = await uploadVetImage(body);
      setPreview(response.data.image?.url || "");
      toast.success("Profile image updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not upload image");
    } finally {
      setSaving(false);
    }
  };

  const removeImage = async () => {
    setSaving(true);
    try {
      await deleteVetImage();
      setPreview("");
      toast.success("Profile image deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete image");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <VetLoader text="Loading edit profile..." />;
  if (error) return <VetErrorState message={error} onRetry={load} />;

  return (
    <main>
      <VetPageHeader title="Edit Profile" description="Update your public veterinarian information." />
      <form onSubmit={save} className="space-y-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <ProfileImageUploader preview={preview} onChoose={chooseImage} onDelete={removeImage} loading={saving} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name *"><input className={inputClass} value={form.name} onChange={(e) => setField("name", e.target.value)} /></Field>
          <Field label="Email *"><input type="email" className={inputClass} value={form.email} onChange={(e) => setField("email", e.target.value)} /></Field>
          <Field label="Phone"><input className={inputClass} value={form.phone} onChange={(e) => setField("phone", e.target.value)} /></Field>
          <Field label="Qualification *"><input className={inputClass} value={form.qualification} onChange={(e) => setField("qualification", e.target.value)} /></Field>
          <Field label="Specialization"><select className={inputClass} value={form.specialization} onChange={(e) => setField("specialization", e.target.value)}>{specializations.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
          <Field label="Experience"><input type="number" min="0" className={inputClass} value={form.experience} onChange={(e) => setField("experience", e.target.value)} /></Field>
          <Field label="Clinic Name *"><input className={inputClass} value={form.clinicName} onChange={(e) => setField("clinicName", e.target.value)} /></Field>
          <Field label="Consultation Fee"><input type="number" min="0" className={inputClass} value={form.consultationFee} onChange={(e) => setField("consultationFee", e.target.value)} /></Field>
          <Field label="Street"><input className={inputClass} value={form.clinicAddress?.street || ""} onChange={(e) => setAddress("street", e.target.value)} /></Field>
          <Field label="City"><input className={inputClass} value={form.clinicAddress?.city || ""} onChange={(e) => setAddress("city", e.target.value)} /></Field>
          <Field label="State"><input className={inputClass} value={form.clinicAddress?.state || ""} onChange={(e) => setAddress("state", e.target.value)} /></Field>
          <Field label="Postal Code"><input className={inputClass} value={form.clinicAddress?.postalCode || ""} onChange={(e) => setAddress("postalCode", e.target.value)} /></Field>
          <Field label="About"><textarea maxLength={1000} className={`${inputClass} min-h-28 resize-y`} value={form.about} onChange={(e) => setField("about", e.target.value)} /></Field>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-60">{saving ? "Saving..." : "Save Profile"}</button>
          <button type="button" onClick={() => navigate("/vet/profile")} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5">Cancel</button>
        </div>
      </form>
    </main>
  );
};

export default EditVetProfile;
