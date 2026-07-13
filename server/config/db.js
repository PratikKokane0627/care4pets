import mongoose from "mongoose";


const connectDB = async () => {
  try {
    // Connect to MongoDB Atlas
    const connection = await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");
    console.log(`📦 Database: ${connection.connection.name}`);
    console.log(`🌐 Host: ${connection.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Failed");
    console.error(error.message);

    // Stop the server if database connection fails
    process.exit(1);
  }
};

export default connectDB;