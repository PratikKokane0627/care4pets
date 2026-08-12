import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import DateInput from "../../../components/common/DateInput";
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
  const hasLoadedRef = useRef(false);
  const dateInputRef = useRef(null);

  const loadSchedule = useCallback(async () => {
    if (!hasLoadedRef.current) setLoading(true);
    setError("");

    try {
      const today = bookingDateKey(new Date());
      const params = {
        limit: 50,
        sort: "oldest",
        ...(view === "today" && { bookingDate: today }),
        ...(view === "date" && date && { bookingDate: date }),
      };

      const response = await getGroomerBookings(params);
      setBookings(response.data.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load schedule");
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, [date, view]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  useEffect(() => {
    if (view !== "date") return;

    requestAnimationFrame(() => {
      dateInputRef.current?.focus();

      try {
        dateInputRef.current?.showPicker?.();
      } catch {
        // Browsers may block showPicker when it is not directly user-triggered.
      }
    });
  }, [view]);

  const visible = useMemo(() => {
    return bookings.filter((booking) => new Date(booking.bookingDate) >= new Date(new Date().setHours(0, 0, 0, 0)));
  }, [bookings]);

  const scheduleItems = view === "upcoming" ? visible : bookings;

  if (loading) return <GroomerLoader text="Loading schedule..." />;
  if (error) return <GroomerErrorState message={error} onRetry={loadSchedule} />;

  return (
    <main>
      <GroomerPageHeader title="Schedule" description="Today, upcoming, and selected-date grooming appointments." />
      <section className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-slate-900 p-5">
        {["today", "upcoming", "date"].map((item) => <button key={item} type="button" onClick={() => setView(item)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold capitalize ${view === item ? "bg-cyan-400 text-slate-950" : "border border-white/10 text-slate-300"}`}>{item}</button>)}
        {view === "date" && <DateInput ref={dateInputRef} value={date} onChange={(event) => setDate(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-400" />}
      </section>
      {scheduleItems.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{scheduleItems.map((booking, index) => <GroomerScheduleCard key={booking._id} booking={booking} highlighted={index === 0} />)}</div> : <GroomerEmptyState title="No scheduled bookings" />}
    </main>
  );
};

export default GroomerSchedule;
