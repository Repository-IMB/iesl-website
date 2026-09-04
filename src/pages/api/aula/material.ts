import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { isEnrolled } from "../../../lib/aula/db";
import { getModulosDeCurso } from "../../../lib/aula/content";
import { estadoDeLecciones, getProgresoDelCurso } from "../../../lib/aula/progreso";

export const prerender = false;

/**
 * Entrega el material de apoyo de una lección desde el bucket R2.
 *
 * No se enlaza el objeto de R2 directamente porque sería público: acá se exige
 * sesión (vía middleware), matrícula en el curso y que la lección esté
 * desbloqueada. Además la clave del objeto se valida contra el contenido del
 * curso, así el parámetro no puede usarse para leer cualquier archivo del
 * bucket.
 */
export const GET: APIRoute = async ({ request, locals }) => {
  const student = locals.student!;
  const url = new URL(request.url);
  const cursoSlug = url.searchParams.get("curso") ?? "";
  const leccionCode = url.searchParams.get("leccion") ?? "";
  const key = url.searchParams.get("archivo") ?? "";

  if (!cursoSlug || !leccionCode || !key) {
    return new Response("Petición incompleta", { status: 400 });
  }

  const bucket = env.MI_BUCKET_R2;
  if (!bucket) {
    console.error("[aula] falta el binding MI_BUCKET_R2");
    return new Response("El material no está disponible en este momento.", { status: 503 });
  }

  try {
    if (!(await isEnrolled(env.DB_AULA, student.id, cursoSlug))) {
      return new Response("Sin acceso a este curso", { status: 403 });
    }

    const modulos = await getModulosDeCurso(cursoSlug);
    const leccion = modulos
      .flatMap((modulo) => modulo.data.lessons)
      .find((l) => l.code === leccionCode);

    if (!leccion) return new Response("Lección inexistente", { status: 404 });

    // La clave tiene que estar declarada en esta lección: evita que el
    // parámetro sirva para pedir cualquier objeto del bucket.
    const recurso = leccion.resources.find((r) => r.key === key);
    if (!recurso) return new Response("Material inexistente", { status: 404 });

    const progreso = await getProgresoDelCurso(env.DB_AULA, student.id, cursoSlug);
    if (!estadoDeLecciones(modulos, progreso).get(leccionCode)?.desbloqueada) {
      return new Response("Esta lección todavía está bloqueada", { status: 403 });
    }

    const objeto = await bucket.get(key);
    if (!objeto) return new Response("El archivo no está en el bucket", { status: 404 });

    const nombre = objeto.customMetadata?.["originalName"] ?? key.split("/").pop() ?? key;
    const nombreCodificado = encodeURIComponent(nombre).replace(/'/g, "%27");

    return new Response(objeto.body, {
      status: 200,
      headers: {
        "Content-Type": objeto.httpMetadata?.contentType ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${nombre}"; filename*=UTF-8''${nombreCodificado}`,
        // Material privado del alumno: no debe quedar en cachés compartidas.
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[aula] no se pudo entregar el material:", error);
    return new Response("No se pudo descargar el material. Volvé a intentar.", { status: 503 });
  }
};
