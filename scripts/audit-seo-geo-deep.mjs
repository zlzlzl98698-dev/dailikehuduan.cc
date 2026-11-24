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

const distDir = path.resolve('docs/.vitepress/dist');
const htmlFiles = walk(distDir);
console.log(`Auditing ${htmlFiles.length} HTML files in ${distDir}`);

const results = {
  crawlIndex: {},
  riskControl: {},
  contentGEO: {},
  schemaSERP: {}
};

// 1. Crawl & Index
// Robots.txt
const robotsTxt = fs.readFileSync(path.join(distDir, 'robots.txt'), 'utf8');
const sitemapXml = fs.readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);

results.crawlIndex.robots = {
  content: robotsTxt,
  disallows: [...robotsTxt.matchAll(/Disallow:\s*(.*)/g)].map(m => m[1].trim()),
  sitemapDeclared: robotsTxt.includes('Sitemap: https://dailikehuduan.cc/sitemap.xml'),
  blocksAssets: robotsTxt.includes('Disallow: /assets/')
};

results.crawlIndex.sitemap = {
  totalUrls: sitemapUrls.length,
  has404: sitemapUrls.some(u => u.includes('404')),
  nonHttps: sitemapUrls.filter(u => !u.startsWith('https://dailikehuduan.cc/')),
  sampleUrls: sitemapUrls.slice(0, 5)
};

// Canonical check
let missingCanonical = [];
let invalidCanonical = [];
let sampledCanonicals = [];

// Empty a tags check
let emptyATags = [];
let jsATags = [];

// Outbound links check
let outboundLinks = [];
let unflaggedOutbound = [];

// Local leaks check
let leakedPaths = [];

// Word counts & Content
let wordCounts = [];
let thinPages = []; // < 1500 chars

// Schema & Titles
let titles = new Map();
let descs = new Map();
let schemas = [];
let schemaErrors = [];

for (const file of htmlFiles) {
  const rel = path.relative(distDir, file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');

  // 1. Canonical
  const canMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
                || html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
  if (!canMatch) {
    if (rel !== '404.html') missingCanonical.push(rel);
  } else {
    const href = canMatch[1];
    if (sampledCanonicals.length < 30) sampledCanonicals.push({ rel, href });
    if (!href.startsWith('https://dailikehuduan.cc/')) {
      invalidCanonical.push({ rel, href, reason: 'Prefix not https://dailikehuduan.cc/' });
    }
    // Check self-pointing
    let expectedHref = 'https://dailikehuduan.cc/' + (rel === 'index.html' ? '' : rel.replace(/\/index\.html$/, '/').replace(/\.html$/, '/'));
    if (href !== expectedHref && rel !== '404.html') {
      invalidCanonical.push({ rel, href, expectedHref, reason: 'Mismatch self URL' });
    }
  }

  // 2. Empty a tags & JS links
  const aMatches = [...html.matchAll(/<a\b([^>]*)>(.*?)<\/a>/gis)];
  for (const m of aMatches) {
    const attrs = m[1];
    const hrefMatch = attrs.match(/\bhref=["']([^"']*)["']/i);
    if (!hrefMatch || hrefMatch[1].trim() === '') {
      // Check if it's an anchor without href or named anchor
      if (!attrs.includes('name=') && !attrs.includes('id=')) {
        emptyATags.push({ rel, tag: m[0].slice(0, 100) });
      }
    } else {
      const h = hrefMatch[1].trim();
      if (h.startsWith('javascript:')) {
        jsATags.push({ rel, href: h });
      } else if (h.startsWith('http://') || h.startsWith('https://')) {
        try {
          const urlObj = new URL(h);
          if (urlObj.hostname !== 'dailikehuduan.cc' && urlObj.hostname !== 'localhost') {
            const relAttr = (attrs.match(/\brel=["']([^"']*)["']/i) || [])[1] || '';
            const relTokens = relAttr.toLowerCase().split(/\s+/);
            const isNofollow = relTokens.includes('nofollow');
            const isSponsored = relTokens.includes('sponsored');
            outboundLinks.push({ rel, host: urlObj.hostname, href: h, relAttr });
            if (!isNofollow) {
              unflaggedOutbound.push({ rel, href: h, relAttr });
            }
          }
        } catch {}
      }
    }
  }

  // 3. Local leaks
  if (html.includes('C:\\Users\\') || html.includes('C:/Users/')) {
    leakedPaths.push({ rel, type: 'Windows local user path' });
  }
  if (html.includes('192.168.') || html.includes('10.0.') || html.includes('172.16.')) {
    leakedPaths.push({ rel, type: 'Internal private IP' });
  }

  // 4. Content thickness & Han characters in SSR HTML
  // Strip tags
  const bodyMatch = html.match(/<main\b[^>]*>(.*?)<\/main>/is) || html.match(/<body\b[^>]*>(.*?)<\/body>/is);
  const textContent = (bodyMatch ? bodyMatch[1] : html).replace(/<script\b[^>]*>.*?<\/script>/gis, '').replace(/<style\b[^>]*>.*?<\/style>/gis, '').replace(/<[^>]+>/g, ' ');
  const hanChars = (textContent.match(/[\u4e00-\u9fa5]/g) || []).length;
  wordCounts.push({ rel, hanChars });
  if (hanChars < 800 && rel !== '404.html' && rel !== 'index.html') {
    thinPages.push({ rel, hanChars });
  }

  // 5. Title & Desc
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  if (titleMatch) {
    const t = titleMatch[1].trim();
    if (!titles.has(t)) titles.set(t, []);
    titles.get(t).push(rel);
  }
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)
                 || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i);
  if (descMatch) {
    const d = descMatch[1].trim();
    if (!descs.has(d)) descs.set(d, []);
    descs.get(d).push(rel);
  }

  // 6. JSON-LD
  const jsonLdMatches = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis)];
  for (const jm of jsonLdMatches) {
    try {
      const parsed = JSON.parse(jm[1]);
      schemas.push({ rel, schema: parsed });
    } catch (e) {
      schemaErrors.push({ rel, error: e.message, raw: jm[1].slice(0, 150) });
    }
  }
}

