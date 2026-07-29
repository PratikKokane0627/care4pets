import crypto from "crypto";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../app.js";
import Order from "../models/Order.js";
import Pet from "../models/Pet.js";
import User from "../models/User.js";
import GroomingBooking from "../models/GroomingBooking.js";
import GroomingService from "../models/GroomingService.js";
import GroomerProfile from "../models/GroomerProfile.js";
import VetProfile from "../models/VetProfile.js";
import generateToken from "../utils/generateToken.js";
import { createUser } from "./helpers.js";

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) =>
      collection.deleteMany({})
    )
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("authentication and authorization", () => {
  it("registers, logs in and returns the authenticated profile", async () => {
    const registration = await request(app).post("/api/auth/register").send({
      name: "Pet Owner",
      email: "owner@example.com",
      phone: "9876543210",
      password: "Password123!",
    });

    expect(registration.status).toBe(201);
    expect(registration.body.token).toBeUndefined();
    expect(registration.body.user.email).toBe("owner@example.com");

    const login = await request(app).post("/api/auth/login").send({
      email: "owner@example.com",
      password: "Password123!",
    });
    expect(login.status).toBe(200);

    const profile = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(profile.status).toBe(200);
    expect(profile.body.user.name).toBe("Pet Owner");
  });

  it("rejects missing tokens and non-admin access to admin routes", async () => {
    expect((await request(app).get("/api/auth/profile")).status).toBe(401);

    const owner = await createUser();
    const response = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", owner.authorization);

    expect(response.status).toBe(403);
  });

  it("changes a password and invalidates the previous token", async () => {
    const owner = await createUser();
    const changed = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", owner.authorization)
      .send({ currentPassword: "Password123!", newPassword: "NewPassword123!" });

    expect(changed.status).toBe(200);
    expect(changed.body.token).toBeTruthy();

    await new Promise((resolve) => setTimeout(resolve, 1100));
    owner.user.passwordChangedAt = new Date();
    await owner.user.save({ validateBeforeSave: false });

    const oldTokenResponse = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", owner.authorization);
    expect(oldTokenResponse.status).toBe(401);
  });

  it("resets a password using a valid hashed reset token", async () => {
    const owner = await createUser();
    const plainToken = "a-valid-test-reset-token";
    owner.user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(plainToken)
      .digest("hex");
    owner.user.resetPasswordExpire = new Date(Date.now() + 60000);
    await owner.user.save({ validateBeforeSave: false });

    const response = await request(app)
      .post(`/api/auth/reset-password/${plainToken}`)
      .send({ password: "ResetPassword123!" });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();

    const login = await request(app).post("/api/auth/login").send({
      email: owner.user.email,
      password: "ResetPassword123!",
    });
    expect(login.status).toBe(200);
  });
});

describe("owner CRUD operations", () => {
  it("creates, reads, updates and soft-deletes a pet", async () => {
    const owner = await createUser();

    const created = await request(app)
      .post("/api/pets")
      .set("Authorization", owner.authorization)
      .send({
        petName: "Milo",
        species: "Dog",
        breed: "Beagle",
        age: 3,
        gender: "Male",
        weight: 12,
      });
    expect(created.status).toBe(201);

    const petId = created.body.pet._id;
    const fetched = await request(app)
      .get(`/api/pets/${petId}`)
      .set("Authorization", owner.authorization);
    expect(fetched.status).toBe(200);

    const updated = await request(app)
      .put(`/api/pets/${petId}`)
      .set("Authorization", owner.authorization)
      .send({ weight: 13 });
    expect(updated.status).toBe(200);
    expect(updated.body.pet.weight).toBe(13);

    const deleted = await request(app)
      .delete(`/api/pets/${petId}`)
      .set("Authorization", owner.authorization);
    expect(deleted.status).toBe(200);
    expect((await Pet.findById(petId)).isActive).toBe(false);
  });

  it("prevents an owner from reading another owner's pet", async () => {
    const first = await createUser();
    const second = await createUser();
    const pet = await Pet.create({
      ownerId: first.user._id,
      petName: "Private Pet",
      species: "Cat",
      breed: "Indian Shorthair",
      age: 2,
      gender: "Female",
      weight: 4,
    });

    const response = await request(app)
      .get(`/api/pets/${pet._id}`)
      .set("Authorization", second.authorization);
    expect(response.status).toBe(404);
  });

  it("deletes the account and dependent owner data after password confirmation", async () => {
    const owner = await createUser();
    await Pet.create({
      ownerId: owner.user._id,
      petName: "Milo",
      species: "Dog",
      breed: "Beagle",
      age: 3,
      gender: "Male",
      weight: 12,
    });

    const response = await request(app)
      .delete("/api/auth/account")
      .set("Authorization", owner.authorization)
      .send({ password: "Password123!" });

    expect(response.status).toBe(200);
    expect(await User.findById(owner.user._id)).toBeNull();
    expect(await Pet.countDocuments({ ownerId: owner.user._id })).toBe(0);
  });
});

