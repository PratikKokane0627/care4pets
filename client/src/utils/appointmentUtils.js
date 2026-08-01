export const getId = (item) => item?._id || item?.id;

export const petName = (pet) => pet?.petName || pet?.name || "Pet";

export const ownerName = (owner) => owner?.name || owner?.fullName || "Owner";

export const imageUrl = (item) =>
  item?.profileImage?.url ||
  item?.profileImage ||
  item?.image?.url ||
  "";

export const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

export const normalizePagination = (payload = {}) =>
  payload.pagination || {
    currentPage: payload.currentPage || payload.page || 1,
    totalPages: payload.totalPages || 1,
    total: payload.total || payload.totalAppointments || 0,
    limit: payload.limit || 10,
  };
