import fs from 'node:fs'
import path from 'node:path'
import esbuild from 'esbuild'

const root = process.cwd()
const docsDir = path.join(root, 'docs')
const distDir = path.join(docsDir, '.vitepress', 'dist')
const publicDir = path.join(docsDir, 'public')
const reportPath = path.join(root, 'audit', 'qa-report.md')
const keywordJsonPath = path.join(root, 'content', 'keyword-map.json')

function loadTsModule(relPath) {
  const fullPath = path.join(root, relPath)
  const res = esbuild.buildSync({
    entryPoints: [fullPath],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
  })
  const mod = { exports: {} }
  new Function('module', 'exports', res.outputFiles[0].text)(mod, mod.exports)
  return mod.exports
}

function walkFiles(dir, extFilter = null) {
  const results = []
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (dir === docsDir && entry.name === '.vitepress') continue
      results.push(...walkFiles(full, extFilter))
    } else if (!extFilter || entry.name.endsWith(extFilter)) {
      results.push(full)
    }
  }
  return results
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return { data: {}, body: content }
  const raw = match[1]
  const data = {}
  for (const line of raw.split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
    if (kv) {
      data[kv[1]] = kv[2].replace(/^['"]|['"]$/g, '').trim()
    }
  }
  return { data, body: content.slice(match[0].length) }
}

function extractMarkdownH1(body) {
  const cleaned = body.replace(/```[\s\S]*?```/g, '')
  const m = cleaned.match(/^#\s+(.+)$/m)
  return m ? m[1].trim() : null
}

function routeExistsInDocs(route) {
  if (route === '/') {
    return fs.existsSync(path.join(docsDir, 'index.md'))
  }
  const clean = route.replace(/^\/+|\/+$/g, '')
  return (
    fs.existsSync(path.join(docsDir, clean, 'index.md')) ||
    fs.existsSync(path.join(docsDir, `${clean}.md`))
  )
}

function routeExistsInDist(route) {
  if (!fs.existsSync(distDir)) return false
  if (route === '/') {
    return fs.existsSync(path.join(distDir, 'index.html'))
  }
  const clean = route.replace(/^\/+|\/+$/g, '')
  return (
    fs.existsSync(path.join(distDir, clean, 'index.html')) ||
    fs.existsSync(path.join(distDir, `${clean}.html`))
  )
}

function resolveDistPath(href) {
  const withoutHash = href.split('#')[0].split('?')[0]
  if (!withoutHash || !withoutHash.startsWith('/')) return true
  if (withoutHash === '/') {
    return fs.existsSync(path.join(distDir, 'index.html'))
  }
  const clean = withoutHash.replace(/^\/+/, '').replace(/\/+$/, '')
  const candidates = [
    path.join(distDir, clean),
    path.join(distDir, `${clean}.html`),
    path.join(distDir, clean, 'index.html'),
  ]
  return candidates.some((c) => fs.existsSync(c) && fs.statSync(c).isFile())
}

function resolveDocsOrPublicPath(href) {
  const withoutHash = href.split('#')[0].split('?')[0]
  if (!withoutHash || !withoutHash.startsWith('/')) return true
  if (withoutHash === '/') return routeExistsInDocs('/')
  const clean = withoutHash.replace(/^\/+/, '').replace(/\/+$/, '')
  if (
    fs.existsSync(path.join(publicDir, clean)) ||
    fs.existsSync(path.join(docsDir, clean, 'index.md')) ||
    fs.existsSync(path.join(docsDir, `${clean}.md`))
  ) {
    return true
  }
  return false
}

// ---------------------------------------------------------------------------
// 1. Load canonical data modules
// ---------------------------------------------------------------------------
const { BRANDS } = loadTsModule('docs/.vitepress/data/brands.ts')
const { NAV_CATEGORIES } = loadTsModule('docs/.vitepress/data/navigation.ts')
const { CLIENTS, OS_PLATFORMS } = loadTsModule('docs/.vitepress/data/clients.ts')

const checks = []
function recordCheck(name, passed, detail) {
  checks.push({ name, passed, detail })
}

// ---------------------------------------------------------------------------
// 2. Validate 31 unique brand slugs & single Firefly
// ---------------------------------------------------------------------------
const slugCounts = new Map()
for (const b of BRANDS) {
  slugCounts.set(b.slug, (slugCounts.get(b.slug) || 0) + 1)
}
const duplicateSlugs = [...slugCounts.entries()].filter(([, c]) => c > 1).map(([s]) => s)
recordCheck(
  '31 家去重品牌 Slug 唯一性校验',
  BRANDS.length === 31 && duplicateSlugs.length === 0,
  `brands.ts 共 ${BRANDS.length} 条记录，唯一 slug 数 ${slugCounts.size}，重复 slug：${duplicateSlugs.length ? duplicateSlugs.join(', ') : '无'}`
)

const fireflyMatches = BRANDS.filter(
  (b) =>
    b.slug === 'firefly' ||
    b.name.toLowerCase().includes('firefly') ||
    b.name.includes('萤火虫') ||
    b.aliases.some((a) => a.toLowerCase().includes('firefly') || a.includes('萤火虫'))
)
recordCheck(
  'Firefly 单一去重规范页校验',
  fireflyMatches.length === 1 && fireflyMatches[0].slug === 'firefly',
  `匹配到 ${fireflyMatches.length} 条 Firefly 记录（slug: ${fireflyMatches.map((b) => b.slug).join(', ')}）`
)

// ---------------------------------------------------------------------------
// 3. Zero hardcoded affiliate domains / code URLs in docs/**/*.md
// ---------------------------------------------------------------------------
const affiliateHosts = Array.from(
  new Set(
    BRANDS.map((b) => b.affiliateUrl)
      .filter(Boolean)
      .map((u) => {
        try {
          return new URL(u).hostname.toLowerCase()
        } catch {
          return null
        }
      })
      .filter(Boolean)
  )
)

const mdFiles = walkFiles(docsDir, '.md')
const affiliateViolations = []
const affUrlPattern = /https?:\/\/[^\s)"'>]+(?:\?code=|#\/\?code=)/gi

for (const file of mdFiles) {
  const rel = path.relative(root, file).replace(/\\/g, '/')
  const content = fs.readFileSync(file, 'utf8')
  const lower = content.toLowerCase()
  for (const host of affiliateHosts) {
    if (lower.includes(host)) {
      affiliateViolations.push(`${rel} 出现推广域名 ${host}`)
    }
  }
  const codeMatches = content.match(affUrlPattern)
  if (codeMatches) {
    for (const m of codeMatches) {
      affiliateViolations.push(`${rel} 出现硬编码推广 URL ${m}`)
    }
  }
}

recordCheck(
  'Markdown 零硬编码推广域名与邀请链接检查',
  affiliateViolations.length === 0,
  affiliateViolations.length === 0
    ? `已扫描 ${mdFiles.length} 个 Markdown 文件，0 处硬编码推广链接`
    : `发现 ${affiliateViolations.length} 处违规：${affiliateViolations.slice(0, 10).join('；')}`
)

// ---------------------------------------------------------------------------
// 4. Route existence check (10 pillars + 60 subtopics + 31 brands + client/extra)
// ---------------------------------------------------------------------------
const pillarRoutes = NAV_CATEGORIES.map((c) => c.link)
const subtopicRoutes = NAV_CATEGORIES.flatMap((c) => c.subsections.map((s) => s.link))
const extraNavRoutes = NAV_CATEGORIES.flatMap((c) =>
  (c.extraGroups || []).flatMap((g) => g.items.map((i) => i.link))
)
const clientRoutes = [
  ...OS_PLATFORMS.map((o) => o.url),
  ...CLIENTS.map((c) => c.tutorialUrl),
  '/clients/stash/',
  '/clients/quantumult-x/',
  '/clients/surge/',
  '/clients/openclash/',
  '/clients/passwall2/',
  '/clients/nikki/',
  '/clients/homeproxy/',
  '/guides/clash-verge-rev-setup/',
  '/guides/system-time-tls-fix/',
  '/guides/subscription-formats-explained/',
  '/troubleshooting/tun-wsl-docker-conflict/',
  '/plans/monthly-under-20-guide/',
  '/plans/annual-vs-monthly-cost/',
  '/plans/traffic-100gb-vs-300gb/',
  '/airport/evening-peak-stability-test/',
  '/airport/iepl-meaning-and-value/',
  '/airport/client-vs-third-party-subscription/',
  '/brands/how-to-verify-airport-legitimacy/',
  '/vpn/vpn-vs-proxy-difference/',
  '/clients/flclash-vs-clash-verge/',
  '/ai-streaming/chatgpt-region-and-block-fix/',
  '/ai-streaming/netflix-unlock-check-guide/',
  '/routes/iepl-vs-iplc-difference/',
  '/routes/multiplier-billing-explained/',
  '/guides/clash-verge-rev-import-subscription/',
  '/guides/v2rayn-subscription-and-core/',
  '/guides/shadowrocket-ios-setup/',
  '/guides/clash-rule-vs-global-mode/',
  '/troubleshooting/all-nodes-timeout-check/',
  '/troubleshooting/subscription-200-empty-fix/',
  '/troubleshooting/connected-no-internet-fix/',
  '/troubleshooting/dns-leak-and-hijack-fix/',
  '/safety/how-to-verify-airport-closure/',
  '/safety/subscription-leak-and-refund-evidence/',
  '/about/',
]
const brandRoutes = BRANDS.map((b) => `/brands/${b.slug}/`)
const reviewRoutes = BRANDS.map((b) => `/reviews/${b.slug}/`)
const compareRoutes = [
  '/compare/guangsuyun-vs-feimao/',
  '/compare/guangsuyun-vs-ermao/',
  '/compare/guangsuyun-vs-quanqiu/',
  '/compare/feimao-vs-xingdaomeng/',
  '/compare/wuyou-vs-lingmao/',
  '/compare/muguang-vs-weifeng/',
  '/compare/yifan-vs-weitu/',
  '/compare/kexin-vs-sujie/',
]

const expectedRoutes = Array.from(
  new Set([
    '/',
    ...pillarRoutes,
    ...subtopicRoutes,
    ...extraNavRoutes,
    ...clientRoutes,
    ...brandRoutes,
    ...reviewRoutes,
    ...compareRoutes,
  ])
)

const missingDocsRoutes = expectedRoutes.filter((r) => !routeExistsInDocs(r))
const distExists = fs.existsSync(distDir)
const missingDistRoutes = distExists ? expectedRoutes.filter((r) => !routeExistsInDist(r)) : expectedRoutes

recordCheck(
  '10 一级 + 60 二级 + 31 品牌商业 + 31 独立评测 + 8 品牌对比 + 27 L3/客户端实战路由（docs/ 源文件）',
  missingDocsRoutes.length === 0,
  `应有路由 ${expectedRoutes.length} 条（一级 ${pillarRoutes.length} + 二级 ${subtopicRoutes.length} + 品牌商业 ${brandRoutes.length} + 独立评测 ${reviewRoutes.length} + 对比 ${compareRoutes.length} + 扩展），docs/ 缺失 ${missingDocsRoutes.length} 条${missingDocsRoutes.length ? '：' + missingDocsRoutes.slice(0, 15).join(', ') : ''}`
)

recordCheck(
  '构建产物 HTML 路由完整性检查（docs/.vitepress/dist/）',
  distExists && missingDistRoutes.length === 0,
  !distExists
    ? '构建产物目录 docs/.vitepress/dist/ 不存在，请先运行 npm run docs:build'
    : `dist/ 缺失 ${missingDistRoutes.length} 条路由${missingDistRoutes.length ? '：' + missingDistRoutes.slice(0, 15).join(', ') : ''}`
)

// ---------------------------------------------------------------------------
// 5. Duplicate Title & H1 check (Markdown & built HTML)
// ---------------------------------------------------------------------------
const mdTitleMap = new Map()
const mdH1Map = new Map()
const mdMissingH1 = []

for (const file of mdFiles) {
  const rel = path.relative(root, file).replace(/\\/g, '/')
  if (rel === 'docs/404.md') continue
  const content = fs.readFileSync(file, 'utf8')
  const { data, body } = parseFrontmatter(content)
  if (data.title) {
    const arr = mdTitleMap.get(data.title) || []
    arr.push(rel)
    mdTitleMap.set(data.title, arr)
  }
  if (rel !== 'docs/index.md') {
    const h1 = extractMarkdownH1(body)
    if (!h1) {
      mdMissingH1.push(rel)
    } else {
      const arr = mdH1Map.get(h1) || []
      arr.push(rel)
      mdH1Map.set(h1, arr)
    }
  }
}

const dupMdTitles = [...mdTitleMap.entries()].filter(([, files]) => files.length > 1)
const dupMdH1s = [...mdH1Map.entries()].filter(([, files]) => files.length > 1)

recordCheck(
  'Markdown 唯一 Title 与 H1 检查',
  dupMdTitles.length === 0 && dupMdH1s.length === 0 && mdMissingH1.length === 0,
  `重复 Title：${dupMdTitles.length} 组，重复 H1：${dupMdH1s.length} 组，缺少 H1：${mdMissingH1.length} 页`
)

const htmlFiles = distExists ? walkFiles(distDir, '.html') : []
const htmlTitleMap = new Map()
const htmlH1Map = new Map()

for (const file of htmlFiles) {
  const rel = path.relative(distDir, file).replace(/\\/g, '/')
  if (rel === '404.html') continue
  const html = fs.readFileSync(file, 'utf8')
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i)
  if (titleMatch) {
    const t = titleMatch[1].trim()
    const arr = htmlTitleMap.get(t) || []
    arr.push(rel)
    htmlTitleMap.set(t, arr)
  }
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  if (h1Match) {
    const h1 = h1Match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    if (h1) {
      const arr = htmlH1Map.get(h1) || []
      arr.push(rel)
      htmlH1Map.set(h1, arr)
    }
  }
}

const dupHtmlTitles = [...htmlTitleMap.entries()].filter(([, files]) => files.length > 1)
const dupHtmlH1s = [...htmlH1Map.entries()].filter(([, files]) => files.length > 1)

recordCheck(
  '构建 HTML 唯一 <title> 与 <h1> 检查',
  distExists && dupHtmlTitles.length === 0 && dupHtmlH1s.length === 0,
  !distExists
    ? '未检测到 dist/ 目录'
    : `共检查 ${htmlFiles.length} 个 HTML 文件；重复 <title>：${dupHtmlTitles.length} 组，重复 <h1>：${dupHtmlH1s.length} 组`
)

// ---------------------------------------------------------------------------
// 6. SEO & Deployment artifacts in dist/
// ---------------------------------------------------------------------------
const requiredArtifacts = ['sitemap.xml', 'robots.txt', '404.html', '.htaccess']
const missingArtifacts = distExists
  ? requiredArtifacts.filter((f) => !fs.existsSync(path.join(distDir, f)))
  : requiredArtifacts

recordCheck(
  '构建产物 SEO 与部署基础文件（sitemap.xml / robots.txt / 404.html / .htaccess）',
  distExists && missingArtifacts.length === 0,
  !distExists
    ? '未检测到 dist/ 目录'
    : missingArtifacts.length === 0
      ? 'sitemap.xml、robots.txt、404.html 与 .htaccess 全部存在'
      : `缺失：${missingArtifacts.join(', ')}`
)

// ---------------------------------------------------------------------------
// 7. Internal dead-link check (Markdown & built HTML)
// ---------------------------------------------------------------------------
const mdDeadLinks = []
const mdLinkRe = /(?<!!)\[[^\]]*\]\((\/[^)\s#?]+(?:\/[^)\s#?]*)?)(?:#[^)\s]*)?(?:\?[^)\s]*)?\)/g
const htmlHrefRe = /href="(\/[^"#?]+)(?:#[^"]*)?(?:\?[^"]*)?"/g

for (const file of mdFiles) {
  const rel = path.relative(root, file).replace(/\\/g, '/')
  const raw = fs.readFileSync(file, 'utf8')
  const stripped = raw.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '')
  let m
  while ((m = mdLinkRe.exec(stripped)) !== null) {
    const target = m[1]
    if (!resolveDocsOrPublicPath(target)) {
      mdDeadLinks.push(`${rel} -> ${target}`)
    }
  }
}

const htmlDeadLinks = []
if (distExists) {
  for (const file of htmlFiles) {
    const rel = path.relative(distDir, file).replace(/\\/g, '/')
    const html = fs.readFileSync(file, 'utf8')
    let m
    while ((m = htmlHrefRe.exec(html)) !== null) {
      const target = m[1]
      if (target.startsWith('/assets/') || target === '/favicon.svg') continue
      if (!resolveDistPath(target)) {
        htmlDeadLinks.push(`${rel} -> ${target}`)
      }
    }
  }
}

recordCheck(
  '站内 Markdown 死链检查',
  mdDeadLinks.length === 0,
  mdDeadLinks.length === 0
    ? `已检查 ${mdFiles.length} 个 Markdown 文件，0 条站内死链`
    : `发现 ${mdDeadLinks.length} 条 Markdown 死链：${mdDeadLinks.slice(0, 15).join('；')}`
)

recordCheck(
  '构建产物 HTML 站内死链检查',
  distExists && htmlDeadLinks.length === 0,
  !distExists
    ? '未检测到 dist/ 目录'
    : htmlDeadLinks.length === 0
      ? `已检查 ${htmlFiles.length} 个构建 HTML 文件，0 条站内死链`
      : `发现 ${htmlDeadLinks.length} 条 HTML 死链：${htmlDeadLinks.slice(0, 15).join('；')}`
)

// ---------------------------------------------------------------------------
// 8. Keyword map validation
// ---------------------------------------------------------------------------
let keywordCheckPass = false
let keywordCheckDetail = '缺少 content/keyword-map.json'
if (fs.existsSync(keywordJsonPath)) {
  try {
    const kwData = JSON.parse(fs.readFileSync(keywordJsonPath, 'utf8'))
    const records = Array.isArray(kwData.records) ? kwData.records : []
    const brandTargets = new Set(
      records.filter((r) => r.entityType === 'brand').map((r) => r.canonicalOwner)
    )
    const missingBrandsInKw = brandRoutes.filter((r) => !brandTargets.has(r))
    const requiredKeys = [
      'seedKeyword',
      'query',
      'variants',
      'intent',
      'entity',
      'entityType',
      'audience',
      'decisionStage',
      'pillar',
      'cluster',
      'targetUrl',
      'canonicalOwner',
      'source',
      'evidenceLevel',
      'priority',
      'lastReviewed',
      'relatedQuestions',
      'internalLinks',
      'status',
    ]
    const missingFieldsCount = records.filter((rec) =>
      requiredKeys.some((k) => !(k in rec))
    ).length
    keywordCheckPass = missingBrandsInKw.length === 0 && missingFieldsCount === 0 && records.length > 0
    keywordCheckDetail = `共 ${records.length} 条词簇映射，31 家品牌覆盖缺口：${missingBrandsInKw.length}，字段缺失记录：${missingFieldsCount}`
  } catch (err) {
    keywordCheckDetail = `JSON 解析失败: ${err.message}`
  }
}
recordCheck('关键词映射库完整性检查 (content/keyword-map.json)', keywordCheckPass, keywordCheckDetail)

// ---------------------------------------------------------------------------
// 9. Write audit/qa-report.md
// ---------------------------------------------------------------------------
const passedCount = checks.filter((c) => c.passed).length
const failedCount = checks.length - passedCount
const nowIso = new Date().toISOString()

const lines = [
  '# 站点质量与发布前 QA 审计报告（QA Report）',
  '',
  `- **生成时间**：${nowIso}`,
  `- **审计脚本**：\`scripts/audit-site.mjs\``,
  `- **检查汇总**：通过 **${passedCount} / ${checks.length}** 项，未通过 **${failedCount}** 项`,
  '',
  '## 1. 检查项明细',
  '',
  '| 检查项 | 状态 | 详细结果 |',
  '|---|---|---|',
  ...checks.map((c) => `| ${c.name} | ${c.passed ? 'PASS' : 'FAIL'} | ${c.detail.replace(/\|/g, '\\|')} |`),
  '',
]

if (missingDocsRoutes.length > 0) {
  lines.push('## 2. docs/ 缺失预期路由列表', '', ...missingDocsRoutes.map((r) => `- \`${r}\``), '')
}
if (distExists && missingDistRoutes.length > 0) {
  lines.push('## 3. dist/ 缺失构建 HTML 路由列表', '', ...missingDistRoutes.map((r) => `- \`${r}\``), '')
}
if (affiliateViolations.length > 0) {
  lines.push('## 4. 硬编码推广链接告警', '', ...affiliateViolations.map((v) => `- ${v}`), '')
}
if (mdDeadLinks.length > 0 || htmlDeadLinks.length > 0) {
  lines.push(
    '## 5. 站内死链明细',
    '',
    ...mdDeadLinks.map((d) => `- [MD] ${d}`),
    ...htmlDeadLinks.map((d) => `- [HTML] ${d}`),
    ''
  )
}
if (dupMdTitles.length > 0 || dupMdH1s.length > 0 || dupHtmlTitles.length > 0 || dupHtmlH1s.length > 0) {
  lines.push('## 6. 重复 Title / H1 明细', '')
  for (const [t, files] of dupMdTitles) lines.push(`- [MD Title] "${t}": ${files.join(', ')}`)
  for (const [h, files] of dupMdH1s) lines.push(`- [MD H1] "${h}": ${files.join(', ')}`)
  for (const [t, files] of dupHtmlTitles) lines.push(`- [HTML Title] "${t}": ${files.join(', ')}`)
  for (const [h, files] of dupHtmlH1s) lines.push(`- [HTML H1] "${h}": ${files.join(', ')}`)
  lines.push('')
}

fs.mkdirSync(path.dirname(reportPath), { recursive: true })
fs.writeFileSync(reportPath, lines.join('\n'), 'utf8')

console.log(`[audit-site] 完成检查：${passedCount}/${checks.length} 项通过，报告已写入 audit/qa-report.md`)
for (const c of checks) {
  console.log(`  [${c.passed ? 'PASS' : 'FAIL'}] ${c.name} -> ${c.detail}`)
}

if (failedCount > 0) {
  process.exit(1)
}
