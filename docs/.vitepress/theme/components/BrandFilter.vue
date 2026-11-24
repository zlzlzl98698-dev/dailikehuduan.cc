<script setup lang="ts">
import { ref, computed } from 'vue'
import { BRANDS, BRAND_BY_SLUG, type BrandRecord } from '../../data/brands'
import BrandCard from './BrandCard.vue'
import AffiliateButton from './AffiliateButton.vue'

const query = ref('')
const priceTier = ref<'all' | 'under10' | '10to20' | 'over20' | 'onetime'>('all')
const clientMode = ref<string>('all')
const protocol = ref<string>('all')
const region = ref<string>('all')
const evidenceFilter = ref<'all' | 'hasTests' | 'vendorOnly' | 'measured'>('all')
const sortBy = ref<'editorial' | 'equivPrice' | 'monthlyPrice' | 'completeness' | 'updated'>('editorial')
const compareSlugs = ref<string[]>(['guangsuyun', 'muguang'])

function getMinEquivPrice(b: BrandRecord): number {
  const vals = b.plans
    .map((p) => (p.billingCycle === '月付' ? p.price : p.monthlyEquivalent))
    .filter((n): n is number => typeof n === 'number' && !Number.isNaN(n))
  return vals.length ? Math.min(...vals) : 9999
}

function getMinTrueMonthly(b: BrandRecord): number {
  const vals = b.plans.filter((p) => p.billingCycle === '月付').map((p) => p.price)
  return vals.length ? Math.min(...vals) : 9999
}

const filteredBrands = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = BRANDS.filter((b) => {
    if (q) {
      const hay = [b.name, ...b.aliases, b.slug, b.summary, ...b.categoryTags, ...b.protocols].join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }

    if (priceTier.value !== 'all') {
      const equiv = getMinEquivPrice(b)
      if (priceTier.value === 'under10' && equiv > 10) return false
      if (priceTier.value === '10to20' && (equiv <= 10 || equiv > 20)) return false
      if (priceTier.value === 'over20' && equiv <= 20) return false
      if (priceTier.value === 'onetime' && !b.plans.some((p) => p.billingCycle === '一次性付费')) return false
    }

    if (clientMode.value !== 'all') {
      if (clientMode.value === 'thirdparty' && !b.clientMode.includes('第三方')) return false
      if (clientMode.value === 'exclusive' && b.clientMode !== '仅专属客户端') return false
    }

    if (protocol.value !== 'all') {
      if (!b.protocols.some((p) => p.toLowerCase().includes(protocol.value.toLowerCase()))) return false
    }

    if (region.value !== 'all') {
      if (!b.regions.some((r) => r.includes(region.value))) return false
    }

    if (evidenceFilter.value === 'hasTests' && b.testRuns.length === 0) return false
    if (evidenceFilter.value === 'vendorOnly' && b.testRuns.length > 0) return false
    if (evidenceFilter.value === 'measured' && !b.testRuns.some((t) => t.evidence === 'measured')) return false

    return true
  })

  const compWeight: Record<string, number> = { 高: 3, 中: 2, 基础: 1 }

  return [...list].sort((a, b) => {
    if (sortBy.value === 'equivPrice') return getMinEquivPrice(a) - getMinEquivPrice(b)
    if (sortBy.value === 'monthlyPrice') return getMinTrueMonthly(a) - getMinTrueMonthly(b)
    if (sortBy.value === 'completeness') return (compWeight[b.completeness] || 0) - (compWeight[a.completeness] || 0)
    if (sortBy.value === 'updated') return b.sourceUpdatedAt.localeCompare(a.sourceUpdatedAt)
    return a.editorialPriority - b.editorialPriority
  })
})

const comparedBrands = computed(() =>
  compareSlugs.value.map((s) => BRAND_BY_SLUG[s]).filter((b): b is BrandRecord => Boolean(b))
)

function toggleCompare(slug: string) {
  if (compareSlugs.value.includes(slug)) {
    compareSlugs.value = compareSlugs.value.filter((s) => s !== slug)
  } else if (compareSlugs.value.length < 3) {
    compareSlugs.value = [...compareSlugs.value, slug]
  } else {
    compareSlugs.value = [...compareSlugs.value.slice(1), slug]
  }
}

