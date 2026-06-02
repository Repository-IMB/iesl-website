import type { CollectionEntry } from "astro:content";

// Los tipos se derivan del schema de la collection (src/content.config.ts),
// así se mantienen siempre sincronizados con la validación Zod.
export type Course = CollectionEntry<"courses">["data"];
export type CourseInstructor = NonNullable<Course["instructors"]>[number];
export type CourseModule = NonNullable<Course["modules"]>[number];
export type CourseCategory = Course["category"];
export type CourseLevel = Course["details"]["level"];
