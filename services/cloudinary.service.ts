import type { UploadApiOptions, UploadApiResponse } from "cloudinary";
import cloudinary from "@/lib/cloudinary";

export interface UploadedAsset {
  url: string;
  publicId: string;
  bytes: number;
  format: string;
  resourceType: string;
}

export async function uploadStream(
  file: File,
  folder: string,
  options: UploadApiOptions = {}
): Promise<UploadedAsset> {
  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto", ...options },
      (error, uploaded) => {
        if (error) return reject(error);
        if (!uploaded) return reject(new Error("Cloudinary returned no result"));
        resolve(uploaded);
      }
    );
    stream.end(buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    bytes: result.bytes,
    format: result.format,
    resourceType: result.resource_type,
  };
}

export async function destroyAsset(publicId: string): Promise<void> {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { invalidate: true });
}
