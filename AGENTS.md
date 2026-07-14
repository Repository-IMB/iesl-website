# AGENTS.md — IESL Institute

Guía operativa canónica para agentes de código (Antigravity, Claude Code, etc.). Para detalle humano ver `PROJECT_GUIDE.md` y `STYLE-GUIDE.md`.

## Stack
- **Astro 7** (`^7.0.9`), modo **híbrido**: la mayoría de páginas son estáticas (`prerender = true` por defecto), pero las rutas `/api/*` y `/gestor-archivos` son SSR (`prerender = false`) ejecutadas en Cloudflare Workers.
- **Adapter:** `@astrojs/cloudflare` (`^14.x`). Opciones relevantes: `imageService: 'passthrough'`, `prerenderEnvironment: 'node'`.
- **Tailwind CSS v4** vía plugin de Vite (`@tailwindcss/vite`). Importar con `@import "tailwindcss"` + `@theme inline` en `src/styles/global.css`. Tipografía de artículos con `@tailwindcss/typography` (clase `prose`).
- **Contenido** (cursos y blog) en **Content Collections** (`src/content/`) usando **MDX**, definidas en `src/content.config.ts`.
- **Iconos:** `astro-icon` (Iconify). Fuentes: Poppins (headings) + Inter (body) vía `astro:assets` / `Font`.
- **Imágenes:** `<SmartImage />` (wrapper de `astro:assets` con fallback a `placeholder.webp`). **No usar en páginas SSR** (ver limitaciones Cloudflare más abajo).
- **Interactividad:** Vanilla JS en `<script>`; Swiper para carruseles. Backend externo de formularios: `https://api.ieslinstitute.com/mailer.php`.
- **Almacenamiento:** Cloudflare R2 (`binding: MI_BUCKET_R2`, bucket: `ieslinstitute`).
- **Autenticación de API:** token Bearer leído desde variable de entorno `SECRET_ACCESS_TOKEN` (en `.dev.vars` local, en Wrangler secrets en producción).
- **Node.js mínimo:** `>=22.12.0`. Wrangler: `^4.x`.

## Comandos
| Comando | Acción |
|---|---|
| `npm install` | Instala dependencias |
| `npm run dev` | Servidor local en `localhost:4321` (usa `.dev.vars` para secrets) |
| `npm run build` | Build híbrido a `/dist` (corre validación Zod de las collections) |
| `npm run preview` | Previsualiza `/dist` |
| `npx astro check` | Chequeo de tipos |
| `npm run generate-types` | Regenera `worker-configuration.d.ts` con tipos de bindings Cloudflare |

## Estructura y convenciones

### Páginas públicas (estáticas)
- **Organización 1:1:** `src/pages/[x].astro` ↔ `src/components/[x]/` ↔ `src/data/[x].data.ts` ↔ `src/types/[x].type.ts`.
- **Patrón Datos → Props → Componentes.** Los datos **nunca** se definen inline en componentes; se importan de `src/data/` o se leen de `src/content/`.
- **Primitivos reutilizables** en `src/components/ui/` (`Section`, `Button`, `InfoBadge`, `SmartImage`, `*Card`...). Reutilizar siempre en vez de recrear DOM.
- **Contenido dinámico** (cursos, artículos) vive en `src/content/` y se lee con `getCollection()` / `render()`.

### Páginas y rutas SSR (Cloudflare Workers)
- Declarar `export const prerender = false;` al inicio del archivo.
- **No usar `Layout.astro`** en páginas SSR: el Layout importa `getImage()` y `Font` de `astro:assets`, que requieren APIs de Node.js no disponibles en el runtime `workerd` de Cloudflare → crash de "Network connection lost".
- **No importar `global.css` directamente** en páginas SSR: causa que Vite intente compilar Tailwind dos veces y satura la memoria de Node.js.
- **Alternativa para estilos en SSR:** usar Tailwind CSS v4 vía CDN (`https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4`) con `<style type="text/tailwindcss">` para variables del tema.
- Leer secrets y bindings con `import { env } from "cloudflare:workers"`.

### Gestor de archivos (admin interno)
- Ruta: `/gestor-archivos` → `src/pages/gestor-archivos.astro`.
- Página SSR standalone (sin Layout). Usa Tailwind CDN + fuentes Google Fonts (Inter + Poppins).
- Autenticación: el usuario ingresa un token en el browser; el JS lo guarda en `localStorage` y lo envía como `Authorization: Bearer <token>` en cada petición a la API.
- Acceso restringido por hostname: solo `gestor.ieslinstitute.com`, `localhost` y `127.0.0.1` (o en modo DEV).

