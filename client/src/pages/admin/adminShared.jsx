/* oxlint-disable react/only-export-components */
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../../services/api";

export const getId = (item) => item?._id || item?.id;

export const toArray = (payload, keys = []) => {
  for (const key of keys) {
    const value = key.split(".").reduce((current, part) => current?.[part], payload);
    if (Array.isArray(value)) return value;
  }

  return Array.isArray(payload) ? payload : [];
};

export const getPagination = (payload = {}) =>
  payload.pagination || {
    currentPage: payload.currentPage || 1,
    totalPages: payload.totalPages || 1,
    total: payload.total || payload.totalServices || payload.totalProducts || 0,
  };

export const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

export const userName = (user) => user?.name || user?.fullName || "Unknown";

export const imageUrl = (item) =>
  item?.profileImage?.url ||
  item?.image?.url ||
  item?.images?.[0]?.url ||
  item?.profileImage ||
  "";

export const Button = ({
  children,
  as: Component = "button",
  variant = "primary",
  className = "",
  ...props
}) => {
  const variants = {
    primary:
      "bg-cyan-400 text-slate-950 hover:-translate-y-0.5 hover:bg-cyan-300 hover:shadow-lg hover:shadow-cyan-500/20",
    ghost:
      "border border-white/10 text-slate-300 hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-white/5 hover:text-white",
    danger:
      "border border-red-400/30 text-red-300 hover:-translate-y-0.5 hover:bg-red-500/10",
    success:
      "border border-emerald-400/30 text-emerald-300 hover:-translate-y-0.5 hover:bg-emerald-500/10",
  };

  return (
    <Component
      type={Component === "button" ? "button" : undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export const Panel = ({ children, className = "" }) => (
  <section
    className={`rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-lg shadow-black/10 transition hover:border-cyan-300/20 ${className}`}
  >
    {children}
  </section>
);

export const Field = ({
  label,
  value,
  onChange,
  type = "text",
  as = "input",
  options = [],
  className = "",
  inputClassName = "",
  ...props
}) => (
  <label className={`block ${className}`}>
    <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
    {as === "select" ? (
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition hover:border-white/25 focus:border-cyan-400 ${inputClassName}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ) : as === "textarea" ? (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`min-h-28 w-full resize-y rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition hover:border-white/25 focus:border-cyan-400 ${inputClassName}`}
        {...props}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition hover:border-white/25 focus:border-cyan-400 ${inputClassName}`}
        {...props}
      />
    )}
  </label>
);

export const ErrorState = ({ message }) =>
  message ? (
    <div className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      {message}
    </div>
  ) : null;

export const InfoBlock = ({ label, value }) => (
  <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-sm font-semibold text-white">{value || "Not set"}</p>
  </div>
);

export const useAdminResource = ({
  endpoint,
  keys,
  enabled = true,
  errorMessage = "Could not load data",
}) => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get(endpoint);
        if (!mounted) return;
        setItems(toArray(response.data, keys));
        setPagination(getPagination(response.data));
      } catch (err) {
        const message = err.response?.data?.message || errorMessage;
        setError(message);
        toast.error(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [enabled, endpoint, errorMessage, keys, refreshKey]);

  return { items, setItems, pagination, loading, error, refresh };
};
