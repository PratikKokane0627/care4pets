import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import cloudinary from "../config/cloudinary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

const deleteUploadedImage = async (publicId) => {
  if (!publicId) return null;

  if (publicId.startsWith("local:")) {
    const relativePath = publicId.slice("local:".length);
    const absolutePath = path.resolve(publicDir, relativePath);

    if (!absolutePath.startsWith(publicDir)) {
      return null;
    }

    await fs.rm(absolutePath, { force: true });
    return { result: "ok" };
  }

  return cloudinary.uploader.destroy(publicId);
};

export default deleteUploadedImage;
