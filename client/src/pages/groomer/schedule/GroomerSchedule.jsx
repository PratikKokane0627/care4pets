import { useEffect, useMemo, useState } from "react";

import GroomerEmptyState from "../../../components/groomer/GroomerEmptyState";
import GroomerErrorState from "../../../components/groomer/GroomerErrorState";
import GroomerLoader from "../../../components/groomer/GroomerLoader";
import GroomerPageHeader from "../../../components/groomer/GroomerPageHeader";
import GroomerScheduleCard from "../../../components/groomer/GroomerScheduleCard";
import { getGroomerBookings } from "../../../services/groomerApi";
import { bookingDateKey } from "../../../utils/groomingUtils";

const GroomerSchedule = () => {
  const [view, setView] = useState("today");
  const [date, setDate] = useState(bookingDateKey(new Date()));
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getGroomerBookings({ limit: 50, sort: "oldest" })
      .then((res) => { if (alive) setBookings(res.data.bookings || []); })
      .catch((err) => { if (alive) setError(err.response?.data?.message || "Could not load schedule"); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const visible = useMemo(() => {
    const today = bookingDateKey(new Date());
    if (view === "today") return bookings.filter((booking) => bookingDateKey(booking.bookingDate) === today);
    if (view === "date") return bookings.filter((booking) => bookingDateKey(booking.bookingDate) === date);
    return bookings.filter((booking) => new Date(booking.bookingDate) >= new Date(new Date().setHours(0, 0, 0, 0)));
  }, [bookings, date, view]);

  if (loading) return <GroomerLoader text="Loading schedule..." />;
  if (error) return <GroomerErrorState message={error} />;

  return (
    <main>
      <GroomerPageHeader title="Schedule" description="Today, upcoming, and selected-date grooming appointments." />
      <section className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-slate-900 p-5">
        {["today", "upcoming", "date"].map((item) => <button key={item} type="button" onClick={() => setView(item)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold capitalize ${view === item ? "bg-cyan-400 text-slate-950" : "border border-white/10 text-slate-300"}`}>{item}</button>)}
        {view === "date" && <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-400" />}
      </section>
      {visible.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((booking, index) => <GroomerScheduleCard key={booking._id} booking={booking} highlighted={index === 0} />)}</div> : <GroomerEmptyState title="No scheduled bookings" />}
    </main>
  );
};

export default GroomerSchedule;
