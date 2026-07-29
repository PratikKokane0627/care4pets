const requiredVariables = [
  "MONGO_URI",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  // Payment code temporarily disabled.
  // "RAZORPAY_KEY_ID",
  // "RAZORPAY_KEY_SECRET",
  // "RAZORPAY_WEBHOOK_SECRET",
];

const validateEnv = () => {
  const productionOnlyVariables = ["EMAIL_USER", "EMAIL_PASSWORD"];
  const variablesToCheck =
    process.env.NODE_ENV === "production"
      ? [...requiredVariables, ...productionOnlyVariables]
      : requiredVariables;
  const missing = variablesToCheck.filter((name) => !process.env[name]?.trim());
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
  }
};

export default validateEnv;
