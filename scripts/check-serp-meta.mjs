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
let longTitles = [];
let shortTitles = [];
let longDescs = [];
let shortDescs = [];
let stuffing = [];

for (const file of htmlFiles) {
  const rel = path.relative('docs/.vitepress/dist', file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');
  const tMatch = html.match(/<title>([^<]*)<\/title>/i);
  if (tMatch) {
    const t = tMatch[1].trim();
    if (t.length > 70) longTitles.push({ rel, len: t.length, t });
    if (t.length < 15 && rel !== '404.html') shortTitles.push({ rel, len: t.length, t });

    // Check keyword stuffing: if any word or brand name appears > 3 times in title
    const words = t.split(/[\s,_\-—|:：/]+/);
    const freq = {};
    for (const w of words) {
      if (w.length >= 2) freq[w] = (freq[w] || 0) + 1;
    }
    const stuffed = Object.entries(freq).filter(([w, c]) => c >= 3);
    if (stuffed.length > 0) stuffing.push({ rel, t, stuffed });
  }

  const dMatch = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)
              || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i);
  if (dMatch) {
    const d = dMatch[1].trim();
    if (d.length > 200) longDescs.push({ rel, len: d.length, d });
    if (d.length < 50 && rel !== '404.html') shortDescs.push({ rel, len: d.length, d });
  }
}

console.log('Total pages checked:', htmlFiles.length);
console.log('Long titles (>70 chars):', longTitles.length);
if (longTitles.length > 0) console.log('Sample long title:', longTitles[0]);
console.log('Short titles (<15 chars):', shortTitles.length);
console.log('Keyword stuffing in titles (word >= 3 times):', stuffing.length);
if (stuffing.length > 0) console.log('Stuffing sample:', stuffing[0]);
console.log('Long descriptions (>200 chars):', longDescs.length);
if (longDescs.length > 0) console.log('Sample long desc:', longDescs[0]);
console.log('Short descriptions (<50 chars):', shortDescs.length);
