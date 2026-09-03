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
- **Node.js mínimo:** `>=22.15.0` (Astro 7 importa `registerHooks` de `node:module`). Wrangler: `^4.x`.

## Comandos
| Comando | Acción |
|---|---|
| `npm install` | Instala dependencias |
| `npm run dev` | Servidor local en `localhost:4321` (usa `.dev.vars` para secrets) |
| `npm run build` | Build híbrido a `/dist` (corre validación Zod de las collections) |
| `npm run preview` | Previsualiza `/dist` |
| `npx astro check` | Chequeo de tipos |
| `npm run generate-types` | Regenera `worker-configuration.d.ts` con tipos de bindings Cloudflare |
| `npm run aula:schema` | Crea el esquema del aula en la base D1 **local** |
| `npm run aula:schema:remoto` | Idem en la base D1 de Cloudflare |
| `npm run aula:alta` | Da de alta un alumno del aula (ver Aula virtual) |

**Node:** con una versión menor a 22.15 el dev server muere sin mensaje útil (el error real
queda en `.astro/dev.log`). El repo fija `22.23.2` en `.node-version` para gestores como fnm o
nvm.

## Estructura y convenciones

### Páginas públicas (estáticas)
- **Organización 1:1:** `src/pages/[x].astro` ↔ `src/components/[x]/` ↔ `src/data/[x].data.ts` ↔ `src/types/[x].type.ts`.
- **Patrón Datos → Props → Componentes.** Los datos **nunca** se definen inline en componentes; se importan de `src/data/` o se leen de `src/content/`.
- **Primitivos reutilizables** en `src/components/ui/` (`Section`, `Button`, `InfoBadge`, `SmartImage`, `*Card`...). Reutilizar siempre en vez de recrear DOM.
- **Contenido dinámico** (cursos, artículos) vive en `src/content/` y se lee con `getCollection()` / `render()`.

### Páginas y rutas SSR (Cloudflare Workers)
- Declarar `export const prerender = false;` al inicio del archivo.
- **No usar `Layout.astro`** en páginas SSR: el Layout importa `getImage()` y `Font` de `astro:assets`, que requieren APIs de Node.js no disponibles en el runtime `workerd` de Cloudflare → crash de "Network connection lost".
- **Sí se puede importar `global.css` en páginas SSR.** Verificado bajo `wrangler dev`: el CSS se compila en build y se sirve como hoja de estilos normal (`<link rel="stylesheet">`). Es lo que hace `AulaLayout.astro`. Preferir esto para cualquier página que vea un usuario final: da el Tailwind y los tokens reales del sitio.
- **Tailwind por CDN solo para herramientas internas.** `AdminLayout.astro` (gestor de archivos) lo usa por razones históricas, pero compila el CSS en el navegador: pesa y parpadea al cargar. No replicarlo en páginas de alumnos.
- **El desborde de memoria del dev server no lo causa el CSS.** Lo dispara el optimizador de dependencias de Vite cuando aparece un archivo nuevo en `src/`: el "program reload" que sigue supera el heap por defecto de Node y mata el servidor sin mensaje útil (el error real queda en `.astro/dev.log`). Por eso `npm run dev` pasa por `scripts/dev.mjs`, que sube el heap a 8 GB.
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
- En páginas SSR se importa `global.css` y se usan los mismos tokens que en el resto del sitio (ver `AulaLayout.astro`). Solo el gestor de archivos define tokens con `@theme` dentro de `<style type="text/tailwindcss">`, porque usa Tailwind por CDN.

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

## Aula virtual (`/aula`)

Donde se **dictan** los cursos beneficio, aparte del catálogo de marketing de `/cursos`.
Diseño completo en `docs/specs/aula-virtual-power-bi.md`.

