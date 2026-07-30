import { UploadCloud } from "lucide-react";

const ImageUploader = ({
  label = "Choose image",
  multiple = false,
  value,
  onChange,
}) => (
  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-300/35 hover:bg-white/5 hover:text-white">
    <UploadCloud size={18} />
    {value || label}
    <input
      type="file"
      multiple={multiple}
      className="hidden"
      accept="image/*"
      onChange={(event) =>
        onChange(multiple ? [...event.target.files] : event.target.files?.[0] || null)
      }
    />
  </label>
);

export default ImageUploader;
