import mongoose from "mongoose";

const groomingServiceSchema = new mongoose.Schema(
    {
        serviceName: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
        },

        duration: {
            type: Number,
            required: true,
            min: 1,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        image: {
            url: String,
            publicId: String,
        },

        category: {
            type: String,
            enum: [
                "Bath",
                "Haircut",
                "Spa",
                "Nail Trimming",
                "Dental Cleaning",
                "Full Grooming",
            ],
            required: true,
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

export default mongoose.model(
    "GroomingService",
    groomingServiceSchema
);

