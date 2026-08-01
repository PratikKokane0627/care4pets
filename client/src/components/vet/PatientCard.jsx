import { Link } from "react-router-dom";

import { formatDate } from "../../utils/dateUtils";
import { getId, imageUrl, ownerName, petName } from "../../utils/appointmentUtils";

const PatientCard = ({ row }) => {
  const pet = row.pet || row;
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900 transition hover:-translate-y-1 hover:border-cyan-300/30">
      <div className="aspect-[16/9] bg-slate-950">
        {imageUrl(pet) && <img src={imageUrl(pet)} alt={petName(pet)} className="h-full w-full object-cover" />}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-white">{petName(pet)}</h3>
        <p className="mt-1 text-sm text-cyan-200">{pet.species || "Pet"} - {pet.breed || "Breed not set"}</p>
        <div className="mt-4 space-y-2 text-sm text-slate-400">
          <p>Owner: {ownerName(row.owner || pet.ownerId)}</p>
          <p>Consultations: {row.appointmentCount || 0}</p>
          <p>Last visit: {formatDate(row.lastConsultationDate)}</p>
        </div>
        <Link to={`/vet/patients/${getId(pet)}`} className="mt-5 inline-flex w-full justify-center rounded-xl border border-cyan-400/30 px-4 py-2.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950">View Patient</Link>
      </div>
    </article>
  );
};

export default PatientCard;
