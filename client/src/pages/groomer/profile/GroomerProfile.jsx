import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import GroomerImageUploader from "../../../components/groomer/GroomerImageUploader";
import GroomerLoader from "../../../components/groomer/GroomerLoader";
import GroomerPageHeader from "../../../components/groomer/GroomerPageHeader";
import GroomerStatusBadge from "../../../components/groomer/GroomerStatusBadge";
import { deleteGroomerImage, getMyGroomerProfile, uploadGroomerImage } from "../../../services/groomerApi";
import { formatDate, personName } from "../../../utils/groomingUtils";

const Info = ({ label, value, className = "" }) => (
  <div className={className}>
    <p className="mb-2 text-sm font-medium text-slate-300">{label}</p>
    <div className="min-h-14 rounded-xl border border-white/10 bg-slate-950 px-5 py-4 text-sm font-semibold leading-6 text-white transition hover:border-cyan-300/25">
      {value || "Not set"}
    </div>
  </div>
);

const GroomerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
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

    setImageLoading(true);
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
      setImageLoading(false);
    }
  };

  const deleteImage = async () => {
    setImageLoading(true);
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
      setImageLoading(false);
    }
  };

  if (loading) return <GroomerLoader text="Loading profile..." />;

  return (
    <main>
      <GroomerPageHeader
        title={personName(user)}
        description="Your groomer account and profile details."
        actions={<Link to="/groomer/profile/edit" className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">Edit Profile</Link>}
      />

      <section className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <GroomerImageUploader
          image={preview}
          loading={imageLoading}
          selectedName={selectedImage?.name}
          onChoose={chooseImage}
          onUpload={uploadImage}
          onDelete={deleteImage}
        />

        <section className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">Profile Details</h2>
              <p className="mt-1 text-sm text-slate-500">Information owners and admins use for grooming bookings.</p>
            </div>
            <GroomerStatusBadge status={profile?.isActive ? "active" : "inactive"} />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Info label="Email" value={user.email} />
            <Info label="Phone" value={user.phone} />
            <Info label="Experience" value={`${profile?.experience || 0} years`} />
            <Info label="Joined" value={formatDate(profile?.createdAt)} />
            <Info label="Bio" value={profile?.bio} className="md:col-span-2" />
            <Info label="Skills" value={profile?.skills?.join(", ")} />
            <Info label="Service Areas" value={profile?.serviceAreas?.join(", ")} />
          </div>
        </section>
      </section>

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
