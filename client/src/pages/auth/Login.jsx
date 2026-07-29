import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
} from "react-icons/fi";
import { FaPaw } from "react-icons/fa";

import api from "../../services/api";

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const rememberedEmail =
    location.state?.email || localStorage.getItem("rememberedEmail") || "";

  const [form, setForm] = useState({
    email: rememberedEmail,
    password: "",
    remember: Boolean(rememberedEmail),
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(form.email.trim())) {
      newErrors.email = "Enter a valid email address";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password =
        "Password must contain at least 8 characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const redirectByRole = (role) => {
    const routes = {
      owner: "/owner/dashboard",
      vet: "/vet/dashboard",
      groomer: "/groomer/dashboard",
      admin: "/admin/dashboard",
    };

    navigate(routes[role] || "/", { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm() || loading) {
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      const { token, user, message } = response.data;

      if (!token || !user) {
        toast.error("Invalid response received from server");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (form.remember) {
        localStorage.setItem(
          "rememberedEmail",
          form.email.trim().toLowerCase()
        );
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      toast.success(message || "Login successful");

      redirectByRole(user.role);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (!error.response) {
        toast.error(
          "Cannot connect to the server. Check whether the backend is running."
        );
      } else if (status === 400) {
        toast.error(message || "Enter email and password");
      } else if (status === 401) {
        toast.error(message || "Invalid email or password");
      // Email verification before login temporarily disabled.
      // } else if (
      //   status === 403 &&
      //   message?.toLowerCase().includes("verify your email")
      // ) {
      //   toast.error(message, {
      //     duration: 5000,
      //   });
      //   navigate("/verify-email", {
      //     state: { email: form.email.trim().toLowerCase() },
      //   });
      } else if (status === 403) {
        toast.error(message || "You cannot access this account", {
          duration: 5000,
        });
      } else {
        toast.error(message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-slate-950 px-5 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur-xl transition duration-300 hover:border-cyan-300/30 hover:bg-white/[0.07] sm:p-9">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-2xl text-cyan-400">
            <FaPaw />
          </div>

          <h1 className="text-3xl font-bold text-white">
            Welcome Back
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Log in to access your Care4Pets account
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-5">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Email address
            </label>

            <div
              className={`flex items-center rounded-xl border bg-white/5 px-4 ${
                errors.email
                  ? "border-red-500"
                  : "border-white/10 focus-within:border-cyan-400"
              }`}
            >
              <FiMail className="shrink-0 text-slate-400" />

              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                autoComplete="email"
                className="w-full bg-transparent px-3 py-3.5 text-white outline-none placeholder:text-slate-500"
              />
            </div>

            {errors.email && (
              <p className="mt-1.5 text-sm text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Password
            </label>

            <div
              className={`flex items-center rounded-xl border bg-white/5 px-4 ${
                errors.password
                  ? "border-red-500"
                  : "border-white/10 focus-within:border-cyan-400"
              }`}
            >
              <FiLock className="shrink-0 text-slate-400" />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full bg-transparent px-3 py-3.5 text-white outline-none placeholder:text-slate-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                className="text-slate-400 transition hover:text-white"
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {errors.password && (
              <p className="mt-1.5 text-sm text-red-400">
                {errors.password}
              </p>
            )}
          </div>

          <div className="mb-6 flex items-center justify-between gap-3 text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-slate-400">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
                className="h-4 w-4 accent-cyan-400"
              />
              Remember email
            </label>

            <Link
              to="/forgot-password"
              className="text-cyan-400 hover:text-cyan-300"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-5 py-3.5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Email verification before login temporarily disabled. */}
        {/* <p className="mt-5 text-center text-sm text-slate-400">
          Need to verify your email?{" "}
          <Link
            to="/verify-email"
            state={{ email: form.email.trim().toLowerCase() }}
            className="font-semibold text-cyan-400 hover:text-cyan-300"
          >
            Verify email
          </Link>
        </p> */}

        <p className="mt-6 text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-cyan-400 hover:text-cyan-300"
          >
            Register
          </Link>
        </p>
      </div>
    </section>
  );
};

export default Login;
