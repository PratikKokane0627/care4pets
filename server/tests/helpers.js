import bcrypt from "bcryptjs";

import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

export const createUser = async (overrides = {}) => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const user = await User.create({
    name: "Test User",
    email: `user-${suffix}@example.com`,
    phone: "9876543210",
    password: await bcrypt.hash("Password123!", 10),
    role: "owner",
    status: "active",
    isVerified: true,
    ...overrides,
  });

  return {
    user,
    token: generateToken(user._id),
    authorization: `Bearer ${generateToken(user._id)}`,
  };
};
