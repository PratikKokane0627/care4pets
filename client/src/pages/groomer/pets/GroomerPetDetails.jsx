import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import GroomerDataTable from "../../../components/groomer/GroomerDataTable";
import GroomerLoader from "../../../components/groomer/GroomerLoader";
import GroomerPageHeader from "../../../components/groomer/GroomerPageHeader";
import { getGroomerBookings } from "../../../services/groomerApi";
import { formatDate, getId, money, personName, petName, serviceName } from "../../../utils/groomingUtils";

const Info = ({ label, value }) => <div className="rounded-xl border border-white/10 bg-slate-950 p-4"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-2 text-sm font-semibold text-white">{value || "Not set"}</p></div>;

const GroomerPetDetails = () => {
  const { id } = useParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getGroomerBookings({ limit: 50 }).then((res) => setBookings(res.data.bookings || [])).finally(() => setLoading(false)); }, []);
  const petBookings = bookings.filter((booking) => getId(booking.petId) === id);
  const pet = petBookings[0]?.petId;
  const owner = petBookings[0]?.ownerId;
  if (loading) return <GroomerLoader text="Loading pet..." />;
  return <main><GroomerPageHeader title={petName(pet)} description="Pet details scoped to your assigned grooming bookings." actions={<Link to="/groomer/pets" className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300">Back</Link>} /><section className="mb-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-900 p-5 md:grid-cols-[160px_1fr]"><div className="aspect-square overflow-hidden rounded-2xl bg-slate-950">{pet?.profileImage ? <img src={pet.profileImage?.url || pet.profileImage} alt={petName(pet)} className="h-full w-full object-cover" /> : null}</div><div className="grid gap-4 md:grid-cols-3"><Info label="Owner" value={personName(owner)} /><Info label="Species" value={pet?.species} /><Info label="Breed" value={pet?.breed} /><Info label="Gender" value={pet?.gender} /><Info label="Age" value={pet?.age} /><Info label="Weight" value={pet?.weight} /></div></section><GroomerDataTable data={petBookings} emptyTitle="No grooming history" columns={[{ header: "Service", render: (b) => serviceName(b.serviceId) }, { header: "Date", render: (b) => `${formatDate(b.bookingDate)} ${b.bookingTime}` }, { header: "Price", render: (b) => money(b.price) }, { header: "Status", render: (b) => b.status }, { header: "Notes", render: (b) => b.groomerNotes || "None" }, { header: "Actions", render: (b) => <Link to={`/groomer/bookings/${getId(b)}`} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300">View</Link> }]} /></main>;
};

export default GroomerPetDetails;
