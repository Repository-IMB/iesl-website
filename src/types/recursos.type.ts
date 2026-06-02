import type { CollectionEntry } from "astro:content";

// Datos crudos del frontmatter (schema en src/content.config.ts)
export type ResourceData = CollectionEntry<"blog">["data"];

// Modelo de vista que reciben los componentes: data + slug + fecha formateada
export type Resource = ResourceData & {
  slug: string;
  date: string;
};

export type ResourceCategory = ResourceData["category"];
export type IncludedResource = NonNullable<ResourceData["includedResource"]>;

// Tipos para la metadata de la página /recursos (no son ítems de contenido)
export type RecursosHeroSection = {
  badge: "Blog y recursos" | string;
  title: {
    static: string;
  };
  description: string;
};
