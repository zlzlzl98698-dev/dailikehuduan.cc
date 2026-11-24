import fs from 'fs';

const html = fs.readFileSync('docs/.vitepress/dist/reviews/guangsuyun/index.html', 'utf8');
console.log('HTML size (bytes):', html.length);
console.log('Contains Answer-First in raw HTML?', html.includes('answer-first-box'));
console.log('Contains MiaoKo images in raw HTML?', html.includes('gsy-miaoko-cs-telecom.jpg'));
console.log('Contains 7-plan table in raw HTML?', html.includes('7 档套餐完整财务核算'));
console.log('Contains FAQ in raw HTML?', html.includes('为什么光速云 2026-08-19 的 5 张 MiaoKo'));
