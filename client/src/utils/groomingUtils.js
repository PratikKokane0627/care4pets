export const groomingStatuses = ["pending", "accepted", "rejected", "cancelled", "completed"];
export const groomingPaymentStatuses = ["pending", "paid", "failed", "refunded"];
export const groomingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const getId = (item) => item?._id || item?.id || "";

export const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
export const personName = (user) => user?.name || user?.fullName || "Unknown";
export const petName = (pet) => pet?.petName || pet?.name || "Pet";
export const serviceName = (service) => service?.serviceName || service?.name || "Grooming service";

export const bookingDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export const isToday = (value) => bookingDateKey(value) === bookingDateKey(new Date());

export const uniqueById = (items, pick) => {
  const map = new Map();
  items.forEach((item) => {
    const value = pick(item);
    const id = getId(value);
    if (id && !map.has(id)) map.set(id, value);
  });
  return Array.from(map.values());
};

export const normalizePagination = (data = {}, limit = 10) => ({
  currentPage: data.currentPage || data.pagination?.currentPage || 1,
  totalPages: data.totalPages || data.pagination?.totalPages || 1,
  total: data.totalBookings || data.totalServices || data.pagination?.total || 0,
  limit,
});
