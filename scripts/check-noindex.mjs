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
let noindexFiles = [];
for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('noindex')) {
    noindexFiles.push(path.relative('docs/.vitepress/dist', file));
  }
}
console.log('Files with noindex:', noindexFiles);
