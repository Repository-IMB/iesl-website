import fs from 'fs';
const p = 'dist/server/wrangler.json';
if (fs.existsSync(p)) {
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  const kvId = 'cbec1b6e72a545348613dc7fb10d1785';
  if (d.kv_namespaces && d.kv_namespaces.length > 0) {
    d.kv_namespaces[0].id = kvId;
  }
  if (d.previews && d.previews.kv_namespaces && d.previews.kv_namespaces.length > 0) {
    d.previews.kv_namespaces[0].id = kvId;
  }
  fs.writeFileSync(p, JSON.stringify(d, null, 2));
  console.log('✅ Injected KV ID into dist/server/wrangler.json to fix Code 10014');
}
