import "server-only";
import { createHash } from "node:crypto";

// Photos are uploaded by the browser straight to Cloudinary (Vercel functions cap
// request bodies at ~4.5 MB, smaller than a phone photo). We only sign the upload.
export const UPLOAD_FOLDER = "products";
export const ALLOWED_FORMATS = "jpg,png,webp,heic";

function config() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary is not configured");
  return { cloudName, apiKey, apiSecret };
}

export function signUpload() {
  const { cloudName, apiKey, apiSecret } = config();
  const timestamp = Math.floor(Date.now() / 1000);
  // Signed params, alphabetical; api_key, file and resource_type are not signed.
  const toSign = `allowed_formats=${ALLOWED_FORMATS}&folder=${UPLOAD_FOLDER}&timestamp=${timestamp}`;
  const signature = createHash("sha1").update(toSign + apiSecret).digest("hex");
  return {
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder: UPLOAD_FOLDER,
    allowedFormats: ALLOWED_FORMATS,
  };
}

// Only accept image URLs from our own Cloudinary account when saving a product.
export function isOurCloudinaryUrl(url: string): boolean {
  const { cloudName } = config();
  return url.startsWith(`https://res.cloudinary.com/${cloudName}/`);
}
