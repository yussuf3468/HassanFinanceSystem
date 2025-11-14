// Vercel Edge Function: /api/image-proxy
// Fetches an image from a remote URL, sets correct MIME type, caches for 1 year, returns fallback on error

export const config = {
  runtime: "edge",
};

// Use a same-origin fallback image deployed with the app
const FALLBACK_IMAGE_PATH = "/fallback-image.svg";

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");
  const origin = new URL(req.url).origin;
  const fallbackUrl = new URL(FALLBACK_IMAGE_PATH, origin).toString();

  if (!imageUrl) {
    return fetch(fallbackUrl);
  }

  try {
    const res = await fetch(imageUrl, { cache: "force-cache" });

    if (!res.ok) {
      return fetch(fallbackUrl);
    }

    // Determine MIME type based on file extension
    const urlObj = new URL(imageUrl);
    const ext = urlObj.pathname.split('.').pop()?.toLowerCase();
    let mimeType = "image/jpeg"; // default
    if (ext === "png") mimeType = "image/png";
    else if (ext === "webp") mimeType = "image/webp";
    else if (ext === "avif") mimeType = "image/avif";
    else if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";

    // Set headers manually
    const headers = new Headers(res.headers);
    headers.set("Content-Type", mimeType);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Access-Control-Allow-Origin", "*");

    return new Response(res.body, {
      status: res.status,
      headers,
    });
  } catch {
    return fetch(fallbackUrl);
  }
}
