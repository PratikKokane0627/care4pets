import {
  FiCalendar,
  FiFileText,
  FiShield,
  FiShoppingBag,
} from "react-icons/fi";

const features = [
  {
    title: "Pet Health Records",
    description:
      "Store vaccination details, medical history, allergies and important health information in one place.",
    icon: <FiFileText />,
  },
  {
    title: "Smart Appointments",
    description:
      "Book veterinary appointments and manage upcoming visits without unnecessary phone calls.",
    icon: <FiCalendar />,
  },
  {
    title: "Vaccination Reminders",
    description:
      "Never miss an important vaccine date with timely reminders and vaccination tracking.",
    icon: <FiShield />,
  },
  {
    title: "Pet Shopping",
    description:
      "Discover trusted food, healthcare and grooming products for your pet.",
    icon: <FiShoppingBag />,
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="px-5 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Smart pet care
          </p>

          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Everything You Need to Care for Your Pet
          </h2>

          <p className="mt-4 leading-7 text-slate-400">
            Manage your pet's health, appointments, vaccinations and shopping
            from one simple platform.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-3xl border border-white/10 bg-[#0b1222] p-7 transition duration-300 hover:-translate-y-1 hover:border-indigo-400/40"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-xl text-cyan-400 transition group-hover:bg-cyan-400/20">
                {feature.icon}
              </div>

              <h3 className="mt-6 text-xl font-semibold text-white">
                {feature.title}
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;