<script setup lang="ts">
import { ref, computed } from 'vue'
import { CLIENTS, OS_PLATFORMS, type OsPlatform } from '../../data/clients'

const selectedOs = ref<'all' | OsPlatform>('all')
const selectedKernel = ref<string>('all')
const thirdPartyOnly = ref<boolean>(false)
const freeOnly = ref<boolean>(false)
const openSourceOnly = ref<boolean>(false)
const difficultyFilter = ref<string>('all')

const filteredClients = computed(() => {
  return CLIENTS.filter((c) => {
    if (selectedOs.value !== 'all' && !c.platforms.includes(selectedOs.value)) return false
    if (selectedKernel.value !== 'all' && !c.kernel.toLowerCase().includes(selectedKernel.value.toLowerCase())) return false
    if (thirdPartyOnly.value && !c.supportsThirdPartySub) return false
    if (freeOnly.value && c.pricing !== '免费开源' && c.pricing !== '免费闭源') return false
    if (openSourceOnly.value && !c.openSource) return false
    if (difficultyFilter.value !== 'all' && c.difficulty !== difficultyFilter.value) return false
    return true
  })
})
</script>

<template>
  <section class="client-selector">
    <div class="client-selector__os-tabs" role="tablist" aria-label="按操作系统筛选客户端">
      <button
        type="button"
        class="os-tab"
        :class="{ 'is-active': selectedOs === 'all' }"
        @click="selectedOs = 'all'"
      >
        全部系统 ({{ CLIENTS.length }})
      </button>
      <button
        v-for="os in OS_PLATFORMS"
        :key="os.id"
        type="button"
        class="os-tab"
        :class="{ 'is-active': selectedOs === os.id }"
        @click="selectedOs = os.id"
      >
        {{ os.name }}
      </button>
    </div>

    <div class="client-selector__filters">
      <select v-model="selectedKernel" aria-label="按内核筛选" class="cs-select">
        <option value="all">全部代理内核</option>
        <option value="Mihomo">Mihomo (Clash.Meta)</option>
        <option value="sing-box">sing-box</option>
        <option value="Xray">Xray-core</option>
        <option value="私有">独立/私有核心</option>
      </select>

      <select v-model="difficultyFilter" aria-label="按入门难度筛选" class="cs-select">
        <option value="all">全部上手难度</option>
        <option value="新手友好">新手友好</option>
        <option value="进阶配置">进阶配置</option>
        <option value="专业/路由">专业 / 软路由</option>
      </select>

      <label class="cs-check">
        <input v-model="thirdPartyOnly" type="checkbox" />
        <span>支持第三方订阅</span>
      </label>

      <label class="cs-check">
        <input v-model="freeOnly" type="checkbox" />
        <span>免费软件</span>
      </label>

      <label class="cs-check">
        <input v-model="openSourceOnly" type="checkbox" />
        <span>开源可审计</span>
      </label>
    </div>

    <div class="diw-grid-2">
      <article v-for="c in filteredClients" :key="c.id" class="diw-card cs-card">
        <div class="cs-card__head">
          <div>
            <h3 class="cs-card__title">
              <a :href="c.tutorialUrl">{{ c.name }}</a>
            </h3>
            <div class="cs-card__kernel">内核：{{ c.kernel }} · 核实日期：{{ c.verifiedAt }}</div>
          </div>
          <span
            class="diw-badge"
            :class="c.maintenanceStatus === 'caution' ? 'diw-badge--amber' : 'diw-badge--teal'"
          >
            {{ c.maintenanceStatus === 'caution' ? '维护注意' : c.pricing }}
          </span>
        </div>

        <p class="cs-card__summary">{{ c.summary }}</p>

        <div class="cs-card__meta">
          <span>系统：{{ c.platforms.join(' / ') }}</span>
          <span>订阅格式：{{ c.subscriptionFormats.join('、') }}</span>
          <span>难度：{{ c.difficulty }} · 第三方订阅：{{ c.supportsThirdPartySub ? '支持' : '不支持' }}</span>
        </div>

        <div v-if="c.cautions.length" class="cs-card__caution">
          ⚠ {{ c.cautions[0] }}
        </div>

        <div class="cs-card__links">
          <a :href="c.tutorialUrl" class="cs-card__btn">安装与配置教程 →</a>
          <a
            :href="c.officialSourceUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="cs-card__repo"
          >
            {{ c.officialSourceVerified ? c.officialSourceLabel : `${c.officialSourceLabel}（待核实）` }} ↗
          </a>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.client-selector {
  margin: 1.25rem 0;
}

.client-selector__os-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.85rem;
}

.os-tab {
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  border: 1px solid var(--diw-border-strong);
  background: var(--diw-surface);
  color: var(--vp-c-text-2);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
}

.os-tab.is-active {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: #ffffff;
}

.client-selector__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  background: var(--diw-surface-alt);
  border: 1px solid var(--diw-border);
  border-radius: 10px;
  padding: 0.75rem 0.9rem;
  margin-bottom: 1rem;
}

.cs-select {
  padding: 0.42rem 0.65rem;
  border-radius: 7px;
  border: 1px solid var(--diw-border-strong);
  background: var(--diw-surface);
  color: var(--vp-c-text-1);
  font-size: 0.83rem;
}

.cs-check {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.83rem;
  cursor: pointer;
}

.cs-card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.cs-card__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.6rem;
}

.cs-card__title {
  margin: 0;
  font-size: 1.02rem;
}

.cs-card__title a {
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.cs-card__title a:hover {
  color: var(--vp-c-brand-1);
}

.cs-card__kernel {
  font-size: 0.76rem;
  color: var(--vp-c-text-3);
  margin-top: 0.15rem;
}

.cs-card__summary {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.55;
  color: var(--vp-c-text-2);
}

.cs-card__meta {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
  background: var(--diw-surface-alt);
  padding: 0.5rem 0.65rem;
  border-radius: 8px;
}

.cs-card__caution {
  font-size: 0.77rem;
  color: #b45309;
  background: rgba(245, 158, 11, 0.1);
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
}

.dark .cs-card__caution {
  color: #fbbf24;
}

.cs-card__links {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.4rem;
}

.cs-card__btn {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.cs-card__repo {
  font-size: 0.76rem;
  color: var(--vp-c-text-3);
  text-decoration: none;
}

.cs-card__repo:hover {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}
</style>
