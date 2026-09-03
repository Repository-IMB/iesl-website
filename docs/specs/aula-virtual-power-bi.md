# Aula virtual — Microcurso Power BI

Fecha: 2026-09-02

## Problema

IESL Institute tiene un sitio de marketing con catálogo de cursos, pero no tiene dónde
**dictar** un curso. El microcurso asincrónico "Power BI: Fundamentos y Desarrollo de
Dashboards" (curso beneficio para miembros) necesita un aula: acceso con credenciales,
carátula con la introducción del curso, y los 6 módulos con sus 33 lecciones.

El proyecto WebExpedikids ya resolvió un problema equivalente (módulo Capacitaciones) y sirve
de referencia de arquitectura: sesiones en KV, datos en D1, PBKDF2 vía Web Crypto, middleware
que protege las rutas, y una página por módulo con todas sus partes en un solo scroll.

## Alcance

**Entra:** login, carátula, introducción del curso, temario con el título de cada lección
visible, y una página por módulo con todas sus lecciones en la misma página.

**No entra en esta entrega:** exámenes, progreso por alumno y entrega de proyecto final con
rúbrica. La estructura queda preparada para sumarlos.

**Agregado después:** panel web de administración de alumnos en `/aula/admin`, con el mismo
login que usan los alumnos (ver "Administración" más abajo).

## Flujo

```
/aula/login  ──login ok──▶  /aula  ──redirige──▶  /aula/power-bi-fundamentos
                                                    │
                                          carátula → introducción → temario
                                                    │
                                                    ▼
                                    /aula/power-bi-fundamentos/modulo/1
                                    (todas las lecciones del módulo 1
                                     en una sola página)
```

## Rutas

Todas SSR (`export const prerender = false`).

| Ruta | Responsabilidad |
|---|---|
| `/aula` | Con sesión redirige al curso matriculado; sin sesión, a `/aula/login` |
| `/aula/login` | Formulario de acceso. Con sesión activa redirige a `/aula` |
| `/aula/[curso]` | Carátula, introducción y temario del curso |
| `/aula/[curso]/modulo/[n]` | Un módulo con todas sus lecciones |
| `/aula/admin` | Panel de administración de alumnos (solo cuentas `is_admin`) |
| `POST /api/aula/login` | Valida credenciales, crea sesión en KV, setea cookie |
| `POST /api/aula/logout` | Destruye la sesión y limpia la cookie |
| `POST /api/aula/admin/alumnos` | Crear, editar, cambiar contraseña y eliminar alumnos |

`/aula/[curso]` es **una sola página** en tres bloques verticales:

1. **Carátula** — portada del curso, título, badge de modalidad, botón de continuar.
2. **Introducción** — lo principal del curso: objetivo del programa, modalidad, cantidad de
   módulos, requisito previo, software, y la distribución del tiempo estimado (contenido
   audiovisual 4–5 h, prácticas 2–3 h, proyecto final 1–2 h, total 8–10 h).
3. **Temario** — los 6 módulos + proyecto final. Cada módulo muestra su número, título,
   duración estimada, cantidad de lecciones, y **la lista de sus lecciones con título visible**.

## Contenido

Dos Content Collections nuevas, ambas bajo `src/content/aula/`:

```
src/content/aula/power-bi-fundamentos/
├── index.mdx        colección `aulaCursos` (patrón */index.mdx)
├── cover.webp
└── modulos/         colección `aulaModulos` (patrón */modulos/*.mdx)
    ├── 1-introduccion-power-bi.mdx
    ├── 2-importacion-transformacion.mdx
    ├── 3-modelado-datos.mdx
    ├── 4-analisis-dax.mdx
    ├── 5-visualizacion-interactividad.mdx
    ├── 6-diseno-dashboards.mdx
    └── 7-proyecto-final.mdx
```

Los dos globs no se solapan, así que pueden convivir en el mismo árbol y el contenido de un
curso queda junto en una carpeta.

### `aulaCursos`

```yaml
title: "Power BI: Fundamentos y Desarrollo de Dashboards"
kind: "Microcurso asincrónico"
description: "..."          # resumen corto
image: ./cover.webp
objective: "..."            # objetivo del programa
modality: "Asincrónica"
requirement: "Conocimientos básicos de computación y manejo de datos en Excel"
software: "Power BI Desktop"
totalModules: 6
totalLessons: 33
duration: { videos: "4–5 h", practice: "2–3 h", project: "1–2 h", total: "8–10 h" }
```

El **cuerpo MDX** es la introducción extendida que se muestra en la carátula.

