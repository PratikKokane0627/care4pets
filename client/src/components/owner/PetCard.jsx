import { Edit3, Eye, Trash2 } from "lucide-react";

import StatusBadge from "./StatusBadge";

const fallbackImage =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=80";

const PetCard = ({ pet, onView, onDetails, onEdit, onDelete }) => {
  const image =
    pet?.profileImage?.url || pet?.image?.url || pet?.image || fallbackImage;
  const name = pet?.petName || pet?.name || "Pet";

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-950 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:shadow-2xl hover:shadow-cyan-950/20">
      <div className="aspect-[16/9] overflow-hidden bg-slate-900">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-white">{name}</h3>
            <p className="mt-1 text-sm text-cyan-200">
              {pet?.breed || "Breed not set"} - {pet?.species || "Pet"}
            </p>
          </div>
          <StatusBadge status={pet?.vaccinationStatus || "Pending"} />
        </div>

        <p className="mt-4 text-sm text-slate-400">
          {pet?.age || 0} years - {pet?.gender || "Not set"} -{" "}
          {pet?.weight || 0} kg
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => (onView || onDetails)?.(pet?._id || pet?.id)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-white/5 hover:text-white"
          >
            <Eye size={16} />
            Details
          </button>
          <button
            type="button"
            onClick={() => onEdit?.(pet)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-white/5 hover:text-white"
          >
            <Edit3 size={16} />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(pet?._id || pet?.id)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/30 px-3 py-2.5 text-sm font-semibold text-red-300 transition hover:-translate-y-0.5 hover:bg-red-500/10"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
};

export default PetCard;
