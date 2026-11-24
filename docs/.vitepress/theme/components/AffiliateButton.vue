<script setup lang="ts">
import { computed } from 'vue'
import { BRAND_BY_SLUG } from '../../data/brands'

const props = withDefaults(defineProps<{
  slug: string
  label?: string
  compact?: boolean
  showDisclosure?: boolean
}>(), {
  label: '',
  compact: false,
  showDisclosure: true,
})

const brand = computed(() => BRAND_BY_SLUG[props.slug])
const buttonText = computed(() => {
  if (props.label) return props.label
  if (!brand.value) return '品牌入口待核实'
  return brand.value.linkAnomaly
    ? `访问 ${brand.value.name} 历史入口（格式待核实）`
    : `前往 ${brand.value.name} 注册入口（含推广）`
})
</script>

<template>
  <div v-if="brand" class="aff-cta" :class="{ 'aff-cta--compact': props.compact }">
    <div class="aff-cta__actions">
      <a
        v-if="brand.affiliateUrl"
        :href="brand.affiliateUrl"
        target="_blank"
        rel="nofollow sponsored noopener noreferrer"
        class="aff-cta__btn"
        :class="{ 'aff-cta__btn--warn': brand.linkAnomaly }"
      >
        <span>{{ buttonText }}</span>
        <span aria-hidden="true">↗</span>
      </a>
      <span v-else class="aff-cta__disabled">暂无可用入口（待核实）</span>

      <span v-if="brand.coupon" class="aff-cta__coupon">
        资料优惠码：<code>{{ brand.coupon }}</code>
      </span>
    </div>

    <div v-if="brand.linkAnomaly && brand.linkAnomalyNote" class="aff-cta__anomaly">
      ⚠ 链接异常/历史入口提示：{{ brand.linkAnomalyNote }}
    </div>

    <p v-if="props.showDisclosure" class="aff-cta__disclosure">
      透明披露：含推广链接，通过链接注册可能为本站带来佣金，不影响用户支付价格；历史入口不保证当前官网实时可用。
    </p>
  </div>
</template>

<style scoped>
.aff-cta {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin: 0.85rem 0;
}

.aff-cta--compact {
  margin: 0.4rem 0 0;
}

.aff-cta__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}

.aff-cta__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.56rem 1.05rem;
  border-radius: 8px;
  background: var(--vp-c-brand-1);
  color: #ffffff !important;
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none !important;
  transition: background-color 0.15s ease, transform 0.12s ease;
}

.aff-cta__btn:hover {
  background: var(--vp-c-brand-2);
  transform: translateY(-1px);
}

.aff-cta__btn--warn {
  background: #b45309;
}

.aff-cta__btn--warn:hover {
  background: #92400e;
}

.aff-cta__disabled {
  display: inline-flex;
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  background: var(--diw-surface-alt);
  border: 1px solid var(--diw-border);
  font-size: 0.84rem;
  color: var(--vp-c-text-3);
}

.aff-cta__coupon {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  background: var(--diw-surface-alt);
  border: 1px solid var(--diw-border);
  padding: 0.3rem 0.65rem;
  border-radius: 7px;
}

.aff-cta__anomaly {
  font-size: 0.78rem;
  color: #b45309;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 7px;
  padding: 0.42rem 0.68rem;
}

.dark .aff-cta__anomaly {
  color: #fbbf24;
}

.aff-cta__disclosure {
  margin: 0;
  font-size: 0.74rem;
  line-height: 1.45;
  color: var(--vp-c-text-3);
}
</style>
