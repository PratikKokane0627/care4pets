import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import petRoutes from "./routes/petRoutes.js";
import vetRoutes from "./routes/vetRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import vaccinationRoutes from "./routes/vaccinationRoutes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import ApiError from "./utils/ApiError.js";

import { protect } from "./middleware/authMiddleware.js";
import { authorize } from "./middleware/roleMiddleware.js";

dotenv.config();

connectDB();

const app = express();

const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// Request logger
app.use(morgan("dev"));

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Parse JSON data
app.use(express.json());

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Health route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Care4Pets API is running",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/vets", vetRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/vaccinations", vaccinationRoutes);




// 404 middleware
app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
});

// Global error middleware — always last
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Care4Pets server running on port ${PORT}`);
});