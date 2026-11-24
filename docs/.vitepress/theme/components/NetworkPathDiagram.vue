<script setup lang="ts">
import { computed } from 'vue'
import { BRAND_BY_SLUG } from '../../data/brands'

const props = defineProps<{
  slug?: string
}>()

const brand = computed(() => (props.slug ? BRAND_BY_SLUG[props.slug] : null))
</script>

<template>
  <section class="obs-panel">
    <div class="obs-panel__header">
      <div>
        <h3 class="obs-panel__title">
          {{ brand ? `${brand.name} · ` : '' }}Network Path Observatory（原理示意 / 非实测）
        </h3>
        <div class="obs-panel__meta">
          将“通用隧道/专线架构原理”与“当前品牌实际可查验线路证据”明确分离
        </div>
      </div>
      <span class="obs-status-pill obs-status-pill--historical">
        <span class="obs-dot"></span>
        Schematic Only · 原理示意
      </span>
    </div>

    <div class="path-flow" role="img" aria-label="客户端经境内入口与跨境传输至海外落地节点的原理示意图">
      <div class="path-node">
        <div class="path-node__tag">1. 终端客户端</div>
        <div class="path-node__title">桌面 / 移动 / 软路由</div>
        <div class="path-node__sub">
          {{ brand ? brand.protocols.join(' / ') : 'VLESS / Trojan / Hysteria 2' }}
        </div>
      </div>

      <div class="path-arrow">
        <span class="path-arrow__line"></span>
        <span class="path-arrow__text">TLS 加密传输</span>
      </div>

      <div class="path-node">
        <div class="path-node__tag">2. 境内接入层（原理）</div>
        <div class="path-node__title">BGP 入口 / 隧道中转</div>
        <div class="path-node__sub">跨网优化与入口容灾（视实际套餐）</div>
      </div>

      <div class="path-arrow path-arrow--thick">
        <span class="path-arrow__line"></span>
        <span class="path-arrow__text">跨境传输段（中转或专线）</span>
      </div>

      <div class="path-node">
        <div class="path-node__tag">3. 海外落地节点</div>
        <div class="path-node__title">香港 / 日本 / 新加坡 / 美国</div>
        <div class="path-node__sub">出口 IP 决定流媒体与 AI 风控结果</div>
      </div>
    </div>

    <div v-if="brand" class="path-evidence">
      <div class="path-evidence__title">当前品牌已知线路声明与证据分级（非本站独立验证）：</div>
      <ul>
        <li v-for="(r, i) in brand.routes" :key="i">
          <code>{{ r.evidence }}</code> · {{ r.label }}
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.path-flow {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  align-items: center;
  gap: 0.65rem;
}

.path-node {
  background: var(--diw-obs-card);
  border: 1px solid #293855;
  border-radius: 10px;
  padding: 0.75rem 0.85rem;
}

.path-node__tag {
  font-family: var(--vp-font-family-mono);
  font-size: 0.68rem;
  color: #38bdf8;
  margin-bottom: 0.25rem;
}

.path-node__title {
  font-weight: 700;
  font-size: 0.9rem;
  color: #f8fafc;
}

.path-node__sub {
  font-size: 0.74rem;
  color: #94a3b8;
  margin-top: 0.2rem;
}

.path-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 78px;
}

.path-arrow__line {
  width: 100%;
  height: 2px;
  background: #38bdf8;
  position: relative;
}

.path-arrow--thick .path-arrow__line {
  height: 4px;
  background: linear-gradient(90deg, #0ea5e9, #14b8a6);
}

.path-arrow__text {
  font-size: 0.68rem;
  color: #94a3b8;
  text-align: center;
}

.path-evidence {
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--diw-obs-border);
  font-size: 0.82rem;
  color: #cbd5e1;
}

.path-evidence__title {
  font-weight: 600;
  margin-bottom: 0.35rem;
  color: #f8fafc;
}

.path-evidence ul {
  margin: 0;
  padding-left: 1.2rem;
}

@media (max-width: 820px) {
  .path-flow {
    grid-template-columns: 1fr;
  }
  .path-arrow {
    flex-direction: row;
    justify-content: center;
    padding: 0.2rem 0;
  }
  .path-arrow__line {
    width: 32px;
  }
}
</style>