function resetFilters() {
  query.value = ''
  priceTier.value = 'all'
  clientMode.value = 'all'
  protocol.value = 'all'
  region.value = 'all'
  evidenceFilter.value = 'all'
  sortBy.value = 'editorial'
}
</script>

<template>
  <div class="brand-filter-shell">
    <div class="brand-filter__notice">
      <strong>排序口径透明说明：</strong>
      默认排序为「编辑精选（含推广合作）」顺序，<strong>并非</strong>经独立实测证实的性能排行榜。跨周期价格已拆分为「年付折算月均」与「真实月付门槛」，请勿混淆。
    </div>

    <div class="brand-filter__controls">
      <div class="brand-filter__search-row">
        <label class="sr-only" for="brand-search-input">搜索机场品牌</label>
        <input
          id="brand-search-input"
          v-model="query"
          type="search"
          placeholder="搜索品牌名、别名、协议（如 VLESS）或特点..."
          class="brand-filter__input"
        />
        <select v-model="sortBy" aria-label="排序方式" class="brand-filter__select">
          <option value="editorial">排序：编辑精选（含推广合作）</option>
          <option value="equivPrice">排序：年付折算单价从低到高</option>
          <option value="monthlyPrice">排序：真实月付门槛从低到高</option>
          <option value="completeness">排序：资料完整度优先</option>
          <option value="updated">排序：资料快照日期最新</option>
        </select>
      </div>

      <div class="brand-filter__facets">
        <select v-model="priceTier" aria-label="价位筛选" class="brand-filter__select">
          <option value="all">全部价位与周期</option>
          <option value="under10">折算 ≤ ¥10/月（含年付小包）</option>
          <option value="10to20">¥10 – ¥20/月 档</option>
          <option value="over20">¥20+/月 档</option>
          <option value="onetime">含一次性不限时流量包</option>
        </select>

        <select v-model="clientMode" aria-label="客户端兼容筛选" class="brand-filter__select">
          <option value="all">全部客户端模式</option>
          <option value="thirdparty">支持第三方订阅（Clash/小火箭等）</option>
          <option value="exclusive">仅支持品牌专属客户端</option>
        </select>

        <select v-model="protocol" aria-label="协议筛选" class="brand-filter__select">
          <option value="all">全部协议</option>
          <option value="VLESS">VLESS</option>
          <option value="Trojan">Trojan</option>
          <option value="Shadowsocks">Shadowsocks</option>
          <option value="Hysteria">Hysteria 2</option>
        </select>

        <select v-model="region" aria-label="地区筛选" class="brand-filter__select">
          <option value="all">全部地区节点</option>
          <option value="香港">含香港节点</option>
          <option value="日本">含日本节点</option>
          <option value="新加坡">含新加坡节点</option>
          <option value="美国">含美国节点</option>
          <option value="台湾">含台湾节点</option>
        </select>

        <select v-model="evidenceFilter" aria-label="实测资料状态筛选" class="brand-filter__select">
          <option value="all">全部资料状态</option>
          <option value="hasTests">含测速历史/实测记录</option>
          <option value="measured">仅含站长归档实测摘要</option>
          <option value="vendorOnly">暂无测速（仅文字参数）</option>
        </select>
      </div>

      <div class="brand-filter__stats">
        <span>当前匹配 <strong>{{ filteredBrands.length }}</strong> / {{ BRANDS.length }} 家去重品牌</span>
        <button type="button" class="brand-filter__reset" @click="resetFilters">重置筛选条件</button>
      </div>
    </div>

    <!-- 横向真实参数对比托盘 -->
    <div v-if="comparedBrands.length >= 2" class="compare-tray">
      <div class="compare-tray__head">
        <strong>横向参数对比（已选 {{ comparedBrands.length }}/3 家，点击卡片“加入对比”可切换）</strong>
      </div>
      <div class="compare-tray__table-wrap">
        <table class="compare-tray__table">
          <thead>
            <tr>
              <th>对比维度</th>
              <th v-for="b in comparedBrands" :key="b.slug">
                <a :href="`/brands/${b.slug}/`">{{ b.name }}</a>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>真实月付最低</td>
              <td v-for="b in comparedBrands" :key="b.slug + '-m'">
                {{ getMinTrueMonthly(b) < 9999 ? `¥${getMinTrueMonthly(b)}/月` : '无常规月付/待核实' }}
              </td>
            </tr>
            <tr>
              <td>年付折算最低</td>
              <td v-for="b in comparedBrands" :key="b.slug + '-y'">
                {{ getMinEquivPrice(b) < 9999 ? `约 ¥${getMinEquivPrice(b)}/月（折算）` : '待核实' }}
              </td>
            </tr>
            <tr>
              <td>客户端支持</td>
              <td v-for="b in comparedBrands" :key="b.slug + '-c'">{{ b.clientMode }}</td>
            </tr>
            <tr>
              <td>标注协议</td>
              <td v-for="b in comparedBrands" :key="b.slug + '-p'">{{ b.protocols.join(' / ') }}</td>
            </tr>
            <tr>
              <td>资料与测速证据</td>
              <td v-for="b in comparedBrands" :key="b.slug + '-e'">
                {{ b.testRuns.length ? (b.testRuns[0].evidence === 'measured' ? '含归档实测摘要' : '仅2026-10-19历史汇总') : '暂无测速数据' }}
              </td>
            </tr>
            <tr>
              <td>推广入口</td>
              <td v-for="b in comparedBrands" :key="b.slug + '-cta'">
                <AffiliateButton :slug="b.slug" compact :show-disclosure="false" label="注册入口" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="filteredBrands.length" class="brand-grid diw-grid-2">
      <BrandCard
        v-for="brand in filteredBrands"
        :key="brand.slug"
        :brand="brand"
        show-compare-toggle
        :selected-for-compare="compareSlugs.includes(brand.slug)"
        @toggle-compare="toggleCompare"
      />
    </div>

    <div v-else class="brand-empty diw-card">
      <h4>未找到完全符合当前组合条件的机场品牌</h4>
      <p>部分品牌缺少公开的协议、地区或测速字段，因此未被纳入特定条件结果。你可以重置筛选或搜索品牌名称。</p>
      <button type="button" class="brand-filter__reset" @click="resetFilters">显示全部 31 家品牌</button>
    </div>
  </div>