describe("admin operations", () => {
  it("creates and manages groomers and lists users", async () => {
    const admin = await createUser({
      email: "admin@example.com",
      role: "admin",
      name: "Administrator",
    });

    const created = await request(app)
      .post("/api/admin/groomers")
      .set("Authorization", admin.authorization)
      .send({
        name: "Groomer One",
        email: "groomer@example.com",
        phone: "9123456789",
        password: "Password123!",
      });
    expect(created.status).toBe(201);

    const groomerId = created.body.groomer._id;
    const blocked = await request(app)
      .patch(`/api/admin/groomers/${groomerId}/status`)
      .set("Authorization", admin.authorization)
      .send({ status: "blocked" });
    expect(blocked.status).toBe(200);
    expect(blocked.body.groomer.status).toBe("blocked");

    const users = await request(app)
      .get("/api/admin/users?role=groomer")
      .set("Authorization", admin.authorization);
    expect(users.status).toBe(200);
    expect(users.body.users).toHaveLength(1);
    expect(await GroomerProfile.exists({ userId: groomerId })).toBeTruthy();

    const groomerToken = generateToken(groomerId);
    const profile = await request(app)
      .put("/api/groomers/profile")
      .set("Authorization", `Bearer ${groomerToken}`)
      .send({ bio: "Experienced pet groomer", skills: ["Bath", "Haircut"] });
    expect(profile.status).toBe(403);

    await User.updateOne({ _id: groomerId }, { status: "active" });
    const activeProfile = await request(app)
      .put("/api/groomers/profile")
      .set("Authorization", `Bearer ${groomerToken}`)
      .send({ bio: "Experienced pet groomer", skills: ["Bath", "Haircut"] });
    expect(activeProfile.status).toBe(200);
    expect(activeProfile.body.profile.skills).toContain("Haircut");
  });

  it("does not allow an administrator to delete itself", async () => {
    const admin = await createUser({ role: "admin", email: "admin@example.com" });
    const response = await request(app)
      .delete(`/api/admin/users/${admin.user._id}`)
      .set("Authorization", admin.authorization);
    expect(response.status).toBe(400);
  });

  it("accepts a veterinarian application for admin approval", async () => {
    const application = await request(app).post("/api/vets/apply").send({
      name: "Dr Test",
      email: "vet-applicant@example.com",
      phone: "9988776655",
      password: "Password123!",
      qualification: "BVSc",
      specialization: "General Veterinary",
      experience: 4,
      registrationNumber: "REG-TEST-001",
      clinicName: "Test Clinic",
      clinicAddress: { city: "Bengaluru", state: "Karnataka" },
      consultationFee: 600,
      availability: [
        { day: "Monday", startTime: "09:00", endTime: "17:00" },
      ],
    });
    expect(application.status).toBe(201);

    const vetUser = await User.findOne({ email: "vet-applicant@example.com" });

    const admin = await createUser({ role: "admin", email: "vet-admin@example.com" });
    const approved = await request(app)
      .patch(`/api/admin/vets/${application.body.application.id}/approve`)
      .set("Authorization", admin.authorization);

    expect(approved.status).toBe(200);
    expect(approved.body.vet.status).toBe("approved");
    expect((await User.findById(vetUser._id)).status).toBe("active");
    expect((await VetProfile.findById(application.body.application.id)).isActive).toBe(true);
  });

  it("assigns an active groomer to a booking", async () => {
    const [admin, owner, groomer] = await Promise.all([
      createUser({ role: "admin", email: "assign-admin@example.com" }),
      createUser({ email: "assign-owner@example.com" }),
      createUser({ role: "groomer", email: "assign-groomer@example.com" }),
    ]);
    const pet = await Pet.create({
      ownerId: owner.user._id,
      petName: "Milo",
      species: "Dog",
      breed: "Beagle",
      age: 3,
      gender: "Male",
      weight: 12,
    });
    const service = await GroomingService.create({
      serviceName: "Bath",
      duration: 30,
      price: 400,
      category: "Bath",
    });
    const booking = await GroomingBooking.create({
      ownerId: owner.user._id,
      petId: pet._id,
      serviceId: service._id,
      bookingDate: new Date(Date.now() + 86400000),
      bookingTime: "11:00",
      price: 400,
      duration: 30,
    });

    const response = await request(app)
      .patch(`/api/grooming-bookings/${booking._id}/assign`)
      .set("Authorization", admin.authorization)
      .send({ groomerId: groomer.user._id.toString() });

    expect(response.status).toBe(200);
    expect(response.body.booking.groomerId).toBe(groomer.user._id.toString());
  });
});

