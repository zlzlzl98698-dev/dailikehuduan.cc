import { BRANDS } from './brands'
import contentIndex from './content-index.json'

export interface NavSubItem {
  title: string
  link: string
  description: string
  badge?: string
}

export interface NavExtraGroup {
  text: string
  items: { text: string; link: string }[]
}

export interface NavCategory {
  id: string
  text: string
  link: string
  tagline: string
  subsections: NavSubItem[]
  extraGroups?: NavExtraGroup[]
}

export const NAV_CATEGORIES: NavCategory[] = [
  {
    id: 'airport',
    text: '机场推荐',
    link: '/airport/',
    tagline: '基于线路结构、付款周期与可验证指标的客观选型方法',
    subsections: [
      { title: '机场推荐与选择方法', link: '/airport/recommend/', description: '从使用场景、客户端兼容与预算出发的选型框架' },
      { title: '机场排行与口径说明', link: '/airport/ranking/', description: '区分编辑精选（含推广）与可验证实测指标的排行边界' },
      { title: '靠谱机场判断指标', link: '/airport/reliable/', description: '协议透明度、域名稳定性、退款条款与售后核验清单' },
      { title: '稳定机场与晚高峰测试', link: '/airport/stable/', description: '20:00–23:30 晚高峰丢包、RTT 抖动与单线程测速方法' },
      { title: '新手如何选机场', link: '/airport/beginner/', description: '先定客户端与支付风险上限，再看月付试错流程' },
      { title: '多设备与家庭方案', link: '/airport/multi-device/', description: '软路由、多端同时在线限制与不限设备条款核对' },
    ],
  },
  {
    id: 'plans',
    text: '价格与套餐',
    link: '/plans/',
    tagline: '拆解真实支付金额、年付折算陷阱、刷新周期与节点倍率',
    subsections: [
      { title: '便宜机场与低价档边界', link: '/plans/budget/', description: '5–15 元档线路常见妥协与成本核算方法' },
      { title: '一元机场真实成本', link: '/plans/one-yuan/', description: '超低价套餐的倍率、风控与停服风险分析' },
      { title: '一分机场与体验门槛', link: '/plans/one-cent/', description: '低价试用、一次性包与隐性限制核查' },
      { title: '月付机场推荐原则', link: '/plans/monthly/', description: '为什么首次评测优先选择短周期月付试错' },
      { title: '不限时流量包指南', link: '/plans/non-expiring/', description: '一次性流量包的过期条件、备用价值与单价对比' },
      { title: '性价比机场价格比较', link: '/plans/value/', description: '跨品牌按实际支付周期与每月可用 GB 横向对比' },
    ],
  },
  {
    id: 'brands',
    text: '机场品牌',
    link: '/brands/',
    tagline: '31 家去重品牌可追溯数据库、证据分级与历史资料冲突审计',
    subsections: [
      { title: '品牌数据库检索中心', link: '/brands/directory/', description: '支持按价格、周期、协议、客户端与数据状态筛选 31 家品牌' },
      { title: '品牌独立评测名录', link: '/brands/reviews/', description: '逐一查验实测证据、品牌宣称与待核实字段' },
      { title: '品牌横向对比中心', link: '/brands/comparisons/', description: '同价位品牌在协议、自研/通用客户端与条款上的真实差异' },
      { title: '套餐优惠与优惠码核验', link: '/brands/coupons/', description: '记录各品牌历史优惠码、折扣限制与冲突说明' },
      { title: '品牌信息与近期变动', link: '/brands/status/', description: '跟踪资料快照日期、链接格式异常与待核实清单' },
      { title: '同类品牌替代方案', link: '/brands/alternatives/', description: '按协议、预算与客户端兼容度寻找平替品牌' },
    ],
  },
  {
    id: 'vpn',
    text: 'VPN 与加速器',
    link: '/vpn/',
    tagline: '厘清传统商业 VPN、规则代理机场与游戏加速器的技术边界',
    subsections: [
      { title: 'VPN 推荐的评价维度', link: '/vpn/recommend/', description: '审计报告、管辖地、协议栈与跨境连通性差异' },
      { title: '免费 VPN 使用限制', link: '/vpn/free/', description: '限速、日志风险、流量上限与广告变现模式拆解' },
      { title: '手机 VPN 选型建议', link: '/vpn/mobile/', description: '移动端耗电、后台保活、TUN 模式与系统兼容' },
      { title: '安卓 VPN 与代理区别', link: '/vpn/android/', description: 'VpnService 权限机制与第三方 APK 校验原则' },
      { title: '游戏加速器原理分析', link: '/vpn/gaming/', description: 'UDP 转发、FullCone NAT 与常规网页代理的差异' },
      { title: 'VPN、机场与加速器对比', link: '/vpn/compare/', description: '分流粒度、价格结构与多场景适用性矩阵' },
    ],
  },
  {
    id: 'clients',
    text: '客户端软件',
    link: '/clients/',
    tagline: '本站核心板块：官方源码仓库校验、全平台安装与现代内核迁移指南',
    subsections: [
      { title: 'Clash Verge Rev', link: '/clients/clash-verge-rev/', description: '现代桌面端主力 Mihomo GUI，支持 TUN 与系统代理', badge: '主力' },
      { title: 'Clash Meta / Mihomo 客户端', link: '/clients/clash-meta/', description: 'Mihomo 生态客户端演进、与已归档 CFW 的本质区别' },
      { title: 'v2rayN', link: '/clients/v2rayn/', description: 'Windows / macOS / Linux 多核心客户端（Xray / sing-box）', badge: '多核' },
      { title: 'Shadowrocket（小火箭）', link: '/clients/shadowrocket/', description: 'iOS / iPadOS 常用规则代理客户端与订阅配置指南' },
      { title: 'Mihomo 核心与生态', link: '/clients/mihomo/', description: '原 Clash.Meta 内核能力、VLESS Reality 与覆写规则' },
      { title: 'sing-box 核心与生态', link: '/clients/sing-box/', description: '新一代通用代理平台与 SFI/SFA/SFM 官方客户端家族' },
    ],
    extraGroups: [
      {
        text: '按操作系统筛选',
        items: [
          { text: 'Windows 客户端中心', link: '/clients/platform/windows/' },
          { text: 'Android 客户端中心', link: '/clients/platform/android/' },
          { text: 'iOS / iPadOS 客户端中心', link: '/clients/platform/ios/' },
          { text: 'macOS 客户端中心', link: '/clients/platform/macos/' },
          { text: 'Linux 客户端中心', link: '/clients/platform/linux/' },
          { text: 'OpenWrt / 软路由中心', link: '/clients/platform/openwrt/' },
        ],
      },
      {
        text: '更多主流客户端专题',
        items: [
          { text: 'FlClash（全平台 Mihomo）', link: '/clients/flclash/' },
          { text: 'v2rayNG（Android Xray）', link: '/clients/v2rayng/' },
          { text: 'Hiddify（跨平台多协议）', link: '/clients/hiddify/' },
          { text: 'Karing（sing-box 规则系）', link: '/clients/karing/' },
          { text: 'NekoBox（维护状态警示）', link: '/clients/nekobox/' },
          { text: 'Stash / Quantumult X / Surge', link: '/clients/stash/' },
          { text: 'OpenClash / PassWall2 / Nikki / HomeProxy', link: '/clients/openclash/' },
        ],
      },
    ],
  },
  {
    id: 'ai-streaming',
    text: 'AI 与流媒体',
    link: '/ai-streaming/',
    tagline: '落地 IP 归属、风控降级、DNS 分流与地区解锁的可验证排查方法',
    subsections: [
      { title: 'ChatGPT 场景兼容性', link: '/ai-streaming/chatgpt/', description: 'IP 风险评分、App vs 网页端验证差异与常见拦截代码' },
      { title: 'Claude 场景兼容性', link: '/ai-streaming/claude/', description: '地区白名单、账号风控触发因素与纯净节点要求' },
      { title: 'Gemini 场景兼容性', link: '/ai-streaming/gemini/', description: 'Google 地区归属判定、送中修正与家宽/原生 IP 影响' },
      { title: 'Netflix 解锁判断', link: '/ai-streaming/netflix/', description: '自制剧 vs 全区剧检测逻辑与非原生 IP 限制' },
      { title: 'YouTube 访问与缓冲诊断', link: '/ai-streaming/youtube/', description: '4K/8K 吞吐要求、IPv6 回落与地区“送中”排查' },
      { title: 'Disney+ 与其他流媒体', link: '/ai-streaming/disney/', description: 'Disney+、HBO Max、TikTok 与 Spotify 区域判定说明' },
    ],
  },
  {
    id: 'routes',
    text: '线路与节点',
    link: '/routes/',
    tagline: '理解传输层架构、中转与专线术语查验、延迟指标与计费倍率',
    subsections: [
      { title: 'IEPL 术语与查验', link: '/routes/iepl/', description: '以太网专线技术含义与如何识别商家虚标宣传' },
      { title: 'IPLC 术语与查验', link: '/routes/iplc/', description: '国际专线点对点架构与普通 BGP 中转的本质区别' },
      { title: '香港节点特性分析', link: '/routes/hong-kong/', description: '低延迟优势、AI 服务地区限制及出口拥堵规律' },
      { title: '日本节点特性分析', link: '/routes/japan/', description: '兼顾游戏、流媒体与部分 AI 工具的常见选择维度' },
      { title: '低延迟、丢包与抖动', link: '/routes/latency/', description: 'ICMP Ping、TLS RTT 与 HTTPS 请求延迟的测量区别' },
      { title: '线路倍率与流量计费', link: '/routes/multipliers/', description: '0.5x–5x 倍率对套餐真实可用流量的实际影响' },
    ],
  },
  {
    id: 'guides',
    text: '使用教程',
    link: '/guides/',
    tagline: '从零安装、订阅格式转换、YAML 覆写、规则分流到 TUN 接管全流程',
    subsections: [
      { title: '订阅导入与更新管理', link: '/guides/subscription/', description: 'Clash YAML、Base64 与 sing-box 订阅格式识别与刷新' },
      { title: 'Clash YAML 配置详解', link: '/guides/clash-config/', description: 'proxies、proxy-groups、rules 与 dns 核心结构解析' },
      { title: '分流规则与策略组', link: '/guides/routing/', description: 'geosite/geoip 规则集、AI 独立分组与直连绕过策略' },
      { title: 'TUN 模式深度配置', link: '/guides/tun/', description: '虚拟网卡接管非浏览器流量、Fake-IP 与 Redir-Host 选择' },
      { title: '客户端安装标准流程', link: '/guides/installation/', description: 'Windows/macOS/Linux 架构选择、哈希校验与权限授权' },
      { title: '自动更新与配置备份', link: '/guides/automatic-update/', description: '定时拉取订阅、Parser/Script 覆写保护与多端同步' },
    ],
  },
  {
    id: 'troubleshooting',
    text: '故障排查',
    link: '/troubleshooting/',
    tagline: '结构化排障树：按症状、系统环境与错误代码快速定位根因',
    subsections: [
      { title: '节点全部超时排查', link: '/troubleshooting/timeout/', description: '本地时间偏差、TLS 握手失败、防火墙与上游阻断定位' },
      { title: '订阅失败与 200+0 字节', link: '/troubleshooting/subscription/', description: 'UA 拦截、TLS 代理死循环、DNS 污染与空订阅响应处理' },
      { title: '连不上或频繁断线', link: '/troubleshooting/disconnected/', description: '系统代理端口冲突、连接数超限与移动端后台被杀排查' },
      { title: 'DNS 错误与泄漏检测', link: '/troubleshooting/dns/', description: 'Fake-IP 残留、IPv6 泄露、DoH 超时与局域网域名失灵' },
      { title: '客户端无法启动处理', link: '/troubleshooting/startup/', description: 'WebView2 缺失、macOS 签名隔离、内核端口被占与权限修复' },
      { title: 'TUN 与系统代理冲突', link: '/troubleshooting/tun/', description: '双 VPN 网卡打架、杀毒软件拦截与 WSL/Docker 网络异常' },
    ],
  },
  {
    id: 'safety',
    text: '风险与替代',
    link: '/safety/',
    tagline: '基于事实核验的停服状态确认、下载防钓鱼与隐私安全指南',
    subsections: [
      { title: '机场停服与状态核验', link: '/safety/closures/', description: '区分节点维护、域名被阻断与真实失联的客观核验步骤' },
      { title: '选择与避坑核查清单', link: '/safety/avoid-scams/', description: '识别夸大宣传、高倍扣流与不可逆预付风险的实用规则' },
      { title: '服务异常时的替代方案', link: '/safety/alternatives/', description: '如何平滑迁移本地配置并准备低成本不限时备用通道' },
      { title: '退款政策与维权资料', link: '/safety/refunds/', description: '下单前保存条款快照、支付凭证与工单沟通留证要点' },
      { title: '隐私与日志风险认知', link: '/safety/privacy/', description: 'HTTPS 端到端加密边界、SNI/DNS 可见性与自建/托管差异' },
      { title: '客户端下载安全防钓鱼', link: '/safety/security/', description: '核对 GitHub 官方仓库、SHA256 校验与防范山寨安装包' },
    ],
  },
]