</template>

<style scoped>
.brand-filter__notice {
  background: rgba(2, 132, 199, 0.08);
  border: 1px solid rgba(2, 132, 199, 0.24);
  border-radius: 10px;
  padding: 0.78rem 1rem;
  font-size: 0.85rem;
  line-height: 1.55;
  margin-bottom: 1rem;
}

.brand-filter__controls {
  background: var(--diw-surface-alt);
  border: 1px solid var(--diw-border);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.brand-filter__search-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 0.65rem;
}

.brand-filter__facets {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.55rem;
}

.brand-filter__input,
.brand-filter__select {
  width: 100%;
  padding: 0.52rem 0.72rem;
  border-radius: 8px;
  border: 1px solid var(--diw-border-strong);
  background: var(--diw-surface);
  color: var(--vp-c-text-1);
  font-size: 0.84rem;
}

.brand-filter__stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
  color: var(--vp-c-text-3);
}

.brand-filter__reset {
  padding: 0.34rem 0.75rem;
  border-radius: 7px;
  border: 1px solid var(--diw-border-strong);
  background: var(--diw-surface);
  color: var(--vp-c-text-1);
  font-size: 0.8rem;
  cursor: pointer;
}

.brand-filter__reset:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.compare-tray {
  border: 1px solid var(--diw-border);
  border-radius: 12px;
  background: var(--diw-surface);
  padding: 0.95rem 1rem;
  margin-bottom: 1.25rem;
}

.compare-tray__head {
  font-size: 0.88rem;
  margin-bottom: 0.65rem;
}

.compare-tray__table-wrap {
  overflow-x: auto;
}

.compare-tray__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.compare-tray__table th,
.compare-tray__table td {
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid var(--diw-border);
  text-align: left;
  min-width: 130px;
  white-space: nowrap;
}

.brand-empty {
  text-align: center;
  padding: 2rem 1rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

@media (max-width: 960px) {
  .brand-filter__facets {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .brand-filter__search-row,
  .brand-filter__facets {
    grid-template-columns: 1fr;
  }
}
</style>