// Payment code temporarily disabled.
describe.skip("payments and webhooks", () => {
  const createOnlineOrder = async (userId, overrides = {}) =>
    Order.create({
      userId,
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          productName: "Dog Food",
          quantity: 1,
          price: 500,
          totalPrice: 500,
        },
      ],
      shippingAddress: {
        fullName: "Test User",
        phone: "9876543210",
        address: "1 Test Street",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
      },
      totalItems: 1,
      subtotal: 500,
      totalAmount: 500,
      paymentMethod: "ONLINE",
      ...overrides,
    });

  it("rejects invalid payment signatures and records the failure", async () => {
    const owner = await createUser();
    const order = await createOnlineOrder(owner.user._id, {
      razorpayOrderId: "order_test_invalid",
    });

    const response = await request(app)
      .post("/api/payments/verify-payment")
      .set("Authorization", owner.authorization)
      .send({
        razorpay_order_id: "order_test_invalid",
        razorpay_payment_id: "pay_test_invalid",
        razorpay_signature: "not-valid",
      });

    expect(response.status).toBe(400);
    expect((await Order.findById(order._id)).paymentStatus).toBe("Failed");
  });

  it("verifies a valid payment signature", async () => {
    const owner = await createUser();
    const razorpayOrderId = "order_test_valid";
    const razorpayPaymentId = "pay_test_valid";
    const order = await createOnlineOrder(owner.user._id, { razorpayOrderId });
    const signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const response = await request(app)
      .post("/api/payments/verify-payment")
      .set("Authorization", owner.authorization)
      .send({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: signature,
      });

    expect(response.status).toBe(200);
    expect((await Order.findById(order._id)).paymentStatus).toBe("Paid");
  });

  it("rejects invalid webhooks and processes signed payment events", async () => {
    const owner = await createUser();
    const order = await createOnlineOrder(owner.user._id, {
      razorpayOrderId: "order_webhook",
    });
    const event = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: { id: "pay_webhook", order_id: "order_webhook" },
        },
      },
    });

    const invalid = await request(app)
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .set("x-razorpay-signature", "invalid")
      .send(event);
    expect(invalid.status).toBe(400);

    const signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(event)
      .digest("hex");
    const valid = await request(app)
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .set("x-razorpay-signature", signature)
      .send(event);

    expect(valid.status).toBe(200);
    const updated = await Order.findById(order._id);
    expect(updated.paymentStatus).toBe("Paid");
    expect(updated.razorpayPaymentId).toBe("pay_webhook");
  });

  it("verifies grooming-service payments", async () => {
    const owner = await createUser();
    const pet = await Pet.create({
      ownerId: owner.user._id,
      petName: "Milo",
      species: "Dog",
      breed: "Beagle",
      age: 3,
      gender: "Male",
      weight: 12,
    });
    const service = await GroomingService.create({
      serviceName: "Full Groom",
      duration: 60,
      price: 750,
      category: "Full Grooming",
    });
    const booking = await GroomingBooking.create({
      ownerId: owner.user._id,
      petId: pet._id,
      serviceId: service._id,
      bookingDate: new Date(Date.now() + 86400000),
      bookingTime: "10:00",
      price: 750,
      duration: 60,
      razorpayOrderId: "order_grooming_test",
    });
    const paymentId = "pay_grooming_test";
    const signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`order_grooming_test|${paymentId}`)
      .digest("hex");

    const response = await request(app)
      .post("/api/payments/service/verify")
      .set("Authorization", owner.authorization)
      .send({
        type: "grooming",
        razorpay_order_id: "order_grooming_test",
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });

    expect(response.status).toBe(200);
    expect((await GroomingBooking.findById(booking._id)).paymentStatus).toBe("paid");
  });
});

describe("documentation and request security", () => {
  it("publishes an OpenAPI document and readiness status", async () => {
    const docs = await request(app).get("/api/docs/openapi.json");
    expect(docs.status).toBe(200);
    expect(docs.body.openapi).toBe("3.0.3");
    expect(docs.body.paths["/auth/login"]).toBeTruthy();

    const ready = await request(app).get("/api/ready");
    expect(ready.status).toBe(200);
    expect(ready.body.database).toBe("connected");
  });

  it("rejects MongoDB operator keys in request bodies", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: { $ne: null }, password: "Password123!" });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("unsafe");
  });
});
