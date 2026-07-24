import {
  FiActivity,
  FiCalendar,
  FiScissors,
  FiShoppingBag,
} from "react-icons/fi";
import { Link } from "react-router-dom";

const services = [
  {
    title: "Veterinary Care",
    description:
      "Book appointments with trusted veterinarians and manage your pet's medical visits.",
    icon: <FiActivity />,
    link: "/appointments",
  },
  {
    title: "Pet Grooming",
    description:
      "Schedule professional grooming services to keep your pet healthy, clean and happy.",
    icon: <FiScissors />,
    link: "/grooming",
  },
  {
    title: "Vaccination Tracking",
    description:
      "Track vaccination history and receive reminders for upcoming vaccine dates.",
    icon: <FiCalendar />,
    link: "/vaccinations",
  },
  {
    title: "Pet Shop",
    description:
      "Explore pet food, healthcare products, toys and grooming accessories.",
    icon: <FiShoppingBag />,
    link: "/shop",
  },
];

const ServicesSection = () => {
  return (
    <section
      id="services"
      className="bg-[#070d1b] px-5 py-24 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Our services
            </p>

            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              Complete Care for Every Pet
            </h2>

            <p className="mt-4 leading-7 text-slate-400">
              Access essential pet care services from one simple and secure
              platform.
            </p>
          </div>

          <Link
            to="/register"
            className="w-fit rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Explore all services
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <article
              key={service.title}
              className="group flex flex-col rounded-3xl border border-white/10 bg-[#0b1222] p-6 transition duration-300 hover:-translate-y-2 hover:border-indigo-400/40"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl text-indigo-400 transition group-hover:bg-indigo-500 group-hover:text-white">
                {service.icon}
              </div>

              <h3 className="mt-6 text-xl font-semibold text-white">
                {service.title}
              </h3>

              <p className="mt-3 flex-1 leading-7 text-slate-400">
                {service.description}
              </p>

              <Link
                to={service.link}
                className="mt-6 font-semibold text-cyan-400 transition hover:text-cyan-300"
              >
                Learn more →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;