import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { hashPassword } from "../../../../lib/aula/auth";
import {
  countActiveAdmins,
  createStudent,
  deleteStudent,
  emailExists,
  requireAdmin,
  setEnrollments,
  updateStudent,
  updateStudentPassword,
} from "../../../../lib/aula/db";
import { getAulaCursos } from "../../../../lib/aula/content";

export const prerender = false;

const PASSWORD_MINIMO = 8;
const PANEL = "/aula/admin";

/** 303 para que el navegador reemplace el POST por un GET al volver al panel. */
const volver = (params: Record<string, string>) =>
  new Response(null, {
    status: 303,
    headers: { Location: `${PANEL}?${new URLSearchParams(params)}` },
  });

const error = (mensaje: string) => volver({ error: mensaje });
const ok = (mensaje: string) => volver({ ok: mensaje });

/** Validación deliberadamente laxa: alcanza para atajar errores de tipeo. */
const emailValido = (valor: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);

export const POST: APIRoute = async ({ request, locals }) => {
  const admin = locals.student!;
  const db = env.DB_AULA;

  // El middleware ya filtró por la sesión; acá se confirma contra la base, que
  // es la fuente de verdad del rol.
  try {
    if (!(await requireAdmin(db, admin.id))) {
      return new Response("Sin permisos", { status: 403 });
    }
  } catch (err) {
    console.error("[aula/admin] no se pudo verificar el permiso:", err);
    return new Response("El panel no está disponible en este momento.", { status: 503 });
  }

  const form = await request.formData();
  const accion = String(form.get("accion") ?? "");
  const id = Number(form.get("id") ?? 0);

  try {
    switch (accion) {
      case "crear": {
        const email = String(form.get("email") ?? "").trim();
        const nombre = String(form.get("nombre") ?? "").trim();
        const password = String(form.get("password") ?? "");
        const cursos = form.getAll("cursos").map(String);

        if (!emailValido(email)) return error("El correo no tiene un formato válido.");
        if (password.length < PASSWORD_MINIMO) {
          return error(`La contraseña necesita al menos ${PASSWORD_MINIMO} caracteres.`);
        }
        if (await emailExists(db, email)) return error("Ya existe un alumno con ese correo.");

        const cursosValidos = await filtrarCursos(cursos);
        const nuevoId = await createStudent(db, email, nombre, await hashPassword(password));
        if (cursosValidos.length > 0) await setEnrollments(db, nuevoId, cursosValidos);

        return ok(`Alumno ${email} creado.`);
      }

      case "editar": {
        if (!id) return error("Falta el alumno a editar.");
        const email = String(form.get("email") ?? "").trim();
        const nombre = String(form.get("nombre") ?? "").trim();
        const activo = form.get("activo") === "1";
        const cursos = form.getAll("cursos").map(String);

        if (!emailValido(email)) return error("El correo no tiene un formato válido.");
        if (await emailExists(db, email, id)) {
          return error("Ese correo ya está usado por otro alumno.");
        }

        // Desactivar al último administrador activo dejaría el panel sin dueño.
        if (!activo && id === admin.id && (await countActiveAdmins(db)) <= 1) {
          return error("No podés desactivarte: sos el único administrador activo.");
        }

        await updateStudent(db, id, email, nombre, activo);
        await setEnrollments(db, id, await filtrarCursos(cursos));

        return ok("Cambios guardados.");
      }

      case "password": {
        if (!id) return error("Falta el alumno.");
        const password = String(form.get("password") ?? "");
        if (password.length < PASSWORD_MINIMO) {
          return error(`La contraseña necesita al menos ${PASSWORD_MINIMO} caracteres.`);
        }
        await updateStudentPassword(db, id, await hashPassword(password));
        return ok("Contraseña actualizada.");
      }

      case "eliminar": {
        if (!id) return error("Falta el alumno.");
        if (id === admin.id) return error("No podés eliminar tu propia cuenta.");
        await deleteStudent(db, id);
        return ok("Alumno eliminado.");
      }

      default:
        return error("Acción no reconocida.");
    }
  } catch (err) {
    console.error(`[aula/admin] falló la acción "${accion}":`, err);
    return error("No se pudo completar la operación. Volvé a intentar.");
  }
};

/** Descarta slugs que no correspondan a un curso real del aula. */
async function filtrarCursos(slugs: string[]): Promise<string[]> {
  const existentes = new Set((await getAulaCursos()).map((curso) => curso.id));
  return [...new Set(slugs)].filter((slug) => existentes.has(slug));
}
