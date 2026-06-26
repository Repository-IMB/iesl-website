import type { CollectionEntry } from "astro:content";

// Los tipos se derivan del schema de la collection (src/content.config.ts),
// así se mantienen siempre sincronizados con la validación Zod.
export type Course = CollectionEntry<"courses">["data"];
// Módulos e instructores se definen inline en el frontmatter de cada curso;
// estos tipos se derivan del schema de la collection de cursos.
export type CourseInstructor = Course["instructors"][number];
export type CourseModule = Course["modules"][number];
export type CourseCategory = Course["category"];
export type CourseLevel = Course["details"]["level"];
