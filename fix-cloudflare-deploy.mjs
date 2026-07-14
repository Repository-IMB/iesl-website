import fs from 'node:fs';

const wranglerPath = 'dist/server/wrangler.json';

if (fs.existsSync(wranglerPath)) {
  const data = JSON.parse(fs.readFileSync(wranglerPath, 'utf8'));
  
  // Cloudflare Pages inyecta el binding ASSETS automáticamente.
  // Declararlo explícitamente en el wrangler.json causa un error de validación 
  // ("ASSETS is reserved"). Lo eliminamos de la configuración generada.
  if (data.assets) {
    delete data.assets;
  }
  
  // Astro inyecta por defecto un KV namespace "SESSION" para manejo de sesiones.
  // Como no usamos sesiones de Astro y Cloudflare Pages exige que tengan un "id",
  // lo eliminamos para evitar errores de validación.
  if (data.kv_namespaces) {
    delete data.kv_namespaces;
  }
  
  fs.writeFileSync(wranglerPath, JSON.stringify(data, null, 2));
  console.log('✔ dist/server/wrangler.json parcheado para Cloudflare Pages');
} else {
  console.log('⚠ dist/server/wrangler.json no encontrado, omitiendo parcheo');
}
