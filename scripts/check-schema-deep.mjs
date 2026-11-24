import fs from 'fs';
import path from 'path';

function walk(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) res.push(...walk(full));
    else if (f.endsWith('.html')) res.push(full);
  }
  return res;
}

const htmlFiles = walk('docs/.vitepress/dist');
let schemaTypes = {};
let sampleSchemas = [];
let mismatchChecks = [];

for (const file of htmlFiles) {
  const rel = path.relative('docs/.vitepress/dist', file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');
  const jsonLdMatches = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis)];
  for (const jm of jsonLdMatches) {
    try {
      const obj = JSON.parse(jm[1]);
      const type = obj['@type'] || (Array.isArray(obj['@graph']) ? 'Graph' : 'Unknown');
      schemaTypes[type] = (schemaTypes[type] || 0) + 1;
      if (sampleSchemas.length < 5) sampleSchemas.push({ rel, type, obj });

      // Check if schema headline/name exists in visible HTML
      if (obj.headline && !html.includes(obj.headline)) {
        mismatchChecks.push({ rel, field: 'headline', val: obj.headline });
      }
      if (obj.name && typeof obj.name === 'string' && !html.includes(obj.name)) {
        mismatchChecks.push({ rel, field: 'name', val: obj.name });
      }
    } catch (e) {
      console.error('JSON parse error in', rel, e.message);
    }
  }
}

console.log('Schema Types:', schemaTypes);
console.log('Sample Schemas:', sampleSchemas.slice(0, 3));
console.log('Mismatch count:', mismatchChecks.length);
if (mismatchChecks.length > 0) {
  console.log('Sample mismatches:', mismatchChecks.slice(0, 5));
}
