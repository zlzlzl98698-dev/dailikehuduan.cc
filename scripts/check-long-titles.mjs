import fs from 'fs';
import path from 'path';

function walk(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) res.push(...walk(full));
    else if (f.endsWith('index.md')) res.push(full);
  }
  return res;
}

const files = walk('docs');
let longList = [];
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const m = content.match(/^title:\s*["']?(.*?)["']?\s*$/m);
  if (m) {
    const t = m[1].replace(/^["']|["']$/g, '');
    const fullLen = t.length + 18; // plus suffix
    if (fullLen > 70) {
      longList.push({ file: f.replace(/\\/g, '/'), fullLen, title: t });
    }
  }
}

console.log('Total long titles:', longList.length);
longList.forEach(l => console.log(`${l.file} (${l.fullLen}): ${l.title}`));
