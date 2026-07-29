const bearer = [{ bearerAuth: [] }];

const openapi = {
  openapi: "3.0.3",
  info: {
    title: "Care4Pets API",
    version: "1.0.0",
    description: "Authentication, pet care, veterinary, grooming, commerce and administration API.",
  },
  servers: [{ url: "/api" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  paths: {
    "/health": { get: { summary: "API health check", responses: { 200: { description: "Healthy" } } } },
    "/ready": { get: { summary: "Database readiness check", responses: { 200: { description: "Ready" }, 503: { description: "Not ready" } } } },
    "/auth/register": { post: { summary: "Register a pet owner", responses: { 201: { description: "Registered" } } } },
    "/auth/login": { post: { summary: "Login", responses: { 200: { description: "Authenticated" } } } },
    // Email verification before login temporarily disabled.
    // "/auth/send-otp": { post: { summary: "Send an email verification OTP", responses: { 200: { description: "Accepted" } } } },
    // "/auth/verify-otp": { post: { summary: "Verify email OTP", responses: { 200: { description: "Verified" } } } },
    "/auth/forgot-password": { post: { summary: "Request password reset", responses: { 200: { description: "Accepted" } } } },
    "/auth/reset-password/{token}": { post: { summary: "Reset password", responses: { 200: { description: "Reset" } } } },
    "/auth/profile": {
      get: { summary: "Get profile", security: bearer, responses: { 200: { description: "Profile" } } },
      put: { summary: "Update profile", security: bearer, responses: { 200: { description: "Updated" } } },
    },
    "/vets/apply": { post: { summary: "Submit a veterinarian application", responses: { 201: { description: "Submitted" } } } },
    "/vets": { get: { summary: "List approved veterinarians", responses: { 200: { description: "Veterinarians" } } } },
    "/groomers/available": { get: { summary: "List available groomers", security: bearer, responses: { 200: { description: "Groomers" } } } },
    "/groomers/profile": {
      get: { summary: "Get groomer profile", security: bearer, responses: { 200: { description: "Profile" } } },
      put: { summary: "Update groomer profile", security: bearer, responses: { 200: { description: "Updated" } } },
    },
    "/pets": {
      get: { summary: "List owner's pets", security: bearer, responses: { 200: { description: "Pets" } } },
      post: { summary: "Create a pet", security: bearer, responses: { 201: { description: "Created" } } },
    },
    "/appointments": {
      get: { summary: "List owner's appointments", security: bearer, responses: { 200: { description: "Appointments" } } },
      post: { summary: "Book an appointment", security: bearer, responses: { 201: { description: "Booked" } } },
    },
    "/grooming-bookings": {
      get: { summary: "List owner's grooming bookings", security: bearer, responses: { 200: { description: "Bookings" } } },
      post: { summary: "Create a grooming booking", security: bearer, responses: { 201: { description: "Booked" } } },
    },
    "/orders": {
      get: { summary: "List owner's orders", security: bearer, responses: { 200: { description: "Orders" } } },
      post: { summary: "Place an order", security: bearer, responses: { 201: { description: "Placed" } } },
    },
    // Payment code temporarily disabled.
    // "/payments/service/{type}/{id}/create": {
    //   post: { summary: "Create appointment or grooming payment", security: bearer, responses: { 201: { description: "Created" } } },
    // },
    // "/payments/service/verify": {
    //   post: { summary: "Verify appointment or grooming payment", security: bearer, responses: { 200: { description: "Verified" } } },
    // },
    "/admin/dashboard": { get: { summary: "Admin dashboard", security: bearer, responses: { 200: { description: "Dashboard" } } } },
    "/admin/reports": { get: { summary: "Combined admin reports", security: bearer, responses: { 200: { description: "Reports" } } } },
  },
};

export default openapi;
