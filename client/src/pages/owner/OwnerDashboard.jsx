import {
  Activity,
  CalendarDays,
  ChevronRight,
  Clock,
  HeartPulse,
  PawPrint,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Syringe,
  UserRound,
} from "lucide-react";
import { useState } from "react";
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

const weeklyActivity = [
  { day: "Mon", value: 40 },
  { day: "Tue", value: 70 },
  { day: "Wed", value: 50 },
  { day: "Thu", value: 85 },
  { day: "Fri", value: 65 },
  { day: "Sat", value: 95 },
  { day: "Sun", value: 75 },
];

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

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);

  const { loading } = useFetch(async () => {
    const [petsRes, appointmentsRes, vaccinationsRes] = await Promise.all([
      api.get("/pets"),
      api.get("/appointments").catch(() => ({ data: [] })),
      api.get("/vaccinations").catch(() => ({ data: [] })),
    ]);

    setPets(toArray(petsRes.data, ["pets"]));
    setAppointments(toArray(appointmentsRes.data, ["appointments"]));
    setVaccinations(toArray(vaccinationsRes.data, ["vaccinations"]));
  }, "owner-dashboard");

  const ownerName = storedUser.name?.split(" ")[0] || "Pet Owner";
  const upcomingAppointments = appointments.filter((item) =>
    ["pending", "accepted", "confirmed"].includes(
      String(item.status).toLowerCase()
    )
  );
  const upcomingVaccinations = vaccinations.filter(
    (item) => item.nextDueDate || String(item.status).toLowerCase() !== "completed"
  );

  return (
    <main>
      <section className="mb-8">
        <p className="text-sm font-semibold text-cyan-400">Owner Dashboard</p>

        <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">
          Welcome back, {ownerName}!
        </h1>

        <p className="mt-2 text-slate-400">
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
          value={upcomingVaccinations.length || vaccinations.length}
          description="Upcoming vaccination doses"
          icon={Syringe}
          iconClass="bg-amber-500/15 text-amber-400"
        />

        <StatCard
          title="Health Status"
          value="Good"
          description="All pets are doing well"
          icon={HeartPulse}
          iconClass="bg-emerald-500/15 text-emerald-400"
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
            {weeklyActivity.map((item) => (
              <div
                key={item.day}
                className="flex h-full flex-1 flex-col items-center justify-end"
              >
                <div
                  className="w-full max-w-9 rounded-t-lg bg-gradient-to-t from-indigo-600 to-cyan-400 transition hover:opacity-80"
                  style={{ height: `${item.value}%` }}
                  title={`${item.value}% activity`}
                />

                <span className="mt-3 text-xs text-slate-500">{item.day}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-xl bg-emerald-500/10 p-4 text-emerald-400">
            <Activity size={21} />

            <div>
              <p className="font-semibold">Activity increased by 18%</p>
              <p className="text-xs text-emerald-400/70">
                Compared with last week
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

          {vaccinations.length === 0 ? (
            <EmptyState
              title="No reminders"
              description="Upcoming vaccine reminders will appear here."
            />
          ) : (
            <div className="space-y-4">
              {vaccinations.slice(0, 3).map((vaccination) => (
                <article
                  key={getId(vaccination)}
                  className="flex items-start gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 transition hover:-translate-y-1 hover:border-cyan-400/40"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                    <Syringe size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-white">
                          {vaccination.vaccineName || "Vaccination"}
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          For {petName(vaccination.petId)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                          vaccination.status || "Upcoming"
                        )}`}
                      >
                        {vaccination.status || "Upcoming"}
                      </span>
                    </div>

                    <p className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                      <CalendarDays size={16} className="text-amber-400" />
                      Due on {formatDate(vaccination.nextDueDate)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
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
