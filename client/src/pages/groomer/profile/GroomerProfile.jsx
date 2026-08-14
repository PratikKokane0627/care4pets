import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import GroomerImageUploader from "../../../components/groomer/GroomerImageUploader";
import GroomerLoader from "../../../components/groomer/GroomerLoader";
import GroomerPageHeader from "../../../components/groomer/GroomerPageHeader";
import GroomerStatusBadge from "../../../components/groomer/GroomerStatusBadge";
import { deleteGroomerImage, getMyGroomerProfile, updateMyGroomerProfile, uploadGroomerImage } from "../../../services/groomerApi";
import { formatDate, personName } from "../../../utils/groomingUtils";

const inputClass = "w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 hover:border-white/25 focus:border-cyan-400";

const groomerFormFrom = (profile = {}) => ({
  name: profile.userId?.name || "",
  email: profile.userId?.email || "",
  phone: profile.userId?.phone || "",
  bio: profile.bio || "",
  experience: profile.experience ?? "",
  skills: profile.skills?.join(", ") || "",
  serviceAreas: profile.serviceAreas?.join(", ") || "",
});

const Info = ({ label, value, className = "" }) => (
  <div className={className}>
    <p className="mb-2 text-sm font-medium text-slate-300">{label}</p>
    <div className="min-h-14 rounded-xl border border-white/10 bg-slate-950 px-5 py-4 text-sm font-semibold leading-6 text-white transition hover:border-cyan-300/25">
      {value || "Not set"}
    </div>
  </div>
);

const Field = ({ label, children, error, className = "" }) => (
  <label className={`block ${className}`}>
    <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
    {children}
    {error && <p className="mt-1 text-sm text-red-300">{error}</p>}
  </label>
);

const GroomerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(groomerFormFrom());
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const user = profile?.userId || {};
  const preview = useMemo(
    () => (selectedImage ? URL.createObjectURL(selectedImage) : user.profileImage || ""),
    [selectedImage, user.profileImage]
  );

  useEffect(() => () => {
    if (selectedImage) URL.revokeObjectURL(preview);
  }, [preview, selectedImage]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyGroomerProfile();
      setProfile(res.data.profile);
      setForm(groomerFormFrom(res.data.profile || {}));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const syncStoredUserImage = (profileImage) => {
    const current = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({ ...current, profileImage }));
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

    setUploadLoading(true);
    try {
      const res = await uploadGroomerImage(selectedImage);
      setProfile((current) => ({
        ...current,
        userId: {
          ...(current?.userId || {}),
          profileImage: res.data.profileImage,
        },
      }));
      syncStoredUserImage(res.data.profileImage);
      setSelectedImage(null);
      toast.success("Profile image uploaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not upload image");
    } finally {
      setUploadLoading(false);
    }
  };

  const deleteImage = async () => {
    setDeleteLoading(true);
    try {
      const res = await deleteGroomerImage();
      setProfile((current) => ({
        ...current,
        userId: {
          ...(current?.userId || {}),
          profileImage: res.data.profileImage,
        },
      }));
      syncStoredUserImage(res.data.profileImage);
      setSelectedImage(null);
      toast.success("Profile image deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete image");
    } finally {
      setDeleteLoading(false);
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

  const resetForm = () => {
    setForm(groomerFormFrom(profile || {}));
    setErrors({});
    setSelectedImage(null);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!validate() || saving) return;
    setSaving(true);
    try {
      const res = await updateMyGroomerProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        experience: Number(form.experience),
        skills: form.skills.split(",").map((item) => item.trim()).filter(Boolean),
        serviceAreas: form.serviceAreas.split(",").map((item) => item.trim()).filter(Boolean),
      });
      const nextProfile = res.data.profile || profile;
      setProfile((current) => ({
        ...(current || {}),
        ...nextProfile,
        userId: nextProfile.userId || current?.userId || profile?.userId,
      }));
      setForm(groomerFormFrom(nextProfile || {}));
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({
        ...currentUser,
        name: nextProfile.userId?.name || currentUser.name,
        email: nextProfile.userId?.email || currentUser.email,
        phone: nextProfile.userId?.phone || currentUser.phone,
      }));
      window.dispatchEvent(new Event("groomer-profile-updated"));
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <GroomerLoader text="Loading profile..." />;

  return (
    <main>
      <GroomerPageHeader
        title={personName(user)}
        description="Your groomer account and profile details."
      />

      <form onSubmit={saveProfile} className="grid gap-7 rounded-2xl border border-white/10 bg-slate-900 p-6 lg:grid-cols-[340px_1fr]">
        <div>
          <GroomerImageUploader
            image={preview}
            uploadLoading={uploadLoading}
            deleteLoading={deleteLoading}
            selectedName={selectedImage?.name}
            onChoose={chooseImage}
            onUpload={uploadImage}
            onDelete={deleteImage}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <button type="submit" disabled={saving} className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">{saving ? "Saving..." : "Save Profile"}</button>
            <button type="button" onClick={resetForm} disabled={saving} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-60">Cancel</button>
          </div>
        </div>

        <div className="content-start">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">Profile Details</h2>
              <p className="mt-1 text-sm text-slate-500">Information owners and admins use for grooming bookings.</p>
            </div>
            <GroomerStatusBadge status={profile?.isActive ? "active" : "inactive"} />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Name">
              <input value={form.name} onChange={(event) => setField("name", event.target.value)} className={inputClass} />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={(event) => setField("email", event.target.value)} className={inputClass} />
            </Field>
            <Field label="Phone">
              <input value={form.phone} onChange={(event) => setField("phone", event.target.value)} className={inputClass} />
            </Field>
            <Info label="Joined" value={formatDate(profile?.createdAt)} />
            <Field label="Experience *" error={errors.experience}>
              <input type="number" min="0" value={form.experience} onChange={(event) => setField("experience", event.target.value)} className={inputClass} />
            </Field>
            <Field label="Skills">
              <input value={form.skills} onChange={(event) => setField("skills", event.target.value)} placeholder="Bath, Haircut, Nail Trimming" className={inputClass} />
            </Field>
            <Field className="md:col-span-2" label="Service Areas">
              <input value={form.serviceAreas} onChange={(event) => setField("serviceAreas", event.target.value)} placeholder="Bengaluru, Indiranagar" className={inputClass} />
            </Field>
            <Field className="md:col-span-2" label="Bio" error={errors.bio}>
              <textarea value={form.bio} onChange={(event) => setField("bio", event.target.value)} className={`${inputClass} min-h-36 resize-y`} />
              <p className={`mt-1 text-sm ${form.bio.length > 1000 ? "text-red-300" : "text-slate-500"}`}>{form.bio.length}/1000</p>
            </Field>
          </div>
        </div>
      </form>

      <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <h2 className="mb-4 text-lg font-bold text-white">Availability</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {profile?.availability?.length ? profile.availability.map((slot) => (
            <div key={slot.day} className={`rounded-xl border p-4 ${slot.isAvailable ? "border-emerald-300/20 bg-emerald-500/10" : "border-white/10 bg-slate-950"}`}>
              <p className="font-semibold text-white">{slot.day}</p>
              <p className={`mt-1 text-sm ${slot.isAvailable ? "text-emerald-300" : "text-slate-500"}`}>
                {slot.isAvailable ? `${slot.startTime} - ${slot.endTime}` : "Not available"}
              </p>
            </div>
          )) : <p className="text-sm text-slate-400">No availability added.</p>}
        </div>
      </section>
    </main>
  );
};

export default GroomerProfile;
