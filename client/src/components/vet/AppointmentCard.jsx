import { CalendarDays, Clock, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

import { formatDate } from "../../utils/dateUtils";
import { getId, ownerName, petName } from "../../utils/appointmentUtils";
import VetStatusBadge from "./VetStatusBadge";

const AppointmentCard = ({ appointment, actions }) => (
  <article className="rounded-2xl border border-white/10 bg-slate-900 p-5 transition hover:-translate-y-1 hover:border-cyan-300/30">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="font-bold text-white">{appointment.reason || "Veterinary visit"}</h3>
        <p className="mt-1 text-sm text-cyan-200">{petName(appointment.petId)} with {ownerName(appointment.ownerId)}</p>
      </div>
      <VetStatusBadge status={appointment.status} />
    </div>
    <div className="mt-4 space-y-2 text-sm text-slate-400">
      <p className="flex items-center gap-2"><CalendarDays size={16} className="text-cyan-400" /> {formatDate(appointment.appointmentDate)}</p>
      <p className="flex items-center gap-2"><Clock size={16} className="text-cyan-400" /> {appointment.appointmentTime || "Time not set"}</p>
      <p className="flex items-center gap-2"><UserRound size={16} className="text-cyan-400" /> {ownerName(appointment.ownerId)}</p>
    </div>
    <div className="mt-5 flex flex-wrap gap-2 max-sm:[&>*]:w-full">
      <Link to={`/vet/appointments/${getId(appointment)}`} className="inline-flex justify-center rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-cyan-300/35 hover:bg-white/5 hover:text-white">View Details</Link>
      {actions}
    </div>
  </article>
);

export default AppointmentCard;
