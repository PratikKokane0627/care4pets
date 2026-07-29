import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiArrowLeft, FiCheckCircle, FiMail } from "react-icons/fi";
import { FaPaw } from "react-icons/fa";

import api from "../../services/api";

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialEmail = useMemo(
    () => location.state?.email || "",
    [location.state?.email]
  );

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const canSend = Boolean(normalizedEmail) && !sending;
  const canVerify = Boolean(normalizedEmail) && /^\d{6}$/.test(otp) && !verifying;

  const sendOtp = async () => {
    if (!normalizedEmail) {
      toast.error("Email is required");
      return;
    }

    try {
      setSending(true);
      const response = await api.post("/auth/send-otp", {
        email: normalizedEmail,
      });
      toast.success(
        response.data?.message || "Verification code sent to your email"
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Could not send verification code. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();

    if (!canVerify) {
      toast.error("Enter the 6-digit verification code");
      return;
    }

    try {
      setVerifying(true);
      const response = await api.post("/auth/verify-otp", {
        email: normalizedEmail,
        otp,
      });
      toast.success(response.data?.message || "Email verified successfully");
      navigate("/login", {
        replace: true,
        state: { email: normalizedEmail },
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Could not verify email. Please try again."
      );
    } finally {
      setVerifying(false);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-slate-950 px-5 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur-xl transition duration-300 hover:border-cyan-300/30 hover:bg-white/[0.07] sm:p-9">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-2xl text-cyan-400">
            <FaPaw />
          </div>

          <h1 className="text-3xl font-bold text-white">Verify Email</h1>

          <p className="mt-2 text-sm text-slate-400">
            Enter your email, send a code, then verify before logging in.
          </p>
        </div>

        <form onSubmit={verifyOtp} noValidate>
          <div className="mb-5">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Email address
            </label>

            <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-4 focus-within:border-cyan-400">
              <FiMail className="shrink-0 text-slate-400" />

              <input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                className="w-full bg-transparent px-3 py-3.5 text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={!canSend}
            onClick={sendOtp}
            className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/40 px-5 py-3 font-semibold text-cyan-300 transition hover:border-cyan-300 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiMail />
            {sending ? "Sending..." : "Send verification code"}
          </button>

          <div className="mb-6">
            <label
              htmlFor="otp"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Verification code
            </label>

            <input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="6-digit code"
              autoComplete="one-time-code"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-center text-lg tracking-[0.35em] text-white outline-none placeholder:text-sm placeholder:tracking-normal placeholder:text-slate-500 focus:border-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={!canVerify}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-5 py-3.5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiCheckCircle />
            {verifying ? "Verifying..." : "Verify email"}
          </button>
        </form>

        <Link
          to="/login"
          className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300"
        >
          <FiArrowLeft />
          Back to login
        </Link>
      </div>
    </section>
  );
};

export default VerifyEmail;
