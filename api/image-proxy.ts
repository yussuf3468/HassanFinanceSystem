// Vercel Edge Function: /api/image-proxy
// Fetches an image from a remote URL, caches for 1 year, returns fallback on error

export const config = {
  runtime: "edge",
};

const FALLBACK_IMAGE = "https://finance.lenzro.com/fallback-image.png";

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return fetch(FALLBACK_IMAGE);
  }

  try {
    const res = await fetch(imageUrl, { cache: "force-cache" });
    if (!res.ok || !res.headers.get("content-type")?.startsWith("image")) {
      return fetch(FALLBACK_IMAGE);
    }
    // Clone the response so we can set headers
    const headers = new Headers(res.headers);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Access-Control-Allow-Origin", "*");
    return new Response(res.body, {
      status: res.status,
      headers,
    });
  } catch {
    return fetch(FALLBACK_IMAGE);
  }
}
