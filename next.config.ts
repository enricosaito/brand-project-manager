import type { NextConfig } from "next"

/** Allow next/image to optimise files served from this project's storage bucket. */
function supabaseImagePattern() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!raw) {
    return { protocol: "https" as const, hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }
  }
  const url = new URL(raw)
  return {
    protocol: url.protocol.replace(":", "") as "http" | "https",
    hostname: url.hostname,
    port: url.port || undefined,
    pathname: "/storage/v1/object/public/**",
  }
}

const supabasePattern = supabaseImagePattern()
const supabaseIsLocal = ["127.0.0.1", "localhost", "host.docker.internal"].includes(
  supabasePattern.hostname
)

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }, supabasePattern],
    // Only for a local `supabase start` stack: the optimizer blocks private
    // IPs by default (SSRF guard). Never true for a hosted project.
    ...(supabaseIsLocal ? { dangerouslyAllowLocalIP: true } : {}),
  },
}

export default nextConfig
