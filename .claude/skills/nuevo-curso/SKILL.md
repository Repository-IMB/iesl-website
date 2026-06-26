---
name: nuevo-curso
description: Crea un curso nuevo en la Content Collection `courses` (MDX) de IESL a partir de un brief, temario o perfil de docente. Genera el frontmatter validado por Zod (objetivos, módulos, instructores, includes, tools) y el cuerpo "Sobre este curso", y valida con npm run build. Úsala cuando el usuario diga "agregá este curso", "crea el curso X", "nuevo producto/programa", o entregue un temario + datos del docente.
---

# Crear un curso nuevo (IESL Institute)

Eres editor de contenido del sitio de **IESL Institute** (Astro 6 + Content Collections, 100% estático). Tu tarea es convertir lo que pase el usuario (brief, temario, perfil de LinkedIn del docente, plantilla de programa) en un **curso** dentro de la collection `courses`, siguiendo el schema y las convenciones del proyecto.

## Antes de empezar (siempre)
1. Lee `src/content.config.ts` para confirmar el **schema vigente** de `courses`. El schema manda: si cambió, respétalo sobre estas instrucciones.
2. Mira un curso existente como referencia de estilo y formato: `src/content/courses/*/index.mdx` (p. ej. `power-bi-ia-finanzas`). Imita su estructura, no reinventes.

## Qué tienes que producir
Un archivo nuevo: `src/content/courses/<slug>/index.mdx`, donde `<slug>` es kebab-case, corto, en inglés o español sin acentos ni símbolos (ej. `ai-product-manager`, `people-analytics-power-bi`).

### Frontmatter (validado por Zod — debe pasar `npm run build`)
```yaml
---
title: "Nombre del curso"
description: "Resumen corto para tarjeta y SEO (1 frase)."
category: "..."                      # EXACTAMENTE una del enum (ver abajo)
image: ../../../assets/images/placeholder.webp   # ver regla de imágenes
details:
  totalHours: "72 horas"
  totalLessons: "48 sesiones"        # "clases" o "sesiones", lo que use el brief
  level: "Nivel avanzado"            # uno del enum de niveles
rating: "5.0"                        # string; "5.0" si es nuevo
reviews: 92                          # OPCIONAL: omítelo en cursos nuevos sin reseñas
featured: true
priceBadge: "100% EN VIVO"           # OPCIONAL: badge naranja del sidebar
learnings:                           # OBJETIVOS generales (3-4). Ver nota abajo.
  - "..."
modules:                             # un objeto por módulo
  - title: "Nombre del módulo"       # SIN prefijo "Módulo N:"; la numeración la pone el componente
    duration: "18 horas"
    classesCount: 12
    topics:
      - "..."
instructors:                         # 1-3 por curso
  - name: "Nombre Apellido"
    role: "Cargo actual en Empresa"
    avatar: ../../../assets/images/placeholder.webp   # ver regla de imágenes
    bio: >-
      Biografía en 2-4 frases. La PRIMERA frase debe funcionar sola como
      resumen (≤ 100 caracteres): el carrusel "Equipo docente" del home la
      trunca a ese límite con `truncateText` (src/lib/truncate.ts).
benefits:                            # 3-4 bullets cortos del sidebar
  - "..."
includes:                            # 4 ítems "Este curso incluye" (clases, horas, certificado, recursos)
  - label: "48 sesiones en vivo"
    icon: "tabler:device-desktop"
  - label: "72 horas de contenido"
    icon: "mdi:clock-outline"
  - label: "Certificado: <Nombre del curso>"
    icon: "tabler:school"
  - label: "Recursos descargables"
    icon: "tabler:file-invoice"
tools:
  - "..."
---
```

