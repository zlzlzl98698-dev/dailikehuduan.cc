import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const docsDir = path.join(root, 'docs')
const outFile = path.join(docsDir, '.vitepress', 'data', 'content-index.json')

const PILLARS = [
  'airport',
  'plans',
  'brands',
  'vpn',
  'clients',
  'ai-streaming',
  'routes',
  'guides',
  'troubleshooting',
  'safety',
  'reviews',
  'compare',
  'about',
]

function walkMd(dir) {
  const res = []
  if (!fs.existsSync(dir)) return res
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) res.push(...walkMd(full))
    else if (ent.name.endsWith('.md')) res.push(full)
  }
  return res
}

function parseYamlFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return { data: {}, body: content }
  const lines = m[1].split(/\r?\n/)
  const data = {}
  let currentKey = null
  let inList = false

  for (const line of lines) {
    const topKv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
    if (topKv) {
      currentKey = topKv[1]
      const val = topKv[2].trim()
      if (val === '' || val === '[]') {
        data[currentKey] = val === '[]' ? [] : ''
        inList = val === ''
      } else if (val.startsWith('[') && val.endsWith(']')) {
        data[currentKey] = val
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean)
        inList = false
      } else {
        data[currentKey] = val.replace(/^['"]|['"]$/g, '')
        inList = false
      }
      continue
    }
    if (inList && currentKey && /^\s+-\s+/.test(line)) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = []
      const itemVal = line.replace(/^\s+-\s+/, '').trim().replace(/^['"]|['"]$/g, '')
      if (!itemVal.includes(': ')) {
        data[currentKey].push(itemVal)
      }
    }
  }
  return { data, body: content.slice(m[0].length) }
}

function routeFromFile(filePath) {
  let rel = path.relative(docsDir, filePath).replace(/\\/g, '/')
  rel = rel.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')
  return rel ? `/${rel.replace(/\/+$/, '')}/` : '/'
}

const entries = []
for (const p of PILLARS) {
  const dir = path.join(docsDir, p)
  for (const file of walkMd(dir)) {
    const route = routeFromFile(file)
    const raw = fs.readFileSync(file, 'utf8')
    const { data, body } = parseYamlFrontmatter(raw)
    if (data.draft === 'true') continue
    const h1 = (body.replace(/```[\s\S]*?```/g, '').match(/^#\s+(.+)$/m) || [])[1] || ''
    const cleanText = body
      .replace(/```[\s\S]*?```/g, '')
      .replace(/<[^>]+>/g, '')
    const hanChars = (cleanText.match(/[\u4e00-\u9fff]/g) || []).length

    entries.push({
      url: route,
      pillar: data.pillar || p,
      title: String(data.title || h1 || route),
      h1: h1.trim(),
      description: String(data.description || ''),
      parentTopic: data.parentTopic ? String(data.parentTopic) : null,
      primaryKeyword: data.primaryKeyword ? String(data.primaryKeyword) : null,
      searchIntent: data.searchIntent ? String(data.searchIntent) : null,
      category: data.category ? String(data.category) : null,
      relatedSlugs: Array.isArray(data.relatedSlugs) ? data.relatedSlugs : [],
      relatedBrands: Array.isArray(data.relatedBrands) ? data.relatedBrands : [],
      lastUpdated: data.lastUpdated ? String(data.lastUpdated) : '2026-11-24',
      hanChars,
    })
  }
}

entries.sort((a, b) => a.url.localeCompare(b.url))
fs.writeFileSync(outFile, JSON.stringify({ generatedAt: '2026-11-24', count: entries.length, entries }, null, 2), 'utf8')
console.log(`[generate-content-index] Indexed ${entries.length} pages -> docs/.vitepress/data/content-index.json`)
