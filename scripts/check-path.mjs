import fs from 'fs';

const html = fs.readFileSync('docs/.vitepress/dist/troubleshooting/tun-wsl-docker-conflict/index.html', 'utf8');
const idx = html.indexOf('C:\\Users');
if (idx !== -1) {
  console.log(html.slice(idx - 50, idx + 100));
}
const idx2 = html.indexOf('C:/Users');
if (idx2 !== -1) {
  console.log(html.slice(idx2 - 50, idx2 + 100));
}
