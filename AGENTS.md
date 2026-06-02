# AGENTS.md — IESL Institute

Guía operativa canónica para agentes de código (Claude Code, etc.). Para detalle humano ver `PROJECT_GUIDE.md` y `STYLE-GUIDE.md`.

## Stack
- **Astro 6**, sitio 100% **estático** (sin adapter SSR). `site: https://ieslinstitute.com`.
- **Tailwind CSS v4** vía `@import "tailwindcss"` + `@theme inline` en `src/styles/global.css`. Tipografía de artículos con el plugin `@tailwindcss/typography` (clase `prose`).
- **Contenido** (cursos y blog) en **Content Collections** (`src/content/`) usando **MDX**, definidas en `src/content.config.ts`.
- **Iconos:** `astro-icon` (Iconify). Fuentes: Poppins (headings) + Inter (body) vía `astro:assets`.
- **Imágenes:** `<SmartImage />` (wrapper de `astro:assets` con fallback a `placeholder.webp`).
- **Interactividad:** Vanilla JS en `<script>`; Swiper para carruseles. Backend externo de formularios: `https://api.ieslinstitute.com/mailer.php`.

## Comandos
| Comando | Acción |
|---|---|
| `npm install` | Instala dependencias |
| `npm run dev` | Servidor local en `localhost:4321` |
| `npm run build` | Build estático a `/dist` (corre validación Zod de las collections) |
| `npm run preview` | Previsualiza `/dist` |
| `npx astro check` | Chequeo de tipos |

## Estructura y convenciones
- **Organización 1:1 por página:** `src/pages/[x].astro` ↔ `src/components/[x]/` ↔ `src/data/[x].data.ts` ↔ `src/types/[x].type.ts`.
- **Patrón Datos → Props → Componentes.** Los datos **nunca** se definen inline en componentes; se importan de `src/data/` o se leen de `src/content/`.
- **Primitivos reutilizables** en `src/components/ui/` (`Section`, `Button`, `InfoBadge`, `SmartImage`, `*Card`...). Reutilizar siempre en vez de recrear DOM.
- **Contenido dinámico** (cursos, artículos) vive en `src/content/` y se lee con `getCollection()` / `render()`. Los textos de página (hero, FAQs, comparación) siguen en `src/data/*.data.ts`.

### Imágenes
- Locales en `src/assets/images/` o **colocadas** junto al `.mdx` de la collection.
- En collections usar el helper `image()` del schema (optimización automática). Referenciar con ruta relativa (`./cover.webp`).
- Renderizar siempre con `<SmartImage />`, no `<Image />` directo.

### Iconos
- `astro-icon`. Todo nombre de icono nuevo **debe** agregarse al union `IconName` en `src/types/icons.ts`.

### Estilos
- **No** hardcodear hex: usar `text-primary`, `bg-secondary`, grises estándar.
- Tokens en `global.css`: `--color-primary #2AB3BA`, `--color-secondary #d62942`. Transición global: `.transition-global`.
- Headings con `clamp()`; base `18px`. Reutilizar `Section`, `Button`, `InfoBadge`.

### JS del cliente
- CSS de librerías externas en el **frontmatter**; JS interactivo en `<script>`. Re-inicializar con `astro:page-load` cuando aplique.

## Cómo agregar contenido

### Un curso nuevo
1. Crear `src/content/courses/<slug>/index.mdx`.
2. Frontmatter (validado por `src/content.config.ts`):
   ```yaml
   ---
   title: "Nombre del curso"
   description: "Resumen corto para tarjeta y SEO"
   category: "Recursos Humanos"          # debe existir en el enum del schema
   image: ./cover.webp                    # portada colocada
   details: { totalHours: "48 horas", totalLessons: "24 clases", level: "Nivel avanzado" }
   rating: "4.9"
   reviews: 85
   featured: true
   priceBadge: "PRECIO ACCESIBLE"
   learnings: ["...", "..."]
   modules:
     - { title: "Módulo 1", duration: "4 horas", classesCount: 2 }
   instructors:                           # 2-3 por curso
     - { name: "Ana Pérez", role: "...", avatar: ./instructores/ana.webp, bio: "..." }
   benefits: ["..."]
   includes:
     - { label: "24 clases en vivo", icon: "tabler:device-desktop" }
   tools: ["Power BI", "DAX"]
   ---
   ```
3. El **cuerpo MDX** (debajo del frontmatter) es la sección "Sobre este curso".
4. Colocar `cover.webp` y avatares junto al archivo.

### Un artículo de blog nuevo
1. Crear `src/content/blog/<slug>/index.mdx`.
2. Frontmatter:
   ```yaml
   ---
   title: "..."
   description: "..."                      # meta description
   category: "Productividad"               # enum del schema
   author: "IESL"
   publishDate: 2024-06-12                  # YYYY-MM-DD
   image: ./cover.webp
   includedResource: { label: "Plantilla OKR", icon: "material-symbols:download-rounded", url: "#" }   # opcional
   relatedSlugs: ["liderazgo-colaborativo"]
   draft: false
   ---
   ```
3. El **cuerpo en Markdown/MDX** es el contenido del artículo (estilado con `prose`).

### Una página nueva
Seguir el checklist de `PROJECT_GUIDE.md`: página en `pages/`, tipos en `types/`, datos en `data/`, componentes de sección en `components/<pagina>/`, ensamblar con `<Layout>` + `<Section>`.

## Fuera de alcance / no tocar
- El backend externo `api.ieslinstitute.com/mailer.php` (no vive en este repo).
- Mailing list / lead magnet gating / SEO avanzado del blog (JSON-LD, RSS): iteración futura, no implementar salvo pedido explícito.
