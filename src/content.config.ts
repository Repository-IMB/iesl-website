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
  // Cursos beneficio del aula: no se venden, se acceden con credenciales.
  "Beneficio",
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
      rating: z.string().optional(),
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

// ─── Aula virtual ───────────────────────────────────────────────────────────
// Los cursos del aula (cursos beneficio) viven aparte del catálogo de
// marketing: aquí se dictan, allá se venden. Ambas collections comparten el
// árbol src/content/aula/ y no se solapan porque los globs son distintos:
// */index.mdx para el curso, */modulos/*.mdx para sus módulos.

const aulaCursos = defineCollection({
  loader: glob({
    pattern: "*/index.{md,mdx}",
    base: "./src/content/aula",
    generateId: slugFromIndex,
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Etiqueta de formato, p.ej. "Microcurso asincrónico". */
      kind: z.string(),
      description: z.string(),
      image: image(),
      objective: z.string(),
      modality: z.string(),
      requirement: z.string(),
      software: z.string(),
      /** Mismo enum que el catálogo: la tarjeta de `/cursos` lo muestra. */
      level: z.enum(COURSE_LEVELS),
      /** Competencias que se llevan del curso, para la ficha pública. */
      learnings: z.array(z.string()).default([]),
      /** Qué incluye, para la barra lateral de la ficha pública. */
      includes: z
        .array(z.object({ label: z.string(), icon: z.string() }))
        .default([]),
      totalModules: z.number(),
      totalLessons: z.number(),
      /**
       * Porcentaje mínimo para aprobar la evaluación de una lección y
       * desbloquear la siguiente. Con 3 preguntas los únicos resultados
       * posibles son 0, 33, 67 y 100: con 100 hay que acertar las tres, con 60
       * alcanza con dos.
       */
      passScore: z.number().int().min(1).max(100).default(100),
      duration: z.object({
        videos: z.string(),
        practice: z.string(),
        project: z.string(),
        total: z.string(),
      }),
    }),
});

const aulaModulos = defineCollection({
  loader: glob({
    pattern: "*/modulos/*.{md,mdx}",
    base: "./src/content/aula",
  }),
  schema: z.object({
    /** Slug del curso al que pertenece (debe existir en aulaCursos). */
    course: z.string(),
    number: z.number(),
    title: z.string(),
    duration: z.string(),
    /** El proyecto final se muestra distinto al resto de los módulos. */
    isProject: z.boolean().default(false),
    lessons: z
      .array(
        z.object({
          /** Numeración del temario, p.ej. "1.1". */
          code: z.string(),
          title: z.string(),
          topic: z.string(),
          /** Vacío mientras el video no esté publicado. */
          videoUrl: z.string().nullable().default(null),
          /**
           * Material de apoyo descargable. `key` apunta a un objeto del bucket
           * R2 y se sirve por `/api/aula/material`, que exige sesión y
           * matrícula; `url` es para material alojado fuera. Sin ninguno de los
           * dos, el material figura como pendiente de publicación.
           */
          resources: z
            .array(
              z.object({
                kind: z.enum(["resumen", "practica", "otro"]).default("otro"),
                label: z.string(),
                key: z.string().nullable().default(null),
                url: z.string().nullable().default(null),
              })
            )
            .default([]),
          /**
           * Evaluación rápida de la lección. `correctIndex` NUNCA se envía al
           * navegador: la corrección ocurre en el servidor.
           *
           * Una lección sin preguntas no bloquea el avance, así que se pueden
           * ir cargando de a poco sin dejar el curso trabado.
           */
          questions: z
            .array(
              z.object({
                prompt: z.string(),
                options: z.array(z.string()).min(2),
                correctIndex: z.number().int().min(0),
              })
            )
            .default([]),
        })
      )
      .default([]),
  }),
});

export const collections = { courses, blog, aulaCursos, aulaModulos };
