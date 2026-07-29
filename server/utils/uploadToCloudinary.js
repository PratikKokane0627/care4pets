import cloudinary from "../config/cloudinary.js";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

const extensionByMimeType = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const cloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim()
  );

const shouldUseCloudinary = () =>
  process.env.NODE_ENV === "production" ||
  process.env.USE_CLOUDINARY_UPLOADS === "true";

const uploadToLocalPublic = async (
  fileBuffer,
  folder = "care4pets",
  mimeType = "image/jpeg"
) => {
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "-");
  const extension = extensionByMimeType[mimeType] || "jpg";
  const relativeDirectory = path.join("uploads", safeFolder);
  const absoluteDirectory = path.join(publicDir, relativeDirectory);
  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  const relativePath = path.join(relativeDirectory, fileName);
  const absolutePath = path.join(publicDir, relativePath);
  const publicBaseUrl =
    process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;

  await fs.mkdir(absoluteDirectory, { recursive: true });
  await fs.writeFile(absolutePath, fileBuffer);

  return {
    secure_url: `${publicBaseUrl}/${relativePath.replace(/\\/g, "/")}`,
    public_id: `local:${relativePath.replace(/\\/g, "/")}`,
  };
};

const uploadToCloudinaryStream = (fileBuffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        timeout: Number(process.env.CLOUDINARY_TIMEOUT_MS) || 20000,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });

const uploadToCloudinary = async (
  fileBuffer,
  folder = "care4pets",
  mimeType = "image/jpeg"
) => {
  if (!shouldUseCloudinary() || !cloudinaryConfigured()) {
    return uploadToLocalPublic(fileBuffer, folder, mimeType);
  }

  try {
    return await uploadToCloudinaryStream(fileBuffer, folder);
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    console.warn(
      `Cloudinary upload failed, using local upload fallback: ${error.message}`
    );
    return uploadToLocalPublic(fileBuffer, folder, mimeType);
  }
};

export default uploadToCloudinary;
