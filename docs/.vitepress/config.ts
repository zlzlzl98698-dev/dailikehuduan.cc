import { defineConfig, type HeadConfig } from 'vitepress'
import { buildVitePressNav, buildVitePressSidebar } from './data/navigation'
import { BRAND_BY_SLUG } from './data/brands'

const SITE_URL = (process.env.SITE_URL || 'https://dailikehuduan.cc/').replace(/\/+$/, '')

const hasAlgoliaCreds = Boolean(
  process.env.VITE_ALGOLIA_APP_ID &&
  process.env.VITE_ALGOLIA_API_KEY &&
  process.env.VITE_ALGOLIA_INDEX_NAME
)

function routeFromRelativePath(relativePath: string): string {
  let route = '/' + relativePath.replace(/\\/g, '/')
  route = route.replace(/(^|\/)index\.md$/, '$1')
  route = route.replace(/\.md$/, '')
  if (route !== '/' && !route.endsWith('/')) {
    route += '/'
  }
  return route
}

export default defineConfig({
  lang: 'zh-CN',
  title: '代理客户端',
  titleTemplate: ':title｜代理客户端 dailikehuduan.cc',
  description: '原创网络代理客户端文档知识库、全平台安装与配置教程、TUN/DNS 故障排查手册及 31 家机场品牌可核验资料库。',
  base: '/',
  cleanUrls: true,
  lastUpdated: true,

  sitemap: {
    hostname: `${SITE_URL}/`,
    lastmodDateOnly: true,
    transformItems: (items) => {
      return items.filter((item) => {
        if (item.url.includes('404')) return false
        if (item.url.startsWith('audit/')) return false
        return true
      })
    },
  },

  markdown: {
    lineNumbers: false,
  },

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico?v=4', sizes: 'any' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon.png?v=4' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg?v=4' }],
    ['link', { rel: 'apple-touch-icon', href: '/images/site-avatar.png?v=4' }],
    ['meta', { name: 'theme-color', content: '#0284c7' }],
    ['meta', { name: 'robots', content: 'index, follow' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: '代理客户端 dailikehuduan.cc' }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ['meta', { property: 'og:image', content: `${SITE_URL}/images/site-avatar.webp` }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['meta', { name: 'twitter:image', content: `${SITE_URL}/images/site-avatar.webp` }],
    ...(process.env.GOOGLE_SITE_VERIFICATION
      ? ([['meta', { name: 'google-site-verification', content: process.env.GOOGLE_SITE_VERIFICATION }]] as HeadConfig[])
      : []),
    ...(process.env.BING_SITE_VERIFICATION
      ? ([['meta', { name: 'msvalidate.01', content: process.env.BING_SITE_VERIFICATION }]] as HeadConfig[])
      : []),
    ...(process.env.BAIDU_SITE_VERIFICATION
      ? ([['meta', { name: 'baidu-site-verification', content: process.env.BAIDU_SITE_VERIFICATION }]] as HeadConfig[])
      : []),
    ...(process.env.SHENMA_SITE_VERIFICATION
      ? ([['meta', { name: 'shenma-site-verification', content: process.env.SHENMA_SITE_VERIFICATION }]] as HeadConfig[])
      : []),
  ],

  themeConfig: {
    siteTitle: '代理客户端',
    logo: '/images/site-avatar.webp',
    nav: buildVitePressNav(),
    sidebar: buildVitePressSidebar(),
    outline: {
      level: [2, 3],
      label: '本页目录',
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },
    lastUpdated: {
      text: '最近更新',
    },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '栏目目录',
    darkModeSwitchLabel: '外观模式',
    search: hasAlgoliaCreds
      ? {
          provider: 'algolia',
          options: {
            appId: process.env.VITE_ALGOLIA_APP_ID!,
            apiKey: process.env.VITE_ALGOLIA_API_KEY!,
            indexName: process.env.VITE_ALGOLIA_INDEX_NAME!,
            placeholder: '搜索客户端、报错代码、配置或机场品牌...',
          },
        }
      : {
          provider: 'local',
          options: {
            translations: {
              button: {
                buttonText: '搜索文档与品牌',
                buttonAriaLabel: '搜索站内文档与品牌资料',
              },
              modal: {
                noResultsText: '未找到匹配内容，请尝试客户端名称、报错关键词或品牌名',
                resetButtonTitle: '清空搜索',
                footer: {
                  selectText: '打开',
                  navigateText: '切换',
                  closeText: '关闭',
                },
              },
            },
          },
        },
  },

  transformHead({ pageData }) {
    const heads: HeadConfig[] = []
    const route = routeFromRelativePath(pageData.relativePath)
    const canonical = `${SITE_URL}${route}`
    const fm = pageData.frontmatter || {}
    const title = pageData.title || '代理客户端'
    const description =
      pageData.description ||
      fm.description ||
      '代理客户端文档知识库、客户端安装教程、故障排查手册与机场品牌评测数据库。'

    heads.push(['link', { rel: 'canonical', href: canonical }])
    heads.push(['meta', { property: 'og:title', content: title }])
    heads.push(['meta', { property: 'og:description', content: description }])
    heads.push(['meta', { property: 'og:url', content: canonical }])
    heads.push([
      'meta',
      {
        property: 'og:image',
        content: fm.cover ? `${SITE_URL}${fm.cover}` : `${SITE_URL}/images/site-avatar.webp`,
      },
    ])
    heads.push(['meta', { name: 'twitter:title', content: title }])
    heads.push(['meta', { name: 'twitter:description', content: description }])
    heads.push([
      'meta',
      {
        name: 'twitter:image',
        content: fm.cover ? `${SITE_URL}${fm.cover}` : `${SITE_URL}/images/site-avatar.webp`,
      },
    ])

    if (fm.date) {
      try {
        heads.push([
          'meta',
          {
            property: 'article:published_time',
            content: new Date(fm.date).toISOString(),
          },
        ])
      } catch {}
    }
    if (fm.lastUpdated) {
      try {
        heads.push([
          'meta',
          {
            property: 'article:modified_time',
            content: new Date(fm.lastUpdated).toISOString(),
          },
        ])
      } catch {}
    }
    if (fm.author) {
      heads.push(['meta', { property: 'article:author', content: String(fm.author) }])
    }
    if (fm.category) {
      heads.push(['meta', { property: 'article:section', content: String(fm.category) }])
    }
    if (Array.isArray(fm.tags)) {
      for (const tag of fm.tags) {
        heads.push(['meta', { property: 'article:tag', content: String(tag) }])
      }
    }

    const schemas: Record<string, any>[] = []

    if (route === '/') {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: '代理客户端',
        url: `${SITE_URL}/`,
        inLanguage: 'zh-CN',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/brands/directory/?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      })
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: '代理客户端',
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/images/site-avatar.webp`,
      })
    } else {
      const parts = route.split('/').filter(Boolean)
      const crumbList = [
        {
          '@type': 'ListItem',
          position: 1,
          name: '首页',
          item: `${SITE_URL}/`,
        },
      ]
      let acc = ''
      parts.forEach((seg, idx) => {
        acc += `/${seg}`
        crumbList.push({
          '@type': 'ListItem',
          position: idx + 2,
          name: idx === parts.length - 1 ? title : seg,
          item: `${SITE_URL}${acc}/`,
        })
      })
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: crumbList,
      })

      if (fm.schemaType === 'SoftwareApplication' && fm.appName) {
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: fm.appName,
          operatingSystem: fm.operatingSystem || 'Cross-platform',
          applicationCategory: 'NetworkingApplication',
          url: canonical,
          offers: fm.isFree
            ? { '@type': 'Offer', price: '0', priceCurrency: 'CNY' }
            : undefined,
        })
      } else if (fm.schemaType === 'ItemList' && route === '/brands/directory/') {
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: '机场品牌可核验资料库（31 家去重名单）',
          numberOfItems: 31,
          url: canonical,
        })
      } else if (fm.schemaType === 'CollectionPage') {
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          description,
          inLanguage: 'zh-CN',
          dateModified: fm.lastUpdated || '2026-11-23',
          url: canonical,
          isPartOf: { '@type': 'WebSite', name: '代理客户端', url: `${SITE_URL}/` },
        })
        if (typeof fm.itemListCount === 'number' && fm.itemListCount > 0) {
          schemas.push({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: title,
            numberOfItems: fm.itemListCount,
            url: canonical,
          })
        }
      } else if (fm.schemaType === 'TechArticle' || (parts.length >= 2 && (route.startsWith('/clients/') || route.startsWith('/guides/') || route.startsWith('/troubleshooting/')))) {
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: title,
          description,
          inLanguage: 'zh-CN',
          dateModified: fm.lastUpdated || '2026-11-23',
          mainEntityOfPage: canonical,
          author: { '@type': 'Organization', name: '代理客户端编辑部' },
        })
      } else if (route !== '/404/') {
        const brandSlug =
          (parts[0] === 'brands' || parts[0] === 'reviews') && parts[1] && BRAND_BY_SLUG[parts[1]]
            ? parts[1]
            : null
        const brandObj = brandSlug ? BRAND_BY_SLUG[brandSlug] : null
        const modified = (brandObj && brandObj.lastUpdated) || fm.lastUpdated || '2026-11-24'
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          description,
          inLanguage: 'zh-CN',
          datePublished: fm.date || '2026-11-23',
          dateModified: modified,
          mainEntityOfPage: canonical,
          author: { '@type': 'Organization', name: fm.author || '代理客户端编辑部' },
        })
        if (parts[0] === 'reviews' && brandObj) {
          schemas.push({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: brandObj.name,
            serviceType: 'Network Proxy / Tunnel Service',
            description: brandObj.summary,
            provider: { '@type': 'Organization', name: brandObj.name },
            url: `${SITE_URL}/brands/${brandObj.slug}/`,
          })
        }
      }
    }

    if (Array.isArray(fm.faq) && fm.faq.length > 0) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: fm.faq.map((item: { q: string; a: string }) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      })
    }

    for (const schema of schemas) {
      heads.push([
        'script',
        { type: 'application/ld+json' },
        JSON.stringify(schema),
      ])
    }

    return heads
  },
})
