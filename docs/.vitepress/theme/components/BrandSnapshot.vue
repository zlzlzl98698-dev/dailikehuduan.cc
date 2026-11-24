<script setup lang="ts">
import { computed } from 'vue'
import { BRAND_BY_SLUG } from '../../data/brands'
import AffiliateButton from './AffiliateButton.vue'

const props = defineProps<{
  slug: string
}>()

const brand = computed(() => BRAND_BY_SLUG[props.slug])

const statusTextMap: Record<string, string> = {
  measured: 'Measured Data / 含实测归档',
  vendor: 'Vendor Data / 品牌方资料',
  historical: 'Historical Snapshot / 历史快照',
  inferred: 'Inferred / 推断记录',
  unknown: 'Unknown / 待核实',
}
</script>

<template>
  <section v-if="brand" class="obs-panel snapshot" :style="{ '--brand-accent': brand.accentColor }">
    <div class="obs-panel__header">
      <div class="snapshot__identity">
        <img
          v-if="brand.logo"
          :src="brand.logo"
          :alt="`${brand.name} 品牌标识`"
          width="48"
          height="48"
          class="snapshot__logo"
        />
        <div v-else class="snapshot__monogram" aria-hidden="true">
          {{ brand.name.slice(0, 2) }}
        </div>
        <div>
          <h2 class="obs-panel__title">
            {{ brand.name }} · Infrastructure Service Snapshot
          </h2>
          <div class="obs-panel__meta">
            Slug: {{ brand.slug }} · 来源更新: {{ brand.sourceUpdatedAt }} · 站内核对: {{ brand.verifiedAt }}
          </div>
        </div>
      </div>

      <span class="obs-status-pill" :class="`obs-status-pill--${brand.dataStatus}`">
        <span class="obs-dot"></span>
        {{ statusTextMap[brand.dataStatus] || '待核实' }}
      </span>
    </div>

    <div class="snapshot__metrics">
      <div class="snapshot__metric">
        <span class="snapshot__k">运营起始标注</span>
        <span class="snapshot__v">{{ brand.foundedYear }}</span>
      </div>
      <div class="snapshot__metric">
        <span class="snapshot__k">客户端模式</span>
        <span class="snapshot__v">{{ brand.clientMode }}</span>
      </div>
      <div class="snapshot__metric">
        <span class="snapshot__k">协议标注</span>
        <span class="snapshot__v">{{ brand.protocols.join(' / ') }}</span>
      </div>
      <div class="snapshot__metric">
        <span class="snapshot__k">已知套餐档位</span>
        <span class="snapshot__v">{{ brand.plans.length }} 档（含待核实备注）</span>
      </div>
      <div class="snapshot__metric">
        <span class="snapshot__k">资料完整度</span>
        <span class="snapshot__v">{{ brand.completeness }}（{{ brand.isFeatured ? `编辑精选 #${brand.editorialPriority}` : '常规收录' }}）</span>
      </div>
      <div class="snapshot__metric">
        <span class="snapshot__k">信息源</span>
        <span class="snapshot__v">{{ brand.originalSource }}</span>
      </div>
    </div>

    <div class="snapshot__cta-wrap">
      <AffiliateButton :slug="brand.slug" />
    </div>
  </section>
</template>

<style scoped>
.snapshot {
  border-top: 3px solid var(--brand-accent, #0284c7);
}

.snapshot__identity {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.snapshot__logo {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  object-fit: cover;
  background: #1e293b;
  border: 1px solid #334155;
  flex-shrink: 0;
}

.snapshot__monogram {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--brand-accent, #0284c7), #0f172a);
  color: #f8fafc;
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #334155;
  flex-shrink: 0;
}

.snapshot__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.snapshot__metric {
  background: var(--diw-obs-card);
  border: 1px solid var(--diw-obs-border);
  border-radius: 9px;
  padding: 0.65rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.snapshot__k {
  font-size: 0.72rem;
  color: var(--diw-obs-muted);
}

.snapshot__v {
  font-size: 0.84rem;
  font-weight: 600;
  color: #f1f5f9;
  line-height: 1.4;
}

.snapshot__cta-wrap {
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--diw-obs-border);
}

.snapshot__cta-wrap :deep(.aff-cta__disclosure),
.snapshot__cta-wrap :deep(.aff-cta__coupon) {
  color: #cbd5e1;
}

.snapshot__cta-wrap :deep(.aff-cta__coupon) {
  background: #162238;
  border-color: #293855;
}

@media (max-width: 768px) {
  .snapshot__metrics {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .snapshot__metrics {
    grid-template-columns: 1fr;
  }
}
</style>
