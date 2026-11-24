<script setup lang="ts">
import { computed } from 'vue'
import { useData, useRoute } from 'vitepress'
import { NAV_CATEGORIES } from '../../data/navigation'
import { BRAND_BY_SLUG } from '../../data/brands'

const route = useRoute()
const { frontmatter, page } = useData()

interface Crumb {
  label: string
  link: string
}

const crumbs = computed<Crumb[]>(() => {
  const path = route.path
  if (path === '/' || path === '/404.html') return []

  const items: Crumb[] = [{ label: '首页', link: '/' }]
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 0) return []

  const topCat = NAV_CATEGORIES.find((c) => c.id === segments[0])
  if (topCat) {
    items.push({ label: topCat.text, link: topCat.link })
  } else if (segments[0] === 'reviews') {
    items.push({ label: '机场品牌', link: '/brands/' })
    items.push({ label: '品牌独立评测名录', link: '/brands/reviews/' })
  } else if (segments[0] === 'compare') {
    items.push({ label: '机场品牌', link: '/brands/' })
    items.push({ label: '品牌横向对比中心', link: '/brands/comparisons/' })
  }

  if (segments.length >= 2) {
    const fullSubLink = `/${segments[0]}/${segments[1]}/`
    const subMatch = topCat?.subsections.find((s) => s.link === fullSubLink)
    const brandMatch = segments[0] === 'brands' ? BRAND_BY_SLUG[segments[1]] : null
    const parentTopicPath = typeof frontmatter.value?.parentTopic === 'string' ? frontmatter.value.parentTopic : null
    const parentSubMatch =
      !subMatch && topCat && parentTopicPath
        ? topCat.subsections.find((s) => s.link === parentTopicPath)
        : null

    if (subMatch && path !== subMatch.link) {
      items.push({ label: subMatch.title, link: subMatch.link })
    } else if (parentSubMatch && path !== parentSubMatch.link) {
      items.push({ label: parentSubMatch.title, link: parentSubMatch.link })
    } else if (brandMatch && path !== `/brands/${brandMatch.slug}/`) {
      items.push({ label: brandMatch.name, link: `/brands/${brandMatch.slug}/` })
    }

    const currentTitle = frontmatter.value?.title || page.value?.title || segments[segments.length - 1]
    if (path !== topCat?.link) {
      items.push({ label: currentTitle, link: path })
    }
  }

  return items
})
</script>

<template>
  <nav v-if="crumbs.length > 1" class="diw-breadcrumbs" aria-label="面包屑导航">
    <ol>
      <li v-for="(item, idx) in crumbs" :key="item.link + idx">
        <a v-if="idx < crumbs.length - 1" :href="item.link">{{ item.label }}</a>
        <span v-else aria-current="page">{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.diw-breadcrumbs {
  margin-bottom: 1rem;
  font-size: 0.82rem;
  color: var(--vp-c-text-3);
}

.diw-breadcrumbs ol {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.diw-breadcrumbs li {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.diw-breadcrumbs li:not(:last-child)::after {
  content: '/';
  color: var(--diw-border-strong);
}

.diw-breadcrumbs a {
  color: var(--vp-c-text-2);
  text-decoration: none;
}

.diw-breadcrumbs a:hover {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}

.diw-breadcrumbs span {
  color: var(--vp-c-text-1);
  font-weight: 500;
}
</style>
