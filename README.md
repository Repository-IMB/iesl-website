# IESL Institute — Sitio Web

Repositorio del sitio web de **IESL Institute**, una academia educativa enfocada en el crecimiento profesional mediante tecnología, inteligencia artificial y bienestar humano integral.

---

## Tecnologías

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Astro | `^7.0.9` |
| Adapter de despliegue | @astrojs/cloudflare | `^14.x` |
| Estilos | Tailwind CSS v4 (vía plugin Vite) | `^4.2.2` |
| Contenido | Astro Content Collections (MDX) | — |
| Iconos | astro-icon (Iconify) | `^1.x` |
| Fuentes | Inter + Poppins (via astro:assets Font) | — |
| Carruseles | Swiper.js | `^12.x` |
| Teléfono internacional | intl-tel-input | `^26.x` |
| Almacenamiento de archivos | Cloudflare R2 | — |
| Infraestructura de despliegue | Cloudflare Workers | — |
| Runtime mínimo | Node.js | `>=22.12.0` |
| Gestión de Workers | Wrangler | `^4.x` |

---

## Arquitectura del proyecto

El sitio opera en modo **híbrido**: la mayoría de páginas son generadas de forma estática en build time, pero las rutas del panel de administración y la API se ejecutan como Cloudflare Workers en tiempo de petición (SSR).

```
/
├── public/                   # Archivos servidos en la raíz (favicon, robots.txt, _headers)
├── src/
│   ├── assets/               # Imágenes locales (.webp) optimizadas en build
│   ├── components/
│   │   ├── analytics/        # Google Tag Manager, CookieBanner
│   │   ├── layout/           # Header y Footer del sitio
│   │   ├── shared/           # Componentes reutilizables entre varias páginas
│   │   ├── ui/               # Primitivos del sistema de diseño: Button, Input, Section,
│   │   │                     #   SmartImage, CourseCard, InfoBadge, etc.
│   │   └── [pagina]/         # Componentes propios de cada página (home/, cursos/, etc.)
│   ├── constants/            # Constantes globales (URLs, datos de contacto, SEO base)
│   ├── content/
│   │   ├── courses/          # Un directorio por curso con index.mdx + imágenes colocadas
│   │   └── blog/             # Un directorio por artículo con index.mdx + imágenes colocadas
│   ├── content.config.ts     # Schemas Zod para las Content Collections (courses, blog)
│   ├── data/                 # Datos estáticos de cada página (textos, FAQs, beneficios)
│   ├── layouts/
│   │   └── Layout.astro      # Layout base con SEO, Open Graph, fuentes y Analytics
│   ├── lib/                  # Utilidades del servidor
│   │   ├── auth.ts           # Validación del token Bearer para rutas API
│   │   ├── highlightTerms.ts # Resaltado de términos en búsqueda
│   │   ├── truncate.ts       # Truncado de texto
│   │   └── rehype-prompt-placeholders.mjs  # Plugin MDX para bloques de código interactivos
│   ├── pages/
│   │   ├── index.astro               # Inicio
│   │   ├── cursos/                   # Listado y páginas individuales de cursos
│   │   ├── recursos/                 # Blog / Recursos
│   │   ├── comunidad.astro           # Página de comunidad
│   │   ├── nosotros.astro            # Página institucional
│   │   ├── beneficios.astro          # Beneficios
│   │   ├── ficha-de-matricula.astro  # Formulario de matrícula
│   │   ├── politica-de-privacidad.astro
│   │   ├── 404.astro
│   │   ├── gestor-archivos.astro     # Panel de administración de R2 (SSR, acceso restringido)
│   │   └── api/
│   │       ├── files.ts              # GET: listar y descargar archivos de R2
│   │       └── upload.ts             # POST: subir archivos a R2
│   ├── styles/
│   │   └── global.css        # Tokens de diseño (colores, fuentes, utilidades base)
│   └── types/
│       ├── icons.ts           # Union type IconName — todos los iconos permitidos
│       └── *.type.ts          # Tipos TypeScript por sección/página
├── wrangler.jsonc             # Configuración de Cloudflare Workers y bindings R2
├── astro.config.mjs           # Configuración de Astro, integraciones y adapter
├── AGENTS.md                  # Guía operativa para agentes de código (leer antes de trabajar)
├── PROJECT_GUIDE.md           # Guía de arquitectura detallada para desarrolladores
└── STYLE-GUIDE.md             # Guía de estilos y sistema de diseño
```

---

## Configuración del entorno local

### Requisitos previos

- Node.js `>=22.12.0`
- npm
- Cuenta en Cloudflare (solo necesaria para deploy)

