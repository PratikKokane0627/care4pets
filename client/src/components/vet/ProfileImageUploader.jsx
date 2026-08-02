import { Camera, Trash2 } from "lucide-react";

const ProfileImageUploader = ({ preview, onChoose, onDelete, loading, showDelete = true }) => (
  <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-slate-900 text-cyan-300">
        {preview ? <img src={preview} alt="Profile" className="h-full w-full object-cover" /> : <Camera size={34} />}
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
          <Camera size={16} /> Choose Image
          <input type="file" accept="image/*" className="hidden" onChange={onChoose} disabled={loading} />
        </label>
        {showDelete && (
          <button type="button" onClick={onDelete} disabled={!preview || loading} className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50">
            <Trash2 size={16} /> Delete
          </button>
        )}
      </div>
    </div>
  </div>
);

export default ProfileImageUploader;
