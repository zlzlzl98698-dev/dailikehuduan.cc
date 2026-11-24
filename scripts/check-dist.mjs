import fs from 'fs';

const res = JSON.parse(fs.readFileSync('scripts/audit-results.json', 'utf8'));
const counts = {
  over5000: 0,
  between3000and5000: 0,
  between2000and3000: 0,
  between1000and2000: 0,
  under1000: 0
};

for (const p of res.contentGEO.wordCountStats ? [] : []) {}
const htmls = JSON.parse(fs.readFileSync('scripts/audit-results.json', 'utf8'));

