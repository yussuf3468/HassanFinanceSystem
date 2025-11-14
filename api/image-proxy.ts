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

  const fetchOpts: RequestInit = {
    redirect: "follow",
    headers: {
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  };

  // ---- 1) TRY FETCHING ORIGINAL TRANSFORMED URL ----
  let upstream: Response;
  try {
    upstream = await fetch(rawUrl, fetchOpts);
  } catch (err) {
    console.warn("[image-proxy] fetch error:", err);
    return inlinePixelResponse(502, { "x-error": "fetch-failed", "x-error-msg": String(err) });
  }

  let upstreamStatus = upstream.status;
  let upstreamCT = upstream.headers.get("content-type") ?? "";

  // If transformed image loads correctly → return it
  if (upstream.ok && upstreamCT.startsWith("image")) {
    const body = await upstream.arrayBuffer();
    const headers = new Headers(upstream.headers);
    headers.set("cache-control", "public, max-age=31536000, immutable");
    headers.set("access-control-allow-origin", "*");
    headers.set("x-fallback-used", "none");
    return new Response(body, { status: upstreamStatus, headers });
  }

  // ---- 2) FALLBACK: TRY RAW IMAGE WITHOUT TRANSFORMATION ----
  const rawNoParams = rawUrl.split("?")[0];

  try {
    const rawRes = await fetch(rawNoParams, fetchOpts);
    const rawCT = rawRes.headers.get("content-type") ?? "";

    if (rawRes.ok && rawCT.startsWith("image")) {
      const body = await rawRes.arrayBuffer();
      const headers = new Headers(rawRes.headers);
      headers.set("cache-control", "public, max-age=31536000, immutable");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-fallback-used", "raw-image");
      return new Response(body, { status: 200, headers });
    }
  } catch (err) {
    console.warn("[image-proxy] raw fallback error:", err);
  }

  // ---- 3) BOTH FAILED → RETURN INLINE PNG ----
  console.warn("[image-proxy] unusable upstream", {
    url: rawUrl,
    status: upstreamStatus,
    contentType: upstreamCT,
  });

  const resp = inlinePixelResponse(502);
  resp.headers.set("x-upstream-status", String(upstreamStatus));
  resp.headers.set("x-upstream-content-type", upstreamCT);
  resp.headers.set(
    "x-upstream-url",
    rawUrl.length > 200 ? rawUrl.slice(0, 200) + "…" : rawUrl
  );

  return resp;
}
