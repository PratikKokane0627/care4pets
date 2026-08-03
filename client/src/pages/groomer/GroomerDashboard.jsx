import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight, CalendarDays, CheckCircle2, ChevronRight, Clock, IndianRupee, PawPrint, RefreshCw, Scissors, Users } from "lucide-react";

import GroomerEmptyState from "../../components/groomer/GroomerEmptyState";
import GroomerErrorState from "../../components/groomer/GroomerErrorState";
import GroomerLoader from "../../components/groomer/GroomerLoader";
import GroomerPageHeader from "../../components/groomer/GroomerPageHeader";
import GroomerScheduleCard from "../../components/groomer/GroomerScheduleCard";
import GroomerStatCard from "../../components/groomer/GroomerStatCard";
import GroomerStatusBadge from "../../components/groomer/GroomerStatusBadge";
import { getGroomerBookings, getGroomerDashboard, getMyGroomerProfile } from "../../services/groomerApi";
import { formatDate, isToday, money, personName, petName, serviceName, uniqueById } from "../../utils/groomingUtils";

const Panel = ({ title, description, children, action }) => (
  <section className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-lg shadow-black/10">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const quickActions = [
  { label: "Pending bookings", detail: "Review new grooming requests", to: "/groomer/bookings?status=pending", icon: Clock },
  { label: "Today schedule", detail: "See today's grooming visits", to: "/groomer/schedule", icon: CalendarDays },
  { label: "Manage availability", detail: "Edit weekly working hours", to: "/groomer/availability", icon: Scissors },
  { label: "View customers", detail: "Open owners served by you", to: "/groomer/customers", icon: Users },
];