| Ruta | Qué hace |
|---|---|
| `/aula` | Con un solo curso matriculado redirige a él; con varios los lista |
| `/aula/login` | Acceso con correo y contraseña |
| `/aula/[curso]` | Carátula, introducción y temario con el título de cada lección |
| `/aula/[curso]/modulo/[n]` | Un módulo con **todas sus lecciones en la misma página** |
| `/aula/admin` | Panel de administración de alumnos (solo `is_admin`) |
| `POST /api/aula/login` · `logout` | Sesión |
| `POST /api/aula/admin/alumnos` | Crear, editar, cambiar contraseña y eliminar alumnos |

- **Sesiones:** `Astro.session` (API nativa de Astro 7) sobre el KV `SESSION` que configura el
  adapter. No hay manejo manual de cookies ni de KV. `src/lib/aula/auth.ts` solo hace PBKDF2.
- **Datos:** D1 `DB_AULA`, tablas `students` y `enrollments` (`db/aula-schema.sql`).
  `enrollments` decide qué curso ve cada alumno.
- **Protección:** `src/middleware.ts`. Solo lee la sesión bajo `/aula`; fuera de ahí no toca
  nada, porque leerla implica tocar las cabeceras del request y eso emite un warning en cada
  build de las páginas prerenderizadas.
- **Contenido:** collections `aulaCursos` (`src/content/aula/*/index.mdx`) y `aulaModulos`
  (`src/content/aula/*/modulos/*.mdx`). El cuerpo MDX del curso es la introducción; el de cada
  módulo, su presentación. Las lecciones van en el frontmatter del módulo.
- **Videos:** `videoUrl` por lección, opcional. Vacío muestra "video pendiente de publicación".
  Se cargan editando el MDX, sin tocar código.
- **Administración:** `/aula/admin` usa **el mismo login que los alumnos**; lo que habilita el
  panel es la columna `is_admin` de la cuenta, no un acceso aparte. Desde ahí se crean alumnos,
  se elige a qué cursos acceden, se cambian contraseñas, se activan/desactivan y se eliminan.
  Un admin entra directo al panel al autenticarse.
- **El rol admin solo se asigna por CLI**, a propósito: así ningún clic en el panel puede dejar
  al aula sin administradores. El panel además impide que un admin se elimine a sí mismo o se
  desactive siendo el último activo.
- **Doble control en las rutas de admin:** el middleware filtra por el `is_admin` de la sesión
  (barato), y después la página y la API lo confirman contra D1 con `requireAdmin()`. La sesión
  puede haber quedado obsoleta si a alguien le revocaron el rol.
- **Alta por CLI:**
  ```
  npm run aula:alta -- --email ana@empresa.com --pass Clave123 --nombre Ana Perez --curso power-bi-fundamentos
  npm run aula:alta -- --email admin@iesl.com --pass ClaveSegura1 --nombre Equipo IESL --admin
  ```
  Escribe en la base local; agregar `--remoto` para la de Cloudflare.
- **Cambiar el `database_id` resetea la base D1 local.** Miniflare indexa el estado local por
  el id, así que al reemplazarlo queda una base vacía y las rutas del aula empiezan a devolver
  503. Se arregla corriendo de nuevo `npm run aula:schema` y las altas locales; la base vieja
  queda huérfana en `.wrangler/state/v3/d1/`.
- **Sin progreso ni exámenes todavía:** la estructura está preparada, pero no implementados.
- **Un curso nuevo del aula:** crear `src/content/aula/<slug>/index.mdx` + `cover.webp` +
  `modulos/<n>-<slug>.mdx`, y matricular alumnos con `--curso <slug>`. No hace falta tocar
  código.

## Fuera de alcance / no tocar
- El backend externo `api.ieslinstitute.com/mailer.php` (no vive en este repo).
- El archivo `worker-configuration.d.ts` es generado automáticamente por `npm run generate-types`; no editar a mano.
- Mailing list / lead magnet gating / SEO avanzado del blog (JSON-LD, RSS): iteración futura, no implementar salvo pedido explícito.
