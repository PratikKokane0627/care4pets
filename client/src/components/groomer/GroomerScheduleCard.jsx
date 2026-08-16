import { Link } from "react-router-dom";

import { formatDate, getId, personName, petName, serviceName } from "../../utils/groomingUtils";
import GroomerStatusBadge from "./GroomerStatusBadge";

const GroomerScheduleCard = ({ booking, highlighted = false, compact = false }) => (
  <Link
    to={`/groomer/bookings/${getId(booking)}`}
    className={`block rounded-2xl border ${compact ? "p-3.5" : "p-4"} transition hover:-translate-y-1 hover:border-cyan-300/40 ${
      highlighted ? "border-cyan-300/50 bg-cyan-400/10" : "border-white/10 bg-slate-950"
    }`}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-cyan-200">
          {formatDate(booking.bookingDate)} - {booking.bookingTime}
        </p>
        <h3 className={`${compact ? "mt-1 text-sm" : "mt-1"} line-clamp-2 font-bold text-white`}>
          {serviceName(booking.serviceId)}
        </h3>
      </div>
      <GroomerStatusBadge status={booking.status} />
    </div>
    <p className={`${compact ? "mt-2" : "mt-3"} text-sm text-slate-400`}>
      {petName(booking.petId)} - {personName(booking.ownerId)}
    </p>
  </Link>
);

export default GroomerScheduleCard;