### Instalación

```bash
npm install
```

### Variables de entorno locales

Crear un archivo `.dev.vars` en la raíz del proyecto (no se sube al repositorio):

```
SECRET_ACCESS_TOKEN=tu-clave-secreta-para-el-gestor
```

Esta variable autentica las rutas de la API del gestor de archivos. En producción se configura como un Wrangler secret.

### Desarrollo local

```bash
npm run dev
```

El servidor arranca en `http://localhost:4321`. Las rutas SSR (`/api/*` y `/gestor-archivos`) se simulan mediante Wrangler's miniflare.

---

## Comandos

| Comando | Accion |
|---|---|
| `npm install` | Instala dependencias |
| `npm run dev` | Servidor de desarrollo en `localhost:4321` |
| `npm run build` | Build hibrido a `/dist` (valida schemas Zod de las collections) |
| `npm run preview` | Previsualiza `/dist` localmente |
| `npx astro check` | Verificacion de tipos TypeScript en archivos `.astro` |
| `npm run generate-types` | Regenera `worker-configuration.d.ts` con los tipos de los bindings de Cloudflare |

---

## Sistema de contenido

El contenido de cursos y articulos del blog se gestiona mediante **Astro Content Collections** con validacion Zod. Cada pieza de contenido vive en su propio directorio junto a sus imagenes.

### Cursos (`src/content/courses/<slug>/index.mdx`)

Categorias disponibles: `Tecnologia`, `Marketing`, `Idiomas`, `Diseno`, `Data`, `Productividad`, `Negocios`, `Habilidades blandas`, `Finanzas`, `Creatividad`, `Recursos Humanos`, `Mantenimiento`.

Niveles disponibles: `Nivel inicial`, `Nivel intermedio`, `Nivel avanzado`.

### Blog (`src/content/blog/<slug>/index.mdx`)

Categorias disponibles: `Productividad`, `Liderazgo`, `Desarrollo profesional`, `Crecimiento profesional`, `Networking`.

Siempre validar nuevo contenido con `npm run build` antes de hacer commit. Un campo faltante o una categoria incorrecta fallan el build inmediatamente.

---

## Gestor de archivos (panel de administracion)

El proyecto incluye un panel interno para gestionar archivos en Cloudflare R2, accesible en `/gestor-archivos`.

- Acceso restringido al dominio `gestor.ieslinstitute.com` (y `localhost` en desarrollo).
- Autenticacion mediante token Bearer almacenado en `localStorage`. El token debe coincidir con `SECRET_ACCESS_TOKEN`.
- Funciones disponibles: listar archivos, subir archivos (drag-and-drop o selector), descargar archivos.

### Entornos del bucket R2

| Entorno | Bucket usado | Almacenamiento |
|---|---|---|
| `npm run dev` (local) | `ieslinstitute-preview` | `.wrangler/state/v3/r2/` en disco local |
| Produccion (Cloudflare) | `ieslinstitute` | Cloudflare datacenter |

Los archivos subidos en desarrollo local no aparecen en el dashboard de Cloudflare y viceversa. Son entornos completamente independientes.

---

## Sistema de diseno

Los tokens de diseno se definen en `src/styles/global.css` mediante la directiva `@theme` de Tailwind v4:

| Token | Valor | Uso |
|---|---|---|
| `--color-primary` | `#2AB3BA` | Color principal de la marca |
| `--color-secondary` | `#d62942` | Color de acento |
| `font-family: Poppins` | headings | Titulos (`h1`–`h6`) |
| `font-family: Inter` | body | Texto de cuerpo |
| `font-size` base | `18px` | Tamano raiz del sitio publico |

Los primitivos de UI reutilizables estan en `src/components/ui/`: `Button`, `Input`, `Section`, `SmartImage`, `InfoBadge`, `CourseCard`, entre otros.

---

## Despliegue

El proyecto se despliega en Cloudflare Pages / Workers mediante el adapter `@astrojs/cloudflare`. El build genera un bundle hibrido donde las paginas estaticas se sirven como assets y las rutas SSR se ejecutan como Workers.

El backend de formularios de contacto (`api.ieslinstitute.com/mailer.php`) es externo a este repositorio y no requiere configuracion adicional.

---

## Documentacion interna

| Archivo | Contenido |
|---|---|
| `AGENTS.md` | Guia operativa para agentes de IA y herramientas de codigo. Leer antes de trabajar en el proyecto. |
| `PROJECT_GUIDE.md` | Guia de arquitectura detallada para desarrolladores humanos. |
| `STYLE-GUIDE.md` | Guia del sistema de diseno, tokens, componentes y convenciones visuales. |
