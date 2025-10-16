// lib/r2.ts
// Cloudflare R2 (S3-compatible) client + helper for uploading avatar images.

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || ""; // e.g. abcdef1234567890
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET = process.env.R2_BUCKET || ""; // e.g. voxarena or voxarena-avatars

/**
 * If R2_PUBLIC_BASE_URL is not set, fall back to a presigned URL (not ideal for public avatars).
 * Prefer setting this to your R2 public bucket/domain, e.g. https://cdn.example.com/avatars
 */
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL || "";

/**
 * Lazily import `sharp` the first time we need to process an image.
 * We do it lazily to avoid issues in environments where optional native deps are not prebuilt.
 */
let _sharp: any | null = null;
async function getSharp() {
  if (_sharp) return _sharp;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _sharp = (await import("sharp")).default || (await import("sharp"));
    return _sharp;
  } catch (err) {
    console.warn("[R2] sharp not available; skipping avatar minification.", err);
    _sharp = null;
    return null;
  }
}

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Download a source image to a Buffer.
 * Supports a data URL (data:image/png;base64,...) or https URL.
 */
async function downloadSourceToBuffer(
  src: string
): Promise<{ buffer: Buffer; contentType: string }> {
  if (src.startsWith("data:")) {
    const [meta, b64] = src.split(",");
    const match = /data:(.*?);base64/.exec(meta || "");
    const contentType = match?.[1] || "image/png";
    const buffer = Buffer.from(b64, "base64");
    return { buffer, contentType };
  }

  const res = await fetch(src);
  if (!res.ok) {
    throw new Error(`Failed to fetch source image: ${res.status} ${res.statusText}`);
  }
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const arrayBuf = await res.arrayBuffer();
  return { buffer: Buffer.from(arrayBuf), contentType };
}

/**
 * Prepare the avatar buffer for storage:
 * - Downscale to max 512x512 (cover, center) so avatars are small.
 * - Convert to JPEG (quality ~72, mozjpeg) for ~3-5x smaller files than PNG.
 * If sharp isn't available, we pass-through the original buffer/contentType.
 */
async function prepareAvatarBuffer(
  input: Buffer,
  contentType: string
): Promise<{ buffer: Buffer; contentType: string; ext: "jpg" | "png" | "webp" }> {
  const sharp = await getSharp();
  if (!sharp) {
    // No sharp means we keep originals; try to keep png/webp content type if present.
    const ext: "jpg" | "png" | "webp" =
      contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    return { buffer: input, contentType, ext };
  }

  // Always produce JPEG for best compatibility & size (avatars rarely need alpha).
  const processed = await sharp(input)
    .resize(512, 512, { fit: "cover", position: "attention" })
    .jpeg({ quality: 72, mozjpeg: true })
    .toBuffer();

  return { buffer: processed, contentType: "image/jpeg", ext: "jpg" };
}

/**
 * Upload a buffer to R2 at key `avatars/{personaId}.{ext}`
 */
export async function uploadAvatarBufferToR2(
  personaId: string,
  buffer: Buffer,
  contentType: string
): Promise<{ key: string; url: string }> {
  if (!R2_BUCKET) throw new Error("R2_BUCKET is not configured");

  // Optionally minify/convert
  const prepared = await prepareAvatarBuffer(buffer, contentType);
  const key = `avatars/${personaId}.${prepared.ext}`;

  const put = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: prepared.buffer,
    ContentType: prepared.contentType,
    ACL: "public-read", // bucket must allow this
  });

  await r2.send(put);

  const url =
    R2_PUBLIC_BASE_URL
      ? `${R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`
      : // Fallback: construct R2 public URL if bucket is public. If not, caller should replace with a CDN URL.
        `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${key}`;

  return { key, url };
}

/**
 * Convenience: download from `src` then upload.
 * Accepts either a data URL or an HTTPS URL returned by the image model.
 */
export async function uploadAvatarFromSourceToR2(
  personaId: string,
  src: string
): Promise<{ key: string; url: string }> {
  const { buffer, contentType } = await downloadSourceToBuffer(src);
  return uploadAvatarBufferToR2(personaId, buffer, contentType);
}