// Vercel Edge Function: /api/image-proxy
// Fetches an image from a remote URL, strips Supabase transformations for free plan, caches efficiently, and returns fallback on error

export const config = {
  runtime: "edge",
};

// Use a same-origin fallback image deployed with the app
const FALLBACK_IMAGE_PATH = "/fallback-image.svg";

// List of Supabase transformation query params to remove on free plan
const SUPABASE_TRANSFORM_PARAMS = ["width", "quality", "format"];

function stripTransformParams(url: string) {
  try {
    const u = new URL(url);
    SUPABASE_TRANSFORM_PARAMS.forEach((param) => u.searchParams.delete(param));
    return u.toString();
  } catch {
    return url; // fallback if URL parsing fails
  }
}

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");
  const origin = new URL(req.url).origin;
  const fallbackUrl = new URL(FALLBACK_IMAGE_PATH, origin).toString();

  if (!imageUrl) {
    return fetch(fallbackUrl);
  }

  // Strip transformation params to avoid Supabase free plan errors
  const safeUrl = stripTransformParams(imageUrl);

  try {
    const res = await fetch(safeUrl, { cache: "force-cache" });
    const contentType = res.headers.get("content-type") || "";

    if (!res.ok || !contentType.startsWith("image")) {
      // If Supabase returned HTML (limit exceeded) or error, fallback
      return fetch(fallbackUrl);
    }

    // Forward headers and set optimized cache
    const headers = new Headers(res.headers);
    headers.set("Cache-Control", "public, max-age=31536000, immutable"); // 1 year
    headers.set("Access-Control-Allow-Origin", "*");
    return new Response(res.body, {
      status: res.status,
      headers,
    });
  } catch (err) {
    console.warn("[image-proxy] fetch error:", err);
    return fetch(fallbackUrl);
  }
}