### API Routes (`src/pages/api/`)
| Ruta | Método | Descripción |
|---|---|---|
| `/api/files` | GET | Lista objetos del bucket R2. Con `?download=<key>` devuelve el archivo como blob. |
| `/api/upload` | POST | Sube un archivo al bucket R2 con `multipart/form-data`. Guarda el nombre original en `customMetadata.originalName`. |

- Todas las rutas validan el token con `src/lib/auth.ts` (`validateApiToken(request)`).
- El token se lee desde `env.SECRET_ACCESS_TOKEN`. En local se define en `.dev.vars`.

### Entornos de R2 (importante)
| Entorno | Bucket | Dónde vive |
|---|---|---|
| `npm run dev` (local) | `ieslinstitute-preview` | `.wrangler/state/v3/r2/` en disco local |
| Deploy a Cloudflare | `ieslinstitute` | Cloudflare datacenter |

Los archivos subidos en local **no aparecen** en el dashboard de Cloudflare y viceversa. Son buckets independientes.

### Imágenes
- Locales en `src/assets/images/` o **colocadas** junto al `.mdx` de la collection.
- En collections usar el helper `image()` del schema (optimización automática). Referenciar con ruta relativa (`./cover.webp`).
- Renderizar siempre con `<SmartImage />`, no `<Image />` directo.
- **Nunca llamar `getImage()` en contexto SSR (Cloudflare Workers):** solo funciona en build time (Node.js).

### Iconos
- `astro-icon`. Todo nombre de icono nuevo **debe** agregarse al union `IconName` en `src/types/icons.ts`.
- Los iconos de `astro-icon` **no pueden usarse en páginas SSR** (mismo problema que `astro:assets`); usar SVGs inline en su lugar.

### Estilos
- **No** hardcodear hex en páginas públicas: usar `text-primary`, `bg-secondary`, grises estándar de Tailwind.
- Tokens en `global.css`: `--color-primary: #2AB3BA`, `--color-secondary: #d62942`. Transición global: `.transition-global`.
- Headings con `clamp()`; base `18px`. Reutilizar `Section`, `Button`, `InfoBadge`.
- En páginas SSR (sin `global.css`): definir los tokens con `@theme` dentro de `<style type="text/tailwindcss">`.

### JS del cliente
- CSS de librerías externas en el **frontmatter**; JS interactivo en `<script>`. Re-inicializar con `astro:page-load` cuando aplique.
- Usar TypeScript dentro de `<script>` (Astro lo transpila).

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
5. Validar con `npm run build` para que Zod compruebe el schema.

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
4. Validar con `npm run build`.

### Una página nueva (estática)
Seguir el checklist de `PROJECT_GUIDE.md`: página en `pages/`, tipos en `types/`, datos en `data/`, componentes de sección en `components/<pagina>/`, ensamblar con `<Layout>` + `<Section>`.

### Una ruta de API nueva
1. Crear `src/pages/api/<nombre>.ts`.
2. Declarar `export const prerender = false;`.
3. Importar `env` de `cloudflare:workers` para acceder a bindings (R2, KV, etc.).
4. Validar autenticación con `validateApiToken(request)` de `src/lib/auth.ts`.
5. Retornar siempre un `new Response(JSON.stringify({...}), { headers: { "Content-Type": "application/json" } })`.

## Notas para agentes de código
- Tras crear o editar contenido en `src/content/` (cursos o blog), validar con `npm run build`: la validación Zod falla el build si falta un campo obligatorio o una categoría está mal escrita.
- Para cambios de tipos o `.astro`, correr `npx astro check`.
- Respetar el patrón **Datos → Props → Componentes**: nunca poner datos de contenido inline en un componente.
- No agregar dependencias pesadas sin necesidad; el sitio es mayormente estático y liviano a propósito.
- Al crear páginas SSR, recordar las limitaciones del runtime Cloudflare Workers: sin `Layout.astro`, sin `getImage()`, sin `astro-icon`, sin `global.css` directo.

## Fuera de alcance / no tocar
- El backend externo `api.ieslinstitute.com/mailer.php` (no vive en este repo).
- El archivo `worker-configuration.d.ts` es generado automáticamente por `npm run generate-types`; no editar a mano.
- Mailing list / lead magnet gating / SEO avanzado del blog (JSON-LD, RSS): iteración futura, no implementar salvo pedido explícito.
