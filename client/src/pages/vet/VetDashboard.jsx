import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarClock, CalendarDays, ClipboardList, IndianRupee, PawPrint, RefreshCw, ShieldCheck, Star, Stethoscope, UserCheck, UserRoundCog } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import AppointmentCard from "../../components/vet/AppointmentCard";
import VetEmptyState from "../../components/vet/VetEmptyState";
import VetErrorState from "../../components/vet/VetErrorState";
import VetLoader from "../../components/vet/VetLoader";
import VetPageHeader from "../../components/vet/VetPageHeader";
import VetStatCard from "../../components/vet/VetStatCard";
import VetStatusBadge from "../../components/vet/VetStatusBadge";
import { getVetDashboard } from "../../services/vetApi";
import { formatDate } from "../../utils/dateUtils";
import { getId, money, ownerName, petName } from "../../utils/appointmentUtils";

const initialData = {
  vet: null,
  stats: {},
  todaySchedule: [],
  upcomingAppointments: [],
  pendingRequests: [],
  recentPatients: [],
  recentCompletedAppointments: [],
  weeklyAppointments: [],
  recentReviews: [],
  unreadNotifications: 0,
};

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

const approvalCopy = {
  approved: {
    tone: "from-emerald-500/18 via-cyan-500/10 to-slate-900",
    border: "border-emerald-400/25",
    icon: "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/20",
    title: "Approved and visible",
    description: "Your profile is active for owner bookings.",
    badgeStatus: "active",
  },
  pending: {
    tone: "from-amber-500/18 via-slate-900 to-slate-900",
    border: "border-amber-400/25",
    icon: "bg-amber-400/15 text-amber-300 ring-1 ring-amber-300/20",
    title: "Approval in review",
    description: "Admin approval is still pending.",
    badgeStatus: "pending",
  },
  rejected: {
    tone: "from-red-500/18 via-slate-900 to-slate-900",
    border: "border-red-400/25",
    icon: "bg-red-400/15 text-red-300 ring-1 ring-red-300/20",
    title: "Approval rejected",
    description: "Update your details or contact support.",
    badgeStatus: "inactive",
  },
};

const quickActions = [
  {
    label: "Pending appointments",
    detail: "Review requests waiting for your decision",
    to: "/vet/appointments?status=pending",
    icon: CalendarClock,
    accent: "text-amber-300 bg-amber-400/10 ring-amber-300/15",
  },
  {
    label: "Manage availability",
    detail: "Edit bookable days and consultation hours",
    to: "/vet/availability",
    icon: CalendarDays,
    accent: "text-cyan-300 bg-cyan-400/10 ring-cyan-300/15",
  },
  {
    label: "View patients",
    detail: "Open pets with recent appointment history",
    to: "/vet/patients",
    icon: PawPrint,
    accent: "text-emerald-300 bg-emerald-400/10 ring-emerald-300/15",
  },
  {
    label: "Update profile",
    detail: "Keep clinic, fee, and bio details current",
    to: "/vet/profile/edit",
    icon: UserRoundCog,
    accent: "text-indigo-300 bg-indigo-400/10 ring-indigo-300/15",
  },
];

