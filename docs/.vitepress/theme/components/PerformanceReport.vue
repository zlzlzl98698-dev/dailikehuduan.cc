<script setup lang="ts">
import { computed } from 'vue'
import { BRAND_BY_SLUG } from '../../data/brands'

const props = withDefaults(defineProps<{
  slug: string
  demoMode?: boolean
}>(), {
  demoMode: false,
})

const brand = computed(() => BRAND_BY_SLUG[props.slug])

function barPercent(speedText: string, unit: string) {
  const num = parseFloat(speedText)
  if (Number.isNaN(num)) return 0
  if (unit === 'MB/s') return Math.min(100, Math.round((num / 100) * 100))
  return Math.min(100, Math.round((num / 600) * 100))
}
</script>

<template>
  <section v-if="brand" class="obs-panel">
    <div class="obs-panel__header">
      <div>
        <h3 class="obs-panel__title">
          {{ brand.name }} · Performance Monitoring Report
        </h3>
        <div class="obs-panel__meta">
          <template v-if="brand.testRuns.length">
            时间: {{ brand.testRuns[0].dateLabel }} · 条件: {{ brand.testRuns[0].condition }}
          </template>
          <template v-else>
            状态: 暂无可核验实测数据（Not Tested / Unknown）
          </template>
        </div>
      </div>

      <span
        class="obs-status-pill"
        :class="brand.testRuns.length ? `obs-status-pill--${brand.testRuns[0].evidence}` : 'obs-status-pill--unknown'"
      >
        <span class="obs-dot"></span>
        {{ brand.testRuns.length ? (brand.testRuns[0].evidence === 'measured' ? 'Measured Archive' : 'Historical Data') : 'Not Tested' }}
      </span>
    </div>

    <template v-if="brand.testRuns.length">
      <div v-for="(run, idx) in brand.testRuns" :key="idx" class="perf-run">
        <div class="perf-env">
          测试环境说明：{{ run.environment }}
        </div>
        <div class="perf-rows">
          <div v-for="row in run.rows" :key="row.region" class="perf-row">
            <div class="perf-row__region">{{ row.region }}</div>
            <div class="perf-row__latency">
              {{ row.latencyMs !== null ? `${row.latencyMs} ms` : '延迟未量化' }}
            </div>
            <div class="perf-row__bar-track" aria-hidden="true">
              <div
                class="perf-row__bar-fill"
                :style="{
                  width: `${barPercent(row.downloadSpeed, row.speedUnit)}%`,
                  background: run.evidence === 'measured' ? '#10b981' : '#f59e0b',
                }"
              ></div>
            </div>
            <div class="perf-row__speed">{{ row.downloadSpeed }}</div>
          </div>
        </div>
        <div class="perf-disclaimer">
          数据口径声明：{{ run.summaryNote }}
        </div>
      </div>
    </template>

    <template v-else>
      <div class="perf-empty">
        <p class="perf-empty__headline">暂无可核验测试（No Verifiable Benchmark Recorded）</p>
        <p class="perf-empty__body">
          截至 {{ brand.verifiedAt }}，原始资料中未包含 {{ brand.name }} 的按地区延迟与带宽测量值。本站拒绝使用演示数值伪装实测榜单。建议您先使用月付/小额档位，按以下三项指标自行在晚高峰（20:00–23:30）复测：
        </p>
        <ul class="perf-checklist">
          <li>1. 单线程 HTTPS 请求延迟（TLS RTT / TTFB）与 15 分钟连续丢包率；</li>
          <li>2. 区分测速工具单位：<code>MB/s × 8 = Mbps</code>，勿将多线程峰值误判为单流稳定吞吐；</li>
          <li>3. 记录测试时的本地运营商（电信/联通/移动）与代理客户端内核版本。</li>
        </ul>
      </div>
    </template>
  </section>
</template>

<style scoped>
.perf-env {
  font-size: 0.78rem;
  color: var(--diw-obs-muted);
  margin-bottom: 0.85rem;
}

.perf-rows {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.perf-row {
  display: grid;
  grid-template-columns: 110px 92px 1fr 110px;
  align-items: center;
  gap: 0.75rem;
  background: var(--diw-obs-card);
  border: 1px solid var(--diw-obs-border);
  border-radius: 8px;
  padding: 0.55rem 0.8rem;
  font-size: 0.84rem;
}

.perf-row__region {
  font-weight: 600;
  color: #f8fafc;
}

.perf-row__latency,
.perf-row__speed {
  font-family: var(--vp-font-family-mono);
  font-size: 0.8rem;
  color: #cbd5e1;
}

.perf-row__speed {
  text-align: right;
  font-weight: 600;
}

.perf-row__bar-track {
  height: 8px;
  border-radius: 999px;
  background: #1e293b;
  overflow: hidden;
}

.perf-row__bar-fill {
  height: 100%;
  border-radius: 999px;
}

.perf-disclaimer {
  margin-top: 0.85rem;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  color: #fcd34d;
  font-size: 0.78rem;
  line-height: 1.5;
}

.perf-empty {
  background: var(--diw-obs-card);
  border: 1px dashed #334155;
  border-radius: 10px;
  padding: 1rem;
}

.perf-empty__headline {
  margin: 0 0 0.4rem;
  font-weight: 700;
  color: #f8fafc;
}

.perf-empty__body {
  margin: 0 0 0.65rem;
  font-size: 0.84rem;
  color: #cbd5e1;
  line-height: 1.6;
}

.perf-checklist {
  margin: 0;
  padding-left: 1.1rem;
  font-size: 0.8rem;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

@media (max-width: 640px) {
  .perf-row {
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem;
  }
  .perf-row__bar-track {
    grid-column: 1 / -1;
  }
  .perf-row__speed {
    text-align: left;
  }
}
</style>
