import cloudinary from "../config/cloudinary.js";

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) {
    throw new Error("Public ID is required");
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });

  return result;
};

export default deleteFromCloudinary;