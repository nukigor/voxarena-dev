// frontend/lib/r2.ts
// Cloudflare R2 (S3-compatible) client + helper for uploading avatar images.

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || ""; // e.g. abcdef1234567890
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET = process.env.R2_BUCKET || ""; // e.g. voxarena-avatars
const R2_PUBLIC_BASE_URL = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, ""); 
// e.g. https://cdn.voxarena.ai/avatars OR https://<accountid>.r2.cloudflarestorage.com/<bucket>

function assertR2Env() {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_BASE_URL) {
    throw new Error(
      "Missing R2 config. Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL"
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
    forcePathStyle: true, // R2 generally prefers path-style
  });
}

/**
 * Upload an avatar image buffer to R2 and return the public URL.
 * @param personaId string (used to key the object)
 * @param buffer PNG bytes
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

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  // R2_PUBLIC_BASE_URL should resolve directly to the avatars "prefix" or bucket root.
  // Examples:
  //   https://cdn.voxarena.ai            -> + /avatars/<id>.png
  //   https://<acct>.r2.cloudflarestorage.com/<bucket> -> + /avatars/<id>.png
  return `${R2_PUBLIC_BASE_URL}/${key}`;
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