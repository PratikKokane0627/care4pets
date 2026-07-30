import { Camera, Trash2, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import Loader from "../../../components/owner/Loader";
import PageHeader from "../../../components/owner/PageHeader";
import useFetch from "../../../hooks/useFetch";
import api from "../../../services/api";
import {
  Button,
  ErrorState,
  Field,
  Panel,
  profileImageUrl,
  syncStoredUser,
} from "../ownerShared";

const OwnerProfile = () => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imageSaving, setImageSaving] = useState(false);

  const preview = useMemo(
    () => (selectedImage ? URL.createObjectURL(selectedImage) : profileImageUrl(user)),
    [selectedImage, user]
  );

  useEffect(() => () => {
    if (selectedImage) URL.revokeObjectURL(preview);
  }, [preview, selectedImage]);

  const { loading, error } = useFetch(async () => {
    const response = await api.get("/auth/profile");
    const nextUser = response.data.user || response.data;
    setUser(nextUser);
    setForm({
      name: nextUser.name || "",
      email: nextUser.email || "",
      phone: nextUser.phone || "",
      address: {
        street: nextUser.address?.street || "",
        city: nextUser.address?.city || "",
        state: nextUser.address?.state || "",
        zipCode: nextUser.address?.zipCode || "",
      },
    });
    syncStoredUser(nextUser);
  }, "owner-profile");

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const setAddressField = (field, value) =>
    setForm((current) => ({
      ...current,
      address: {
        ...current.address,
        [field]: value,
      },
    }));

  const updateProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await api.put("/auth/profile", form);
      const nextUser = response.data.user || response.data;
      setUser(nextUser);
      syncStoredUser(nextUser);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) return toast.error("Choose an image first");
    setImageSaving(true);
    try {
      const body = new FormData();
      body.append("image", selectedImage);
      const response = await api.put("/auth/profile/image", body);
      const nextUser = response.data.user || { ...user, profileImage: response.data.profileImage };
      setUser(nextUser);
      syncStoredUser(nextUser);
      setSelectedImage(null);
      toast.success("Profile image updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not upload image");
    } finally {
      setImageSaving(false);
    }
  };

  const deleteImage = async () => {
    setImageSaving(true);
    try {
      const response = await api.delete("/auth/profile/image");
      const nextUser = response.data.user || { ...user, profileImage: "" };
      setUser(nextUser);
      syncStoredUser(nextUser);
      setSelectedImage(null);
      toast.success("Profile image deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete image");
    } finally {
      setImageSaving(false);
    }
  };

  if (loading) return <Loader label="Loading profile" />;

  return (
    <main>
      <PageHeader title="Profile" description="View and update owner profile information." />
      <ErrorState message={error} />
      <Panel className="grid gap-7 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-950 p-6">
          <h2 className="mb-5 font-bold text-white">Owner Profile Image</h2>
          <div className="mx-auto flex aspect-square w-44 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
            {preview ? (
              <img src={preview} alt={form.name || "Owner"} className="h-full w-full object-cover" />
            ) : (
              <UserRound className="text-slate-500" size={64} />
            )}
          </div>
          <p className="mt-3 text-center text-sm text-slate-500">
            {selectedImage ? selectedImage.name : preview ? "Current profile image" : "No profile image"}
          </p>
          <label className="mt-6 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-white/5 hover:text-white">
            <Camera size={18} />
            Choose Image
            <input type="file" accept="image/*" className="hidden" onChange={(event) => setSelectedImage(event.target.files?.[0] || null)} />
          </label>
          <Button className="mt-4 w-full" onClick={uploadImage} disabled={imageSaving}>
            {imageSaving ? "Saving..." : "Upload Image"}
          </Button>
          {(preview || selectedImage) && (
            <Button variant="danger" className="mt-4 w-full" onClick={deleteImage} disabled={imageSaving}>
              <Trash2 size={18} />
              Delete Image
            </Button>
          )}
        </div>

        <form onSubmit={updateProfile} className="grid content-start gap-5 md:grid-cols-2">
          <Field label="Name" value={form.name} onChange={(value) => setField("name", value)} required />
          <Field label="Email" type="email" value={form.email} onChange={(value) => setField("email", value)} required />
          <Field label="Phone" value={form.phone} onChange={(value) => setField("phone", value)} required />
          <div className="md:col-span-2">
            <div className="mb-1 mt-2 border-t border-white/10 pt-5">
              <h2 className="text-lg font-bold text-white">Address</h2>
              <p className="mt-1 text-sm text-slate-500">Used for orders, appointments and service visits.</p>
            </div>
          </div>
          <Field className="md:col-span-2" label="Street address" value={form.address.street} onChange={(value) => setAddressField("street", value)} />
          <Field label="City" value={form.address.city} onChange={(value) => setAddressField("city", value)} />
          <Field label="State" value={form.address.state} onChange={(value) => setAddressField("state", value)} />
          <Field label="Zip code" value={form.address.zipCode} onChange={(value) => setAddressField("zipCode", value)} />
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>{saving ? "Updating..." : "Update Profile"}</Button>
          </div>
        </form>
      </Panel>
    </main>
  );
};

export default OwnerProfile;

