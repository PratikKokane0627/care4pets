import {
  FiCalendar,
  FiHeart,
  FiShield,
  FiShoppingBag,
  FiUsers,
} from "react-icons/fi";
import { FaPaw } from "react-icons/fa";
import { Link } from "react-router-dom";

const values = [
  {
    title: "Compassion",
    description:
      "Every feature is designed around the health, comfort and happiness of pets.",
    icon: <FiHeart />,
  },
  {
    title: "Trust",
    description:
      "We help pet owners connect with reliable veterinarians, groomers and services.",
    icon: <FiShield />,
  },
  {
    title: "Convenience",
    description:
      "Appointments, vaccinations, grooming and shopping are managed from one platform.",
    icon: <FiCalendar />,
  },
  {
    title: "Community",
    description:
      "We bring pet owners and care professionals together in one connected ecosystem.",
    icon: <FiUsers />,
  },
];

const About = () => {
  return (
    <>
      <section className="relative overflow-hidden px-5 pb-20 pt-24 lg:px-8">
        <div className="absolute left-1/2 top-10 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-2 text-sm font-semibold text-indigo-300">
            <FaPaw />
            About Care4Pets
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Making Pet Care
            <span className="block bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Simple and Connected
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-400">
            Care4Pets is a complete pet care management platform that helps pet
            owners manage health records, appointments, grooming, vaccinations,
            shopping and payments from one place.
          </p>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Our mission
            </p>

            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              Better Care for Pets, Less Stress for Owners
            </h2>

            <p className="mt-5 leading-8 text-slate-400">
              Managing a pet involves many responsibilities. Owners need to
              remember vaccination dates, maintain medical records, schedule
              veterinary visits, book grooming services and purchase essential
              products.
            </p>

            <p className="mt-4 leading-8 text-slate-400">
              Care4Pets brings all these services together so owners can focus
              more on their pets and spend less time managing different
              platforms and records.
            </p>

            <Link
              to="/register"
              className="mt-7 inline-flex rounded-xl bg-indigo-500 px-6 py-3 font-semibold text-white transition hover:bg-indigo-400"
            >
              Join Care4Pets
            </Link>
          </div>

          <div className="relative rounded-3xl border border-white/10 bg-[#0b1222] p-8">
            <div className="absolute right-6 top-6 h-28 w-28 rounded-full bg-indigo-500/20 blur-3xl" />

            <div className="relative grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <FiUsers className="text-3xl text-indigo-400" />
                <h3 className="mt-4 text-3xl font-bold text-white">10K+</h3>
                <p className="mt-1 text-slate-400">Pet owners supported</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <FiShield className="text-3xl text-cyan-400" />
                <h3 className="mt-4 text-3xl font-bold text-white">500+</h3>
                <p className="mt-1 text-slate-400">Care professionals</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <FiCalendar className="text-3xl text-emerald-400" />
                <h3 className="mt-4 text-3xl font-bold text-white">25K+</h3>
                <p className="mt-1 text-slate-400">Bookings managed</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <FiShoppingBag className="text-3xl text-yellow-400" />
                <h3 className="mt-4 text-3xl font-bold text-white">1K+</h3>
                <p className="mt-1 text-slate-400">Pet products</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#070d1b] px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Our values
            </p>

            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              What Care4Pets Stands For
            </h2>

            <p className="mt-4 leading-7 text-slate-400">
              Our platform is built around trust, compassion and responsible
              pet care.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <article
                key={value.title}
                className="rounded-3xl border border-white/10 bg-[#0b1222] p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-400/40"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-xl text-indigo-400">
                  {value.icon}
                </div>

                <h3 className="mt-5 text-xl font-semibold text-white">
                  {value.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-400">
                  {value.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-indigo-400/20 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 px-7 py-12 text-center">
          <FaPaw className="mx-auto text-4xl text-indigo-400" />

          <h2 className="mt-5 text-3xl font-bold text-white">
            Give Your Pet the Care They Deserve
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-400">
            Create your account and start managing your pet’s health, services
            and daily care from one secure dashboard.
          </p>

          <Link
            to="/register"
            className="mt-7 inline-flex rounded-xl bg-indigo-500 px-6 py-3 font-semibold text-white transition hover:bg-indigo-400"
          >
            Create Free Account
          </Link>
        </div>
      </section>
    </>
  );
};

export default About;