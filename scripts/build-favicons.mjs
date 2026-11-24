import fs from 'fs';

const png32 = fs.readFileSync('rendered_avatar_32.png');
const png64 = fs.readFileSync('rendered_avatar_64.png');

// 1. Generate multi-resolution ICO (32x32 and 64x64)
const images = [
  { w: 32, h: 32, buf: png32 },
  { w: 64, h: 64, buf: png64 }
];

const count = images.length;
const dirHeader = Buffer.alloc(6);
dirHeader.writeUInt16LE(0, 0); // reserved
dirHeader.writeUInt16LE(1, 2); // ICO type
dirHeader.writeUInt16LE(count, 4);

let offset = 6 + count * 16;
const entries = [];
for (const img of images) {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(img.w >= 256 ? 0 : img.w, 0);
  entry.writeUInt8(img.h >= 256 ? 0 : img.h, 1);
  entry.writeUInt8(0, 2); // color palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(img.buf.length, 8); // size
  entry.writeUInt32LE(offset, 12); // offset
  entries.push(entry);
  offset += img.buf.length;
}

const icoBuffer = Buffer.concat([dirHeader, ...entries, ...images.map(img => img.buf)]);

// Write favicon.ico to public and dist
fs.writeFileSync('docs/public/favicon.ico', icoBuffer);
if (fs.existsSync('docs/.vitepress/dist')) {
  fs.writeFileSync('docs/.vitepress/dist/favicon.ico', icoBuffer);
}
console.log('Wrote favicon.ico, size:', icoBuffer.length);

// Write favicon.png (32x32)
fs.writeFileSync('docs/public/favicon.png', png32);
if (fs.existsSync('docs/.vitepress/dist')) {
  fs.writeFileSync('docs/.vitepress/dist/favicon.png', png32);
}
console.log('Wrote favicon.png, size:', png32.length);

// Write images/site-avatar.png (64x64)
fs.writeFileSync('docs/public/images/site-avatar.png', png64);
if (fs.existsSync('docs/.vitepress/dist/images')) {
  fs.writeFileSync('docs/.vitepress/dist/images/site-avatar.png', png64);
}
console.log('Wrote docs/public/images/site-avatar.png, size:', png64.length);

// Write favicon.svg (embedded PNG64)
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
console.log('Wrote favicon.svg, length:', svg.length);

console.log('All favicon files successfully updated!');
