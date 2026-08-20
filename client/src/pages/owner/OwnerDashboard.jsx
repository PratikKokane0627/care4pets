import {
  Activity,
  Bell,
  CalendarDays,
  ChevronRight,
  Clock,
  Heart,
  HeartPulse,
  PawPrint,
  Plus,
  ShoppingCart,
  ShieldCheck,
  ShoppingBag,
  Scissors,
  Syringe,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import EmptyState from "../../components/owner/EmptyState";
import useFetch from "../../hooks/useFetch";
import api from "../../services/api";
import {
  formatDate,
  getId,
  itemImage,
  petName,
  toArray,
  vetName,
} from "./ownerShared";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const startOfWeek = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  return start;
};

const parseRecordDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const statusClass = (status = "") => {
  const value = status.toLowerCase();

  if (value === "confirmed" || value === "completed" || value === "accepted") {
    return "bg-emerald-500/15 text-emerald-400";
  }

  if (value === "pending" || value === "due soon" || value === "overdue") {
    return "bg-amber-500/15 text-amber-400";
  }

  if (value === "cancelled" || value === "rejected") {
    return "bg-red-500/15 text-red-400";
  }

  return "bg-cyan-500/15 text-cyan-400";
};

const formatStatus = (status = "Upcoming") =>
  String(status)
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const StatCard = ({ title, value, description, icon: Icon, iconClass }) => (
  <article className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-lg transition hover:-translate-y-1 hover:border-cyan-400/40">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-slate-400">{title}</p>
        <h2 className="mt-2 text-3xl font-bold text-white">{value}</h2>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>

      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon size={23} />
      </div>
    </div>
  </article>
);

const SectionHeading = ({ title, description, buttonText, onClick }) => (
  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
    </div>

    {buttonText && (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1 text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
      >
        {buttonText}
        <ChevronRight size={17} />
      </button>
    )}
  </div>
);

