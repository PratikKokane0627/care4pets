import {
  FiArrowRight,
  FiCalendar,
  FiShield,
} from "react-icons/fi";
import { FaPaw } from "react-icons/fa";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden px-5 pb-24 pt-20 lg:px-8 lg:pt-28">
      <div className="absolute left-1/2 top-0 h-[450px] w-[450px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[130px]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
            <FaPaw />
            AI-powered pet care
          </div>

          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-7xl">
            Everything Your Pet{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Needs
            </span>
            <br />
            in One Place
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            Manage pets, appointments, grooming,
            vaccinations, shopping and medical records
            from one intelligent platform.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 font-semibold text-white transition hover:bg-indigo-400"
            >
              Get Started
              <FiArrowRight />
            </Link>

            <a
              href="#services"
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Explore Services
            </a>
          </div>
        </div>

        <div className="relative mx-auto mt-20 flex h-64 max-w-xl items-center justify-center">
          <div className="absolute h-56 w-56 rounded-full border border-indigo-500/40 shadow-[0_0_100px_rgba(99,102,241,0.25)]">
            <div className="absolute inset-5 rounded-full border border-cyan-400/20" />
            <div className="absolute inset-12 rounded-full border border-indigo-300/20" />

            <FaPaw className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl text-indigo-400/50" />
          </div>

          <div className="absolute right-0 top-8 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:right-10">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-cyan-400/10 p-3 text-cyan-400">
                <FiCalendar />
              </span>

              <div>
                <p className="text-xs text-slate-500">
                  Next Vaccine
                </p>

                <p className="text-sm font-semibold text-white">
                  Oct 24, 2026
                </p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:left-12">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-emerald-400/10 p-3 text-emerald-400">
                <FiShield />
              </span>

              <div>
                <p className="text-xs text-slate-500">
                  Health Status
                </p>

                <p className="text-sm font-semibold text-white">
                  Fully Protected
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;