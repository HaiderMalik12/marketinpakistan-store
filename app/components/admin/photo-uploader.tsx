"use client";

import { useRef, useState } from "react";
import { optimizedImage } from "@/app/lib/images";

const MAX_PHOTOS = 8;
const MAX_BYTES = 10 * 1024 * 1024; // Cloudinary free-plan image limit

type Signature = {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  allowedFormats: string;
};

async function uploadOne(file: File): Promise<string> {
  const signRes = await fetch("/api/admin/cloudinary-sign", { method: "POST" });
  if (!signRes.ok) throw new Error("Not signed in. Refresh the page and log in again.");
  const sig = (await signRes.json()) as Signature;

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sig.apiKey);
  body.append("timestamp", String(sig.timestamp));
  body.append("signature", sig.signature);
  body.append("folder", sig.folder);
  body.append("allowed_formats", sig.allowedFormats);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: "POST",
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? "Upload failed.");
  return data.secure_url as string;
}

export function PhotoUploader({
  images,
  onChange,
  error,
}: {
  images: string[];
  onChange: (next: string[]) => void;
  error?: string;
}) {
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploadError(null);
    const files = Array.from(fileList).slice(0, MAX_PHOTOS - images.length);
    if (fileList.length > files.length) {
      setUploadError(`Up to ${MAX_PHOTOS} photos per product.`);
    }

    let next = [...images];
    setUploading(files.length);
    for (const file of files) {
      try {
        if (file.size > MAX_BYTES) throw new Error(`${file.name} is over 10 MB.`);
        next = [...next, await uploadOne(file)];
        onChange(next);
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Upload failed.");
      }
      setUploading((n) => n - 1);
    }
    if (galleryRef.current) galleryRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }

  const busy = uploading > 0;
  const full = images.length >= MAX_PHOTOS;

  function makeCover(index: number) {
    const next = [...images];
    const [picked] = next.splice(index, 1);
    onChange([picked, ...next]);
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-gray-900">Photos</div>

      <div className="grid grid-cols-2 gap-3 sm:flex">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={busy || full}
          className="min-h-12 px-5 rounded-full bg-gray-900 text-white text-sm font-semibold disabled:opacity-50"
        >
          Take photo
        </button>
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          disabled={busy || full}
          className="min-h-12 px-5 rounded-full border border-gray-300 bg-white text-sm font-semibold text-gray-900 disabled:opacity-50"
        >
          Choose photos
        </button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-label="Take a photo"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,.heic"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose photos from your device"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <p className="text-sm text-gray-500">
        JPG, PNG or HEIC, up to 10 MB each. The first photo is the cover.
      </p>

      {(images.length > 0 || busy) && (
        <ul className="flex flex-wrap gap-3">
          {images.map((url, i) => (
            <li key={url} className="relative w-24 h-24 rounded-xl overflow-hidden bg-rose-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={optimizedImage(url, 240)} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              {i === 0 ? (
                <span className="absolute left-1.5 bottom-1.5 bg-gray-900 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  Cover
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => makeCover(i)}
                  disabled={busy}
                  className="absolute left-1.5 bottom-1.5 bg-white/90 text-gray-900 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                >
                  Make cover
                </button>
              )}
              <button
                type="button"
                aria-label={`Remove photo ${i + 1}`}
                onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                disabled={busy}
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-white text-gray-700 flex items-center justify-center"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          ))}
          {Array.from({ length: uploading }).map((_, i) => (
            <li
              key={`up-${i}`}
              className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-500 animate-pulse"
            >
              Uploading…
            </li>
          ))}
        </ul>
      )}

      {(uploadError || error) && (
        <p role="alert" className="text-sm text-rose-700">
          {uploadError ?? error}
        </p>
      )}
    </div>
  );
}
