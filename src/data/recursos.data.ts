/**
 * recursos.data.ts
 * ─────────────────────────────────────────────
 * Metadata de la página /recursos + helpers de acceso al blog.
 * Los artículos viven como Content Collection en `src/content/blog/<slug>/index.mdx`
 * (schema en `src/content.config.ts`).
 */

import { getCollection, type CollectionEntry } from "astro:content";
import type { Resource, RecursosHeroSection } from "../types/recursos.type";

// ─── PÁGINA PRINCIPAL HERO ──────────────────────────────────────────────────
export const recursosHero: RecursosHeroSection = {
  badge: "Blog y recursos",
  title: {
    static: "Ideas y herramientas para crear profesionalmente",
  },
  description:
    "Artículos, guías y recursos descargables sobre crecimiento profesional, liderazgo y desarrollo personal.",
};

// ─── HELPERS ────────────────────────────────────────────────────────────────
const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);

export const toResource = (entry: CollectionEntry<"blog">): Resource => ({
  ...entry.data,
  slug: entry.id,
  date: formatDate(entry.data.publishDate),
});

/** Todos los artículos publicados, ordenados por fecha descendente. */
export const getResources = async (): Promise<Resource[]> => {
  const entries = await getCollection("blog", ({ data }) => !data.draft);
  return entries
    .map(toResource)
    .sort(
      (a, b) => b.publishDate.getTime() - a.publishDate.getTime()
    );
};

/** Artículos relacionados según `relatedSlugs`. */
export const getRelatedResources = async (
  resource: Pick<Resource, "relatedSlugs">
): Promise<Resource[]> => {
  if (!resource.relatedSlugs || resource.relatedSlugs.length === 0) return [];
  const all = await getResources();
  return all.filter((r) => resource.relatedSlugs.includes(r.slug));
};
