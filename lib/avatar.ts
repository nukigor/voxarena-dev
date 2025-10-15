// Robust normalizer for whatever the image provider returns.
// Accepts: data URL string, raw base64 string, { url: string }, Buffer/Uint8Array.
// Returns: "data:image/png;base64,..." or a plain https URL string, else null.

export function extractAvatarUrl(input: unknown): string | null {
  try {
    if (!input) return null;

    // If an object with { url }
    if (typeof input === "object" && input !== null && "url" in (input as any)) {
      const url = (input as any).url;
      if (typeof url === "string" && url.trim()) return url.trim();
    }

    // If a string already starting with data:
    if (typeof input === "string") {
      const s = input.trim();
      if (!s) return null;
      if (s.startsWith("data:image/")) return s;

      // If it looks like a raw base64 payload (no data: prefix), wrap it.
      // Accept common base64 chars only, and length multiple of 4 (loose check).
      const base64ish = /^[A-Za-z0-9+/=\s]+$/.test(s);
      if (base64ish) {
        return `data:image/png;base64,${s.replace(/\s+/g, "")}`;
      }

      // Otherwise if it looks like a normal URL, return it.
      try {
        const u = new URL(s);
        if (u.protocol === "http:" || u.protocol === "https:") return s;
      } catch {
        /* not a URL */
      }
      return null;
    }

    // If a Buffer/Uint8Array, encode to base64 data URL
    if (input instanceof Uint8Array) {
      const b64 = Buffer.from(input).toString("base64");
      return `data:image/png;base64,${b64}`;
    }

    return null;
  } catch {
    return null;
  }
}