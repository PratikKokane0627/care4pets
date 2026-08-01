import api from "./api";

const paramsConfig = (params) => ({ params });

export const getVetDashboard = () => api.get("/vet/dashboard");
export const getVetAppointments = (params) => api.get("/appointments/vet", paramsConfig(params));
export const getVetAppointmentStats = () => api.get("/appointments/vet/stats");
export const getVetAppointment = (id) => api.get(`/appointments/${id}`);
export const acceptAppointment = (id) => api.put(`/appointments/${id}/accept`);
export const rejectAppointment = (id, rejectionReason) =>
  api.put(`/appointments/${id}/reject`, { rejectionReason });
export const completeAppointment = (id, data) => api.put(`/appointments/${id}/complete`, data);

export const getVetPatients = (params) => api.get("/vet/patients", paramsConfig(params));
export const getVetPatient = (id) => api.get(`/vet/patients/${id}`);
export const getVetPrescriptions = (params) => api.get("/vet/prescriptions", paramsConfig(params));

export const getMyVetProfile = () => api.get("/vets/me");
export const updateMyVetProfile = (data) => api.put("/vets/me", data);
export const updateVetAvailability = (availability) =>
  api.put("/vets/me/availability", { availability });
export const uploadVetImage = (formData) => api.put("/vets/me/image", formData);
export const deleteVetImage = () => api.delete("/vets/me/image");

export const getVetReviews = (params) => api.get("/vet/reviews", paramsConfig(params));
export const getVetReviewSummary = () => api.get("/vet/reviews/summary");

export const changePassword = (data) => api.post("/auth/change-password", data);

export const emptyNotifications = () =>
  Promise.resolve({
    data: {
      success: true,
      notifications: [],
      unreadCount: 0,
      totalNotifications: 0,
      totalPages: 1,
      currentPage: 1,
    },
  });
