import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import GroomerDataTable from "../../../components/groomer/GroomerDataTable";
import GroomerLoader from "../../../components/groomer/GroomerLoader";
import GroomerPageHeader from "../../../components/groomer/GroomerPageHeader";
import GroomerSearchBar from "../../../components/groomer/GroomerSearchBar";
import { getGroomerBookings } from "../../../services/groomerApi";
import { formatDate, getId, personName, petName } from "../../../utils/groomingUtils";

const GroomerPets = () => {
  const [query, setQuery] = useState("");
  const [species, setSpecies] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getGroomerBookings({ limit: 50 }).then((res) => setBookings(res.data.bookings || [])).finally(() => setLoading(false)); }, []);
  const pets = useMemo(() => {
    const map = new Map();
    bookings.forEach((booking) => {
      const id = getId(booking.petId);
      if (!id) return;
      const current = map.get(id) || { pet: booking.petId, owner: booking.ownerId, total: 0, last: null, upcoming: null };
      current.total += 1;
      if (!current.last || new Date(booking.bookingDate) > new Date(current.last)) current.last = booking.bookingDate;
      if (["pending", "accepted"].includes(booking.status)) current.upcoming = booking.bookingDate;
      map.set(id, current);
    });
    return Array.from(map.values()).filter((row) => (!species || row.pet?.species === species) && [petName(row.pet), row.pet?.species, row.pet?.breed, personName(row.owner)].join(" ").toLowerCase().includes(query.toLowerCase()));
  }, [bookings, query, species]);
  if (loading) return <GroomerLoader text="Loading pets..." />;
  return <main><GroomerPageHeader title="Pets" description="Pets connected to grooming bookings assigned to you." /><section className="mb-5 grid gap-4 rounded-2xl border border-white/10 bg-slate-900 p-5 md:grid-cols-2"><GroomerSearchBar value={query} onChange={setQuery} placeholder="Search pets" /><select value={species} onChange={(event) => setSpecies(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"><option value="">All species</option>{Array.from(new Set(bookings.map((b) => b.petId?.species).filter(Boolean))).map((item) => <option key={item} value={item}>{item}</option>)}</select></section><GroomerDataTable data={pets} emptyTitle="No pets found" columns={[{ header: "Pet", render: (row) => <><p className="font-semibold text-white">{petName(row.pet)}</p><p className="text-xs text-slate-500">{row.pet?.species} · {row.pet?.breed}</p></> }, { header: "Owner", render: (row) => personName(row.owner) }, { header: "Bookings", render: (row) => row.total }, { header: "Last grooming", render: (row) => formatDate(row.last) }, { header: "Upcoming", render: (row) => formatDate(row.upcoming) }, { header: "Actions", render: (row) => <Link to={`/groomer/pets/${getId(row.pet)}`} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300">View</Link> }]} /></main>;
};

export default GroomerPets;
