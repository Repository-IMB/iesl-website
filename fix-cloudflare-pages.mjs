import fs from 'node:fs';

// Astro v14 con @astrojs/cloudflare genera un puntero de redirección en .wrangler/deploy/config.json
// que le dice a Cloudflare que lea la configuración generada en dist/server/wrangler.json.
// Esto rompe Cloudflare Pages porque ese archivo autogenerado contiene "ASSETS" (una palabra reservada en Pages).
// La solución más limpia es eliminar este puntero de redirección después del build. 
// Al hacerlo, Cloudflare Pages usará el wrangler.json de la raíz, que es completamente válido para Pages.

const badRedirect = '.wrangler/deploy/config.json';
if (fs.existsSync(badRedirect)) {
  fs.rmSync(badRedirect, { force: true });
  console.log('✔ Eliminado el puntero .wrangler/deploy/config.json generado por Astro v14 para evitar fallos en Cloudflare Pages.');
} else {
  console.log('⚠ No se encontró el puntero de redirección de Astro.');
}
