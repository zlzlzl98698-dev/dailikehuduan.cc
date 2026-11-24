import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)

function printUsage() {
  console.log(`用法:
  node scripts/import-keywords-csv.mjs <csv文件路径> [--source gsc|bing] [--dry-run]

说明:
  - 支持 Google Search Console (GSC) 与 Bing Webmaster Tools 导出的 UTF-8 CSV。
  - 仅写入 CSV 中真实出现的 clicks / impressions / ctr / position；缺失字段一律保留 null，绝不虚构搜索量或 KD。
  - 已匹配到的 query / variants 会更新其 observedMetrics；未匹配到的新词以 status: "candidate" 写入 content/keyword-map.json 供人工分配 canonicalOwner。
`)
}

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  printUsage()
  process.exit(0)
}

const csvPathArg = args.find((a) => !a.startsWith('--'))
if (!csvPathArg) {
  console.error('[import-keywords-csv] 错误：请提供 CSV 文件路径')
  process.exit(1)
}

const sourceIdx = args.indexOf('--source')
const sourceName =
  sourceIdx !== -1 && args[sourceIdx + 1] ? args[sourceIdx + 1].toLowerCase() : 'gsc'
const dryRun = args.includes('--dry-run')

const resolvedCsvPath = path.resolve(process.cwd(), csvPathArg)
if (!fs.existsSync(resolvedCsvPath)) {
  console.error(`[import-keywords-csv] 错误：找不到文件 ${resolvedCsvPath}`)
  process.exit(1)
}

const keywordJsonPath = path.resolve(process.cwd(), 'content', 'keyword-map.json')
if (!fs.existsSync(keywordJsonPath)) {
  console.error(`[import-keywords-csv] 错误：找不到 ${keywordJsonPath}`)
  process.exit(1)
}

function parseCsv(text) {
  const clean = text.replace(/^\uFEFF/, '')
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    const next = clean[i + 1]
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cell += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(cell.trim())
      cell = ''
    } else if (ch === '\r' && next === '\n') {
      row.push(cell.trim())
      rows.push(row)
      row = []
      cell = ''
      i++
    } else if (ch === '\n' || ch === '\r') {
      row.push(cell.trim())
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += ch
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim())
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c !== ''))
}

function normalizeHeader(h) {
  const s = h.toLowerCase().trim()
  if (['query', 'top queries', '热门查询', '查询', 'keyword'].includes(s)) return 'query'
  if (['clicks', '点击次数', '点击'].includes(s)) return 'clicks'
  if (['impressions', '展示次数', '展示'].includes(s)) return 'impressions'
  if (['ctr', '点击率'].includes(s)) return 'ctr'
  if (['position', 'avg. position', 'avg position', '平均排名', '排名'].includes(s)) return 'position'
  return s
}

function parseNumberOrNull(val) {
  if (val === undefined || val === null) return null
  const s = String(val).replace(/,/g, '').trim()
  if (!s || s === '-' || s === '--' || s.toLowerCase() === 'n/a') return null
  if (s.endsWith('%')) {
    const num = parseFloat(s.slice(0, -1))
    return Number.isFinite(num) ? Number((num / 100).toFixed(6)) : null
  }
  const num = parseFloat(s)
  return Number.isFinite(num) ? num : null
}

const rawCsv = fs.readFileSync(resolvedCsvPath, 'utf8')
const rows = parseCsv(rawCsv)
if (rows.length < 2) {
  console.error('[import-keywords-csv] 错误：CSV 数据行不足')
  process.exit(1)
}

const headers = rows[0].map(normalizeHeader)
const qIdx = headers.indexOf('query')
if (qIdx === -1) {
  console.error(`[import-keywords-csv] 错误：未识别到 Query / Top queries 列，当前表头为: ${rows[0].join(', ')}`)
  process.exit(1)
}

const clicksIdx = headers.indexOf('clicks')
const imprIdx = headers.indexOf('impressions')
const ctrIdx = headers.indexOf('ctr')
const posIdx = headers.indexOf('position')

const kwFile = JSON.parse(fs.readFileSync(keywordJsonPath, 'utf8'))
const records = Array.isArray(kwFile.records) ? kwFile.records : []

const lookup = new Map()
for (const rec of records) {
  if (rec.query) lookup.set(rec.query.trim().toLowerCase(), rec)
  for (const v of rec.variants || []) {
    const key = v.trim().toLowerCase()
    if (!lookup.has(key)) lookup.set(key, rec)
  }
}

const nowDate = new Date().toISOString().slice(0, 10)
let matchedCount = 0
let addedCount = 0

for (const r of rows.slice(1)) {
  const queryText = (r[qIdx] || '').trim()
  if (!queryText) continue

  const metrics = {
    source: sourceName,
    clicks: clicksIdx !== -1 ? parseNumberOrNull(r[clicksIdx]) : null,
    impressions: imprIdx !== -1 ? parseNumberOrNull(r[imprIdx]) : null,
    ctr: ctrIdx !== -1 ? parseNumberOrNull(r[ctrIdx]) : null,
    position: posIdx !== -1 ? parseNumberOrNull(r[posIdx]) : null,
    importedAt: nowDate,
  }

  const existing = lookup.get(queryText.toLowerCase())
  if (existing) {
    existing.observedMetrics = metrics
    existing.lastReviewed = nowDate
    matchedCount++
  } else {
    const candidate = {
      seedKeyword: queryText,
      query: queryText,
      variants: [],
      intent: 'informational',
      entity: queryText,
      entityType: 'concept',
      audience: '待人工归类（CSV 导入真实搜索词）',
      decisionStage: 'awareness',
      pillar: 'unassigned',
      cluster: 'imported-candidate',
      targetUrl: null,
      canonicalOwner: null,
      source: `${sourceName.toUpperCase()} CSV 导入 (${path.basename(resolvedCsvPath)})`,
      evidenceLevel: 'measured',
      priority: 'P3',
      lastReviewed: nowDate,
      relatedQuestions: [],
      internalLinks: [],
      status: 'candidate',
      observedMetrics: metrics,
    }
    records.push(candidate)
    lookup.set(queryText.toLowerCase(), candidate)
    addedCount++
  }
}

kwFile.totalRecords = records.length
kwFile.lastReviewed = nowDate
kwFile.records = records

if (dryRun) {
  console.log(`[import-keywords-csv] [DRY RUN] 匹配更新 ${matchedCount} 条，新增 candidate ${addedCount} 条（未写入磁盘）`)
} else {
  fs.writeFileSync(keywordJsonPath, JSON.stringify(kwFile, null, 2) + '\n', 'utf8')
  console.log(`[import-keywords-csv] 完成：匹配更新 ${matchedCount} 条，新增 candidate ${addedCount} 条，总计 ${records.length} 条 -> content/keyword-map.json`)
}
