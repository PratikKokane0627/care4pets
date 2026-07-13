export default function Home() {
  return (
    <main className="min-h-screen bg-[#030712] text-white">
      <section className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-4xl text-center">
          <span className="inline-flex rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300">
            Complete Pet Care Platform
          </span>

          <h1 className="mt-8 text-5xl font-black tracking-tight md:text-7xl">
            Complete Care for
            <span className="block bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Every Pet
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            Manage pets, book veterinary appointments, schedule grooming,
            receive vaccination reminders, and shop for pet essentials.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button className="rounded-xl bg-indigo-600 px-7 py-3 font-semibold transition hover:bg-indigo-500">
              Get Started
            </button>

            <button className="rounded-xl border border-white/10 bg-white/5 px-7 py-3 font-semibold transition hover:bg-white/10">
              Explore Services
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}