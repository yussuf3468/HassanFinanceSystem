export const config = { runtime: "edge" };

/* inline 1x1 PNG fallback (base64) */
const PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=";

function base64ToArrayBuffer(base64: string) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function inlinePixelResponse(status = 502, extraHeaders: Record<string, string> = {}) {
  const body = base64ToArrayBuffer(PIXEL_PNG_BASE64);
  const headers = new Headers({
    "content-type": "image/png",
    "cache-control": "public, max-age=31536000, immutable",
    "access-control-allow-origin": "*",
    "x-fallback-used": "inline-pixel",
    ...extraHeaders,
  });
  return new Response(body, { status, headers });
}

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get("url");
  if (!rawUrl) {
    console.warn("[image-proxy] missing url param");
    return inlinePixelResponse(400);
  }

  // Use a browser-like UA and follow redirects — helps with some CDNs
  const fetchOpts: RequestInit = {
    redirect: "follow",
    headers: {
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  };

  let upstream: Response;
  try {
    upstream = await fetch(rawUrl, fetchOpts);
  } catch (err) {
    console.warn("[image-proxy] fetch error:", err);
    return inlinePixelResponse(502, { "x-error": "fetch-failed", "x-error-msg": String(err) });
  }

  const upstreamStatus = upstream.status;
  const upstreamCT = upstream.headers.get("content-type") ?? "";

  // If upstream OK and returns an image, forward it
  if (upstream.ok && upstreamCT.startsWith("image")) {
    const body = await upstream.arrayBuffer();
    const headers = new Headers(upstream.headers);
    headers.set("cache-control", "public, max-age=31536000, immutable");
    headers.set("access-control-allow-origin", "*");
    headers.set("x-fallback-used", "none");
    return new Response(body, { status: upstreamStatus, headers });
  }

  // Upstream returned non-image or non-ok -> log and return inline pixel with debug headers
  console.warn("[image-proxy] upstream not usable", {
    url: rawUrl,
    status: upstreamStatus,
    contentType: upstreamCT,
  });

  const statusToReturn = upstreamStatus === 404 ? 404 : 502;
  const resp = inlinePixelResponse(statusToReturn);
  resp.headers.set("x-upstream-status", String(upstreamStatus));
  resp.headers.set("x-upstream-content-type", upstreamCT);
  resp.headers.set(
    "x-upstream-url",
    rawUrl.length > 200 ? rawUrl.slice(0, 200) + "…" : rawUrl
  );
  return resp;
}