### Enums permitidos (NO inventes valores — el build falla si no coinciden)
- **`category`** (una sola): `Tecnología`, `Marketing`, `Idiomas`, `Diseño`, `Data`, `Productividad`, `Negocios`, `Habilidades blandas`, `Finanzas`, `Creatividad`, `Recursos Humanos`, `Mantenimiento`. Verifica siempre la lista actual en `src/content.config.ts` (`COURSE_CATEGORIES`).
- **`details.level`**: `Nivel inicial`, `Nivel intermedio`, `Nivel avanzado`.

### Cuerpo (debajo del frontmatter)
Es la sección **"Sobre este curso"**. 1-3 párrafos en prosa que enmarquen el programa: qué construye/logra el alumno, modalidad (en vivo, etc.) y el resultado final/capstone. **No** vuelques el temario en bruto: los temas ya van en `modules[].topics`.

## Cómo mapear el material del usuario
- **Objetivos (`learnings`)**: si el brief trae objetivos por módulo, sintetiza 3-4 objetivos **generales** del programa (uno por módulo o por gran resultado). No copies frases sueltas: redáctalos como "Construir…", "Validar…", "Automatizar…".
- **Módulos**: un objeto por módulo. El `title` va **sin** "Módulo N:" (lo numera el componente). Calcula `duration`/`classesCount` desde el brief (p. ej. 12 sesiones × 1.5 h = "18 horas", `classesCount: 12`). Si el módulo tiene workshop/entregable, agrégalo como un `topic` final.
- **Instructores**: arma `role` (cargo actual) y una `bio` en español a partir del perfil que te den (trayectoria, estudios, logros). No inventes datos que no estén en el material. **Límite de texto:** la card "Equipo docente" del home trunca la bio a **100 caracteres** (`DOCENTE_BIO_MAX` en `src/lib/truncate.ts`), así que redacta la **primera frase como un resumen autónomo** dentro de ese límite; el resto de la bio se ve completo en la página de detalle del curso.
- **`includes`**: 4 ítems. Reutiliza los iconos del curso de referencia (`tabler:device-desktop`, `mdi:clock-outline`, `tabler:school`, `tabler:file-invoice`) salvo que tengas mejores. Uno debe ser el `Certificado: <título>`.
- **`tools`**: lista las herramientas reales del brief.

## Imágenes (portada + avatares)
- Locales en `src/assets/images/` o **colocadas** junto al `index.mdx`.
- Si **no** te dan imagen real, usa `../../../assets/images/placeholder.webp` y deja un comentario indicando cómo reemplazarla:
  ```yaml
  # Portada provisional: colocar cover.webp junto a este index.mdx y cambiar
  # image a: ./cover.webp (recomendado 1200x800 px).
  image: ../../../assets/images/placeholder.webp
  ```
- Para el avatar del docente, mismo patrón (`./avatar.webp`, cuadrada 400x400).
- En el resumen final, lista siempre estos placeholders como pendientes para el usuario.

## Reglas de seguridad MDX (CRÍTICAS — rompen el build si se ignoran)
- Fuera de fences, `<` y `>` se parsean como JSX. Cualquier `<algo>` en prosa va entre backticks o en un fence.
- No metas componentes ni imports salvo que el contenido lo pida; el cuerpo suele ser prosa simple.

## Verificación (OBLIGATORIA antes de terminar)
1. Ejecuta `npm run build`. Debe completar sin errores (valida el frontmatter con Zod y parsea el MDX). Es la forma más rápida de confirmar que el contenido es correcto.
2. Si falla, lee el error y corrígelo (categoría/nivel inválido, falta un campo obligatorio, `<...>` sin escapar, imagen inexistente) y reconstruye.
3. Confirma que se generó `dist/cursos/<slug>/index.html`.

## Salida final al usuario
- Resume qué creaste y la ruta del archivo (como link markdown).
- Lista los **pendientes** que requieren archivos reales (portada del curso, foto del docente) con la instrucción exacta para reemplazarlos.
- Señala cualquier decisión que tomaste (categoría elegida, `reviews` omitido, etc.) por si quiere ajustarla.