export function buildVitePressNav() {
  return NAV_CATEGORIES.map((cat) => ({
    text: cat.text,
    link: cat.link,
    activeMatch: `^/${cat.id}/`,
  }))
}

export function buildVitePressSidebar() {
  const sidebar: Record<string, any[]> = {}

  for (const cat of NAV_CATEGORIES) {
    const groups: any[] = [
      {
        text: `${cat.text}专题`,
        items: [
          { text: `${cat.text}总览`, link: cat.link },
          ...cat.subsections.map((sub) => ({
            text: sub.title,
            link: sub.link,
          })),
        ],
      },
    ]

    if (cat.extraGroups) {
      for (const eg of cat.extraGroups) {
        groups.push({
          text: eg.text,
          collapsed: false,
          items: eg.items,
        })
      }
    }

    if (cat.id === 'clients') {
      groups.push({
        text: '常用单品教程',
        collapsed: false,
        items: [
          { text: 'NekoBox（Android / 桌面）', link: '/clients/nekobox/' },
          { text: 'Stash（iOS / macOS）', link: '/clients/stash/' },
          { text: 'Quantumult X（iOS）', link: '/clients/quantumult-x/' },
          { text: 'Surge（iOS / macOS）', link: '/clients/surge/' },
          { text: 'OpenClash（OpenWrt）', link: '/clients/openclash/' },
          { text: 'PassWall2（OpenWrt）', link: '/clients/passwall2/' },
          { text: 'Nikki（OpenWrt 24.10+）', link: '/clients/nikki/' },
          { text: 'HomeProxy（sing-box 路由）', link: '/clients/homeproxy/' },
        ],
      })
    }

    const subLinks = new Set(cat.subsections.map((s) => s.link))
    const l3Entries = (contentIndex.entries || []).filter(
      (e: any) =>
        e.pillar === cat.id &&
        e.parentTopic &&
        subLinks.has(e.parentTopic) &&
        !subLinks.has(e.url) &&
        !e.url.startsWith('/brands/') &&
        !e.url.startsWith('/reviews/')
    )
    if (l3Entries.length > 0 && cat.id !== 'guides' && cat.id !== 'troubleshooting') {
      groups.push({
        text: '深度长尾专题与指南',
        collapsed: false,
        items: l3Entries.map((e: any) => ({
          text: e.h1 || e.title,
          link: e.url,
        })),
      })
    }

    if (cat.id === 'guides') {
      const existingGuideUrls = new Set([
        '/guides/clash-verge-rev-setup/',
        '/guides/system-time-tls-fix/',
        '/guides/subscription-formats-explained/',
      ])
      const extraGuides = l3Entries
        .filter((e: any) => !existingGuideUrls.has(e.url))
        .map((e: any) => ({ text: e.h1 || e.title, link: e.url }))
      groups.push({
        text: '进阶实操文章',
        collapsed: false,
        items: [
          { text: 'Clash Verge Rev 入门到 TUN 全流程', link: '/guides/clash-verge-rev-setup/' },
          { text: 'Windows 系统时间与 TLS 报错修正', link: '/guides/system-time-tls-fix/' },
          { text: '2026 订阅格式识别与转换原则', link: '/guides/subscription-formats-explained/' },
          ...extraGuides,
        ],
      })
    }

    if (cat.id === 'troubleshooting') {
      const existingTroubleshootUrls = new Set(['/troubleshooting/tun-wsl-docker-conflict/'])
      const extraTroubleshoot = l3Entries
        .filter((e: any) => !existingTroubleshootUrls.has(e.url))
        .map((e: any) => ({ text: e.h1 || e.title, link: e.url }))
      groups.push({
        text: '专题故障手册',
        collapsed: false,
        items: [
          { text: '按问题开始诊断向导', link: '/troubleshooting/' },
          { text: 'Clash TUN 网卡与 WSL2/Docker 冲突', link: '/troubleshooting/tun-wsl-docker-conflict/' },
          ...extraTroubleshoot,
        ],
      })
    }

    sidebar[`/${cat.id}/`] = groups
  }

  const publishedReviewUrls = new Set(
    (contentIndex.entries || []).filter((e: any) => e.url.startsWith('/reviews/')).map((e: any) => e.url)
  )
  const compareEntries = (contentIndex.entries || []).filter((e: any) => e.url.startsWith('/compare/'))
  sidebar['/reviews/'] = [
    {
      text: '机场品牌独立评测体系',
      items: [
        { text: '返回品牌评测总名录', link: '/brands/reviews/' },
        { text: '31 家品牌检索与筛选库', link: '/brands/directory/' },
        { text: '品牌横向对比中心', link: '/brands/comparisons/' },
      ],
    },
    {
      text: '已上线品牌独立评测',
      collapsed: false,
      items: BRANDS.filter((b) => publishedReviewUrls.has(`/reviews/${b.slug}/`)).map((b) => ({
        text: `${b.name}（${b.completeness}）`,
        link: `/reviews/${b.slug}/`,
      })),
    },
  ]

  sidebar['/compare/'] = [
    {
      text: '机场横向对比中心',
      items: [
        { text: '返回品牌横向对比中心', link: '/brands/comparisons/' },
        { text: '品牌独立评测名录', link: '/brands/reviews/' },
        { text: '31 家品牌数据库', link: '/brands/directory/' },
      ],
    },
    {
      text: '双品牌深度对比评测',
      collapsed: false,
      items: compareEntries.map((e: any) => ({
        text: e.h1 || e.title,
        link: e.url,
      })),
    },
  ]

  return sidebar
}
