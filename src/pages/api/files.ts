export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { validateApiToken } from "../../lib/auth";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ── GET ───────────────────────────────────────────────────────────────────────

export const GET: APIRoute = async ({ request }) => {
  // Autenticación
  if (!validateApiToken(request)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const bucket = env.MI_BUCKET_R2;

  if (!bucket) {
    return new Response(
      JSON.stringify({ error: "R2 bucket binding not found" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const url = new URL(request.url);
  const downloadKey = url.searchParams.get("download");

  // ── Modo Descarga ──────────────────────────────────────────────────────────
  if (downloadKey) {
    const object = await bucket.get(downloadKey);

    if (!object) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const originalName =
      object.customMetadata?.["originalName"] ?? downloadKey;
    const contentType =
      object.httpMetadata?.contentType ?? "application/octet-stream";

    const encodedName = encodeURIComponent(originalName).replace(/'/g, "%27");

    return new Response(object.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${originalName}"; filename*=UTF-8''${encodedName}`,
        "Content-Length": object.size.toString(),
        "Cache-Control": "no-store",
      },
    });
  }

  // ── Modo Listado ───────────────────────────────────────────────────────────
  const listed = await bucket.list();

  const files = listed.objects.map((obj: R2Object) => ({
    key: obj.key,
    originalName: obj.customMetadata?.["originalName"] ?? obj.key,
    size: formatBytes(obj.size),
    sizeBytes: obj.size,
    uploaded: obj.uploaded instanceof Date
      ? obj.uploaded.toISOString()
      : new Date(obj.uploaded as string).toISOString(),
  }));

  return new Response(JSON.stringify({ files }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};