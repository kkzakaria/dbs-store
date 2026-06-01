import { getCloudflareContext } from "@opennextjs/cloudflare";

// Cloudflare bindings are unavailable at build-time prerender.
export const dynamic = "force-dynamic";

// Seuls les objets uploadés par l'admin sont servis (clés non devinables).
const ALLOWED_PREFIXES = ["banners/", "products/", "avatars/"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> }
): Promise<Response> {
  const { key: parts } = await params;
  const key = parts.join("/");

  if (!ALLOWED_PREFIXES.some((p) => key.startsWith(p))) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const { env } = await getCloudflareContext<CloudflareEnv>();
    const object = await env.MEDIA.get(key);
    if (!object) return new Response("Not found", { status: 404 });

    // En dev, @opennextjs/cloudflare proxifie le binding R2 : passer un argument
    // non-POJO (writeHttpMetadata(Headers)) ou streamer object.body échoue
    // (DevalueError). On matérialise les octets et on lit le content-type depuis
    // httpMetadata — primitives proxy-safe qui fonctionnent en dev comme en prod.
    const buffer = await object.arrayBuffer();
    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType ?? "application/octet-stream");
    headers.set("ETag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("X-Content-Type-Options", "nosniff");
    return new Response(buffer, { headers });
  } catch (err) {
    console.error(`[media route] échec de lecture de "${key}":`, err);
    return new Response("Internal error", { status: 500 });
  }
}
