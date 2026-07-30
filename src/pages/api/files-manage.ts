export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { validateApiToken } from "../../lib/auth";

// ── DELETE — Eliminar un archivo de R2 ───────────────────────────────────────

export const DELETE: APIRoute = async ({ request }) => {
  if (!validateApiToken(request)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { key?: string };
  try {
    body = (await request.json()) as { key?: string };
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const key = body.key?.trim();
  if (!key) {
    return new Response(JSON.stringify({ error: "Missing key" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const bucket = env.MI_BUCKET_R2;
  await bucket.delete(key);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

// ── PUT — Reemplazar archivo y/o cambiar enlace (key) ────────────────────────
//
// FormData esperado:
//   - oldKey  (string, requerido): clave actual del archivo en R2
//   - newKey  (string, opcional):  nueva clave deseada (enlace personalizado)
//   - file    (File,   opcional):  archivo de reemplazo
//
// Escenarios:
//   1. Solo archivo nuevo  → se sube con la misma key (oldKey)
//   2. Solo nueva key      → se copia el objeto existente a la nueva key y se borra la vieja
//   3. Ambos               → se sube el archivo nuevo a la nueva key y se borra la vieja

export const PUT: APIRoute = async ({ request }) => {
  if (!validateApiToken(request)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid form data" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const oldKey = (formData.get("oldKey") as string | null)?.trim();
  const rawNewKey = (formData.get("newKey") as string | null)?.trim();
  const file = formData.get("file") as File | null;

  if (!oldKey) {
    return new Response(JSON.stringify({ error: "Missing oldKey" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Sanitizar nueva clave: eliminar barras por seguridad
  const newKey = rawNewKey ? rawNewKey.replace(/[\/\\]/g, "").trim() : null;
  const targetKey = newKey || oldKey;
  const keyChanged = targetKey !== oldKey;
  const hasFile = file instanceof File && file.size > 0;

  if (!hasFile && !keyChanged) {
    return new Response(
      JSON.stringify({ error: "No changes provided" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const bucket = env.MI_BUCKET_R2;

  try {
    if (hasFile) {
      // Escenario 1 o 3: se sube archivo nuevo a targetKey
      await bucket.put(targetKey, file.stream(), {
        httpMetadata: {
          contentType: file.type || "application/octet-stream",
        },
        customMetadata: { originalName: file.name },
      });
    } else {
      // Escenario 2: solo cambió la key → copiar objeto existente
      const existing = await bucket.get(oldKey);
      if (!existing) {
        return new Response(
          JSON.stringify({ error: "Original file not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }
      await bucket.put(targetKey, existing.body, {
        httpMetadata: existing.httpMetadata,
        customMetadata: existing.customMetadata ?? {},
      });
    }

    // Si la clave cambió, eliminar el objeto viejo
    if (keyChanged) {
      await bucket.delete(oldKey);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: `Operation failed: ${message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ ok: true, key: targetKey }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};