### `aulaModulos`

```yaml
course: "power-bi-fundamentos"   # slug del curso al que pertenece
number: 1
title: "Introducción a Power BI"
duration: "35–45 min"
isProject: false                 # true solo para el proyecto final
lessons:
  - { code: "1.1", title: "Fundamentos de Business Intelligence",
      topic: "Conceptos de BI, datos e información para la toma de decisiones",
      videoUrl: null }
```

El **cuerpo MDX** es contenido adicional del módulo (opcional).

`videoUrl` es opcional. Cuando falta, la lección muestra un bloque "video pendiente de
publicación" en lugar del reproductor, igual que hace Expedikids. Las URLs se cargan después
editando el MDX, sin tocar código.

**Contenido disponible hoy:** el PDF `recursos/CURSOS BENEFICIO IESL (1).pdf` da el título y
un tema de una línea por lección. Eso es lo que se carga. El desarrollo de cada lección lo
escribe después el equipo académico en el MDX.

## Datos y acceso

### D1 — `db/aula-schema.sql`

```sql
CREATE TABLE students (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,   -- PBKDF2: iteraciones.saltB64.hashB64
  active        INTEGER NOT NULL DEFAULT 1,
  is_admin      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE enrollments (
  student_id  INTEGER NOT NULL REFERENCES students(id),
  course_slug TEXT NOT NULL,
  granted_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (student_id, course_slug)
);
```

`enrollments` decide qué curso ve cada alumno. Es lo que evita que, al sumar el segundo curso
beneficio, todos los alumnos lo vean automáticamente.

Sin tabla de progreso: está fuera del alcance de esta entrega.

### Sesiones

KV (el namespace de sesiones que el adapter ya crea y `inject-kv-id.mjs` parchea). Token
aleatorio como clave, TTL 8 h por defecto y 30 días con "recordarme". Cookie `aula_session`,
`HttpOnly`, `SameSite=Lax`, `Secure` solo sobre HTTPS — en `localhost` el navegador rechaza
cookies `Secure` sobre HTTP.

### Contraseñas

PBKDF2-SHA256, 100 000 iteraciones, salt de 16 bytes, vía Web Crypto (`crypto.subtle`), que
funciona igual en workerd y en Node. Comparación en tiempo constante. Formato almacenado
`iteraciones.saltB64.hashB64`.

Alta de alumnos por script de línea de comandos (`npm run aula:alta`) o desde el panel web.

## Piezas

```
src/middleware.ts                  carga la sesión de KV y protege /aula/*
src/layouts/AulaLayout.astro       layout SSR con global.css real, noindex
src/lib/aula/auth.ts               PBKDF2 + sesiones en KV + cookies
src/lib/aula/db.ts                 consultas a D1
src/lib/aula/content.ts            lectura y ordenamiento de las collections
src/components/aula/               Caratula, IntroduccionCurso, TemarioModulos,
                                   ModuloCard, LeccionSection, VideoSlot, AulaHeader
src/types/aula.type.ts             tipos de la sección
src/content.config.ts              + aulaCursos y aulaModulos
wrangler.jsonc                     + binding D1
db/aula-schema.sql                 esquema
scripts/aula-alta-alumno.mjs       alta de alumnos por CLI
```

### Middleware

El proyecto no tenía middleware. El nuevo debe:

- Tolerar la ausencia de runtime: durante el prerender de las páginas estáticas
  (`prerenderEnvironment: 'node'`) no hay `locals.runtime`, así que todo acceso va con
  optional chaining y `locals.student` queda en `null`.
- Proteger solo el prefijo `/aula`, dejando `/aula/login` fuera. Las demás rutas del sitio
  pasan sin tocarse.

## Estilos

Las páginas SSR **sí pueden** importar `src/styles/global.css`. Verificado bajo workerd
(`wrangler dev`): responde 200 y emite `<link rel="stylesheet">` a un CSS compilado.

El `AGENTS.md` afirma lo contrario. Está desactualizado para el stack actual (Astro 7,
Tailwind 4.2, adapter 14): el desbordamiento de memoria que documenta lo dispara el
optimizador de dependencias de Vite en el **dev server** al agregar archivos nuevos
(`optimized dependencies changed. reloading` → OOM), no el runtime de producción. Se resuelve
subiendo el heap de Node en el script `dev`.

Esto importa porque el aula la usan alumnos: recibe el Tailwind y los tokens reales del sitio
(`--color-primary: #2AB3BA`, Poppins para títulos, Inter para cuerpo) en vez de Tailwind por
CDN como `gestor-archivos.astro`, que compila CSS en el navegador y parpadea al cargar.

