/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "tailwindcss.com" },
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  }
};

// Dynamically allow R2 hosts so avatar images can render
const r2Hosts = new Set();

// If you’ve set a custom CDN/domain for R2 (recommended)
if (process.env.R2_PUBLIC_HOSTNAME) {
  r2Hosts.add(process.env.R2_PUBLIC_HOSTNAME);
}

// Native Cloudflare R2 public endpoints we may use
if (process.env.R2_ACCOUNT_ID) {
  // S3-style public hostname
  r2Hosts.add(`${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);
  // r2.dev style (pub-<accountId>.r2.dev/<bucket>/<key>)
  r2Hosts.add(`pub-${process.env.R2_ACCOUNT_ID}.r2.dev`);
}

// If you’ve configured a full base URL, pull just the hostname from it
if (process.env.R2_PUBLIC_BASE_URL) {
  try {
    const u = new URL(process.env.R2_PUBLIC_BASE_URL);
    if (u.hostname) r2Hosts.add(u.hostname);
  } catch {
    // ignore bad URL
  }
}

// Append any discovered R2 hostnames to Next/Image allowlist
if (nextConfig.images && nextConfig.images.remotePatterns) {
  nextConfig.images.remotePatterns.push(
    ...Array.from(r2Hosts).map((hostname) => ({ protocol: "https", hostname }))
  );
}

export default nextConfig;