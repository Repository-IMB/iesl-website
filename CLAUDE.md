# CLAUDE.md

La guía canónica para trabajar en este repositorio está en AGENTS.md:

@AGENTS.md

## Notas específicas de Claude Code
- Tras crear o editar contenido en `src/content/` (cursos o blog), valida con `npm run build`: la validación Zod de las collections falla el build si falta un campo obligatorio o una categoría está mal escrita. Es la forma más rápida de confirmar que el contenido es correcto.
- Para cambios de tipos o `.astro`, corre `npx astro check`.
- Respeta el patrón **Datos → Props → Componentes**: nunca pongas datos de contenido inline en un componente.
- No agregues dependencias pesadas sin necesidad; el sitio es estático y liviano a propósito.
