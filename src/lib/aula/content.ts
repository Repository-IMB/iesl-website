// Lectura de las Content Collections del aula.
//
// Las collections son planas: `aulaModulos` referencia su curso por slug en el
// campo `course`. Estas funciones hacen el filtrado y el orden en un solo lugar
// para que las páginas no repitan la lógica.

import { getCollection, getEntry } from "astro:content";
import type { CollectionEntry } from "astro:content";
import type { Course } from "../../types/course.type";

export type AulaCurso = CollectionEntry<"aulaCursos">;
export type AulaModulo = CollectionEntry<"aulaModulos">;

export async function getAulaCurso(slug: string): Promise<AulaCurso | undefined> {
  return await getEntry("aulaCursos", slug);
}

export async function getAulaCursos(): Promise<AulaCurso[]> {
  return await getCollection("aulaCursos");
}

/** Módulos de un curso, ordenados por su número. El proyecto final va último. */
export async function getModulosDeCurso(courseSlug: string): Promise<AulaModulo[]> {
  const modulos = await getCollection("aulaModulos", ({ data }) => data.course === courseSlug);
  return modulos.sort((a, b) => a.data.number - b.data.number);
}

export interface ModuloVecinos {
  modulo: AulaModulo;
  /**
   * Posición entre los módulos numerados, empezando en 1. El proyecto final no
   * consume número, así que para él vale 0.
   */
  position: number;
  /** Cantidad de módulos numerados del curso, sin contar el proyecto final. */
  total: number;
  anterior: AulaModulo | null;
  siguiente: AulaModulo | null;
}

/**
 * Ubica un módulo dentro de su curso y devuelve sus vecinos para la navegación
 * entre módulos. Devuelve null si el número no existe en ese curso.
 */
export async function getModuloConVecinos(
  courseSlug: string,
  number: number
): Promise<ModuloVecinos | null> {
  const modulos = await getModulosDeCurso(courseSlug);
  const index = modulos.findIndex((m) => m.data.number === number);
  if (index === -1) return null;

  const numerados = modulos.filter((m) => !m.data.isProject);
  const modulo = modulos[index];

  return {
    modulo,
    position: modulo.data.isProject
      ? 0
      : numerados.findIndex((m) => m.data.number === number) + 1,
    total: numerados.length,
    anterior: index > 0 ? modulos[index - 1] : null,
    siguiente: index < modulos.length - 1 ? modulos[index + 1] : null,
  };
}

/** Cantidad de lecciones de un módulo. El proyecto final no cuenta como lección. */
export function contarLecciones(modulos: AulaModulo[]): number {
  return modulos
    .filter((m) => !m.data.isProject)
    .reduce((total, m) => total + m.data.lessons.length, 0);
}

// ─── Catálogo público ───────────────────────────────────────────────────────

/** Etiqueta con la que los cursos del aula aparecen en el catálogo. */
export const CATEGORIA_BENEFICIO = "Beneficio";

/**
 * Adapta un curso del aula al formato que espera `<CourseCard />`, para que en
 * `/cursos` se vea igual que los del catálogo comercial.
 *
 * No se duplica el curso en la collection `courses`: se mapea el que ya existe
 * en `aulaCursos`, así el título, la descripción y la portada tienen una sola
 * fuente. Se omite `rating` a propósito: no hay valoraciones reales todavía.
 *
 * El enlace va a la ficha pública `/cursos/<slug>`, igual que el resto del
 * catálogo, y desde ahí se entra al aula.
 */
export function aCardDeCatalogo(curso: AulaCurso) {
  return {
    slug: curso.id,
    title: curso.data.title,
    description: curso.data.description,
    category: CATEGORIA_BENEFICIO,
    image: curso.data.image,
    // Se usa la misma redacción que las tarjetas del catálogo comercial
    // ("36 horas", "18 clases", "Nivel intermedio") para que la fila se lea
    // homogénea, en vez de la del aula ("8–10 h", "33 lecciones").
    details: {
      totalHours: `${curso.data.duration.total.replace(/\s*h$/, "")} horas`,
      totalLessons: `${curso.data.totalLessons} clases`,
      level: curso.data.level,
    },
    href: `/cursos/${curso.id}`,
  };
}

/** Los cursos del aula listos para renderizar en el catálogo público. */
export async function getCursosBeneficioParaCatalogo() {
  const cursos = await getAulaCursos();
  return cursos.map(aCardDeCatalogo);
}

/**
 * Adapta un curso del aula al tipo `Course` del catálogo, para que la ficha
 * pública (`/cursos/<slug>`) pueda reusar tal cual los componentes de detalle
 * y quede con el mismo diseño que los cursos comerciales.
 *
 * Los módulos del aula se traducen al formato del catálogo: cada lección pasa a
 * ser un "tema" del módulo. Se omiten `rating`, `reviews`, `instructors` y
 * `benefits` porque no hay datos reales; los componentes que los usan ya se
 * ocultan solos cuando faltan.
 */
export function aFichaDeCurso(
  curso: AulaCurso,
  modulos: AulaModulo[]
): Course & { titlePrefix: string } {
  const card = aCardDeCatalogo(curso);

  return {
    // El titular del catálogo es bicolor: prefijo en gris + nombre en primary
    // ("Cursos de **Agile Coach**"). Se replica con el tipo de curso para no
    // romper ese patrón: "Microcurso **Power BI: Fundamentos...**".
    titlePrefix: curso.data.kind.split(" ")[0],
    title: curso.data.title,
    description: curso.data.description,
    category: CATEGORIA_BENEFICIO as "Beneficio",
    image: curso.data.image,
    details: card.details,
    featured: false,
    priceBadge: "INCLUIDO EN TU BENEFICIO",
    learnings: curso.data.learnings,
    // El proyecto final se excluye del acordeón: el componente del catálogo
    // numera los módulos por posición, así que aparecería como "Módulo 7" con
    // "1 clases". Figura en learnings y en includes, donde sí corresponde.
    modules: modulos
      .filter((modulo) => !modulo.data.isProject)
      .map((modulo) => ({
      title: modulo.data.title,
      duration: modulo.data.duration,
      classesCount: modulo.data.lessons.length,
      topics: modulo.data.lessons.map(
        (leccion) => `${leccion.title}: ${leccion.topic}`
      ),
    })),
    instructors: [],
    benefits: [],
    includes: curso.data.includes,
    tools: [],
    // Sin valoraciones reales: los componentes ocultan la estrella al faltar.
    rating: undefined,
    reviews: undefined,
  };
}