const VetDashboard = () => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      const response = await getVetDashboard();
      setData(response.data.data || initialData);
      if (silent) toast.success("Dashboard refreshed");
    } catch (err) {
      const message = err.response?.data?.message || "Could not load veterinarian dashboard";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const vetName = data.vet?.userId?.name || "Veterinarian";
  const stats = data.stats || {};
  const approvalStatus = String(data.vet?.status || "pending").toLowerCase();
  const approval = approvalCopy[approvalStatus] || approvalCopy.pending;
  const maxWeekly = Math.max(...(data.weeklyAppointments || []).map((item) => item.count), 1);
  const completion = useMemo(() => {
    const profileFields = [
      data.vet?.qualification,
      data.vet?.specialization,
      data.vet?.experience !== undefined,
      data.vet?.registrationNumber,
      data.vet?.clinicName,
      data.vet?.clinicAddress?.city,
      data.vet?.consultationFee !== undefined,
      data.vet?.about,
      data.vet?.availability?.length,
    ];
    return Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);
  }, [data.vet]);

  if (loading) return <VetLoader />;
  if (error) return <VetErrorState title="Dashboard unavailable" message={error} onRetry={() => load()} />;

  return (
    <div>
      <VetPageHeader
        title={`Welcome back, Dr. ${vetName}`}
        description="Live overview of your appointments, patients, prescriptions, and practice profile."
        actions={
          <button type="button" disabled={refreshing} onClick={() => load({ silent: true })} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-white disabled:opacity-60">
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} /> {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        }
      />

      <div className={`mb-6 overflow-hidden rounded-2xl border ${approval.border} bg-gradient-to-r ${approval.tone} p-5 shadow-lg shadow-black/10`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${approval.icon}`}>
              <ShieldCheck size={25} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200/80">Approval status</p>
              <h2 className="mt-1 text-2xl font-bold capitalize text-white">{approvalStatus}</h2>
              <p className="mt-1 text-sm text-slate-300">{approval.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/45 px-3 py-2">
            <span className="text-sm font-semibold text-slate-300">{approval.title}</span>
            <VetStatusBadge status={data.vet?.isActive ? approval.badgeStatus : "inactive"} />
          </div>
        </div>
      </div>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <VetStatCard title="Today's Appointments" value={stats.todayAppointments || 0} subtitle="Scheduled today" icon={CalendarDays} color="cyan" />
        <VetStatCard title="Pending" value={stats.pendingAppointments || 0} subtitle="Awaiting your action" icon={Stethoscope} color="amber" />
        <VetStatCard title="Accepted" value={stats.acceptedAppointments || 0} subtitle="Confirmed visits" icon={UserCheck} color="emerald" />
        <VetStatCard title="Completed" value={stats.completedAppointments || 0} subtitle="Consultations done" icon={ClipboardList} color="indigo" />
        <VetStatCard title="Patients" value={stats.totalPatients || 0} subtitle="Unique patients" icon={PawPrint} color="cyan" />
        <VetStatCard title="Prescriptions" value={stats.totalPrescriptions || 0} subtitle="Completed prescriptions" icon={ClipboardList} color="indigo" />
        <VetStatCard title="Average Rating" value={Number(stats.averageRating || 0).toFixed(1)} subtitle={`${stats.totalReviews || 0} reviews`} icon={Star} color="amber" />
        <VetStatCard title="Paid Revenue" value={money(stats.paidRevenue)} subtitle="Paid consultation fees" icon={IndianRupee} color="emerald" />
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Panel title="Today's Schedule" description="Appointments scheduled for today" action={<Link to="/vet/appointments" className="text-sm font-semibold text-cyan-400">View all</Link>}>
          {data.todaySchedule.length ? <div className="grid gap-4 md:grid-cols-2">{data.todaySchedule.map((appointment) => <AppointmentCard key={getId(appointment)} appointment={appointment} />)}</div> : <VetEmptyState title="No appointments today" description="Today's accepted or pending visits will appear here." />}
        </Panel>
        <Panel title="Weekly Appointment Summary" description="Real appointments this week">
          <div className="flex h-64 items-end justify-between gap-3 pt-5">
            {(data.weeklyAppointments || []).map((item) => (
              <div key={item.day} className="flex h-full flex-1 flex-col items-center justify-end">
                <div className="w-full max-w-9 rounded-t-lg bg-gradient-to-t from-indigo-600 to-cyan-400" style={{ height: `${item.count ? Math.max((item.count / maxWeekly) * 100, 12) : 4}%` }} title={`${item.count} appointments`} />
                <span className="mt-3 text-xs text-slate-500">{item.day}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-3">
        <Panel title="Pending Requests" description="Appointment requests waiting for action">
          {data.pendingRequests.length ? <div className="space-y-3">{data.pendingRequests.slice(0, 4).map((a) => <Link key={getId(a)} to={`/vet/appointments/${getId(a)}`} className="block rounded-xl border border-white/10 bg-slate-950 p-4 hover:border-cyan-300/30"><p className="font-semibold text-white">{petName(a.petId)}</p><p className="mt-1 text-sm text-slate-400">{formatDate(a.appointmentDate)} at {a.appointmentTime}</p></Link>)}</div> : <VetEmptyState title="No pending requests" />}
        </Panel>
        <Panel title="Recent Patients" description="Latest pets under your care">
          {data.recentPatients.length ? <div className="space-y-3">{data.recentPatients.slice(0, 4).map((row) => <Link key={getId(row.pet)} to={`/vet/patients/${getId(row.pet)}`} className="block rounded-xl border border-white/10 bg-slate-950 p-4 hover:border-cyan-300/30"><p className="font-semibold text-white">{petName(row.pet)}</p><p className="mt-1 text-sm text-slate-400">{ownerName(row.owner)} - {row.appointmentCount} visits</p></Link>)}</div> : <VetEmptyState title="No patients yet" />}
        </Panel>
        <Panel title="Practice Snapshot" description="Profile, availability, and reviews">
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-slate-950 p-4"><p className="text-sm text-slate-400">Profile completion</p><div className="mt-3 h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${completion}%` }} /></div><p className="mt-2 text-sm font-semibold text-white">{completion}% complete</p></div>
            <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-400">Availability</p>
                <Link to="/vet/availability" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
                  Manage
                </Link>
              </div>
              <p className="mt-2 text-lg font-bold text-white">
                {data.vet?.availability?.filter((slot) => slot.isAvailable).length || 0} days
              </p>
              <div className="mt-3 space-y-2">
                {data.vet?.availability?.filter((slot) => slot.isAvailable).slice(0, 3).map((slot) => (
                  <div key={`${slot.day}-${slot.startTime}-${slot.endTime}`} className="flex justify-between gap-3 rounded-lg bg-slate-900 px-3 py-2 text-xs">
                    <span className="font-semibold text-slate-200">{slot.day}</span>
                    <span className="text-cyan-200">{slot.startTime} - {slot.endTime}</span>
                  </div>
                ))}
                {!data.vet?.availability?.some((slot) => slot.isAvailable) && (
                  <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                    Add availability so owners can book appointments.
                  </p>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950 p-4"><p className="text-sm text-slate-400">Unread notifications</p><p className="mt-2 text-lg font-bold text-white">{data.unreadNotifications || 0}</p></div>
          </div>
        </Panel>
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-2">
        <Panel title="Recent Completed Consultations" description="Latest completed medical notes">
          {data.recentCompletedAppointments.length ? <div className="space-y-3">{data.recentCompletedAppointments.slice(0, 4).map((a) => <Link key={getId(a)} to={`/vet/appointments/${getId(a)}`} className="block rounded-xl border border-white/10 bg-slate-950 p-4 hover:border-cyan-300/30"><p className="font-semibold text-white">{petName(a.petId)}</p><p className="mt-1 text-sm text-slate-400">{a.diagnosis || "Diagnosis not set"}</p></Link>)}</div> : <VetEmptyState title="No completed consultations" />}
        </Panel>
        <Panel title="Quick Actions" description="Common veterinarian workflows">
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map(({ label, detail, to, icon: Icon, accent }) => (
              <Link
                key={to}
                to={to}
                className="group flex min-h-28 items-center gap-4 rounded-xl border border-white/10 bg-slate-950 p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-300/35"
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${accent}`}>
                  <Icon size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-white">{label}</span>
                  <span className="mt-1 block text-sm leading-5 text-slate-500 transition group-hover:text-slate-300">{detail}</span>
                </span>
                <ArrowRight size={18} className="shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300" />
              </Link>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
};

export default VetDashboard;
