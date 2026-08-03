import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import GroomerImageUploader from "../../../components/groomer/GroomerImageUploader";
import GroomerLoader from "../../../components/groomer/GroomerLoader";
import GroomerPageHeader from "../../../components/groomer/GroomerPageHeader";
import { deleteGroomerImage, getMyGroomerProfile, updateMyGroomerProfile, uploadGroomerImage } from "../../../services/groomerApi";

const inputClass = "w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 hover:border-white/25 focus:border-cyan-400";

const Field = ({ label, children, error, className = "" }) => (
  <label className={`block ${className}`}>
    <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
    {children}
    {error && <p className="mt-1 text-sm text-red-300">{error}</p>}
  </label>
);

const EditGroomerProfile = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ bio: "", experience: "", skills: "", serviceAreas: "" });
  const [profileImage, setProfileImage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageSaving, setImageSaving] = useState(false);

  const preview = useMemo(
    () => (selectedImage ? URL.createObjectURL(selectedImage) : profileImage),
    [profileImage, selectedImage]
  );

  useEffect(() => () => {
    if (selectedImage) URL.revokeObjectURL(preview);
  }, [preview, selectedImage]);

  useEffect(() => {
    getMyGroomerProfile().then((res) => {
      const profile = res.data.profile || {};
      setForm({
        bio: profile.bio || "",
        experience: profile.experience ?? "",
        skills: profile.skills?.join(", ") || "",
        serviceAreas: profile.serviceAreas?.join(", ") || "",
      });
      setProfileImage(profile.userId?.profileImage || "");
    }).finally(() => setLoading(false));
  }, []);

  const syncStoredUserImage = (imageUrl) => {
    const current = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({ ...current, profileImage: imageUrl }));
    window.dispatchEvent(new Event("groomer-profile-updated"));
  };

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
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

    setImageSaving(true);
    try {
      const res = await uploadGroomerImage(selectedImage);
      setProfileImage(res.data.profileImage || "");
      setSelectedImage(null);
      syncStoredUserImage(res.data.profileImage || "");
      toast.success("Profile image uploaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not upload image");
    } finally {
      setImageSaving(false);
    }
  };

  const deleteImage = async () => {
    setImageSaving(true);
    try {
      const res = await deleteGroomerImage();
      setProfileImage(res.data.profileImage || "");
      setSelectedImage(null);
      syncStoredUserImage(res.data.profileImage || "");
      toast.success("Profile image deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete image");
    } finally {
      setImageSaving(false);
    }
  };

  const validate = () => {
    const next = {};
    const experience = Number(form.experience);
    if (!Number.isFinite(experience) || experience < 0) next.experience = "Experience must be zero or greater";
    if (form.bio.length > 1000) next.bio = "Bio cannot exceed 1000 characters";
    setErrors(next);
    return !Object.keys(next).length;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate() || saving) return;
    setSaving(true);
    try {
      await updateMyGroomerProfile({
        bio: form.bio.trim(),
        experience: Number(form.experience),
        skills: form.skills.split(",").map((item) => item.trim()).filter(Boolean),
        serviceAreas: form.serviceAreas.split(",").map((item) => item.trim()).filter(Boolean),
      });
      toast.success("Profile updated");
      navigate("/groomer/profile");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <GroomerLoader text="Loading profile..." />;

  return (
    <main>
      <GroomerPageHeader title="Edit Profile" description="Update your public groomer information." />
      <section className="grid gap-7 rounded-2xl border border-white/10 bg-slate-900 p-5 lg:grid-cols-[320px_1fr]">
        <GroomerImageUploader
          image={preview}
          loading={imageSaving}
          selectedName={selectedImage?.name}
          onChoose={chooseImage}
          onUpload={uploadImage}
          onDelete={deleteImage}
        />

        <form onSubmit={submit} className="grid content-start gap-5 md:grid-cols-2">
          <Field label="Experience *" error={errors.experience}>
            <input type="number" min="0" value={form.experience} onChange={(event) => setField("experience", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Skills">
            <input value={form.skills} onChange={(event) => setField("skills", event.target.value)} placeholder="Bath, Haircut, Nail Trimming" className={inputClass} />
          </Field>
          <Field className="md:col-span-2" label="Service Areas">
            <input value={form.serviceAreas} onChange={(event) => setField("serviceAreas", event.target.value)} placeholder="Bengaluru, Indiranagar" className={inputClass} />
          </Field>
          <Field className="md:col-span-2" label="About" error={errors.bio}>
            <textarea value={form.bio} onChange={(event) => setField("bio", event.target.value)} className={`${inputClass} min-h-36 resize-y`} />
            <p className={`mt-1 text-sm ${form.bio.length > 1000 ? "text-red-300" : "text-slate-500"}`}>{form.bio.length}/1000</p>
          </Field>

          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">{saving ? "Saving..." : "Save Profile"}</button>
            <Link to="/groomer/profile" className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5">Cancel</Link>
          </div>
        </form>
      </section>
    </main>
  );
};

export default EditGroomerProfile;
