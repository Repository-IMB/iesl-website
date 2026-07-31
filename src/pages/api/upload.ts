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

  // Si el usuario proporcionó una clave personalizada, usarla; sino, usar el nombre del archivo.
  // Solo eliminamos barras (/) y barras invertidas (\) por seguridad.
  const customKey = (formData.get("customKey") as string | null)?.trim();
  let safeKey = customKey
    ? customKey.replace(/[\/\\]/g, "").trim()
    : originalName.replace(/[\/\\]/g, "").trim();
  
  // Fallback por si el nombre estuviera completamente vacío tras limpiar
  if (!safeKey) {
    const ext = originalName.includes(".")
      ? "." + originalName.split(".").pop()!.toLowerCase()
      : "";
    safeKey = crypto.randomUUID() + ext;
  }

  // ── 4. Subida a R2 ────────────────────────────────────────────────────────
  const bucket = env.MI_BUCKET_R2;

  const existingFile = await bucket.head(safeKey);
  if (existingFile) {
    return new Response(
      JSON.stringify({ error: "El enlace ya está en uso por otro archivo" }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    await bucket.put(safeKey, file.stream(), {
      httpMetadata: { 
        contentType: file.type || "application/octet-stream",
        cacheControl: "public, max-age=0, must-revalidate"
      },
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