results.crawlIndex.canonical = {
  sampled: sampledCanonicals.slice(0, 10),
  missing: missingCanonical,
  invalid: invalidCanonical
};

results.crawlIndex.links = {
  emptyATagsCount: emptyATags.length,
  emptyATagsSample: emptyATags.slice(0, 5),
  jsATagsCount: jsATags.length,
  jsATagsSample: jsATags.slice(0, 5)
};

results.riskControl.outbound = {
  totalOutbound: outboundLinks.length,
  unflaggedCount: unflaggedOutbound.length,
  unflaggedSample: unflaggedOutbound.slice(0, 10),
  uniqueOutboundHosts: [...new Set(outboundLinks.map(o => o.host))]
};

results.riskControl.leaks = leakedPaths;

results.contentGEO.thinPages = thinPages;
results.contentGEO.wordCountStats = {
  total: wordCounts.length,
  min: Math.min(...wordCounts.map(w => w.hanChars)),
  max: Math.max(...wordCounts.map(w => w.hanChars)),
  avg: Math.round(wordCounts.reduce((a, b) => a + b.hanChars, 0) / wordCounts.length)
};

// Duplicates
results.schemaSERP.titleDuplicates = [...titles.entries()].filter(([k, v]) => v.length > 1);
results.schemaSERP.descDuplicates = [...descs.entries()].filter(([k, v]) => v.length > 1);
results.schemaSERP.schemaCount = schemas.length;
results.schemaSERP.schemaErrors = schemaErrors;

// Check GA4 / Analytics tracking codes
let analyticsMatches = [];
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(distDir, file).replace(/\\/g, '/');
  if (html.includes('googletagmanager.com') || html.includes('google-analytics.com') || html.includes('hm.baidu.com') || html.includes('pagead2.googlesyndication.com')) {
    analyticsMatches.push(rel);
  }
}
results.riskControl.analytics = {
  detectedFiles: analyticsMatches.length
};

fs.writeFileSync('scripts/audit-results.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Deep audit analysis complete. Results saved to scripts/audit-results.json');
