<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vitepress'
import { BRANDS, BRAND_BY_SLUG } from '../../data/brands'
import contentIndex from '../../data/content-index.json'

interface ContentEntry {
  url: string
  pillar: string
  title: string
  h1: string
  description: string
  parentTopic: string | null
  primaryKeyword: string | null
  searchIntent: string | null
  category: string | null
  relatedSlugs: string[]
  relatedBrands: string[]
  lastUpdated: string
  hanChars: number
}

const route = useRoute()

const normalizedRoute = computed(() => {
  let p = route.path.replace(/\.html$/, '')
  if (p !== '/' && !p.endsWith('/')) p += '/'
  return p
})

const entries = (contentIndex as { entries: ContentEntry[] }).entries || []
const byUrl = computed(() => {
  const m = new Map<string, ContentEntry>()
  for (const e of entries) m.set(e.url, e)
  return m
})

const currentEntry = computed(() => byUrl.value.get(normalizedRoute.value) || null)

const isHome = computed(() => normalizedRoute.value === '/')
const isBrandCommercial = computed(() => {
  const parts = normalizedRoute.value.split('/').filter(Boolean)
  return parts[0] === 'brands' && parts.length === 2 && Boolean(BRAND_BY_SLUG[parts[1]])
})
const isBrandReview = computed(() => {
  const parts = normalizedRoute.value.split('/').filter(Boolean)
  return parts[0] === 'reviews' && parts.length === 2 && Boolean(BRAND_BY_SLUG[parts[1]])
})
const isComparePage = computed(() => {
  const parts = normalizedRoute.value.split('/').filter(Boolean)
  return parts[0] === 'compare' && parts.length === 2
})
const isReviewsHub = computed(() => normalizedRoute.value === '/brands/reviews/')
const isComparisonsHub = computed(() => normalizedRoute.value === '/brands/comparisons/')

const childL3Articles = computed(() => {
  if (isHome.value) return []
  return entries.filter(
    (e) =>
      e.parentTopic === normalizedRoute.value &&
      !e.url.startsWith('/reviews/') &&
      !e.url.startsWith('/compare/') &&
      e.url !== normalizedRoute.value
  )
})

const publishedReviews = computed(() =>
  entries.filter((e) => e.url.startsWith('/reviews/') && e.url.split('/').filter(Boolean).length === 2)
)

const publishedComparisons = computed(() =>
  entries.filter((e) => e.url.startsWith('/compare/') && e.url.split('/').filter(Boolean).length === 2)
)

const currentBrandSlug = computed(() => {
  const parts = normalizedRoute.value.split('/').filter(Boolean)
  if ((parts[0] === 'brands' || parts[0] === 'reviews') && parts[1] && BRAND_BY_SLUG[parts[1]]) {
    return parts[1]
  }
  return null
})

const currentBrand = computed(() => (currentBrandSlug.value ? BRAND_BY_SLUG[currentBrandSlug.value] : null))

const matchingComparisons = computed(() => {
  const slug = currentBrandSlug.value
  if (!slug) return []
  return publishedComparisons.value.filter(
    (c) => c.relatedBrands.includes(slug) || c.url.includes(slug)
  )
})

const parentEntry = computed(() => {
  const pt = currentEntry.value?.parentTopic
  return pt ? byUrl.value.get(pt) || { url: pt, title: '所属上级专题' } : null
})

const relatedArticles = computed(() => {
  const e = currentEntry.value
  if (!e || !e.relatedSlugs?.length) return []
  return e.relatedSlugs
    .map((u) => byUrl.value.get(u.endsWith('/') ? u : `${u}/`))
    .filter((item): item is ContentEntry => Boolean(item && item.url !== normalizedRoute.value))
    .slice(0, 6)
})

const relatedBrandLinks = computed(() => {
  const slugs = currentEntry.value?.relatedBrands || []
  return slugs
    .map((s) => BRAND_BY_SLUG[s])
    .filter(Boolean)
    .slice(0, 4)
    .map((b) => ({
      slug: b.slug,
      name: b.name,
      reviewExists: byUrl.value.has(`/reviews/${b.slug}/`),
      reviewUrl: `/reviews/${b.slug}/`,
      commercialUrl: `/brands/${b.slug}/`,
    }))
})

const hasAnyPanel = computed(() => {
  if (isHome.value) return false
  return Boolean(
    childL3Articles.value.length > 0 ||
      (isReviewsHub.value && publishedReviews.value.length > 0) ||
      (isComparisonsHub.value && publishedComparisons.value.length > 0) ||
      isBrandCommercial.value ||
      isBrandReview.value ||
      isComparePage.value ||
      relatedArticles.value.length > 0 ||
      (parentEntry.value && !isBrandReview.value && !isBrandCommercial.value)
  )
})
</script>

