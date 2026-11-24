import fs from 'fs';

const html = fs.readFileSync('docs/.vitepress/dist/clients/clash-verge-rev/index.html', 'utf8');
const regex = /(.{0,40}(?:192\.168\.|10\.0\.|172\.16\.)[^\s<'\"]{0,20}.{0,40})/g;
let m;
while ((m = regex.exec(html)) !== null) {
  console.log('Sample:', m[0].replace(/<[^>]+>/g, ''));
}
