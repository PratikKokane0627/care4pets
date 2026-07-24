import { Link } from "react-router-dom";
import { FaPaw } from "react-icons/fa";
import { FiArrowLeft, FiHome } from "react-icons/fi";

const NotFound = () => {
  return (
    <section className="flex min-h-[80vh] items-center justify-center px-5">
      <div className="max-w-2xl text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-indigo-500/10 text-5xl text-indigo-400">
          <FaPaw />
        </div>

        <h1 className="mt-8 text-7xl font-extrabold text-white">
          404
        </h1>

        <h2 className="mt-4 text-3xl font-bold text-white">
          Oops! Page Not Found
        </h2>

        <p className="mt-5 leading-7 text-slate-400">
          The page you're looking for doesn't exist or may have
          been moved. Let's help you get back on track.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 font-semibold text-white transition hover:bg-indigo-400"
          >
            <FiHome />
            Back to Home
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

export default NotFound;