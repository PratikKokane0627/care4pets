/* oxlint-disable react/only-export-components */
import { Search } from "lucide-react";

export const toArray = (payload, keys = []) => {
  for (const key of keys) {
    const value = key
      .split(".")
      .reduce((current, part) => current?.[part], payload);
    if (Array.isArray(value)) return value;
  }
  return Array.isArray(payload) ? payload : [];
};

export const getId = (item) => item?._id || item?.id;
export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "Not set";
export const money = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
export const petName = (pet) => pet?.petName || pet?.name || "Pet";
export const vetName = (vet) => vet?.userId?.name || vet?.name || "Veterinarian";
export const productName = (product) =>
  product?.productName || product?.name || "Product";
export const itemImage = (item) =>
  item?.profileImage?.url ||
  item?.image?.url ||
  item?.images?.[0]?.url ||
  item?.profileImage ||
  "";

export const profileImageUrl = (user) =>
  typeof user?.profileImage === "string"
    ? user.profileImage
    : user?.profileImage?.url || "";

export const syncStoredUser = (updates) => {
  const current = JSON.parse(localStorage.getItem("user") || "{}");
  const next = { ...current, ...updates };

  localStorage.setItem("user", JSON.stringify(next));
  window.dispatchEvent(new Event("owner-profile-updated"));

  return next;
};

export const notifyOwnerShopCounts = () => {
  window.dispatchEvent(new Event("owner-shop-counts-updated"));
};

export const initialPetForm = {
  petName: "",
  species: "Dog",
  breed: "",
  age: "",
  gender: "Male",
  weight: "",
  color: "",
  dateOfBirth: "",
  medicalHistory: "",
  vaccinationStatus: "Pending",
};

export const initialAppointmentForm = {
  petId: "",
  vetId: "",
  appointmentDate: "",
  appointmentTime: "",
  reason: "",
  notes: "",
};

export const initialGroomingForm = {
  petId: "",
  serviceId: "",
  groomerId: "",
  bookingDate: "",
  bookingTime: "",
  notes: "",
};

export const initialVaccinationForm = {
  petId: "",
  vaccineName: "",
  vaccinationDate: "",
  nextDueDate: "",
  administeredBy: "",
  notes: "",
};

export const initialAddress = {
  street: "",
  city: "",
  state: "",
  zipCode: "",
};

export const Panel = ({ children, className = "", ...props }) => (
  <section
    className={`rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-lg shadow-black/10 transition duration-300 hover:border-cyan-300/25 hover:shadow-cyan-950/15 ${className}`}
    {...props}
  >
    {children}
  </section>
);

export const ErrorState = ({ message }) =>
  message ? (
    <div className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      {message}
    </div>
  ) : null;

export const Button = ({
  children,
  as: Component = "button",
  variant = "primary",
  className = "",
  ...props
}) => {
  const classes = {
    primary:
      "bg-cyan-400 text-slate-950 hover:-translate-y-0.5 hover:bg-cyan-300 hover:shadow-lg hover:shadow-cyan-500/20",
    ghost:
      "border border-white/10 text-slate-300 hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-white/5 hover:text-white",
    danger:
      "border border-red-400/30 text-red-300 hover:-translate-y-0.5 hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-950/20",
  };

  return (
    <Component
      type={Component === "button" ? "button" : undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 ${classes[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export const ConfirmDialog = ({
  open,
  title = "Confirm action",
  message = "Are you sure you want to continue?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  inputLabel,
  inputValue = "",
  inputPlaceholder = "",
  onInputChange,
  onConfirm,
  onClose,
  loading = false,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-cyan-300/20 bg-slate-900 p-6 shadow-2xl shadow-cyan-950/30">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {message && <p className="mt-3 text-sm leading-6 text-slate-400">{message}</p>}
        {inputLabel && (
          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-medium text-slate-300">
              {inputLabel}
            </span>
            <textarea
              value={inputValue}
              onChange={(event) => onInputChange?.(event.target.value)}
              placeholder={inputPlaceholder}
              className="min-h-24 w-full resize-y rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 hover:border-white/25 focus:border-cyan-400"
            />
          </label>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={loading}>
            {loading ? "Please wait..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

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
        className={`min-h-28 w-full resize-y rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 hover:border-white/25 focus:border-cyan-400 ${inputClassName}`}
        {...props}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 hover:border-white/25 focus:border-cyan-400 ${inputClassName}`}
        {...props}
      />
    )}
  </label>
);

export const SearchBox = ({ value, onChange, placeholder = "Search" }) => (
  <div className="relative">
    <Search
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
      size={18}
    />
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-white/10 bg-slate-950 py-3 pl-10 pr-4 text-white outline-none transition placeholder:text-slate-600 hover:border-white/25 focus:border-cyan-400"
    />
  </div>
);

export const InfoBlock = ({ label, value }) => (
  <div className="rounded-xl border border-white/10 bg-slate-950 p-4 transition duration-300 hover:border-cyan-300/25 hover:bg-slate-950/80">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </p>
    <p className="mt-2 text-sm font-semibold text-white">{value || "Not set"}</p>
  </div>
);
