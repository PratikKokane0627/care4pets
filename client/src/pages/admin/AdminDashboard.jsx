import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  PawPrint,
  RefreshCw,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  UserCheck,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../services/api";
import AdminLoader from "../../components/admin/AdminLoader";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";

const initialDashboard = {
  totalUsers: 0,
  activeUsers: 0,
  totalPets: 0,
  totalVets: 0,
  pendingVets: 0,
  totalGroomers: 0,
  totalAppointments: 0,
  totalBookings: 0,
  totalProducts: 0,
  totalOrders: 0,
  revenue: 0,
  recentUsers: [],
  recentAppointments: [],
};

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const getDashboard = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await api.get("/admin/dashboard");

        const responseData =
          response.data.dashboard ||
          response.data.data ||
          response.data;

        const stats = responseData.stats || responseData;

        setDashboard({
          totalUsers:
            stats.users?.total ??
            stats.totalUsers ??
            stats.users ??
            stats.userCount ??
            0,

          activeUsers:
            stats.users?.active ??
            stats.activeUsers ??
            stats.activeUserCount ??
            0,

          totalVets:
            stats.vets?.total ??
            stats.totalVets ??
            stats.veterinarians ??
            stats.vetCount ??
            0,
          totalPets:
            stats.totalPets ??
            stats.pets ??
            0,

          pendingVets:
            stats.vets?.pendingApproval ??
            stats.pendingVets ??
            stats.pendingVeterinarians ??
            stats.pendingVetCount ??
            0,

          totalGroomers:
            stats.totalGroomers ??
            stats.groomers ??
            stats.groomerCount ??
            0,

          totalAppointments:
            stats.totalAppointments ??
            stats.appointments ??
            stats.appointmentCount ??
            0,
          totalBookings:
            stats.totalBookings ??
            stats.groomingBookings ??
            stats.bookings ??
            0,
          totalProducts:
            stats.totalProducts ??
            stats.products ??
            0,

          totalOrders:
            stats.totalOrders ??
            stats.orders ??
            stats.orderCount ??
            0,
          revenue:
            stats.revenue ??
            stats.totalRevenue ??
            0,

          recentUsers:
            responseData.recentUsers ||
            stats.recentUsers ||
            [],

          recentAppointments:
            responseData.recentAppointments ||
            stats.recentAppointments ||
            [],
        });

        if (silent) {
          toast.success("Dashboard refreshed");
        }
      } catch (requestError) {
        const message =
          requestError.response?.data?.message ||
          "Failed to load admin dashboard";

        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    getDashboard();
  }, [getDashboard]);

  const userDistribution = useMemo(() => {
    const maximum = Math.max(
      dashboard.totalUsers,
      dashboard.totalVets,
      dashboard.totalGroomers,
      1
    );

    return [
      {
        label: "Pet owners",
        value: dashboard.totalUsers,
        width: (dashboard.totalUsers / maximum) * 100,
        color: "bg-cyan-400",
      },
      {
        label: "Veterinarians",
        value: dashboard.totalVets,
        width: (dashboard.totalVets / maximum) * 100,
        color: "bg-indigo-400",
      },
      {
        label: "Groomers",
        value: dashboard.totalGroomers,
        width: (dashboard.totalGroomers / maximum) * 100,
        color: "bg-emerald-400",
      },
    ];
  }, [dashboard]);

  if (loading) {
    return <AdminLoader />;
  }

  if (error) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <h1 className="text-xl font-bold text-white">
            Dashboard unavailable
          </h1>

          <p className="mt-3 text-sm text-red-300">
            {error}
          </p>

          <button
            type="button"
            onClick={() => getDashboard()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 font-semibold text-white"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <div>
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-cyan-400">
            Admin overview
          </p>

          <div className="mt-2 flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/20">
              <ShieldCheck size={25} />
            </span>
            <h1 className="text-3xl font-bold text-white">
              Dashboard
            </h1>
          </div>

          <p className="mt-3 text-sm text-slate-400">
            Monitor users, services, appointments, and orders.
          </p>
        </div>

        <button
          type="button"
          disabled={refreshing}
          onClick={() => getDashboard({ silent: true })}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-white disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={refreshing ? "animate-spin" : ""}
          />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      <section className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Users"
          value={dashboard.totalUsers}
          subtitle={`${dashboard.activeUsers} currently active`}
          icon={Users}
          color="cyan"
        />

        <StatCard
          title="Veterinarians"
          value={dashboard.totalVets}
          subtitle={`${dashboard.pendingVets} waiting for approval`}
          icon={Stethoscope}
          color="indigo"
        />

        <StatCard
          title="Groomers"
          value={dashboard.totalGroomers}
          subtitle="Registered service providers"
          icon={Scissors}
          color="emerald"
        />

        <StatCard
          title="Appointments"
          value={dashboard.totalAppointments}
          subtitle="All appointment records"
          icon={CalendarDays}
          color="amber"
        />

        <StatCard
          title="Pets"
          value={dashboard.totalPets}
          subtitle="Registered pet profiles"
          icon={PawPrint}
          color="cyan"
        />

        <StatCard
          title="Grooming Bookings"
          value={dashboard.totalBookings}
          subtitle="All grooming booking records"
          icon={Scissors}
          color="indigo"
        />

        <StatCard
          title="Products"
          value={dashboard.totalProducts}
          subtitle="Active shop products"
          icon={ShoppingBag}
          color="amber"
        />

        <StatCard
          title="Active Users"
          value={dashboard.activeUsers}
          subtitle="Active platform accounts"
          icon={UserCheck}
          color="emerald"
        />

        <StatCard
          title="Pending Vet Approvals"
          value={dashboard.pendingVets}
          subtitle="Profiles requiring review"
          icon={Stethoscope}
          color="rose"
        />

        <StatCard
          title="Total Orders"
          value={dashboard.totalOrders}
          subtitle="Customer orders received"
          icon={ShoppingBag}
          color="violet"
        />

        <StatCard
          title="Revenue"
          value={dashboard.revenue}
          subtitle="Paid order revenue"
          icon={ShoppingBag}
          color="emerald"
        />
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <div>
            <h2 className="text-lg font-bold text-white">
              Platform Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Comparison of registered account types
            </p>
          </div>

          <div className="mt-8 space-y-7">
            {userDistribution.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-300">
                    {item.label}
                  </span>

                  <span className="font-semibold text-white">
                    {item.value}
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                    style={{
                      width: `${Math.max(
                        item.value ? item.width : 0,
                        item.value ? 6 : 0
                      )}%`,
                    }}
                    title={`${item.value} ${item.label.toLowerCase()}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-slate-900 to-cyan-500/10 p-6">
          <p className="text-sm font-semibold text-cyan-400">
            Approval Queue
          </p>

          <h2 className="mt-3 text-4xl font-black text-white">
            {dashboard.pendingVets}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Veterinarian applications are currently waiting for
            admin verification.
          </p>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/admin/veterinarians";
            }}
            className="mt-6 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950"
          >
            Review Veterinarians
          </button>
        </div>
      </section>

      <section className="mt-7 grid gap-6 2xl:grid-cols-2">
        <RecentUsers users={dashboard.recentUsers} />

        <RecentAppointments
          appointments={dashboard.recentAppointments}
        />
      </section>
    </div>
  );
};

const RecentUsers = ({ users }) => {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
      <div className="border-b border-white/10 px-6 py-5">
        <h2 className="text-lg font-bold text-white">
          Recent Users
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Recently registered accounts
        </p>
      </div>

      {users.length === 0 ? (
        <EmptyTable text="No recent users found." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[580px] text-left">
            <thead className="bg-slate-950/40 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr
                  key={user._id}
                  className="hover:bg-white/[0.02]"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">
                      {user.name || user.fullName || "Unknown"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {user.email || "Email unavailable"}
                    </p>
                  </td>

                  <td className="px-6 py-4 text-sm capitalize text-slate-300">
                    {user.role || "owner"}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge
                      status={
                        user.status ||
                        (user.isActive ? "Active" : "Inactive")
                      }
                    />
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-400">
                    {formatDate(user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

const RecentAppointments = ({ appointments }) => {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
      <div className="border-b border-white/10 px-6 py-5">
        <h2 className="text-lg font-bold text-white">
          Recent Appointments
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Latest veterinary appointments
        </p>
      </div>

      {appointments.length === 0 ? (
        <EmptyTable text="No recent appointments found." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead className="bg-slate-950/40 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Pet</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {appointments.map((appointment) => (
                <tr
                  key={appointment._id}
                  className="hover:bg-white/[0.02]"
                >
                  <td className="px-6 py-4 font-medium text-white">
                    {appointment.pet?.petName ||
                      appointment.petId?.petName ||
                      "Pet"}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-300">
                    {appointment.owner?.name ||
                      appointment.ownerId?.name ||
                      "Owner"}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-400">
                    {formatDate(
                      appointment.appointmentDate ||
                        appointment.date
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge
                      status={appointment.status || "Pending"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

const EmptyTable = ({ text }) => {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm text-slate-500">
        {text}
      </p>
    </div>
  );
};

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default AdminDashboard;
