import mongoose from "mongoose";

const petSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    petName: {
      type: String,
      required: [true, "Pet name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    species: {
      type: String,
      required: true,
      enum: ["Dog", "Cat", "Bird", "Rabbit", "Fish", "Other"],
    },

    breed: {
      type: String,
      required: true,
      trim: true,
    },

    age: {
      type: Number,
      required: true,
      min: 0,
    },

    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
    },

    weight: {
      type: Number,
      required: true,
      min: 0,
    },

    color: {
      type: String,
      default: "",
      trim: true,
    },

    dateOfBirth: {
      type: Date,
    },

    profileImage: {
      type: String,
      default: "",
    },

    medicalHistory: {
      type: String,
      default: "",
    },

    vaccinationStatus: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Pet = mongoose.model("Pet", petSchema);

export default Pet;