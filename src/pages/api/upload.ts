export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { validateApiToken } from '../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  // ── 1. Autenticación ──────────────────────────────────────────────────────
  if (!validateApiToken(request)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── 2. Extracción del archivo ─────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid form data" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return new Response(
      JSON.stringify({ error: "No file provided or file is empty" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── 3. Sanitización del nombre ────────────────────────────────────────────
  const originalName = file.name;
  
  // Conservamos el nombre original para que el enlace público sea legible.
  // Solo eliminamos barras (/) y barras invertidas (\) por seguridad.
  let safeKey = originalName.replace(/[\/\\]/g, "").trim();
  
  // Fallback por si el nombre estuviera completamente vacío tras limpiar
  if (!safeKey) {
    const ext = originalName.includes(".")
      ? "." + originalName.split(".").pop()!.toLowerCase()
      : "";
    safeKey = crypto.randomUUID() + ext;
  }

  // ── 4. Subida a R2 ────────────────────────────────────────────────────────
  const bucket = env.MI_BUCKET_R2;

  try {
    await bucket.put(safeKey, file.stream(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
      customMetadata: { originalName },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: `Upload failed: ${message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      key: safeKey,
      originalName,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};