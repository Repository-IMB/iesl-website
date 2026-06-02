/**
 * courses.data.ts
 * ─────────────────────────────────────────────
 * Helpers de acceso al catálogo de cursos.
 * Los cursos viven como Content Collection en `src/content/courses/<slug>/index.mdx`
 * (schema en `src/content.config.ts`). Estos helpers envuelven `getCollection`
 * para no romper los imports existentes.
 */

import { getCollection } from "astro:content";
import type { CourseCategory } from "../types/course.type";

/** Devuelve todos los cursos como objetos planos `{ ...data, slug }`. */
export const getCourses = async () => {
  const entries = await getCollection("courses");
  return entries.map((entry) => ({ ...entry.data, slug: entry.id }));
};

/** Solo los cursos marcados como destacados. */
export const getFeaturedCourses = async () => {
  const courses = await getCourses();
  return courses.filter((course) => course.featured);
};

/** Categorías únicas presentes en los cursos. */
export const getCategories = async (): Promise<CourseCategory[]> => {
  const courses = await getCourses();
  return [...new Set(courses.map((course) => course.category))];
};
