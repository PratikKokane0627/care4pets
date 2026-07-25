import nodemailer from "nodemailer";

import ApiError from "../utils/ApiError.js";

const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new ApiError(503, "Email service is not configured");
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  });
};

export const sendOtpEmail = (email, otp) =>
  sendEmail({
    to: email,
    subject: "Care4Pets verification code",
    text: `Your Care4Pets verification code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your Care4Pets verification code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });

export const sendPasswordResetEmail = (email, resetUrl) =>
  sendEmail({
    to: email,
    subject: "Reset your Care4Pets password",
    text: `Reset your Care4Pets password using this link: ${resetUrl}. The link expires in 15 minutes.`,
    html: `<p>Use the link below to reset your Care4Pets password. It expires in 15 minutes.</p><p><a href="${resetUrl}">Reset password</a></p>`,
  });

export default sendEmail;