`AulaLayout.astro` no usa `Layout.astro` porque ese importa `getImage()` de `astro:assets`,
que sí requiere Node y crashea en workerd. Tampoco usa `astro-icon`: los iconos van como SVG
inline.

Queda por verificar durante la implementación si el componente `<Font>` de `astro:assets`
sobrevive a workerd. Si no, las mismas familias se cargan con un `<link>` a Google Fonts.

## Manejo de errores

| Caso | Respuesta |
|---|---|
| Credenciales incorrectas | Vuelve a `/aula/login?error=1` con mensaje genérico, sin distinguir si el email existe |
| Alumno inactivo (`active = 0`) | Igual que credenciales incorrectas |
| Sesión vencida o inválida | Redirige a `/aula/login` |
| Curso inexistente en la collection | 404 |
| Alumno sin matrícula en ese curso | Redirige a `/aula` |
| Módulo inexistente | Redirige a la carátula del curso |
| D1 no disponible | 503 con mensaje al alumno, error completo en el log del Worker |

## Verificación

- `npm run build` — Zod valida las dos collections nuevas; falla el build si un módulo
  referencia un curso que no existe o si falta un campo obligatorio.
- `npx astro check` — sin errores nuevos sobre los 12 preexistentes.
- `wrangler dev` — recorrido completo bajo workerd: login, carátula, temario, y una página de
  módulo con sus lecciones.
- Comprobar en el navegador que `/aula/*` sin sesión redirige a login y que la portada del
  sitio y las demás rutas públicas siguen respondiendo 200 tras agregar el middleware.
- Verificar el layout a 375, 768 y 1440 px.

## Despliegue

El proyecto usa una **cuenta de Cloudflare distinta** a la de los otros proyectos. Crear la
base D1 y subir el binding requiere el acceso de wrangler de esa cuenta, que el usuario
entrega cuando se le pide. En local no hace falta: `wrangler` guarda el estado de D1 en
`.wrangler/state/` y la base preview es independiente de la nube.


## Administración

`/aula/admin` **no tiene un login aparte**: se entra con las mismas credenciales que usan los
alumnos, y lo que habilita el panel es la columna `is_admin` de la cuenta. Al autenticarse, una
cuenta con ese rol va directo al panel; el encabezado le ofrece pasar al aula y volver.

Qué se puede hacer desde el panel:

- Dar de alta un alumno con correo, nombre, contraseña inicial y los cursos a los que accede.
- Editar correo, nombre y cursos habilitados.
- Activar o desactivar la cuenta. Una cuenta inactiva no puede iniciar sesión.
- Cambiar la contraseña de cualquier alumno.
- Eliminar un alumno, junto con sus matrículas.

### Decisiones

**El rol admin solo se asigna por CLI** (`npm run aula:alta -- --admin`). Deliberado: si el
panel pudiera quitar el rol, un clic podría dejar al aula sin administradores y sin forma de
recuperarse por la web. Por la misma razón el panel impide que un admin elimine su propia
cuenta o se desactive siendo el último activo.

**Doble control de permisos.** El middleware filtra con el `is_admin` de la sesión, que es una
comprobación barata en memoria. Después, la página y la ruta de API vuelven a confirmarlo
contra D1 con `requireAdmin()`, que además exige `active = 1`. La sesión es una copia del
estado al momento de iniciarla: si a alguien le revocan el rol, su sesión seguiría diciendo que
es admin hasta que venza.

**Formularios HTML, sin API JSON.** Las acciones son POST de formulario con un campo `accion`,
y responden `303` de vuelta al panel con el resultado en la query string. Funcionan sin
JavaScript, igual que el login. El único JS del panel es la confirmación antes de eliminar.

### Manejo de errores

| Caso | Respuesta |
|---|---|
| Correo con formato inválido | Vuelve al panel con el error |
| Contraseña de menos de 8 caracteres | Vuelve al panel con el error |
| Correo ya usado por otra cuenta | Vuelve al panel con el error |
| Slug de curso inexistente | Se descarta en silencio; el resto de la operación sigue |
| Admin intentando eliminarse | Se rechaza |
| Admin intentando desactivarse siendo el último activo | Se rechaza |
| Alumno sin rol admin sobre `/aula/admin` | Redirige a `/aula` |
| Alumno sin rol admin sobre la API de admin | `403` |
| Sin sesión sobre la API de admin | `401` |
| D1 no disponible | `503`, con el error completo en el log del Worker |
