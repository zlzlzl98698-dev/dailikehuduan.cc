<script setup lang="ts">
import { computed } from 'vue'
import { BRAND_BY_SLUG, type BrandServiceStatus } from '../../data/brands'

const props = defineProps<{
  slug: string
}>()

const brand = computed(() => BRAND_BY_SLUG[props.slug])

function badgeInfo(item: BrandServiceStatus) {
  switch (item.status) {
    case 'confirmed':
      return { text: '历史实测支持', cls: 'pill--confirmed' }
    case 'vendor':
      return { text: '品牌方宣称', cls: 'pill--vendor' }
    case 'conditional':
      return { text: '视节点/地区', cls: 'pill--conditional' }
    case 'failed':
      return { text: '实测失败', cls: 'pill--failed' }
    default:
      return { text: '待核实', cls: 'pill--unknown' }
  }
}
</script>

<template>
  <section v-if="brand" class="obs-panel">
    <div class="obs-panel__header">
      <div>
        <h3 class="obs-panel__title">{{ brand.name }} · Service Availability Matrix</h3>
        <div class="obs-panel__meta">
          严格区分「已证实实测」「品牌方宣称」「受条件限制」与「待核实」，不以宣传替代实测
        </div>
      </div>
    </div>

    <div class="matrix-section">
      <div class="matrix-heading">AI 生产力平台兼容性</div>
      <div class="matrix-grid">
        <div v-for="item in brand.aiServices" :key="item.service" class="matrix-cell">
          <div class="matrix-cell__top">
            <span class="matrix-cell__name">{{ item.service }}</span>
            <span class="matrix-pill" :class="badgeInfo(item).cls">
              {{ badgeInfo(item).text }}
            </span>
          </div>
          <div class="matrix-cell__note">{{ item.note }}</div>
        </div>
      </div>
    </div>

    <div class="matrix-section">
      <div class="matrix-heading">流媒体与跨区服务兼容性</div>
      <div class="matrix-grid">
        <div v-for="item in brand.streaming" :key="item.service" class="matrix-cell">
          <div class="matrix-cell__top">
            <span class="matrix-cell__name">{{ item.service }}</span>
            <span class="matrix-pill" :class="badgeInfo(item).cls">
              {{ badgeInfo(item).text }}
            </span>
          </div>
          <div class="matrix-cell__note">{{ item.note }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.matrix-section + .matrix-section {
  margin-top: 1.1rem;
}

.matrix-heading {
  font-size: 0.78rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.6rem;
}

.matrix-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
}

.matrix-cell {
  background: var(--diw-obs-card);
  border: 1px solid var(--diw-obs-border);
  border-radius: 9px;
  padding: 0.65rem 0.75rem;
}

.matrix-cell__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.35rem;
}

.matrix-cell__name {
  font-weight: 600;
  font-size: 0.88rem;
  color: #f8fafc;
}

.matrix-cell__note {
  font-size: 0.74rem;
  line-height: 1.45;
  color: #94a3b8;
}

.matrix-pill {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.14rem 0.48rem;
  border-radius: 999px;
  white-space: nowrap;
}

.pill--confirmed {
  background: rgba(16, 185, 129, 0.16);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.pill--vendor {
  background: rgba(56, 189, 248, 0.14);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.32);
}

.pill--conditional {
  background: rgba(245, 158, 11, 0.14);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.32);
}

.pill--failed {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.35);
}

.pill--unknown {
  background: rgba(148, 163, 184, 0.14);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

@media (max-width: 768px) {
  .matrix-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .matrix-grid {
    grid-template-columns: 1fr;
  }
}
</style>