<template>
  <aside v-if="hasAnyPanel" class="diw-cross-links" aria-label="延伸阅读与相关入口">
    <!-- 1. L2 Topic Hub -> Published Child L3 Articles -->
    <div v-if="childL3Articles.length > 0" class="diw-cross-block">
      <h2 class="diw-cross-heading">本专题已发布三级深度指南（{{ childL3Articles.length }} 篇）</h2>
      <div class="diw-cross-grid">
        <a v-for="item in childL3Articles" :key="item.url" :href="item.url" class="diw-cross-card">
          <div class="diw-cross-card__title">{{ item.h1 || item.title }}</div>
          <div class="diw-cross-card__desc">{{ item.description }}</div>
        </a>
      </div>
    </div>

    <!-- 2. /brands/reviews/ -> All Published Brand Reviews -->
    <div v-if="isReviewsHub && publishedReviews.length > 0" class="diw-cross-block">
      <h2 class="diw-cross-heading">已上线品牌独立深度评测（{{ publishedReviews.length }} / {{ BRANDS.length }} 家）</h2>
      <div class="diw-cross-grid diw-cross-grid--compact">
        <a v-for="rev in publishedReviews" :key="rev.url" :href="rev.url" class="diw-cross-pill">
          {{ rev.h1 || rev.title }}
        </a>
      </div>
    </div>

    <!-- 3. /brands/comparisons/ -> All Published Brand Comparisons -->
    <div v-if="isComparisonsHub && publishedComparisons.length > 0" class="diw-cross-block">
      <h2 class="diw-cross-heading">已上线双品牌横向对比文章（{{ publishedComparisons.length }} 篇）</h2>
      <div class="diw-cross-grid">
        <a v-for="cmp in publishedComparisons" :key="cmp.url" :href="cmp.url" class="diw-cross-card">
          <div class="diw-cross-card__title">{{ cmp.h1 || cmp.title }}</div>
          <div class="diw-cross-card__desc">{{ cmp.description }}</div>
        </a>
      </div>
    </div>

    <!-- 4. Brand Commercial Page (/brands/<slug>/) <-> Review & Comparisons -->
    <div v-if="isBrandCommercial && currentBrand" class="diw-cross-block">
      <h2 class="diw-cross-heading">{{ currentBrand.name }} 评测与对比延伸入口</h2>
      <div class="diw-cross-actions">
        <a
          v-if="byUrl.has(`/reviews/${currentBrand.slug}/`)"
          :href="`/reviews/${currentBrand.slug}/`"
          class="diw-cross-btn diw-cross-btn--primary"
        >
          查看 {{ currentBrand.name }} 独立深度评测与冲突审计 →
        </a>
        <a
          v-for="cmp in matchingComparisons"
          :key="cmp.url"
          :href="cmp.url"
          class="diw-cross-btn"
        >
          {{ cmp.h1 || cmp.title }}
        </a>
        <a href="/brands/directory/" class="diw-cross-btn">返回 31 家品牌数据库筛选 →</a>
      </div>
    </div>

    <!-- 5. Brand Independent Review (/reviews/<slug>/) <-> Commercial & Comparisons -->
    <div v-if="isBrandReview && currentBrand" class="diw-cross-block">
      <h2 class="diw-cross-heading">{{ currentBrand.name }} 下一步决策与商业核验入口</h2>
      <div class="diw-cross-actions">
        <a :href="`/brands/${currentBrand.slug}/`" class="diw-cross-btn diw-cross-btn--primary">
          查看 {{ currentBrand.name }} 套餐价格、优惠码与官方注册入口 →
        </a>
        <a
          v-for="cmp in matchingComparisons"
          :key="cmp.url"
          :href="cmp.url"
          class="diw-cross-btn"
        >
          {{ cmp.h1 || cmp.title }}
        </a>
        <a href="/brands/reviews/" class="diw-cross-btn">全部品牌独立评测名录 →</a>
      </div>
    </div>

    <!-- 6. L3 Article Navigation: Parent Topic, Related Articles & Brand Reviews -->
    <div
      v-if="!isBrandCommercial && !isBrandReview && (parentEntry || relatedArticles.length || relatedBrandLinks.length)"
      class="diw-cross-block"
    >
      <div v-if="parentEntry" class="diw-cross-parent">
        所属专题中心：<a :href="parentEntry.url">{{ parentEntry.h1 || parentEntry.title }}</a>
      </div>

      <div v-if="relatedArticles.length" class="diw-cross-sub">
        <h3 class="diw-cross-subheading">相关延伸阅读</h3>
        <div class="diw-cross-grid">
          <a v-for="rel in relatedArticles" :key="rel.url" :href="rel.url" class="diw-cross-card">
            <div class="diw-cross-card__title">{{ rel.h1 || rel.title }}</div>
            <div class="diw-cross-card__desc">{{ rel.description }}</div>
          </a>
        </div>
      </div>

      <div v-if="relatedBrandLinks.length" class="diw-cross-sub">
        <h3 class="diw-cross-subheading">关联品牌评测与商业详情（仅供对照核验）</h3>
        <div class="diw-cross-actions">
          <template v-for="rb in relatedBrandLinks" :key="rb.slug">
            <a v-if="rb.reviewExists" :href="rb.reviewUrl" class="diw-cross-btn">
              {{ rb.name }} 独立评测
            </a>
            <a :href="rb.commercialUrl" class="diw-cross-btn">
              {{ rb.name }} 套餐详情
            </a>
          </template>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.diw-cross-links {
  margin-top: 2.25rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--vp-c-divider);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.diw-cross-heading {
  font-size: 1.08rem;
  font-weight: 700;
  margin: 0 0 0.85rem;
  color: var(--vp-c-text-1);
}

.diw-cross-subheading {
  font-size: 0.94rem;
  font-weight: 600;
  margin: 0.85rem 0 0.6rem;
  color: var(--vp-c-text-1);
}

.diw-cross-parent {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.diw-cross-parent a {
  font-weight: 600;
  color: var(--vp-c-brand-1);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.diw-cross-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.diw-cross-grid--compact {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem;
}

.diw-cross-card {
  display: block;
  padding: 0.85rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  transition: border-color 0.2s, transform 0.15s;
}

.diw-cross-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-1px);
}

.diw-cross-card__title {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}

.diw-cross-card__desc {
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.diw-cross-pill {
  display: block;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  font-size: 0.84rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.diw-cross-pill:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.diw-cross-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.diw-cross-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 0.85rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.diw-cross-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.diw-cross-btn--primary {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

@media (max-width: 768px) {
  .diw-cross-grid,
  .diw-cross-grid--compact {
    grid-template-columns: 1fr;
  }
}
</style>
