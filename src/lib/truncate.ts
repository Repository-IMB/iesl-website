// Trunca texto a un máximo de caracteres para tarjetas con descripciones de
// longitud variable (ej. el carrusel "Equipo docente" del home). Limpia el HTML
// que puedan traer las bios (p. ej. <strong>) y corta en límite de palabra para
// no partir palabras. Reutilizable: no dupliques esta lógica en componentes.

/** Límite de caracteres de la bio del docente en la tarjeta del home. */
export const DOCENTE_BIO_MAX = 100;

// Las bios se autoran con HTML ligero (<strong>) y entidades (&amp;). Al pasar a
// texto plano hay que decodificar las entidades o se verían dobles (&amp;amp;).
// &amp; va al final para no re-decodificar entidades ya resueltas.
const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&amp;": "&",
};

function decodeEntities(input: string): string {
  let out = input;
  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    out = out.split(entity).join(char);
  }
  return out;
}

/** Quita etiquetas HTML, decodifica entidades y colapsa espacios en blanco. */
function stripHtml(input: string): string {
  const noTags = input.replace(/<[^>]*>/g, "");
  return decodeEntities(noTags).replace(/\s+/g, " ").trim();
}

/**
 * Devuelve el texto (sin HTML) recortado a `max` caracteres como máximo. Corta en
 * el último espacio para no partir palabras y agrega "…" solo si hubo recorte.
 */
export function truncateText(text: string, max: number = DOCENTE_BIO_MAX): string {
  const clean = stripHtml(text);
  if (clean.length <= max) return clean;

  const slice = clean.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.replace(/[.,;:\s]+$/, "")}…`;
}
