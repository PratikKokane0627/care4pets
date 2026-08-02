import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { FaPaw } from "react-icons/fa";

import VetRegistrationForm from "../../components/vet/VetRegistrationForm";
import api from "../../services/api";

const ApplyVet = () => {
  const submitApplication = async (payload) => {
    const response = await api.post("/vets/apply", payload);
    toast.success(response.data?.message || "Veterinarian application submitted");
  };

  return (
    <section className="min-h-screen bg-slate-950 px-5 py-10 text-white lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
              <FaPaw />
            </span>
            <span className="text-xl font-bold">
              Care<span className="text-cyan-400">4Pets</span>
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/" className="rounded-xl border border-white/10 px-4 py-2.5 font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white">
              Back Home
            </Link>
            <Link to="/login" className="rounded-xl bg-cyan-400 px-4 py-2.5 font-bold text-slate-950 transition hover:bg-cyan-300">
              Login
            </Link>
          </div>
        </div>

        <VetRegistrationForm
          title="Apply as a Veterinarian"
          description="Submit your professional and clinic details for admin review. After approval, your vet account becomes active and owners can book appointments with you."
          submitText="Submit Application"
          successNote="Applications are created as pending until an admin approves them."
          onSubmit={submitApplication}
        />
      </div>
    </section>
  );
};

export default ApplyVet;
