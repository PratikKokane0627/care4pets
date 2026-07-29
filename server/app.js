import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import adminRoutes from "./routes/adminRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import groomingBookingRoutes from "./routes/groomingBookingRoutes.js";
import groomingServiceRoutes from "./routes/groomingServiceRoutes.js";
import groomerRoutes from "./routes/groomerRoutes.js";
// Payment and notification routes are temporarily disabled.
// import notificationRoutes from "./routes/notificationRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
// import paymentRoutes from "./routes/paymentRoutes.js";
import petRoutes from "./routes/petRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import vaccinationRoutes from "./routes/vaccinationRoutes.js";
import vetRoutes from "./routes/vetRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import ApiError from "./utils/ApiError.js";
import openapi from "./docs/openapi.js";
import { rejectMongoOperators, requestContext } from "./middleware/requestSecurityMiddleware.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("trust proxy", 1);
app.use(requestContext);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Payment code temporarily disabled.
        // scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
        // frameSrc: [
        //   "'self'",
        //   "https://api.razorpay.com",
        //   "https://checkout.razorpay.com",
        // ],
        // connectSrc: ["'self'", "https://api.razorpay.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        frameSrc: ["'self'"],
        connectSrc: ["'self'"],
      },
    },
  })
);

if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Payment code temporarily disabled.
// Webhook signatures must be calculated from the untouched request bytes.
// app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(rejectMongoOperators);
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Care4Pets API is running",
  });
});

app.get("/api/ready", (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({
    success: ready,
    database: ready ? "connected" : "disconnected",
  });
});

app.get("/api/docs/openapi.json", (req, res) => res.json(openapi));
app.get("/api/docs", (req, res) => {
  res.type("html").send(`<!doctype html>
<html><head><title>Care4Pets API</title></head>
<body><h1>Care4Pets API</h1>
<p>OpenAPI specification: <a href="/api/docs/openapi.json">openapi.json</a></p>
</body></html>`);
});

app.use("/api/auth", authRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/vets", vetRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/vaccinations", vaccinationRoutes);
app.use("/api/grooming-services", groomingServiceRoutes);
app.use("/api/grooming-bookings", groomingBookingRoutes);
app.use("/api/groomers", groomerRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
// Payment and notification APIs temporarily disabled.
// app.use("/api/payments", paymentRoutes);
// app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
});

app.use(errorMiddleware);

export default app;
