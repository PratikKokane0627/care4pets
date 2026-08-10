import { Link, useLocation } from "react-router-dom";
import { FaPaw } from "react-icons/fa";
import { FiArrowLeft, FiHome, FiShield } from "react-icons/fi";

const roleHome = {
  admin: "/admin/dashboard",
  owner: "/owner/dashboard",
  vet: "/vet/dashboard",
  groomer: "/groomer/dashboard",
};

const Forbidden = () => {
  const location = useLocation();
  const requestedPath = location.state?.from?.pathname;

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    localStorage.removeItem("user");
  }

  const dashboardPath = roleHome[user?.role] || "/";

  return (
    <section className="flex min-h-[80vh] items-center justify-center px-5">
      <div className="max-w-2xl text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-indigo-500/10 text-5xl text-indigo-400">
          <FaPaw />
        </div>

        <h1 className="mt-8 text-7xl font-extrabold text-white">
          403
        </h1>

        <h2 className="mt-4 text-3xl font-bold text-white">
          Access Denied
        </h2>

        <p className="mt-5 leading-7 text-slate-400">
          This area is protected for a different account type. We can
          still get you back to a place where your profile has access.
        </p>

        {requestedPath ? (
          <p className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            <FiShield className="text-indigo-300" />
            Blocked route: {requestedPath}
          </p>
        ) : null}

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            to={dashboardPath}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 font-semibold text-white transition hover:bg-indigo-400"
          >
            <FiHome />
            Go to Dashboard
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            <FiArrowLeft />
            Go Back
          </button>
        </div>
      </div>
    </section>
  );
};

export default Forbidden;
