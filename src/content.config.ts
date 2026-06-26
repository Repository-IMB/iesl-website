import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// ─── Enums compartidos con los tipos existentes ─────────────────────────────
const COURSE_CATEGORIES = [
  "Tecnología",
  "Marketing",
  "Idiomas",
  "Diseño",
  "Data",
  "Productividad",
  "Negocios",
  "Habilidades blandas",
  "Finanzas",
  "Creatividad",
  "Recursos Humanos",
  "Mantenimiento",
] as const;

const COURSE_LEVELS = ["Nivel inicial", "Nivel intermedio", "Nivel avanzado"] as const;

const BLOG_CATEGORIES = [
  "Productividad",
  "Liderazgo",
  "Desarrollo profesional",
  "Crecimiento profesional",
  "Networking",
] as const;

// ─── Cursos ─────────────────────────────────────────────────────────────────
const slugFromIndex = ({ entry }: { entry: string }) =>
  entry.replace(/\/index\.(md|mdx|ya?ml)$/i, "");

const courses = defineCollection({
  loader: glob({
    pattern: "**/index.{md,mdx}",
    base: "./src/content/courses",
    generateId: slugFromIndex,
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      category: z.enum(COURSE_CATEGORIES),
      image: image(),
      details: z.object({
        totalHours: z.string(),
        totalLessons: z.string(),
        level: z.enum(COURSE_LEVELS),
      }),
      rating: z.string(),
      reviews: z.number().optional(),
      featured: z.boolean().default(false),
      priceBadge: z.string().optional(),
      learnings: z.array(z.string()).default([]),
      // Módulos del curso definidos inline. El título NO lleva el prefijo
      // "Módulo N:"; la numeración la pone el componente según la posición.
      modules: z
        .array(
          z.object({
            title: z.string(),
            duration: z.string(),
            classesCount: z.number(),
            topics: z.array(z.string()).default([]),
          })
        )
        .default([]),
      // Instructores definidos inline (2-3 por curso). avatar usa el helper
      // image() del schema; referenciar con ruta relativa al .mdx.
      instructors: z
        .array(
          z.object({
            name: z.string(),
            role: z.string(),
            avatar: image(),
            bio: z.string(),
            linkedin: z.string().url().optional(),
          })
        )
        .default([]),
      benefits: z.array(z.string()).default([]),
      includes: z
        .array(z.object({ label: z.string(), icon: z.string() }))
        .default([]),
      tools: z.array(z.string()).default([]),
    }),
});

// ─── Blog / Recursos ────────────────────────────────────────────────────────
const blog = defineCollection({
  loader: glob({
    pattern: "**/index.{md,mdx}",
    base: "./src/content/blog",
    generateId: slugFromIndex,
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      category: z.enum(BLOG_CATEGORIES),
      author: z.string().default("IESL"),
      publishDate: z.coerce.date(),
      image: image(),
      includedResource: z
        .object({
          label: z.string(),
          icon: z.string().optional(),
          url: z.string().optional(),
        })
        .optional(),
      relatedSlugs: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
    }),
});

export const collections = { courses, blog };
