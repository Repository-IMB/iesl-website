/**
 * rehype-prompt-placeholders
 * ─────────────────────────────────────────────
 * Dentro de los bloques de código (`<pre><code>`), envuelve cada placeholder
 * tipo `[PEGA tu estrategia]` o `[...]` en un <span class="prompt-fill">, para
 * resaltar visualmente lo que el usuario debe completar.
 *
 * Se aplica después del resaltado de sintaxis (Shiki). Para bloques sin lenguaje
 * (plaintext) cada línea es un único nodo de texto, así que el match es fiable.
 */

export default function rehypePromptPlaceholders() {
  return (tree) => walk(tree, false);
}

function walk(node, insidePre) {
  if (!node || typeof node !== "object" || !Array.isArray(node.children)) return;

  const nowInsidePre =
    insidePre || (node.type === "element" && node.tagName === "pre");

  const next = [];
  for (const child of node.children) {
    if (nowInsidePre && child.type === "text") {
      next.push(...splitText(child.value));
    } else {
      walk(child, nowInsidePre);
      next.push(child);
    }
  }
  node.children = next;
}

function splitText(value) {
  const re = /\[[^\]\n]+\]/g;
  const out = [];
  let last = 0;
  let match;

  while ((match = re.exec(value)) !== null) {
    if (match.index > last) {
      out.push({ type: "text", value: value.slice(last, match.index) });
    }
    out.push({
      type: "element",
      tagName: "span",
      properties: { className: ["prompt-fill"] },
      children: [{ type: "text", value: match[0] }],
    });
    last = match.index + match[0].length;
  }

  if (last < value.length) {
    out.push({ type: "text", value: value.slice(last) });
  }

  // Si no hubo ningún match, devolvemos el texto original intacto.
  return out.length ? out : [{ type: "text", value }];
}
