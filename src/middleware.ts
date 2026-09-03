import { defineMiddleware } from "astro:middleware";
import { SESSION_KEY } from "./lib/aula/auth";

// Prefijos del aula. El resto del sitio (páginas públicas estáticas) no se
// toca: ni se lee la sesión, porque leerla implica tocar las cabeceras del
// request y en las rutas prerenderizadas eso emite un warning en cada build.
const PREFIJOS_DEL_AULA = ["/aula", "/api/aula"];

/** Rutas del aula accesibles sin sesión: el propio login y su API. */
const PUBLICAS = ["/aula/login", "/api/aula/login"];

/** Rutas que además exigen rol de administrador. */
const SOLO_ADMIN = ["/aula/admin", "/api/aula/admin"];

const empiezaPor = (path: string, prefijos: string[]) =>
  prefijos.some((p) => path === p || path.startsWith(`${p}/`));

const esExactamente = (path: string, rutas: string[]) =>
  rutas.some((r) => path === r || path === `${r}/`);

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;

  if (!empiezaPor(path, PREFIJOS_DEL_AULA)) {
    context.locals.student = null;
    return next();
  }

  // `context.session` es undefined si la ruta no se renderiza on-demand.
  context.locals.student = (await context.session?.get(SESSION_KEY)) ?? null;

  if (esExactamente(path, PUBLICAS)) return next();

  if (!context.locals.student) {
    // A una API se le responde 401; a una página se la manda al login.
    return path.startsWith("/api/")
      ? new Response("No autenticado", { status: 401 })
      : context.redirect("/aula/login");
  }

  // Primer filtro de administración, barato: si la sesión no dice admin, no
  // hay nada que discutir. Las páginas y rutas de admin vuelven a confirmarlo
  // contra D1 con requireAdmin(), porque el rol pudo revocarse después de que
  // el alumno inició sesión.
  if (empiezaPor(path, SOLO_ADMIN) && !context.locals.student.is_admin) {
    return path.startsWith("/api/")
      ? new Response("Sin permisos", { status: 403 })
      : context.redirect("/aula");
  }

  return next();
});
