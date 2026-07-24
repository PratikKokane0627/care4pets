import {
  FiCalendar,
  FiHeart,
  FiShield,
} from "react-icons/fi";

const statistics = [
  {
    value: "10K+",
    label: "Happy Pets",
    icon: <FiHeart />,
  },
  {
    value: "500+",
    label: "Experts",
    icon: <FiShield />,
  },
  {
    value: "24/7",
    label: "Support",
    icon: <FiCalendar />,
  },
];

const StatsSection = () => {
  return (
    <section className="border-y border-white/5 bg-[#070d1b] px-5 py-14 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-3">
        {statistics.map((item) => (
          <article
            key={item.label}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-indigo-500/10 p-6 text-center"
          >
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300">
              {item.icon}
            </div>

            <h2 className="text-3xl font-bold text-white">
              {item.value}
            </h2>

            <p className="mt-1 text-sm uppercase tracking-wider text-slate-400">
              {item.label}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default StatsSection;