const GroomerDashboard = () => {
  const [data, setData] = useState({ stats: {}, recentBookings: [], profile: null, bookings: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError("");
      const [dashboardRes, profileRes, bookingsRes] = await Promise.all([
        getGroomerDashboard(),
        getMyGroomerProfile(),
        getGroomerBookings({ limit: 50 }),
      ]);
      setData({
        stats: dashboardRes.data.stats || {},
        recentBookings: dashboardRes.data.recentBookings || [],
        profile: profileRes.data.profile,
        bookings: bookingsRes.data.bookings || [],
      });
      if (silent) toast.success("Dashboard refreshed");
    } catch (err) {
      const message = err.response?.data?.message || "Could not load groomer dashboard";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = data.stats || {};
  const profile = data.profile;
  const bookings = data.bookings;
  const todayBookings = bookings.filter((booking) => isToday(booking.bookingDate));
  const pendingBookings = bookings.filter((booking) => booking.status === "pending");
  const completedBookings = bookings.filter((booking) => booking.status === "completed");
  const customers = uniqueById(bookings, (booking) => booking.ownerId);
  const pets = uniqueById(bookings, (booking) => booking.petId);
  const totalEarnings = completedBookings.reduce((sum, booking) => sum + Number(booking.price || 0), 0);
  const weekly = useMemo(() => {
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = labels.map((day) => ({ day, count: 0 }));
    bookings.forEach((booking) => {
      const date = new Date(booking.bookingDate);
      if (!Number.isNaN(date.getTime())) counts[date.getDay()].count += 1;
    });
    return counts;
  }, [bookings]);
  const maxWeekly = Math.max(...weekly.map((row) => row.count), 1);
  const completion = Math.round(([
    profile?.bio,
    profile?.experience !== undefined,
    profile?.skills?.length,
    profile?.serviceAreas?.length,
    profile?.availability?.length,
  ].filter(Boolean).length / 5) * 100);

  if (loading) return <GroomerLoader text="Loading groomer dashboard..." />;
  if (error) return <GroomerErrorState title="Dashboard unavailable" message={error} onRetry={() => load()} />;

  return (
    <div>
      <GroomerPageHeader
        icon={Scissors}
        title={`Welcome back, ${personName(profile?.userId)}`}
        description="Live overview of assigned grooming bookings, customers, pets, availability and earnings."
        actions={<button type="button" disabled={refreshing} onClick={() => load({ silent: true })} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-300 hover:border-cyan-400/40 disabled:opacity-60"><RefreshCw size={17} className={refreshing ? "animate-spin" : ""} /> {refreshing ? "Refreshing..." : "Refresh"}</button>}
      />

      <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-slate-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200/80">Account status</p>
            <h2 className="mt-1 text-2xl font-bold text-white">{profile?.isActive ? "Active groomer profile" : "Inactive groomer profile"}</h2>
            <p className="mt-1 text-sm text-slate-300">Backend controls account status and assignment permissions.</p>
          </div>
          <GroomerStatusBadge status={profile?.isActive ? "active" : "inactive"} />
        </div>
      </div>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <GroomerStatCard title="Today's Bookings" value={stats.todayBookings || todayBookings.length} subtitle="Scheduled today" icon={CalendarDays} color="cyan" />
        <GroomerStatCard title="Accepted" value={stats.acceptedBookings || 0} subtitle="Confirmed services" icon={CheckCircle2} color="emerald" />
        <GroomerStatCard title="Completed" value={stats.completedBookings || 0} subtitle="Finished services" icon={Scissors} color="indigo" />
        <GroomerStatCard title="Monthly Earnings" value={money(stats.monthlyRevenue)} subtitle="Completed services" icon={IndianRupee} color="emerald" />
        <GroomerStatCard title="Customers" value={customers.length} subtitle="From assigned bookings" icon={Users} color="cyan" />
        <GroomerStatCard title="Pets Served" value={pets.length} subtitle="Unique pets" icon={PawPrint} color="amber" />
        <GroomerStatCard title="Cancelled" value={stats.cancelledBookings || 0} subtitle="Cancelled bookings" icon={Clock} color="rose" />
        <GroomerStatCard title="Total Earnings" value={money(totalEarnings)} subtitle="Completed assigned bookings" icon={IndianRupee} color="indigo" />
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Panel title="Today's Schedule" description="Assigned bookings scheduled for today" action={<Link to="/groomer/schedule" style={{ color: "#22d3ee" }} className="inline-flex items-center gap-1 text-sm font-semibold transition hover:opacity-80">View schedule <ChevronRight size={17} /></Link>}>
          {todayBookings.length ? <div className="grid gap-4 md:grid-cols-2">{todayBookings.map((booking, index) => <GroomerScheduleCard key={booking._id} booking={booking} highlighted={index === 0} />)}</div> : <GroomerEmptyState title="No bookings today" />}
        </Panel>
        <Panel title="Weekly Booking Summary" description="Assigned bookings by weekday">
          <div className="flex h-64 items-end justify-between gap-3 pt-5">
            {weekly.map((item) => <div key={item.day} className="flex h-full flex-1 flex-col items-center justify-end"><div className="w-full max-w-9 rounded-t-lg bg-gradient-to-t from-indigo-600 to-cyan-400" style={{ height: `${item.count ? Math.max((item.count / maxWeekly) * 100, 12) : 4}%` }} /><span className="mt-3 text-xs text-slate-500">{item.day}</span></div>)}
          </div>
        </Panel>
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-3">
        <Panel title="Pending Requests" description="Open grooming jobs you can accept">
          {pendingBookings.length ? <div className="space-y-3">{pendingBookings.slice(0, 4).map((b) => <Link key={b._id} to={`/groomer/bookings/${b._id}`} className="block rounded-xl border border-white/10 bg-slate-950 p-4 hover:border-cyan-300/30"><p className="font-semibold text-white">{serviceName(b.serviceId)}</p><p className="mt-1 text-sm text-slate-400">{formatDate(b.bookingDate)} at {b.bookingTime}</p></Link>)}</div> : <GroomerEmptyState title="No pending requests" />}
        </Panel>
        <Panel title="Recent Customers" description="Owners connected to assigned bookings">
          {customers.length ? <div className="space-y-3">{customers.slice(0, 4).map((owner) => <Link key={owner._id} to={`/groomer/customers/${owner._id}`} className="block rounded-xl border border-white/10 bg-slate-950 p-4 hover:border-cyan-300/30"><p className="font-semibold text-white">{personName(owner)}</p><p className="mt-1 text-sm text-slate-400">{owner.email}</p></Link>)}</div> : <GroomerEmptyState title="No customers yet" />}
        </Panel>
        <Panel title="Profile Snapshot" description="Availability and completion">
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-slate-950 p-4"><p className="text-sm text-slate-400">Profile completion</p><div className="mt-3 h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${completion}%` }} /></div><p className="mt-2 text-sm font-semibold text-white">{completion}% complete</p></div>
            <div className="rounded-xl border border-white/10 bg-slate-950 p-4"><p className="text-sm text-slate-400">Availability</p><p className="mt-2 text-lg font-bold text-white">{profile?.availability?.filter((slot) => slot.isAvailable).length || 0} days</p></div>
            <div className="rounded-xl border border-white/10 bg-slate-950 p-4"><p className="text-sm text-slate-400">Reviews</p><p className="mt-2 text-sm text-slate-300">Groomer reviews are not supported by the current backend.</p></div>
          </div>
        </Panel>
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-2">
        <Panel title="Recent Completed Bookings" description="Latest finished grooming work">
          {completedBookings.length ? <div className="space-y-3">{completedBookings.slice(0, 4).map((b) => <Link key={b._id} to={`/groomer/bookings/${b._id}`} className="block rounded-xl border border-white/10 bg-slate-950 p-4 hover:border-cyan-300/30"><p className="font-semibold text-white">{petName(b.petId)} · {serviceName(b.serviceId)}</p><p className="mt-1 text-sm text-slate-400">{b.groomerNotes || "No notes added"}</p></Link>)}</div> : <GroomerEmptyState title="No completed bookings" />}
        </Panel>
        <Panel title="Quick Actions" description="Common groomer workflows">
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map(({ label, detail, to, icon: Icon }) => <Link key={to} to={to} className="group flex min-h-28 items-center gap-4 rounded-xl border border-white/10 bg-slate-950 p-4 hover:border-cyan-300/40"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"><Icon size={22} /></span><span className="flex-1"><span className="block font-semibold text-white">{label}</span><span className="mt-1 block text-sm text-slate-500">{detail}</span></span><ArrowRight size={18} className="text-slate-600 group-hover:text-cyan-300" /></Link>)}
          </div>
        </Panel>
      </section>
    </div>
  );
};

export default GroomerDashboard;
