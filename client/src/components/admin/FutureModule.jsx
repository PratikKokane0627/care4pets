import AdminPageHeader from "./AdminPageHeader";
import { Panel } from "../../pages/admin/adminShared";

const FutureModule = ({ icon: Icon, title, description, bullets }) => (
  <main>
    <AdminPageHeader title={title} description={description} />
    <Panel className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-6">
        <Icon className="text-cyan-300" size={36} />
        <h2 className="mt-5 text-2xl font-bold text-white">Coming later</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Backend routes stay disabled per project decision. This page reserves
          the admin workflow and visual structure.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {bullets.map((item) => (
          <div
            key={item}
            className="rounded-xl border border-white/10 bg-slate-950 p-4 text-sm font-semibold text-slate-300"
          >
            {item}
          </div>
        ))}
      </div>
    </Panel>
  </main>
);

export default FutureModule;
