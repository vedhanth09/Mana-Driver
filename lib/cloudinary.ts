import { v2 as cloudinary } from "cloudinary";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

declare global {
  // eslint-disable-next-line no-var
  var __cloudinaryConfigured: boolean | undefined;
}

if (!global.__cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: getEnv("CLOUDINARY_CLOUD_NAME"),
    api_key: getEnv("CLOUDINARY_API_KEY"),
    api_secret: getEnv("CLOUDINARY_API_SECRET"),
    secure: true,
  });
  global.__cloudinaryConfigured = true;
}

export default cloudinary;
