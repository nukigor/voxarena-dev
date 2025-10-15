// lib/r2.ts
// Cloudflare R2 (S3-compatible) client + helper for uploading avatar images.

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || ""; // e.g. abcdef1234567890
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET = process.env.R2_BUCKET || ""; // e.g. voxarena or voxarena-avatars

/**
 * If R2_PUBLIC_BASE_URL is not set, fall back to the direct public endpoint:
 *   https://<accountid>.r2.cloudflarestorage.com/<bucket>
 * You can later swap this to a custom domain (e.g. https://cdn.voxarena.ai).
 */
const R2_PUBLIC_BASE_URL =
  (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "") ||
  (R2_ACCOUNT_ID && R2_BUCKET
    ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}`
    : "");

/** Validate minimum env for uploads. */
function assertR2Env() {
  const missing: string[] = [];
  if (!R2_ACCOUNT_ID) missing.push("R2_ACCOUNT_ID");
  if (!R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID");
  if (!R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY");
  if (!R2_BUCKET) missing.push("R2_BUCKET");
  if (!R2_PUBLIC_BASE_URL) missing.push("R2_PUBLIC_BASE_URL (or allow default)");
  if (missing.length) {
    throw new Error(
      `Missing R2 config: ${missing.join(
        ", "
      )}. Set in .env. (R2_PUBLIC_BASE_URL can be omitted; a default will be derived.)`
    );
  }
}

export function getR2Client() {
  assertR2Env();
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true, // R2 prefers path-style endpoints
  });
}

/**
 * Upload an avatar image buffer to R2 and return the public URL.
 * @param personaId string (used to key the object)
 * @param buffer PNG/JPEG bytes
 * @param contentType default "image/png"
 * @returns public URL string
 */
export async function uploadAvatarBufferToR2(
  personaId: string,
  buffer: Uint8Array,
  contentType = "image/png"
): Promise<string> {
  assertR2Env();
  const s3 = getR2Client();
  const key = `avatars/${personaId}.png`;

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
  } catch (err) {
    console.error("[R2] PutObject failed:", err);
    throw err;
  }

  // R2_PUBLIC_BASE_URL should resolve directly to the bucket or a CDN/cached domain.
  // Examples:
  //   Direct endpoint: https://<acct>.r2.cloudflarestorage.com/<bucket>
  //   Custom domain:   https://cdn.voxarena.ai
  // We always append /avatars/<id>.png
  const base = R2_PUBLIC_BASE_URL.replace(/\/+$/, "");
  return `${base}/avatars/${personaId}.png`;
}

/**
 * Given a data URL or http(s) URL, fetch/convert to Buffer and upload to R2.
 * Returns the public R2 URL.
 */
export async function uploadAvatarFromSourceToR2(personaId: string, src: string): Promise<string> {
  if (!src) throw new Error("uploadAvatarFromSourceToR2: missing src");

  // Case 1: Data URL
  if (src.startsWith("data:image/")) {
    const base64 = src.split(",")[1] || "";
    const buffer = Buffer.from(base64, "base64");
    return uploadAvatarBufferToR2(personaId, buffer, "image/png");
  }

  // Case 2: Remote URL (download then upload)
  if (src.startsWith("http://") || src.startsWith("https://")) {
    const res = await fetch(src);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Failed to fetch remote image: ${res.status} ${txt}`);
    }
    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    // Try to infer content-type, default to PNG
    const ct = res.headers.get("content-type") || "image/png";
    return uploadAvatarBufferToR2(personaId, buffer, ct);
  }

  throw new Error("Unsupported avatar source (not data URL or http/https)");
}