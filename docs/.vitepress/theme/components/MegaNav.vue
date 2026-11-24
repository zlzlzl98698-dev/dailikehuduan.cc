<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vitepress'
import { NAV_CATEGORIES } from '../../data/navigation'

const props = withDefaults(defineProps<{
  mode?: 'desktop' | 'mobile'
}>(), {
  mode: 'desktop',
})

const route = useRoute()
const openId = ref<string | null>(null)
const expandedMobile = ref<Record<string, boolean>>({})
const navRef = ref<HTMLElement | null>(null)
let closeTimer: ReturnType<typeof setTimeout> | null = null

function clearTimer() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

function openCategory(id: string) {
  clearTimer()
  openId.value = id
}

function scheduleClose() {
  clearTimer()
  closeTimer = setTimeout(() => {
    openId.value = null
  }, 150)
}

function toggleCategory(id: string) {
  clearTimer()
  openId.value = openId.value === id ? null : id
}

function toggleMobileCategory(id: string) {
  expandedMobile.value[id] = !expandedMobile.value[id]
}

function isActive(link: string) {
  return route.path === link || route.path.startsWith(link)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    openId.value = null
  }
}

function handleClickOutside(e: MouseEvent) {
  if (navRef.value && !navRef.value.contains(e.target as Node)) {
    openId.value = null
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  clearTimer()
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <nav
    v-if="props.mode === 'desktop'"
    ref="navRef"
    class="mega-nav"
    aria-label="全站主导航（10 个核心栏目）"
  >
    <ul class="mega-nav__list">
      <li
        v-for="cat in NAV_CATEGORIES"
        :key="cat.id"
        class="mega-nav__item"
        @mouseenter="openCategory(cat.id)"
        @mouseleave="scheduleClose"
        @focusin="openCategory(cat.id)"
      >
        <div class="mega-nav__trigger-group" :class="{ 'is-active': isActive(cat.link), 'is-open': openId === cat.id }">
          <a
            class="mega-nav__link"
            :href="cat.link"
            @click="openId = null"
          >
            {{ cat.text }}
          </a>
          <button
            type="button"
            class="mega-nav__chevron"
            :aria-label="`展开 ${cat.text} 子栏目菜单`"
            :aria-expanded="openId === cat.id"
            :aria-controls="`mega-panel-${cat.id}`"
            @click.stop="toggleCategory(cat.id)"
          >
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <div
          v-show="openId === cat.id"
          :id="`mega-panel-${cat.id}`"
          class="mega-nav__panel"
          role="region"
          :aria-label="`${cat.text} 子栏目`"
          @mouseenter="clearTimer"
          @mouseleave="scheduleClose"
        >
          <div class="mega-nav__panel-head">
            <div>
              <a :href="cat.link" class="mega-nav__panel-title" @click="openId = null">
                {{ cat.text }}专题首页 →
              </a>
              <p class="mega-nav__panel-tagline">{{ cat.tagline }}</p>
            </div>
          </div>
          <div class="mega-nav__grid">
            <a
              v-for="sub in cat.subsections"
              :key="sub.link"
              :href="sub.link"
              class="mega-nav__sublink"
              @click="openId = null"
            >
              <span class="mega-nav__sublink-title">
                {{ sub.title }}
                <span v-if="sub.badge" class="diw-badge diw-badge--blue">{{ sub.badge }}</span>
              </span>
              <span class="mega-nav__sublink-desc">{{ sub.description }}</span>
            </a>
          </div>
          <div v-if="cat.extraGroups && cat.extraGroups.length" class="mega-nav__extras">
            <div v-for="grp in cat.extraGroups" :key="grp.text" class="mega-nav__extra-col">
              <div class="mega-nav__extra-title">{{ grp.text }}</div>
              <div class="mega-nav__extra-links">
                <a
                  v-for="item in grp.items"
                  :key="item.link"
                  :href="item.link"
                  class="mega-nav__extra-link"
                  @click="openId = null"
                >
                  {{ item.text }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </nav>

  <nav v-else class="mobile-mega-nav" aria-label="移动端二级折叠导航">
    <div v-for="cat in NAV_CATEGORIES" :key="cat.id" class="mobile-mega-nav__group">
      <div class="mobile-mega-nav__row">
        <a :href="cat.link" class="mobile-mega-nav__link" :class="{ 'is-active': isActive(cat.link) }">
          {{ cat.text }}
        </a>
        <button
          type="button"
          class="mobile-mega-nav__toggle"
          :aria-expanded="Boolean(expandedMobile[cat.id])"
          :aria-controls="`mobile-sub-${cat.id}`"
          :aria-label="`切换 ${cat.text} 子菜单`"
          @click="toggleMobileCategory(cat.id)"
        >
          <span>{{ expandedMobile[cat.id] ? '−' : '+' }}</span>
        </button>
      </div>
      <div v-show="expandedMobile[cat.id]" :id="`mobile-sub-${cat.id}`" class="mobile-mega-nav__sub">
        <a v-for="sub in cat.subsections" :key="sub.link" :href="sub.link" class="mobile-mega-nav__sublink">
          {{ sub.title }}
        </a>
        <template v-if="cat.extraGroups">
          <template v-for="grp in cat.extraGroups" :key="grp.text">
            <div class="mobile-mega-nav__extra-label">{{ grp.text }}</div>
            <a v-for="item in grp.items" :key="item.link" :href="item.link" class="mobile-mega-nav__sublink">
              {{ item.text }}
            </a>
          </template>
        </template>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.mega-nav {
  display: none;
  align-items: center;
  position: relative;
  max-width: 100%;
}

@media (min-width: 960px) {
  .mega-nav {
    display: flex;
    flex: 1 1 0%;
    min-width: 0;
    margin: 0 0.25rem;
    overflow: hidden;
  }
}

.mega-nav__list {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0.05rem;
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  overflow-x: auto;
  scrollbar-width: thin;
}

.mega-nav__list::-webkit-scrollbar {
  height: 3px;
}

.mega-nav__list::-webkit-scrollbar-thumb {
  background: var(--diw-border-strong);
  border-radius: 999px;
}

.mega-nav__item {
  position: static;
  flex: 0 0 auto;
}

.mega-nav__trigger-group {
  display: inline-flex;
  align-items: center;
  border-radius: 6px;
  transition: background-color 0.15s ease;
}

.mega-nav__trigger-group:hover,
.mega-nav__trigger-group.is-open {
  background: var(--vp-c-bg-alt);
}

.mega-nav__trigger-group.is-active .mega-nav__link {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.mega-nav__link {
  display: inline-block;
  padding: 0.3rem 0.08rem 0.3rem 0.28rem;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  text-decoration: none;
  white-space: nowrap;
}

.mega-nav__chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem 0.14rem 0.3rem 0.02rem;
  background: transparent;
  border: none;
  color: var(--vp-c-text-3);
  cursor: pointer;
}

.mega-nav__chevron:hover,
.mega-nav__chevron:focus-visible {
  color: var(--vp-c-brand-1);
}

.mega-nav__panel {
  position: fixed;
  top: var(--vp-nav-height, 64px);
  left: 50%;
  transform: translateX(-50%);
  width: min(920px, calc(100vw - 32px));
  background: var(--diw-surface);
  border: 1px solid var(--diw-border);
  border-radius: 14px;
  padding: 1.15rem 1.3rem;
  box-shadow: 0 24px 48px -18px rgba(15, 23, 42, 0.24);
  z-index: 60;
}

.mega-nav__panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 0.75rem;
  margin-bottom: 0.85rem;
  border-bottom: 1px solid var(--diw-border);
}

.mega-nav__panel-title {
  font-size: 0.96rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.mega-nav__panel-tagline {
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: var(--vp-c-text-3);
}

.mega-nav__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
}

.mega-nav__sublink {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.6rem 0.75rem;
  border-radius: 9px;
  border: 1px solid transparent;
  background: var(--diw-surface-alt);
  text-decoration: none;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.mega-nav__sublink:hover,
.mega-nav__sublink:focus-visible {
  border-color: var(--vp-c-brand-1);
  background: var(--diw-surface);
}

.mega-nav__sublink-title {
  font-size: 0.87rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.mega-nav__sublink-desc {
  font-size: 0.76rem;
  line-height: 1.42;
  color: var(--vp-c-text-3);
}

.mega-nav__extras {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 0.9rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--diw-border);
}

.mega-nav__extra-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--vp-c-text-3);
  margin-bottom: 0.45rem;
  text-transform: uppercase;
}

.mega-nav__extra-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.mega-nav__extra-link {
  font-size: 0.78rem;
  padding: 0.22rem 0.55rem;
  border-radius: 6px;
  border: 1px solid var(--diw-border);
  color: var(--vp-c-text-2);
  text-decoration: none;
}

.mega-nav__extra-link:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

/* Mobile Accordion */
.mobile-mega-nav {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.5rem 0 1rem;
  border-bottom: 1px solid var(--diw-border);
  margin-bottom: 0.75rem;
}

.mobile-mega-nav__group {
  border: 1px solid var(--diw-border);
  border-radius: 9px;
  overflow: hidden;
}

.mobile-mega-nav__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--diw-surface-alt);
}

.mobile-mega-nav__link {
  flex: 1;
  padding: 0.65rem 0.85rem;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.mobile-mega-nav__link.is-active {
  color: var(--vp-c-brand-1);
}

.mobile-mega-nav__toggle {
  width: 44px;
  height: 44px;
  border: none;
  border-left: 1px solid var(--diw-border);
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
}

.mobile-mega-nav__sub {
  display: flex;
  flex-direction: column;
  padding: 0.4rem 0.85rem 0.7rem;
  background: var(--diw-surface);
  gap: 0.3rem;
}

.mobile-mega-nav__sublink {
  padding: 0.38rem 0;
  font-size: 0.86rem;
  color: var(--vp-c-text-2);
  text-decoration: none;
  border-bottom: 1px dashed var(--diw-border);
}

.mobile-mega-nav__sublink:last-child {
  border-bottom: none;
}

.mobile-mega-nav__extra-label {
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--vp-c-text-3);
  margin-top: 0.4rem;
}
</style>
