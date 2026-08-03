import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import GroomerDataTable from "../../../components/groomer/GroomerDataTable";
import GroomerLoader from "../../../components/groomer/GroomerLoader";
import GroomerPageHeader from "../../../components/groomer/GroomerPageHeader";
import GroomerSearchBar from "../../../components/groomer/GroomerSearchBar";
import { getGroomerBookings } from "../../../services/groomerApi";
import { formatDate, getId, personName } from "../../../utils/groomingUtils";

const GroomerCustomers = () => {
  const [query, setQuery] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGroomerBookings({ limit: 50 }).then((res) => setBookings(res.data.bookings || [])).finally(() => setLoading(false));
  }, []);

  const customers = useMemo(() => {
    const map = new Map();
    bookings.forEach((booking) => {
      const owner = booking.ownerId;
      const id = getId(owner);
      if (!id) return;
      const current = map.get(id) || { owner, total: 0, completed: 0, last: null, upcoming: null };
      current.total += 1;
      if (booking.status === "completed") current.completed += 1;
      if (!current.last || new Date(booking.bookingDate) > new Date(current.last)) current.last = booking.bookingDate;
      if (["pending", "accepted"].includes(booking.status)) current.upcoming = booking.bookingDate;
      map.set(id, current);
    });
    return Array.from(map.values()).filter((row) => [personName(row.owner), row.owner?.email, row.owner?.phone].join(" ").toLowerCase().includes(query.toLowerCase()));
  }, [bookings, query]);

  if (loading) return <GroomerLoader text="Loading customers..." />;

  return (
    <main>
      <GroomerPageHeader title="Customers" description="Owners connected to your assigned grooming bookings." />
      <div className="mb-5 rounded-2xl border border-white/10 bg-slate-900 p-5"><GroomerSearchBar value={query} onChange={setQuery} placeholder="Search customers" /></div>
      <GroomerDataTable data={customers} emptyTitle="No customers found" columns={[
        { header: "Customer", render: (row) => <><p className="font-semibold text-white">{personName(row.owner)}</p><p className="text-xs text-slate-500">{row.owner?.email}</p></> },
        { header: "Phone", render: (row) => row.owner?.phone || "Not set" },
        { header: "Bookings", render: (row) => row.total },
        { header: "Completed", render: (row) => row.completed },
        { header: "Last service", render: (row) => formatDate(row.last) },
        { header: "Actions", render: (row) => <Link to={`/groomer/customers/${getId(row.owner)}`} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300">View</Link> },
      ]} />
    </main>
  );
};

export default GroomerCustomers;
