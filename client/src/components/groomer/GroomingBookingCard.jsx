import { Link } from "react-router-dom";
import { Clock, PawPrint, UserRound } from "lucide-react";

import { formatDate, getId, money, personName, petName, serviceName } from "../../utils/groomingUtils";
import GroomerStatusBadge from "./GroomerStatusBadge";

const GroomingBookingCard = ({ booking, actions }) => (
  <article className="rounded-2xl border border-white/10 bg-slate-900 p-5 transition hover:border-cyan-300/30">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-bold text-white">{serviceName(booking.serviceId)}</h3>
        <p className="mt-1 text-sm text-slate-500">#{String(getId(booking)).slice(-8)}</p>
      </div>
      <GroomerStatusBadge status={booking.status} />
    </div>
    <div className="mt-4 grid gap-3 text-sm text-slate-400 sm:grid-cols-2">
      <p className="flex items-center gap-2"><PawPrint size={16} /> {petName(booking.petId)}</p>
      <p className="flex items-center gap-2"><UserRound size={16} /> {personName(booking.ownerId)}</p>
      <p className="flex items-center gap-2"><Clock size={16} /> {formatDate(booking.bookingDate)} at {booking.bookingTime}</p>
      <p>{money(booking.price)} · {booking.duration || 0} min</p>
    </div>
    {booking.specialInstructions && <p className="mt-4 rounded-xl bg-slate-950 p-3 text-sm text-slate-400">{booking.specialInstructions}</p>}
    <div className="mt-5 flex flex-wrap gap-2">
      <Link to={`/groomer/bookings/${getId(booking)}`} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:border-cyan-300/40">View Details</Link>
      {actions}
    </div>
  </article>
);

export default GroomingBookingCard;
