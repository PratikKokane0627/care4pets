import crypto from "crypto";

import ApiError from "../utils/ApiError.js";

const containsUnsafeKey = (value) => {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsUnsafeKey);

  return Object.entries(value).some(
    ([key, nested]) =>
      key.startsWith("$") || key.includes(".") || containsUnsafeKey(nested)
  );
};

export const requestContext = (req, res, next) => {
  req.id = req.headers["x-request-id"] || crypto.randomUUID();
  res.setHeader("x-request-id", req.id);
  next();
};

export const rejectMongoOperators = (req, res, next) => {
  if (containsUnsafeKey(req.body)) {
    return next(new ApiError(400, "Request contains unsafe object keys"));
  }
  next();
};
