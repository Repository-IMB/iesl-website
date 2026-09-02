import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getStudentByEmail } from "../../../lib/aula/db";
import { verifyPassword, SESSION_KEY } from "../../../lib/aula/auth";

export const prerender = false;

/** "Recordarme en este equipo": la sesión sobrevive al cierre del navegador. */
const TTL_RECORDARME = 60 * 60 * 24 * 30;

/** 303 para que el navegador reemplace el POST por un GET al volver al login. */
const volverConError = () =>
  new Response(null, {
    status: 303,
    headers: { Location: "/aula/login?error=1" },
  });

export const POST: APIRoute = async ({ request, session }) => {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const recordarme = form.get("remember") === "1";

  if (!email || !password) return volverConError();

  let student;
  try {
    student = await getStudentByEmail(env.DB_AULA, email);
  } catch (error) {
    console.error("[aula] login: no se pudo consultar el alumno:", error);
    return new Response(
      "El aula no está disponible en este momento. Volvé a intentar en unos minutos.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  // Mismo mensaje para "no existe", "inactivo" y "contraseña incorrecta": el
  // formulario no debe permitir averiguar qué correos están registrados.
  if (!student || student.active !== 1) return volverConError();

  const passwordOk = await verifyPassword(password, student.password_hash);
  if (!passwordOk) return volverConError();

  if (!session) {
    console.error("[aula] login: no hay almacenamiento de sesiones disponible");
    return new Response("No se pudo iniciar la sesión. Volvé a intentar en unos minutos.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // Nuevo identificador de sesión al autenticarse: evita la fijación de sesión.
  await session.regenerate();
  session.set(
    SESSION_KEY,
    { id: student.id, email: student.email, full_name: student.full_name },
    recordarme ? { ttl: TTL_RECORDARME } : undefined
  );

  return new Response(null, { status: 303, headers: { Location: "/aula" } });
};
