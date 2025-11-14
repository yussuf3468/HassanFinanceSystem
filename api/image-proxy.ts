export const config = {
  runtime: "edge",
};

const FALLBACK_IMAGE = "https://finance.lenzro.com/fallback-image.png";

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    // No URL: fallback with 400 status
    const fallbackRes = await fetch(FALLBACK_IMAGE);
    const fallbackHeaders = new Headers(fallbackRes.headers);
    fallbackHeaders.set("Cache-Control", "public, max-age=31536000, immutable");
    fallbackHeaders.set("Access-Control-Allow-Origin", "*");
    fallbackHeaders.set("X-Fallback-Image", "true");
    return new Response(fallbackRes.body, {
      status: 400,  // Bad Request: missing image URL
      headers: fallbackHeaders,
    });
  }

  try {
    const res = await fetch(imageUrl, { cache: "force-cache" });

    // Image not found or not an image
    if (!res.ok || !res.headers.get("content-type")?.startsWith("image")) {
      const fallbackRes = await fetch(FALLBACK_IMAGE);
      const fallbackHeaders = new Headers(fallbackRes.headers);
      fallbackHeaders.set("Cache-Control", "public, max-age=31536000, immutable");
      fallbackHeaders.set("Access-Control-Allow-Origin", "*");
      fallbackHeaders.set("X-Fallback-Image", "true");
      // Upstream returned non-image or error, mirror the relevant status
      const status = res.status === 404 ? 404 : 502;
      return new Response(fallbackRes.body, {
        status,
        headers: fallbackHeaders,
      });
    }

    // Success: valid image
    const headers = new Headers(res.headers);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Access-Control-Allow-Origin", "*");
    return new Response(res.body, {
      status: res.status,
      headers,
    });
  } catch (err) {
    // Fetch failed: fallback with 502 (Bad Gateway)
    const fallbackRes = await fetch(FALLBACK_IMAGE);
    const fallbackHeaders = new Headers(fallbackRes.headers);
    fallbackHeaders.set("Cache-Control", "public, max-age=31536000, immutable");
    fallbackHeaders.set("Access-Control-Allow-Origin", "*");
    fallbackHeaders.set("X-Fallback-Image", "true");
    return new Response(fallbackRes.body, {
      status: 502,
      headers: fallbackHeaders,
    });
  }
}
