import {
  v2 as cloudinary,
} from "cloudinary";

import { env } from "./env";

const isCloudinaryConfigured =
  Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET,
  );

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name:
      env.CLOUDINARY_CLOUD_NAME,

    api_key:
      env.CLOUDINARY_API_KEY,

    api_secret:
      env.CLOUDINARY_API_SECRET,

    secure: true,
  });
}

export function assertCloudinaryConfigured() {
  if (!isCloudinaryConfigured) {
    throw new Error(
      "Cloudinary storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }
}

export default cloudinary;