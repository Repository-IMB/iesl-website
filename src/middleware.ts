import { defineMiddleware } from "astro:middleware";
import { SESSION_KEY } from "./lib/aula/auth";

/**
 * Rutas del aula que exigen alumno autenticado. El login queda fuera, y el
 * resto del sitio (páginas públicas estáticas) no se toca.
 */
const AULA_PREFIX = "/aula";
const RUTAS_PUBLICAS_DEL_AULA = ["/aula/login"];

const esRutaDelAula = (path: string) =>
  path === AULA_PREFIX || path.startsWith(`${AULA_PREFIX}/`);

const esPublicaDelAula = (path: string) =>
  RUTAS_PUBLICAS_DEL_AULA.some((ruta) => path === ruta || path === `${ruta}/`);

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;

  // Fuera del aula no se lee la sesión. Leerla implica tocar las cabeceras del
  // request, y en las páginas prerenderizadas eso emite un warning en cada
  // build además de ser trabajo inútil: esas rutas no miran locals.student.
  if (!esRutaDelAula(path)) {
    context.locals.student = null;
    return next();
  }

  // `context.session` es undefined si la ruta no se renderiza on-demand.
  context.locals.student = (await context.session?.get(SESSION_KEY)) ?? null;

  if (!esPublicaDelAula(path) && !context.locals.student) {
    return context.redirect("/aula/login");
  }

  return next();
});
