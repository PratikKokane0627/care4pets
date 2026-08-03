import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import GroomerDataTable from "../../../components/groomer/GroomerDataTable";
import GroomerLoader from "../../../components/groomer/GroomerLoader";
import GroomerPageHeader from "../../../components/groomer/GroomerPageHeader";
import { getGroomerBookings } from "../../../services/groomerApi";
import { formatDate, getId, money, personName, petName, serviceName } from "../../../utils/groomingUtils";

const Info = ({ label, value }) => <div className="rounded-xl border border-white/10 bg-slate-950 p-4"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-2 text-sm font-semibold text-white">{value || "Not set"}</p></div>;

const GroomerCustomerDetails = () => {
  const { id } = useParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getGroomerBookings({ limit: 50 }).then((res) => setBookings(res.data.bookings || [])).finally(() => setLoading(false)); }, []);
  const customerBookings = bookings.filter((booking) => getId(booking.ownerId) === id);
  const owner = customerBookings[0]?.ownerId;
  const pets = useMemo(() => Array.from(new Map(customerBookings.map((booking) => [getId(booking.petId), booking.petId])).values()), [customerBookings]);
  if (loading) return <GroomerLoader text="Loading customer..." />;
  return <main><GroomerPageHeader title={personName(owner)} description="Customer details scoped to your assigned grooming bookings." actions={<Link to="/groomer/customers" className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300">Back</Link>} /><section className="mb-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-900 p-5 md:grid-cols-3"><Info label="Email" value={owner?.email} /><Info label="Phone" value={owner?.phone} /><Info label="Pets seen" value={pets.length} /></section><GroomerDataTable data={customerBookings} emptyTitle="No bookings found" columns={[{ header: "Pet", render: (b) => petName(b.petId) }, { header: "Service", render: (b) => serviceName(b.serviceId) }, { header: "Date", render: (b) => `${formatDate(b.bookingDate)} ${b.bookingTime}` }, { header: "Price", render: (b) => money(b.price) }, { header: "Notes", render: (b) => b.groomerNotes || "None" }, { header: "Actions", render: (b) => <Link to={`/groomer/bookings/${getId(b)}`} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300">View</Link> }]} /></main>;
};

export default GroomerCustomerDetails;
