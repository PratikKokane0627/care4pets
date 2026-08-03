import { Camera, Trash2 } from "lucide-react";

const ProfileImageUploader = ({
  preview,
  onChoose,
  onUpload,
  onDelete,
  loading,
  selectedName,
  title = "Profile Image",
  showDelete = true,
}) => (
  <div className="rounded-2xl border border-white/10 bg-slate-950 p-6">
    <h2 className="mb-5 font-bold text-white">{title}</h2>
    <div className="mx-auto flex h-44 w-44 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900 text-cyan-300 shadow-xl shadow-cyan-950/20">
      {preview ? (
        <img src={preview} alt="Profile" className="h-full w-full object-cover" />
      ) : (
        <Camera size={46} />
      )}
    </div>
    <p className="mt-4 text-center text-sm text-slate-500">
      {selectedName || (preview ? "Current profile image" : "No profile image")}
    </p>
    <div className="mt-6 grid gap-3">
      <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-white/5 hover:text-white">
        <Camera size={18} /> Choose Image
        <input type="file" accept="image/*" className="hidden" onChange={onChoose} disabled={loading} />
      </label>
      {onUpload && (
        <button type="button" onClick={onUpload} disabled={loading} className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60">
          {loading ? "Uploading..." : "Upload Image"}
        </button>
      )}
      {showDelete && (
        <button type="button" onClick={onDelete} disabled={!preview || loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/30 px-4 py-3 text-sm font-semibold text-red-300 transition hover:-translate-y-0.5 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50">
          <Trash2 size={18} /> Delete Image
        </button>
      )}
    </div>
  </div>
);

export default ProfileImageUploader;
