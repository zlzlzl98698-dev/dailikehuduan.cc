<script setup lang="ts">
import { computed } from 'vue'
import type { BrandRecord } from '../../data/brands'
import AffiliateButton from './AffiliateButton.vue'

const props = withDefaults(defineProps<{
  brand: BrandRecord
  selectedForCompare?: boolean
  showCompareToggle?: boolean
}>(), {
  selectedForCompare: false,
  showCompareToggle: false,
})

const emit = defineEmits<{
  (e: 'toggleCompare', slug: string): void
}>()

const lowestMonthlyPlan = computed(() => {
  const monthly = props.brand.plans.filter((p) => p.billingCycle === '月付')
  if (!monthly.length) return null
  return monthly.reduce((min, cur) => (cur.price < min.price ? cur : min), monthly[0])
})

const lowestAnnualEquiv = computed(() => {
  const yearly = props.brand.plans.filter((p) => p.billingCycle === '年付' && p.monthlyEquivalent)
  if (!yearly.length) return null
  return yearly.reduce((min, cur) => ((cur.monthlyEquivalent || 999) < (min.monthlyEquivalent || 999) ? cur : min), yearly[0])
})
</script>

<template>
  <article class="brand-card diw-card" :style="{ '--card-accent': brand.accentColor }">
    <div class="brand-card__head">
      <div class="brand-card__title-wrap">
        <img
          v-if="brand.logo"
          :src="brand.logo"
          :alt="`${brand.name} Logo`"
          width="38"
          height="38"
          loading="lazy"
          class="brand-card__logo"
        />
        <div v-else class="brand-card__mono" aria-hidden="true">{{ brand.name.slice(0, 2) }}</div>
        <div>
          <h3 class="brand-card__name">
            <a :href="`/brands/${brand.slug}/`">{{ brand.name }}</a>
          </h3>
          <div class="brand-card__meta">
            {{ brand.foundedYear }} · 完整度：{{ brand.completeness }}
          </div>
        </div>
      </div>

      <span v-if="brand.isFeatured" class="diw-badge diw-badge--blue">
        编辑精选 #{{ brand.editorialPriority }}
      </span>
      <span v-else class="diw-badge diw-badge--slate">
        收录 #{{ brand.editorialPriority }}
      </span>
    </div>

    <p class="brand-card__summary">{{ brand.summary }}</p>

    <div class="brand-card__specs">
      <div class="brand-card__spec">
        <span>年付折算</span>
        <strong>{{ lowestAnnualEquiv ? `约 ¥${lowestAnnualEquiv.monthlyEquivalent}/月` : '暂无年付数据' }}</strong>
      </div>
      <div class="brand-card__spec">
        <span>真实月付</span>
        <strong>{{ lowestMonthlyPlan ? `¥${lowestMonthlyPlan.price}/月 起` : '仅年付/待核实' }}</strong>
      </div>
      <div class="brand-card__spec">
        <span>客户端</span>
        <strong>{{ brand.clientMode }}</strong>
      </div>
      <div class="brand-card__spec">
        <span>数据状态</span>
        <strong>{{ brand.dataStatus === 'historical' ? '历史快照' : '品牌资料' }} · {{ brand.testRuns.length ? '含测速参考' : '无测速' }}</strong>
      </div>
    </div>

    <div class="brand-card__tags">
      <span v-for="tag in brand.categoryTags.slice(0, 3)" :key="tag" class="diw-badge">{{ tag }}</span>
    </div>

    <div class="brand-card__actions">
      <a :href="`/brands/${brand.slug}/`" class="brand-card__detail-link">查看评测与套餐详情 →</a>
      <button
        v-if="showCompareToggle"
        type="button"
        class="brand-card__compare-btn"
        :class="{ 'is-selected': selectedForCompare }"
        @click="emit('toggleCompare', brand.slug)"
      >
        {{ selectedForCompare ? '✓ 已加入对比' : '+ 加入对比' }}
      </button>
    </div>

    <AffiliateButton :slug="brand.slug" compact :show-disclosure="false" />
  </article>
</template>

<style scoped>
.brand-card {
  display: flex;
  flex-direction: column;
  gap: 0.72rem;
  border-top: 3px solid var(--card-accent, var(--vp-c-brand-1));
}

.brand-card__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.6rem;
}

.brand-card__title-wrap {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.brand-card__logo {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--diw-border);
  flex-shrink: 0;
}

.brand-card__mono {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--card-accent, #0284c7), #0f172a);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-card__name {
  margin: 0;
  font-size: 1.05rem;
}

.brand-card__name a {
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.brand-card__name a:hover {
  color: var(--vp-c-brand-1);
}

.brand-card__meta {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
}

.brand-card__summary {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.55;
  color: var(--vp-c-text-2);
}

.brand-card__specs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
  background: var(--diw-surface-alt);
  border: 1px solid var(--diw-border);
  border-radius: 8px;
  padding: 0.55rem 0.65rem;
}

.brand-card__spec {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  font-size: 0.76rem;
}

.brand-card__spec span {
  color: var(--vp-c-text-3);
}

.brand-card__spec strong {
  color: var(--vp-c-text-1);
}

.brand-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.brand-card__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.35rem;
  border-top: 1px dashed var(--diw-border);
}

.brand-card__detail-link {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.brand-card__detail-link:hover {
  text-decoration: underline;
}

.brand-card__compare-btn {
  padding: 0.28rem 0.6rem;
  border-radius: 6px;
  border: 1px solid var(--diw-border-strong);
  background: var(--diw-surface-alt);
  color: var(--vp-c-text-2);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}

.brand-card__compare-btn.is-selected {
  background: var(--diw-accent-teal-soft);
  border-color: var(--diw-accent-teal);
  color: var(--diw-accent-teal);
}
</style>