const QuickAction = ({ title, description, icon: Icon, iconClass, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 text-left transition hover:-translate-y-1 hover:border-cyan-400/40"
  >
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
    >
      <Icon size={21} />
    </span>

    <span>
      <span className="block font-semibold text-white">{title}</span>
      <span className="mt-1 block text-xs text-slate-500">{description}</span>
    </span>
  </button>
);

const vaccinationReminderClass = (status = "") => {
  const value = String(status).toLowerCase();

  if (value === "overdue") {
    return "border-red-400/25 bg-red-500/10 text-red-300 before:bg-red-300";
  }

  if (value === "completed") {
    return "border-emerald-400/25 bg-emerald-500/10 text-emerald-300 before:bg-emerald-300";
  }

  return "border-cyan-400/25 bg-cyan-500/10 text-cyan-300 before:bg-cyan-300";
};

const VaccinationReminderBadge = ({ status }) => (
  <span
    className={`inline-flex h-7 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-bold leading-none before:h-1.5 before:w-1.5 before:rounded-full ${vaccinationReminderClass(
      status
    )}`}
  >
    {formatStatus(status || "Upcoming")}
  </span>
);

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [groomingBookings, setGroomingBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [shopSummary, setShopSummary] = useState({ cart: 0, wishlist: 0 });
  const [upcomingVaccinationReminders, setUpcomingVaccinationReminders] = useState([]);
  const [overdueVaccinationReminders, setOverdueVaccinationReminders] = useState([]);

  const { loading } = useFetch(async () => {
    const [
      petsRes,
      appointmentsRes,
      vaccinationsRes,
      groomingBookingsRes,
      ordersRes,
      notificationsRes,
      cartSummaryRes,
      wishlistSummaryRes,
      upcomingVaccinationsRes,
      overdueVaccinationsRes,
    ] = await Promise.all([
      api.get("/pets"),
      api.get("/appointments").catch(() => ({ data: [] })),
      api.get("/vaccinations").catch(() => ({ data: [] })),
      api.get("/grooming-bookings").catch(() => ({ data: [] })),
      api.get("/orders/my-orders").catch(() => ({ data: [] })),
      api.get("/notifications", { params: { limit: 4 } }).catch(() => ({ data: [] })),
      api.get("/cart/summary").catch(() => ({ data: { summary: {} } })),
      api.get("/wishlist/summary").catch(() => ({ data: { summary: {} } })),
      api.get("/vaccinations/upcoming").catch(() => ({ data: [] })),
      api.get("/vaccinations/overdue").catch(() => ({ data: [] })),
    ]);

    setPets(toArray(petsRes.data, ["pets"]));
    setAppointments(toArray(appointmentsRes.data, ["appointments"]));
    setVaccinations(toArray(vaccinationsRes.data, ["vaccinations"]));
    setGroomingBookings(toArray(groomingBookingsRes.data, ["bookings"]));
    setOrders(toArray(ordersRes.data, ["orders"]));
    setNotifications(toArray(notificationsRes.data, ["notifications"]));
    setShopSummary({
      cart:
        cartSummaryRes.data.summary?.totalProducts ??
        cartSummaryRes.data.summary?.availableItems ??
        cartSummaryRes.data.summary?.totalItems ??
        0,
      wishlist: wishlistSummaryRes.data.summary?.totalItems || 0,
    });
    setUpcomingVaccinationReminders(
      toArray(upcomingVaccinationsRes.data, ["vaccinations"])
    );
    setOverdueVaccinationReminders(
      toArray(overdueVaccinationsRes.data, ["vaccinations"])
    );
  }, "owner-dashboard");

  const ownerName = storedUser.name?.split(" ")[0] || "Pet Owner";
  const latestOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  const orderTitle = (order) =>
    order.items?.[0]?.productName ||
    order.productName ||
    "Shop order";
  const upcomingAppointments = appointments.filter((item) =>
    ["pending", "accepted", "confirmed"].includes(
      String(item.status).toLowerCase()
    )
  );
  const dueVaccinations = upcomingVaccinationReminders.length
    ? upcomingVaccinationReminders
    : vaccinations.filter(
        (item) =>
          item.nextDueDate || String(item.status).toLowerCase() !== "completed"
      );
  const reminderVaccinations = [
    ...overdueVaccinationReminders,
    ...dueVaccinations,
  ];
  const petHealthSummary = useMemo(() => {
    const overdueCount = overdueVaccinationReminders.length;
    const pendingVaccinationCount = pets.filter((pet) =>
      ["pending", "overdue"].includes(String(pet.vaccinationStatus).toLowerCase())
    ).length;
    const activeCareCount = [
      ...appointments,
      ...groomingBookings,
    ].filter((item) =>
      ["pending", "accepted", "confirmed"].includes(String(item.status).toLowerCase())
    ).length;

    if (!pets.length) {
      return {
        value: "No Pets",
        description: "Add a pet to track health",
        iconClass: "bg-slate-500/15 text-slate-300",
      };
    }

    if (overdueCount) {
      return {
        value: "Needs Care",
        description: `${overdueCount} overdue vaccination${overdueCount > 1 ? "s" : ""}`,
        iconClass: "bg-red-500/15 text-red-400",
      };
    }

    if (pendingVaccinationCount || activeCareCount) {
      return {
        value: "Attention",
        description: `${pendingVaccinationCount + activeCareCount} care item${pendingVaccinationCount + activeCareCount > 1 ? "s" : ""} pending`,
        iconClass: "bg-amber-500/15 text-amber-400",
      };
    }

    return {
      value: "Good",
      description: "All pets are doing well",
      iconClass: "bg-emerald-500/15 text-emerald-400",
    };
  }, [appointments, groomingBookings, overdueVaccinationReminders, pets]);

  const activityStats = useMemo(() => {
    const currentStart = startOfWeek(new Date());
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 7);
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 7);

    const currentCounts = Array(7).fill(0);
    const previousCounts = Array(7).fill(0);
    const records = [
      ...appointments.map((item) => item.appointmentDate || item.createdAt),
      ...groomingBookings.map((item) => item.bookingDate || item.createdAt),
      ...vaccinations.map((item) => item.vaccinationDate || item.nextDueDate || item.createdAt),
      ...orders.map((item) => item.createdAt),
    ];

    records.forEach((value) => {
      const date = parseRecordDate(value);
      if (!date) return;
      const weekIndex = (date.getDay() || 7) - 1;

      if (date >= currentStart && date < currentEnd) {
        currentCounts[weekIndex] += 1;
      } else if (date >= previousStart && date < currentStart) {
        previousCounts[weekIndex] += 1;
      }
    });

    const maxCount = Math.max(...currentCounts, 1);
    const currentTotal = currentCounts.reduce((sum, value) => sum + value, 0);
    const previousTotal = previousCounts.reduce((sum, value) => sum + value, 0);
    const changePercent = previousTotal
      ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100)
      : currentTotal > 0
        ? 100
        : 0;

    return {
      currentTotal,
      previousTotal,
      changePercent,
      bars: weekDays.map((day, index) => ({
        day,
        count: currentCounts[index],
        value: currentCounts[index] ? Math.max((currentCounts[index] / maxCount) * 100, 12) : 4,
      })),
    };
  }, [appointments, groomingBookings, orders, vaccinations]);

  return (
    <main>
      <section className="mb-8">
        <p className="text-sm font-semibold text-cyan-400">Owner Dashboard</p>

        <div className="mt-2 flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/20">
            <PawPrint size={25} />
          </span>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Welcome back, {ownerName}
          </h1>
        </div>

        <p className="mt-3 text-slate-400">
          Here is today&apos;s overview of your pets and their care.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Pets"
          value={pets.length}
          description="Registered pet profiles"
          icon={PawPrint}
          iconClass="bg-cyan-500/15 text-cyan-400"
        />

        <StatCard
          title="Appointments"
          value={upcomingAppointments.length || appointments.length}
          description="Upcoming appointments"
          icon={CalendarDays}
          iconClass="bg-indigo-500/15 text-indigo-400"
        />

        <StatCard
          title="Vaccinations"
          value={
            dueVaccinations.length + overdueVaccinationReminders.length ||
            vaccinations.length
          }
          description={
            overdueVaccinationReminders.length
              ? `${overdueVaccinationReminders.length} overdue doses`
              : "Upcoming vaccination doses"
          }
          icon={Syringe}
          iconClass="bg-amber-500/15 text-amber-400"
        />

        <StatCard
          title="Health Status"
          value={petHealthSummary.value}
          description={petHealthSummary.description}
          icon={HeartPulse}
          iconClass={petHealthSummary.iconClass}
        />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <SectionHeading
            title="My Pets"
            description="Quick overview of your registered pets"
            buttonText="View all"
            onClick={() => navigate("/owner/pets")}
          />

          {loading ? (
            <EmptyState title="Loading pets" description="Fetching your pet profiles." />
          ) : pets.length === 0 ? (
            <EmptyState
              title="No pets found"
              description="Add your first pet profile to begin."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pets.slice(0, 2).map((pet) => (
                <article
                  key={getId(pet)}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 transition hover:-translate-y-1 hover:border-cyan-400/40"
                >
                  <img
                    src={
                      itemImage(pet) ||
                      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80"
                    }
                    alt={petName(pet)}
                    className="h-44 w-full object-cover"
                  />

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {petName(pet)}
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          {pet.breed || "Breed not set"}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                          pet.vaccinationStatus
                        )}`}
                      >
                        {pet.vaccinationStatus || "Pending"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
                      <span>{pet.species || "Pet"}</span>
                      <span>{pet.age || 0} years</span>
                      <span>{pet.gender || "Not set"}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/owner/pets/${getId(pet)}`)}
                      className="mt-4 w-full rounded-xl border border-cyan-400/30 px-4 py-2.5 font-medium text-cyan-400 transition hover:bg-cyan-400 hover:text-slate-950"
                    >
                      View Pet Details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate("/owner/pets/add")}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-3 font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400"
          >
            <Plus size={19} />
            Add New Pet
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <SectionHeading
            title="Weekly Care Activity"
            description="Pet-care activity this week"
          />

          <div className="flex h-64 items-end justify-between gap-3 pt-5">
            {activityStats.bars.map((item) => (
              <div
                key={item.day}
                className="flex h-full flex-1 flex-col items-center justify-end"
              >
                <div
                  className="w-full max-w-9 rounded-t-lg bg-gradient-to-t from-indigo-600 to-cyan-400 transition hover:opacity-80"
                  style={{ height: `${item.value}%` }}
                  title={`${item.count} care records`}
                />

                <span className="mt-3 text-xs text-slate-500">{item.day}</span>
              </div>
            ))}
          </div>

          <div className={`mt-5 flex items-center gap-3 rounded-xl p-4 ${
            activityStats.changePercent >= 0
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-amber-500/10 text-amber-400"
          }`}>
            <Activity size={21} />

            <div>
              <p className="font-semibold">
                {activityStats.currentTotal} care records this week
              </p>
              <p className="text-xs opacity-70">
                {activityStats.previousTotal
                  ? `${Math.abs(activityStats.changePercent)}% ${activityStats.changePercent >= 0 ? "increase" : "decrease"} from last week`
                  : "No care records last week for comparison"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <SectionHeading
            title="Upcoming Appointments"
            description="Your next veterinary visits"
            buttonText="View all"
            onClick={() => navigate("/owner/appointments")}
          />

          {appointments.length === 0 ? (
            <EmptyState
              title="No appointments"
              description="Upcoming appointments will appear here."
            />
          ) : (
            <div className="space-y-4">
              {appointments.slice(0, 3).map((appointment) => (
                <article
                  key={getId(appointment)}
                  className="rounded-xl border border-white/10 bg-slate-950/60 p-4 transition hover:-translate-y-1 hover:border-cyan-400/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
                        <UserRound size={21} />
                      </div>

                      <div>
                        <h3 className="font-semibold text-white">
                          {appointment.reason || "Veterinary Visit"}
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          {petName(appointment.petId)} with {vetName(appointment.vetId)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                        appointment.status
                      )}`}
                    >
                      {appointment.status || "Pending"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-2">
                      <CalendarDays size={16} className="text-cyan-400" />
                      {formatDate(appointment.appointmentDate)}
                    </span>

                    <span className="flex items-center gap-2">
                      <Clock size={16} className="text-cyan-400" />
                      {appointment.appointmentTime || "Time not set"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <SectionHeading
            title="Vaccination Reminders"
            description="Never miss an important vaccination"
            buttonText="View records"
            onClick={() => navigate("/owner/vaccinations")}
          />

          {reminderVaccinations.length === 0 ? (
            <EmptyState
              title="No reminders"
              description="Upcoming vaccine reminders will appear here."
            />
          ) : (
            <div className="space-y-4">
              {reminderVaccinations.slice(0, 3).map((vaccination) => {
                const reminderStatus =
                  vaccination.calculatedStatus || vaccination.status || "Upcoming";

                return (
                <article
                  key={getId(vaccination)}
                  className="flex items-start gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 transition hover:-translate-y-1 hover:border-cyan-400/40"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                    <Syringe size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-white">
                          {vaccination.vaccineName || "Vaccination"}
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          For {petName(vaccination.petId)}
                        </p>
                      </div>

                      <VaccinationReminderBadge status={reminderStatus} />
                    </div>

                    <p className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                      <CalendarDays size={16} className="text-amber-400" />
                      {vaccination.overdueDays !== undefined
                        ? `Overdue by ${vaccination.overdueDays} days`
                        : vaccination.daysRemaining !== undefined
                          ? `Due in ${vaccination.daysRemaining} days`
                          : `Due on ${formatDate(vaccination.nextDueDate)}`}
                    </p>
                  </div>
                </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <SectionHeading
            title="Recent Orders"
            description="Latest pet shop purchases"
            buttonText="View all"
            onClick={() => navigate("/owner/orders")}
          />

          {latestOrders.length === 0 ? (
            <EmptyState title="No orders yet" description="Your shop orders will appear here." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {latestOrders.slice(0, 4).map((order) => (
                <article key={getId(order)} className="rounded-xl border border-white/10 bg-slate-950/60 p-4 transition hover:-translate-y-1 hover:border-cyan-400/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{orderTitle(order)}</p>
                      <p className="mt-1 text-sm text-slate-400">{formatDate(order.createdAt)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(order.orderStatus)}`}>
                      {formatStatus(order.orderStatus || "Pending")}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">
                    {order.totalItems || order.items?.length || 0} items · Rs. {Number(order.totalAmount || 0).toLocaleString("en-IN")}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <SectionHeading title="Shop & Notifications" description="Live account snapshot" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <button type="button" onClick={() => navigate("/owner/cart")} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 p-4 text-left transition hover:border-cyan-400/40">
              <span className="flex items-center gap-3 text-slate-300"><ShoppingCart size={19} className="text-cyan-300" /> Cart items</span>
              <span className="font-bold text-white">{shopSummary.cart}</span>
            </button>
            <button type="button" onClick={() => navigate("/owner/shop/wishlist")} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 p-4 text-left transition hover:border-cyan-400/40">
              <span className="flex items-center gap-3 text-slate-300"><Heart size={19} className="text-cyan-300" /> Wishlist</span>
              <span className="font-bold text-white">{shopSummary.wishlist}</span>
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {notifications.slice(0, 3).map((item) => (
              <button key={getId(item)} type="button" onClick={() => navigate("/owner/notifications")} className="block w-full rounded-xl border border-white/10 bg-slate-950/60 p-4 text-left transition hover:border-cyan-400/40">
                <p className="flex items-center gap-2 text-sm font-semibold text-white"><Bell size={16} className="text-cyan-300" /> {item.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.message}</p>
              </button>
            ))}
            {!notifications.length && <EmptyState title="No notifications" description="Alerts will appear here." />}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <SectionHeading
          title="Quick Actions"
          description="Frequently used owner activities"
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction
            title="Add Pet"
            description="Create a new pet profile"
            icon={PawPrint}
            iconClass="bg-cyan-500/15 text-cyan-400"
            onClick={() => navigate("/owner/pets/add")}
          />

          <QuickAction
            title="Book Appointment"
            description="Schedule a veterinary visit"
            icon={CalendarDays}
            iconClass="bg-indigo-500/15 text-indigo-400"
            onClick={() => navigate("/owner/appointments/book")}
          />

          <QuickAction
            title="Health Records"
            description="View medical information"
            icon={ShieldCheck}
            iconClass="bg-emerald-500/15 text-emerald-400"
            onClick={() => navigate("/owner/health-records")}
          />

          <QuickAction
            title="Grooming Service"
            description="Book grooming care"
            icon={Scissors}
            iconClass="bg-cyan-500/15 text-cyan-400"
            onClick={() => navigate("/owner/grooming")}
          />

          <QuickAction
            title="Pet Shop"
            description="Purchase pet supplies"
            icon={ShoppingBag}
            iconClass="bg-amber-500/15 text-amber-400"
            onClick={() => navigate("/owner/shop")}
          />
        </div>
      </section>
    </main>
  );
};

export default OwnerDashboard;

