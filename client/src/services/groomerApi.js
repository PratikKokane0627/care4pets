import api from "./api";

const paramsConfig = (params) => ({ params });

export const getMyGroomerProfile = () => api.get("/groomers/profile");
export const updateMyGroomerProfile = (data) => api.put("/groomers/profile", data);
export const updateGroomerAvailability = (availability) =>
  api.put("/groomers/availability", { availability });
export const getGroomerDashboard = () => api.get("/grooming-bookings/groomer/dashboard");
export const getGroomerBookings = (params) =>
  api.get("/grooming-bookings/groomer", paramsConfig(params));
export const getAvailableGroomingBookings = (params) =>
  api.get("/grooming-bookings/available", paramsConfig(params));
export const getGroomingBooking = (id) => api.get(`/grooming-bookings/${id}`);
export const acceptGroomingBooking = (id) => api.put(`/grooming-bookings/${id}/accept`);
export const rejectGroomingBooking = (id, rejectionReason) =>
  api.put(`/grooming-bookings/${id}/reject`, { rejectionReason });
export const completeGroomingBooking = (id, groomerNotes) =>
  api.put(`/grooming-bookings/${id}/complete`, { groomerNotes });
export const updateGroomerNotes = (id, groomerNotes) =>
  api.put(`/grooming-bookings/${id}/notes`, { groomerNotes });
export const getGroomingServices = (params) =>
  api.get("/grooming-services", paramsConfig(params));
export const changeGroomerPassword = (data) => api.post("/auth/change-password", data);
export const getGroomerReviews = () => api.get("/groomers/reviews");

export const uploadGroomerImage = (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return api.put("/groomers/profile/image", formData);
};

export const deleteGroomerImage = () => api.delete("/groomers/profile/image");
