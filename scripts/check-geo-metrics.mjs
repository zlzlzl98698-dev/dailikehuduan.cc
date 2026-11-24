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
let withAnswerFirst = 0;
let totalTables = 0;
let withTables = 0;
let withFAQ = 0;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  if (html.includes('answer-first-box') || html.includes('answer-first-label')) withAnswerFirst++;
  const tableCount = (html.match(/<table\b/g) || []).length;
  if (tableCount > 0) {
    withTables++;
    totalTables += tableCount;
  }
  if (html.includes('常见问题') || html.includes('FAQ') || html.includes('faq-section')) withFAQ++;
}

console.log('Total HTML pages:', htmlFiles.length);
console.log('Pages with Answer-First:', withAnswerFirst);
console.log('Pages with Tables:', withTables, '(Total tables:', totalTables, ')');
console.log('Pages with FAQ sections:', withFAQ);
