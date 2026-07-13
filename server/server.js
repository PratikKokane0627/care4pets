import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// Request logger
app.use(morgan("dev"));

// Allow frontend requests
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json());

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Test route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Care4Pets API is running",
  });
});

// 404 middleware
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

app.listen(PORT, () => {
  console.log(`Care4Pets server running on port ${PORT}`);
});