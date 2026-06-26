// Resalta términos clave dentro de los temas/aprendizajes de los cursos para que
// el contenido "se note interesante": acrónimos de métricas, IA, herramientas y
// metodologías. Devuelve HTML (escapado) listo para usar con `set:html`.
//
// Para agregar un término nuevo, súmalo a la lista. El regex prioriza las
// coincidencias más largas (p. ej. "Power BI Copilot" antes que "Copilot") y solo
// matchea palabras completas, respetando mayúsculas/minúsculas tal cual aquí.

const HIGHLIGHT_TERMS = [
  // Inteligencia Artificial
  "Power BI Copilot",
  "Inteligencia Artificial",
  "IA Generativa",
  "AI Generativa",
  "Copilot",
  "IA",
  "AI",
  // Métricas / KPIs
  "MTBF",
  "MTTR",
  "MTTF",
  "OEE",
  "KPIs",
  "KPI",
  "confiabilidad",
  "disponibilidad",
  // Herramientas / técnicas
  "DAX",
  "Power Query",
  "SAP PM",
  "CMMS",
  "mantenimiento predictivo",
  "análisis predictivo",
  "predictivo",
  "geolocalización",
  "tiempo real",
  // Producto / priorización (otros cursos)
  "Product-Market Fit",
  "PMF",
  "OKRs",
  "OKR",
  "RICE",
  "MoSCoW",
  "MCPs",
  "MCP",
] as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PATTERN = new RegExp(
  `(?<![\\p{L}\\p{N}])(${[...HIGHLIGHT_TERMS]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|")})(?![\\p{L}\\p{N}])`,
  "gu"
);

/** Envuelve los términos clave en un <span> resaltado. El texto se escapa primero. */
export function highlightTerms(text: string): string {
  return escapeHtml(text).replace(
    PATTERN,
    '<span class="font-semibold text-primary">$1</span>'
  );
}
