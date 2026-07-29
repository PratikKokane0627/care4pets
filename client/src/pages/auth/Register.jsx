import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiPhone,
  FiUser,
} from "react-icons/fi";
import { FaPaw } from "react-icons/fa";

import api from "../../services/api";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    // Allow only numbers in the phone field
    const updatedValue =
      name === "phone" ? value.replace(/\D/g, "") : value;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: updatedValue,
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    } else if (form.name.trim().length < 3) {
      newErrors.name =
        "Name must contain at least 3 characters";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(form.email.trim())) {
      newErrors.email = "Enter a valid email address";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(form.phone.trim())) {
      newErrors.phone =
        "Enter a valid 10-digit Indian phone number";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password =
        "Password must contain at least 8 characters";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm() || loading) {
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
      });

      toast.success(
        response.data?.message ||
          "Registration successful. You can now log in.",
        {
          duration: 5000,
        }
      );

      // Save email only to fill it automatically on login
      localStorage.setItem(
        "rememberedEmail",
        form.email.trim().toLowerCase()
      );

      navigate("/login", {
        replace: true,
        state: {
          registeredEmail: form.email.trim().toLowerCase(),
        },
      });
    } catch (error) {
      console.error(
        "Registration error:",
        error.response?.data || error.message
      );

      if (!error.response) {
        toast.error(
          "Cannot connect to the server. Make sure the backend is running."
        );
        return;
      }

      const status = error.response.status;
      const message = error.response.data?.message;

      if (status === 400) {
        toast.error(
          message || "Please enter valid registration details."
        );
      } else if (status === 409) {
        toast.error(
          message || "An account with this email already exists."
        );
      } else {
        toast.error(
          message || "Registration failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const inputContainerClass = (fieldName) => {
    return `flex items-center rounded-xl border bg-white/5 px-4 transition ${
      errors[fieldName]
        ? "border-red-500"
        : "border-white/10 focus-within:border-cyan-400"
    }`;
  };

  return (
    <section className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-slate-950 px-5 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur-xl transition duration-300 hover:border-cyan-300/30 hover:bg-white/[0.07] sm:p-9">
        {/* Heading */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-2xl text-cyan-400">
            <FaPaw />
          </div>

          <h1 className="text-3xl font-bold text-white">
            Create Account
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Join Care4Pets and manage your pet care services
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className="mb-5">
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Full name
            </label>

            <div className={inputContainerClass("name")}>
              <FiUser className="shrink-0 text-slate-400" />

              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                className="w-full bg-transparent px-3 py-3.5 text-white outline-none placeholder:text-slate-500"
              />
            </div>

            {errors.name && (
              <p className="mt-1.5 text-sm text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="mb-5">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Email address
            </label>

            <div className={inputContainerClass("email")}>
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

          {/* Phone */}
          <div className="mb-5">
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Phone number
            </label>

            <div className={inputContainerClass("phone")}>
              <FiPhone className="shrink-0 text-slate-400" />

              <input
                id="phone"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter 10-digit phone number"
                autoComplete="tel"
                inputMode="numeric"
                maxLength={10}
                className="w-full bg-transparent px-3 py-3.5 text-white outline-none placeholder:text-slate-500"
              />
            </div>

            {errors.phone && (
              <p className="mt-1.5 text-sm text-red-400">
                {errors.phone}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="mb-5">
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Password
            </label>

            <div className={inputContainerClass("password")}>
              <FiLock className="shrink-0 text-slate-400" />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                className="w-full bg-transparent px-3 py-3.5 text-white outline-none placeholder:text-slate-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((previousValue) => !previousValue)
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

              {/* Confirm Password */}
              <div className="mb-6">
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Confirm password
                </label>

                <div
                  className={inputContainerClass("confirmPassword")}
                >
                  <FiLock className="shrink-0 text-slate-400" />

                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Enter password again"
                    autoComplete="new-password"
                    className="w-full bg-transparent px-3 py-3.5 text-white outline-none placeholder:text-slate-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (previousValue) => !previousValue
                      )
                    }
                    className="text-slate-400 transition hover:text-white"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff />
                    ) : (
                      <FiEye />
                    )}
                  </button>
                </div>

                {errors.confirmPassword && (
                  <p className="mt-1.5 text-sm text-red-400">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-5 py-3.5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-cyan-400 transition hover:text-cyan-300"
              >
                Login
              </Link>
            </p>
          </div>
        </section>
      );
    };

    export default Register;
