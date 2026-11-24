import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function main() {
  const avatarWebp = fs.readFileSync('docs/public/images/site-avatar.webp');

  const server = http.createServer((req, res) => {
    if (req.url === '/avatar.webp') {
      res.writeHead(200, { 'Content-Type': 'image/webp' });
      res.end(avatarWebp);
    } else if (req.url === '/64') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html><html><head><style>
        * { margin: 0; padding: 0; }
        html, body { width: 64px; height: 64px; overflow: hidden; background: transparent; }
        img { width: 64px; height: 64px; object-fit: cover; border-radius: 14px; display: block; }
      </style></head><body><img src="/avatar.webp"></body></html>`);
    } else if (req.url === '/32') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html><html><head><style>
        * { margin: 0; padding: 0; }
        html, body { width: 32px; height: 32px; overflow: hidden; background: transparent; }
        img { width: 32px; height: 32px; object-fit: cover; border-radius: 7px; display: block; }
      </style></head><body><img src="/avatar.webp"></body></html>`);
    } else if (req.url === '/16') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html><html><head><style>
        * { margin: 0; padding: 0; }
        html, body { width: 16px; height: 16px; overflow: hidden; background: transparent; }
        img { width: 16px; height: 16px; object-fit: cover; border-radius: 4px; display: block; }
      </style></head><body><img src="/avatar.webp"></body></html>`);
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  await new Promise((resolve) => server.listen(5999, '127.0.0.1', resolve));
  console.log('Temporary conversion server running on http://127.0.0.1:5999');

  const p64 = path.resolve('rendered_64.png');
  const p32 = path.resolve('rendered_32.png');
  const p16 = path.resolve('rendered_16.png');

  const tempUserDataDir = path.join(os.tmpdir(), 'edge_favicon_' + Date.now());
  fs.mkdirSync(tempUserDataDir, { recursive: true });

  const edgeArgs = (size, file, url) => [
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${tempUserDataDir}`,
    '--hide-scrollbars',
    `--window-size=${size},${size}`,
    `--screenshot=${file}`,
    url
  ];

  try {
    await execFileAsync(EDGE_PATH, edgeArgs(64, p64, 'http://127.0.0.1:5999/64'));
    await execFileAsync(EDGE_PATH, edgeArgs(32, p32, 'http://127.0.0.1:5999/32'));
    await execFileAsync(EDGE_PATH, edgeArgs(16, p16, 'http://127.0.0.1:5999/16'));
  } finally {
    server.close();
    try { fs.rmSync(tempUserDataDir, { recursive: true, force: true }); } catch(e){}
  }

  const png16 = fs.readFileSync(p16);
  const png32 = fs.readFileSync(p32);
  const png64 = fs.readFileSync(p64);

  console.log(`Rendered PNGs: 16px (${png16.length}b), 32px (${png32.length}b), 64px (${png64.length}b)`);

  // Build multi-resolution ICO
  const images = [
    { w: 16, h: 16, buf: png16 },
    { w: 32, h: 32, buf: png32 },
    { w: 64, h: 64, buf: png64 }
  ];

  const count = images.length;
  const dirHeader = Buffer.alloc(6);
  dirHeader.writeUInt16LE(0, 0); // reserved
  dirHeader.writeUInt16LE(1, 2); // ICO type 1
  dirHeader.writeUInt16LE(count, 4);

  let offset = 6 + count * 16;
  const entries = [];
  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.w >= 256 ? 0 : img.w, 0);
    entry.writeUInt8(img.h >= 256 ? 0 : img.h, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(img.buf.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    entries.push(entry);
    offset += img.buf.length;
  }

  const icoBuffer = Buffer.concat([dirHeader, ...entries, ...images.map(img => img.buf)]);

  // Write favicon.ico
  fs.writeFileSync('docs/public/favicon.ico', icoBuffer);
  if (fs.existsSync('docs/.vitepress/dist')) {
    fs.writeFileSync('docs/.vitepress/dist/favicon.ico', icoBuffer);
  }

  // Write favicon.png (32x32 standard browser favicon)
  fs.writeFileSync('docs/public/favicon.png', png32);
  if (fs.existsSync('docs/.vitepress/dist')) {
    fs.writeFileSync('docs/.vitepress/dist/favicon.png', png32);
  }

  // Write site-avatar.png (64x64)
  fs.writeFileSync('docs/public/images/site-avatar.png', png64);
  if (fs.existsSync('docs/.vitepress/dist/images')) {
    fs.writeFileSync('docs/.vitepress/dist/images/site-avatar.png', png64);
  }

  // Write clean SVG with embedded PNG
  const b64 = png64.toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="代理客户端头像">
  <defs>
    <clipPath id="avatar-clip">
      <rect width="64" height="64" rx="14" ry="14" />
    </clipPath>
  </defs>
  <image width="64" height="64" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatar-clip)" href="data:image/png;base64,${b64}" />
</svg>
`;
  fs.writeFileSync('docs/public/favicon.svg', svg, 'utf8');
  if (fs.existsSync('docs/.vitepress/dist')) {
    fs.writeFileSync('docs/.vitepress/dist/favicon.svg', svg, 'utf8');
  }

  // Clean up temporary PNGs
  try { fs.unlinkSync(p16); } catch(e){}
  try { fs.unlinkSync(p32); } catch(e){}
  try { fs.unlinkSync(p64); } catch(e){}

  console.log('Successfully generated favicon.ico, favicon.png, favicon.svg and site-avatar.png!');
}

main().catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
