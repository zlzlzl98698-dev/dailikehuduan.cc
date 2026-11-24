<script setup lang="ts">
import { computed } from 'vue'
import { BRAND_BY_SLUG } from '../../data/brands'

const props = defineProps<{
  slug: string
}>()

const brand = computed(() => BRAND_BY_SLUG[props.slug])

const evidenceLabels: Record<string, string> = {
  measured: '实测记录',
  vendor: '品牌方资料',
  historical: '历史归档',
  inferred: '推断',
  unknown: '待核实',
}
</script>

<template>
  <section v-if="brand" class="plan-panel">
    <div class="plan-panel__head">
      <div>
        <h3 class="plan-panel__title">{{ brand.name }} 套餐价格与折算明细</h3>
        <p class="plan-panel__sub">
          严格区分「实际支付金额/周期」与「年付折算月均成本」；优惠码：<code>{{ brand.coupon || '暂无公开优惠码' }}</code>（{{ brand.couponTerms }}）
        </p>
      </div>
      <span class="diw-badge diw-badge--slate">资料更新：{{ brand.sourceUpdatedAt }}</span>
    </div>

    <div v-if="brand.plans.length" class="plan-table-wrap">
      <table class="plan-table">
        <thead>
          <tr>
            <th>套餐名称</th>
            <th>计费周期</th>
            <th>实付金额</th>
            <th>折算月均</th>
            <th>流量与刷新周期</th>
            <th>倍率</th>
            <th>证据状态与备注</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(plan, idx) in brand.plans" :key="plan.name + idx">
            <td><strong>{{ plan.name }}</strong></td>
            <td><span class="diw-badge diw-badge--blue">{{ plan.billingCycle }}</span></td>
            <td class="mono">¥{{ plan.price }}</td>
            <td class="mono">
              <template v-if="plan.billingCycle === '月付'">¥{{ plan.price }}/月（真月付）</template>
              <template v-else-if="plan.monthlyEquivalent">约 ¥{{ plan.monthlyEquivalent }}/月（折算）</template>
              <template v-else>一次性流量包</template>
            </td>
            <td>{{ plan.trafficLabel }} · {{ plan.resetCycle }}</td>
            <td>{{ plan.multiplier }}</td>
            <td>
              <span class="diw-badge" :class="plan.evidence === 'historical' ? 'diw-badge--amber' : 'diw-badge--slate'">
                {{ evidenceLabels[plan.evidence] || '待核实' }}
              </span>
              <div v-if="plan.notes" class="plan-note">{{ plan.notes }}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="plan-empty">资料不足，当前品牌暂无可核验的完整套餐表格，请以官方最新结算页面为准。</p>
  </section>
</template>

<style scoped>
.plan-panel {
  border: 1px solid var(--diw-border);
  border-radius: 12px;
  background: var(--diw-surface);
  padding: 1.1rem;
  margin: 1.25rem 0;
}

.plan-panel__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.plan-panel__title {
  margin: 0;
  font-size: 1.04rem;
}

.plan-panel__sub {
  margin: 0.3rem 0 0;
  font-size: 0.82rem;
  color: var(--vp-c-text-3);
}

.plan-table-wrap {
  overflow-x: auto;
}

.plan-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.plan-table th,
.plan-table td {
  padding: 0.62rem 0.7rem;
  border-bottom: 1px solid var(--diw-border);
  text-align: left;
  vertical-align: top;
}

.plan-table th {
  background: var(--diw-surface-alt);
  font-weight: 600;
  white-space: nowrap;
}

.mono {
  font-family: var(--vp-font-family-mono);
  white-space: nowrap;
}

.plan-note {
  margin-top: 0.25rem;
  font-size: 0.76rem;
  color: var(--vp-c-text-3);
}

.plan-empty {
  margin: 0.5rem 0 0;
  color: var(--vp-c-text-3);
}
</style>
