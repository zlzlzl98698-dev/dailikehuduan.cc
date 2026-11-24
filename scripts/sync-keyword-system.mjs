import fs from 'node:fs'
import path from 'node:path'
import esbuild from 'esbuild'

const root = process.cwd()
const docsDir = path.join(root, 'docs')
const dataKwDir = path.join(root, 'data', 'keywords')
fs.mkdirSync(dataKwDir, { recursive: true })

function loadTs(rel) {
  const res = esbuild.buildSync({
    entryPoints: [path.join(root, rel)],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
  })
  const mod = { exports: {} }
  new Function('module', 'exports', res.outputFiles[0].text)(mod, mod.exports)
  return mod.exports
}

const { BRANDS } = loadTs('docs/.vitepress/data/brands.ts')
const { NAV_CATEGORIES } = loadTs('docs/.vitepress/data/navigation.ts')

function mdExistsAndSubstantial(url, minHan = 1500) {
  if (!url || !url.startsWith('/')) return { exists: false, han: 0 }
  const clean = url.replace(/^\/+|\/+$/g, '')
  const file = clean ? path.join(docsDir, clean, 'index.md') : path.join(docsDir, 'index.md')
  if (!fs.existsSync(file)) return { exists: false, han: 0 }
  const raw = fs.readFileSync(file, 'utf8')
    .replace(/^---[\s\S]*?---\r?\n/, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]+>/g, '')
  const han = (raw.match(/[\u4e00-\u9fff]/g) || []).length
  return { exists: true, han }
}

function csvEscape(v) {
  const s = String(v ?? '').replace(/\r?\n/g, ' ')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

const TODAY = '2026-11-24'

// ---------------------------------------------------------------------------
// 1. Canonical L3 Article Matrix (4 upgrades + 22 new high-value guides)
// ---------------------------------------------------------------------------
export const L3_ARTICLES = [
  // Existing 4 L3 upgrades
  {
    url: '/guides/clash-verge-rev-setup/',
    title: 'Clash Verge Rev 从零安装到 TUN 接管全流程实操手册',
    primaryKeyword: 'Clash Verge Rev 安装配置教程',
    secondaryKeywords: ['Clash Verge TUN 模式怎么设置', 'Clash Verge Service Mode 安装', 'Clash Verge Rev 订阅导入'],
    longTailQuestions: ['Clash Verge Rev 如何安装？', 'Clash Verge TUN 模式怎么设置？', 'Service Mode 点击安装没反应怎么办？'],
    searchIntent: 'How-to',
    audience: 'Windows / macOS / Linux 桌面端用户',
    contentType: '教程文章',
    pillar: 'guides',
    parentTopic: '/guides/installation/',
    parentCluster: '集群 C：装机后的订阅接入与 TUN 初始化',
    relatedArticles: ['/clients/clash-verge-rev/', '/guides/tun/', '/troubleshooting/tun-wsl-docker-conflict/', '/guides/system-time-tls-fix/'],
    relatedBrands: ['guangsuyun', 'yifan', 'weitu'],
    conversionIntent: 'tutorial-assistant',
    priority: 'P0',
    minTargetHan: 3500,
    sourceRequirements: '官方 GitHub clash-verge-rev 发布规范、Mihomo 配置结构与实机 PowerShell/Terminal 验证命令',
  },
  {
    url: '/guides/system-time-tls-fix/',
    title: '系统时间偏差导致 TLS 握手与节点全部超时修复指南',
    primaryKeyword: '系统时间不同步导致节点超时',
    secondaryKeywords: ['Windows 双系统时间差 8 小时', 'TLS 握手超时修复', 'Reality 时间偏差限制'],
    longTailQuestions: ['系统时间差 2 分钟为什么节点全超时？', 'Windows 和 Linux 双系统时间不一致怎么解决？', 'w32tm 无法同步怎么换国内 NTP？'],
    searchIntent: 'Troubleshooting',
    audience: '遇到全节点超时或双系统切换异常的用户',
    contentType: '排障文章',
    pillar: 'guides',
    parentTopic: '/troubleshooting/timeout/',
    parentCluster: '集群 1：系统时钟、TLS 握手与协议鉴权排障',
    relatedArticles: ['/troubleshooting/timeout/', '/troubleshooting/all-nodes-timeout-check/', '/guides/clash-verge-rev-setup/'],
    relatedBrands: [],
    conversionIntent: 'pure-troubleshooting',
    priority: 'P0',
    minTargetHan: 3000,
    sourceRequirements: 'NTP 同步命令、TLS/VLESS-Reality ±90s 窗口机制、Windows 注册表 RealTimeIsUniversal 参数',
  },
  {
    url: '/guides/subscription-formats-explained/',
    title: '2026 主流机场订阅格式深度解析：Clash YAML、Base64 与 sing-box JSON',
    primaryKeyword: 'Clash 订阅格式与 Base64 区别',
    secondaryKeywords: ['sing-box JSON 订阅转换', 'SIP002 协议 URI', 'User-Agent 订阅分发'],
    longTailQuestions: ['为什么 Clash 订阅导入 v2rayN 报错？', '怎么安全转换不同格式订阅？', 'subscription-userinfo 响应头怎么看？'],
    searchIntent: 'Informational',
    audience: '跨客户端使用并需要判断订阅兼容性的用户',
    contentType: '知识文章',
    pillar: 'guides',
    parentTopic: '/guides/subscription/',
    parentCluster: '集群 1：订阅格式底层原理与多内核转换',
    relatedArticles: ['/guides/subscription/', '/guides/clash-verge-rev-import-subscription/', '/troubleshooting/subscription-200-empty-fix/', '/clients/sing-box/'],
    relatedBrands: ['guangsuyun', 'yifan', 'ermao'],
    conversionIntent: 'client-compatibility',
    priority: 'P0',
    minTargetHan: 3200,
    sourceRequirements: 'Mihomo YAML、Xray Base64、sing-box Outbounds JSON、Subconverter 与订阅响应头规范',
  },
  {
    url: '/troubleshooting/tun-wsl-docker-conflict/',
    title: 'Windows TUN 模式与 WSL2、Docker Desktop 网络冲突完全排查指南',
    primaryKeyword: 'Clash TUN 模式与 WSL2 Docker 冲突',
    secondaryKeywords: ['TUN 开启后 WSL 无法联网', 'dns-hijack 与 Hyper-V 冲突', 'route-exclude-address 配置'],
    longTailQuestions: ['开启 Clash TUN 模式后 Docker 无法联网怎么办？', 'WSL2 mirrored 模式和 Clash TUN 怎么共存？', '如何配置内网网段排除路由？'],
    searchIntent: 'Troubleshooting',
    audience: 'Windows 开发者与容器/WSL2 用户',
    contentType: '排障文章',
    pillar: 'troubleshooting',
    parentTopic: '/troubleshooting/tun/',
    parentCluster: 'TUN 虚拟网卡与系统路由冲突集群',
    relatedArticles: ['/guides/tun/', '/troubleshooting/tun/', '/guides/clash-verge-rev-setup/', '/troubleshooting/connected-no-internet-fix/'],
    relatedBrands: [],
    conversionIntent: 'pure-troubleshooting',
    priority: 'P0',
    minTargetHan: 3200,
    sourceRequirements: 'Mihomo tun.route-exclude-address、Windows Hyper-V vEthernet 路由表与 WSL2 .wslconfig 文档',
  },

  // 22 New High-Priority L3 Articles (spanning all 10 pillars)
  {
    url: '/plans/monthly-under-20-guide/',
    title: '20 元以内月付机场怎么选？真实门槛核算与同价位品牌横评',
    primaryKeyword: '20 元以内月付机场怎么选',
    secondaryKeywords: ['20元月付机场推荐', '15到20元真月付', '年付折算与真月付区别'],
    longTailQuestions: ['20 元以内真实月付机场有哪些？', '为什么 8 元月标价大多需要年付？', '18-20 元月付怎么比较单位流量成本？'],
    searchIntent: 'Commercial Investigation',
    audience: '预算控制在 15-20 元/月且拒绝年付锁仓的新手与轻中度用户',
    contentType: '价格文章',
    pillar: 'plans',
    parentTopic: '/plans/monthly/',
    parentCluster: '¥15-¥25 月付止损与入门档横评集群',
    relatedArticles: ['/plans/monthly/', '/plans/annual-vs-monthly-cost/', '/reviews/yifan/', '/reviews/ermao/', '/reviews/wuyou/', '/reviews/muguang/'],
    relatedBrands: ['yifan', 'ermao', 'wuyou', 'muguang', 'jilian', 'guangnian'],
    conversionIntent: 'plan-comparison',
    priority: 'P0',
    minTargetHan: 3000,
    sourceRequirements: 'brands.ts 中所有 <=20 元真实月付记录与优惠条款、客户端开放度差异及冲突声明',
  },
  {
    url: '/plans/annual-vs-monthly-cost/',
    title: '机场年付折算月价怎么算？百元内年付小包与月付盈亏平衡分析',
    primaryKeyword: '机场年付折算月价怎么算',
    secondaryKeywords: ['百元内年付机场划算吗', '机场买月付还是年付', '99元轻量版折算陷阱'],
    longTailQuestions: ['新手第一次买机场应该选月付还是年付？', '99 元年付轻量版折算月价怎么算？', '什么时候买年付才不会亏？'],
    searchIntent: 'Commercial Investigation',
    audience: '纠结百元内年付折算单价与月付试错成本的选购用户',
    contentType: '价格文章',
    pillar: 'plans',
    parentTopic: '/plans/budget/',
    parentCluster: '百元内年付小包与折算成本核算集群',
    relatedArticles: ['/plans/budget/', '/plans/monthly-under-20-guide/', '/reviews/guangsuyun/', '/reviews/feimao/', '/reviews/xingdaomeng/'],
    relatedBrands: ['guangsuyun', 'feimao', 'xingdaomeng', 'wuyou', 'muguang'],
    conversionIntent: 'cost-calculator',
    priority: 'P0',
    minTargetHan: 3000,
    sourceRequirements: 'brands.ts 年付总价/流量/折扣限制真实数据（含光速云99不打折/飞猫84/星岛梦96/无忧79）',
  },
  {
    url: '/plans/traffic-100gb-vs-300gb/',
    title: '100GB、300GB 与 500GB 机场流量够用多久？按日均场景与倍率实测核算',
    primaryKeyword: '机场 100GB 流量够用多久',
    secondaryKeywords: ['300GB 和 500GB 机场套餐怎么选', '看 4K YouTube 消耗多少流量', '线路倍率怎么消耗流量'],
    longTailQuestions: ['一个月 100GB 流量够看 YouTube 吗？', '写代码和用 ChatGPT 每月消耗多少 GB？', '300GB 与 500GB 套餐怎么对应家庭场景？'],
    searchIntent: 'Informational',
    audience: '不清楚自身月流量消耗模型、容易买多浪费或买少限速的用户',
    contentType: '价格文章',
    pillar: 'plans',
    parentTopic: '/plans/value/',
    parentCluster: '流量配额精算与大流量阶梯集群',
    relatedArticles: ['/plans/value/', '/routes/multiplier-billing-explained/', '/plans/non-expiring/', '/reviews/guangsuyun/'],
    relatedBrands: ['guangsuyun', 'weitu', 'ermao', 'weifeng'],
    conversionIntent: 'plan-sizing',
    priority: 'P1',
    minTargetHan: 2800,
    sourceRequirements: 'HTTP/HLS 视频码率带宽模型、1x vs 2x 倍率真实有效额度、多档代表套餐单价',
  },
  {
    url: '/airport/evening-peak-stability-test/',
    title: '如何判断机场晚高峰是否稳定？20:00–23:30 标准化验证与路由跟踪指南',
    primaryKeyword: '如何判断机场晚高峰是否稳定',
    secondaryKeywords: ['机场晚高峰测速方法', '单线程 TTFB 验证', '丢包率与抖动判断'],
    longTailQuestions: ['怎样在晚高峰实测机场稳不稳定？', '非晚高峰测速 500Mbps 为什么晚上会卡？', '如何用 curl 和 mtr 排查跨网丢包？'],
    searchIntent: 'How-to',
    audience: '希望用客观方法验证月付试用机场真实晚高峰表现的用户',
    contentType: '教程文章',
    pillar: 'airport',
    parentTopic: '/airport/stable/',
    parentCluster: '晚高峰稳定性核验与抗丢包集群',
    relatedArticles: ['/airport/stable/', '/routes/latency/', '/reviews/guangsuyun/', '/reviews/lingdong/'],
    relatedBrands: ['guangsuyun', 'lingdong', 'yifan'],
    conversionIntent: 'evaluation-method',
    priority: 'P0',
    minTargetHan: 3000,
    sourceRequirements: 'curl -w TTFB 测试脚本、NextTrace/MTR 路径排查与 2026-10-19 非晚高峰样本限制披露',
  },
  {
    url: '/airport/iepl-meaning-and-value/',
    title: '机场推荐里的 IEPL 专线有什么意义？真实收益、溢价边界与真假查验',
    primaryKeyword: '机场 IEPL 专线有什么意义',
    secondaryKeywords: ['如何识别虚假 IEPL 宣传', 'IEPL 机场值得买吗', '隧道中转与专线区别'],
    longTailQuestions: ['机场宣传的 IEPL 专线真的有用吗？', '5 元月付写全 IEPL 可信吗？', '普通用户需要为 IEPL 支付更高月费吗？'],
    searchIntent: 'Informational',
    audience: '被各种“全线 IEPL”宣传搞混、想判断性价比边界的用户',
    contentType: '知识文章',
    pillar: 'airport',
    parentTopic: '/airport/recommend/',
    parentCluster: '机场推荐核心指标与线路鉴伪集群',
    relatedArticles: ['/airport/recommend/', '/routes/iepl/', '/routes/iepl-vs-iplc-difference/', '/airport/reliable/'],
    relatedBrands: ['guangsuyun', 'weitu', 'kexin'],
    conversionIntent: 'decision-clarity',
    priority: 'P1',
    minTargetHan: 2800,
    sourceRequirements: 'IEPL 二层以太网过境原理、入口 BGP 与海外落地成本模型及品牌声明冲突边界',
  },
  {
    url: '/airport/client-vs-third-party-subscription/',
    title: '自研专属客户端机场 vs 第三方通用订阅机场：新手与进阶分水岭全解析',
    primaryKeyword: '自研客户端机场和第三方订阅哪个好',
    secondaryKeywords: ['仅专属客户端机场缺点', '第三方订阅机场优势', '开源客户端迁移对比'],
    longTailQuestions: ['自研客户端机场适合新手吗？', '不支持 Clash 订阅有什么真实限制？', '哪些品牌支持自研+第三方双模式？'],
    searchIntent: 'Comparison',
    audience: '在“下载即用一键端”与“Clash/Shadowrocket 通用订阅”之间做选择的用户',
    contentType: '比较文章',
    pillar: 'airport',
    parentTopic: '/airport/beginner/',
    parentCluster: '客户端交付模式与新手选型集群',
    relatedArticles: ['/airport/beginner/', '/brands/alternatives/', '/compare/guangsuyun-vs-feimao/', '/reviews/feimao/', '/reviews/guangsuyun/'],
    relatedBrands: ['guangsuyun', 'feimao', 'wuyou', 'yifan', 'kexin'],
    conversionIntent: 'architecture-choice',
    priority: 'P0',
    minTargetHan: 3000,
    sourceRequirements: 'brands.ts 31 家 clientMode 统计（仅专属客户端 vs 自研+第三方 vs 第三方通用）',
  },
  {
    url: '/brands/how-to-verify-airport-legitimacy/',
    title: '如何核实机场官网真伪、运营时间与评测可信度？购买前六项尽调清单',
    primaryKeyword: '如何判断机场官网是否真实',
    secondaryKeywords: ['机场运营时间怎么核实', '如何看穿虚假机场评测', '仿冒钓鱼官网识别'],
    longTailQuestions: ['怎么分辨真的机场官网和仿冒推广站？', '机场宣称运营 5 年怎么去伪存真？', '为什么有的品牌优惠码和链接格式不一样？'],
    searchIntent: 'Commercial Investigation',
    audience: '准备注册付费前核验陌生机场官网与优惠码真实性的用户',
    contentType: '风险文章',
    pillar: 'brands',
    parentTopic: '/brands/status/',
    parentCluster: '官网入口审计与资料冲突核验集群',
    relatedArticles: ['/brands/status/', '/airport/reliable/', '/safety/how-to-verify-airport-closure/', '/reviews/firefly/'],
    relatedBrands: ['firefly', 'yunjiexian', 'huanqiuti', 'guangsuyun'],
    conversionIntent: 'risk-mitigation',
    priority: 'P1',
    minTargetHan: 2800,
    sourceRequirements: 'brands.ts 链接格式异常记录（云界线/环球梯/榴莲云）与 Firefly 去重审计事实',
  },
  {
    url: '/vpn/vpn-vs-proxy-difference/',
    title: 'VPN 与代理机场、游戏加速器有什么本质区别？技术栈与 12 场景选型指南',
    primaryKeyword: 'VPN 与代理有什么区别',
    secondaryKeywords: ['VPN 和游戏加速器区别', 'VPN 和代理客户端能同时开吗', 'L3 VPN 与应用层代理'],
    longTailQuestions: ['VPN 和代理机场到底哪里不一样？', '打海外联机游戏该用机场还是游戏加速器？', '开着代理客户端能再开商业 VPN 吗？'],
    searchIntent: 'Comparison',
    audience: '混淆传统 VPN、代理规则工具与网游加速器的入门与跨场景用户',
    contentType: '比较文章',
    pillar: 'vpn',
    parentTopic: '/vpn/compare/',
    parentCluster: '协议栈边界与多工具共存集群',
    relatedArticles: ['/vpn/compare/', '/vpn/gaming/', '/vpn/recommend/', '/troubleshooting/tun-wsl-docker-conflict/'],
    relatedBrands: [],
    conversionIntent: 'educational-clarity',
    priority: 'P1',
    minTargetHan: 3000,
    sourceRequirements: 'OSI 3 层/4-7 层转发机制、FullCone NAT 要求、Wintun/VpnService 互斥机制',
  },
  {
    url: '/clients/flclash-vs-clash-verge/',
    title: 'FlClash 与 Clash Verge Rev 有什么区别？内存占用、UI 框架与多端同步选型',
    primaryKeyword: 'FlClash 与 Clash Verge Rev 区别',
    secondaryKeywords: ['FlClash 教程与评测', 'Flutter 与 Tauri 客户端对比', 'Mihomo 桌面端二选一'],
    longTailQuestions: ['电脑装 FlClash 还是 Clash Verge Rev 更好？', 'FlClash 支持 Android 和桌面端同步吗？', '两者都用 Mihomo 内核功能一样吗？'],
    searchIntent: 'Comparison',
    audience: '在现代 Mihomo 开源客户端之间选型的桌面与跨平台用户',
    contentType: '比较文章',
    pillar: 'clients',
    parentTopic: '/clients/clash-verge-rev/',
    parentCluster: '现代 Mihomo 客户端横向选型集群',
    relatedArticles: ['/clients/clash-verge-rev/', '/clients/flclash/', '/clients/mihomo/', '/guides/clash-verge-rev-setup/'],
    relatedBrands: [],
    conversionIntent: 'client-selection',
    priority: 'P1',
    minTargetHan: 2800,
    sourceRequirements: 'clients.ts 中 Clash Verge Rev (Tauri/WebView2) 与 FlClash (Flutter) 官方仓库信息与特性',
  },
  {
    url: '/ai-streaming/chatgpt-region-and-block-fix/',
    title: 'ChatGPT 无法访问、提示地区不支持与降智排查：5 层定位与分流修复实操',
    primaryKeyword: 'ChatGPT 提示地区不支持怎么办',
    secondaryKeywords: ['ChatGPT 无法连接排查', 'OpenAI Cloudflare 1020 拦截', 'ChatGPT 降智 IP 检测'],
    longTailQuestions: ['开了代理为什么 ChatGPT 还是提示不可用地区？', '为什么网页版打不开但手机 App 能用？', '怎么把 OpenAI 域名单独分流到美日节点？'],
    searchIntent: 'Troubleshooting',
    audience: '使用 ChatGPT Web/App 时频繁遇到地区拦截或降智的用户',
    contentType: '排障文章',
    pillar: 'ai-streaming',
    parentTopic: '/ai-streaming/chatgpt/',
    parentCluster: 'AI 服务地区风控与分流规则集群',
    relatedArticles: ['/ai-streaming/chatgpt/', '/ai-streaming/claude/', '/guides/routing/', '/reviews/guangsuyun/'],
    relatedBrands: ['guangsuyun', 'muguang', 'weifeng', 'sujie'],
    conversionIntent: 'ai-compatibility',
    priority: 'P0',
    minTargetHan: 3000,
    sourceRequirements: '香港 IP 对 OpenAI 网页封锁事实、geosite:openai 分流规则写法、DNS 防泄漏验证',
  },
  {
    url: '/ai-streaming/netflix-unlock-check-guide/',
    title: 'Netflix 解锁失败与只看自制剧怎么检查？非原生 IP 识别与测试片号方法',
    primaryKeyword: 'Netflix 解锁失败如何检查',
    secondaryKeywords: ['Netflix 自制剧和全区剧区别', '为什么台湾节点识别为英国区', 'DNS 解锁与原生 IP'],
    longTailQuestions: ['为什么 Netflix 打开搜不到日韩热剧只显示原创剧？', '同一个机场的香港节点为什么有时解锁有时不解锁？', '如何自测节点到底解锁哪些片库？'],
    searchIntent: 'How-to',
    audience: '遇到 Netflix 锁区、只出 Originals 或提示代理错误（M7111-5059）的用户',
    contentType: '教程文章',
    pillar: 'ai-streaming',
    parentTopic: '/ai-streaming/netflix/',
    parentCluster: '流媒体版权区解锁验证与误差排查集群',
    relatedArticles: ['/ai-streaming/netflix/', '/ai-streaming/disney/', '/ai-streaming/youtube/', '/reviews/lingdong/'],
    relatedBrands: ['guangsuyun', 'lingdong', 'feimao'],
    conversionIntent: 'streaming-verify',
    priority: 'P1',
    minTargetHan: 2800,
    sourceRequirements: 'Netflix 自制剧(80197526)/非自制剧测试原理、MiaoKo 归档台湾识别 GB 实例、DNS 分流注意事项',
  },
  {
    url: '/routes/iepl-vs-iplc-difference/',
    title: 'IEPL 与 IPLC 专线有什么区别？企业级跨境传输架构与常见营销误区拆解',
    primaryKeyword: 'IEPL 和 IPLC 有什么区别',
    secondaryKeywords: ['专线机场与公网中转差异', 'BGP 隧道中转是什么', '混线节点识别方法'],
    longTailQuestions: ['IEPL 和 IPLC 哪个延迟更低更稳？', '普通用户日常用分得出 IEPL 和公网中转吗？', '如何从价格反推是不是纯物理专线？'],
    searchIntent: 'Informational',
    audience: '选购前想搞懂专线术语与公网隧道区别的进阶用户',
    contentType: '知识文章',
    pillar: 'routes',
    parentTopic: '/routes/iepl/',
    parentCluster: '跨境传输底层架构对比集群',
    relatedArticles: ['/routes/iepl/', '/routes/iplc/', '/airport/iepl-meaning-and-value/', '/routes/latency/'],
    relatedBrands: ['guangsuyun', 'weitu', 'yinxingren'],
    conversionIntent: 'technical-clarity',
    priority: 'P1',
    minTargetHan: 2800,
    sourceRequirements: 'L2 以太网专线 vs SDH TDM 专线 vs 公网加密隧道差异、成本门槛区间',
  },
  {
    url: '/routes/multiplier-billing-explained/',
    title: '机场线路倍率怎么算？双向流量扣费、0.2x–5x 倍率实算与 Mihomo 防偷跑过滤',
    primaryKeyword: '机场线路倍率怎么算',
    secondaryKeywords: ['2x 3x 节点流量损耗', '1 倍率机场怎么挑', 'Clash 排除高倍率节点脚本'],
    longTailQuestions: ['看 10GB 视频用 2 倍率节点扣多少流量？', '怎么用脚本自动把 3x/5x 节点屏蔽出测速组？', '哪些品牌注明全节点 1 倍率？'],
    searchIntent: 'How-to',
    audience: '发现套餐流量消耗异常快、想核算实际单价并屏蔽高倍率节点的用户',
    contentType: '教程文章',
    pillar: 'routes',
    parentTopic: '/routes/multipliers/',
    parentCluster: '流量倍率核算与客户端规则隔离集群',
    relatedArticles: ['/routes/multipliers/', '/guides/automatic-update/', '/plans/traffic-100gb-vs-300gb/', '/reviews/weitu/'],
    relatedBrands: ['guangsuyun', 'weitu', 'xingdaomeng', 'wuyou'],
    conversionIntent: 'cost-control',
    priority: 'P1',
    minTargetHan: 2800,
    sourceRequirements: '双向计费模型、等效每 GB 成本公式与 Mihomo exclude-filter 正则脚本',
  },
  {
    url: '/guides/clash-verge-rev-import-subscription/',
    title: 'Clash Verge Rev 如何导入订阅与自动更新？完整图文步骤与 UA 排雷',
    primaryKeyword: 'Clash Verge Rev 如何导入订阅',
    secondaryKeywords: ['Clash 订阅链接一键导入无效', 'Clash Verge 更新订阅间隔', 'User-Agent 分发设置'],
    longTailQuestions: ['复制了订阅链接在 Clash Verge Rev 里粘哪？', '点网页“一键导入 Clash”浏览器没反应怎么办？', '更新订阅后原修改的配置被覆盖怎么防？'],
    searchIntent: 'How-to',
    audience: '已经安装好桌面客户端、卡在“导入订阅链接并拉取节点”步骤的新手',
    contentType: '教程文章',
    pillar: 'guides',
    parentTopic: '/guides/subscription/',
    parentCluster: '集群 2：全平台客户端首次导入与防坑实操',
    relatedArticles: ['/guides/subscription/', '/guides/clash-verge-rev-setup/', '/guides/automatic-update/', '/troubleshooting/subscription-200-empty-fix/'],
    relatedBrands: ['guangsuyun', 'yifan', 'ermao'],
    conversionIntent: 'onboarding-help',
    priority: 'P0',
    minTargetHan: 2800,
    sourceRequirements: 'Clash Verge Rev Profiles 面板字段、clash:// scheme、Merge 覆写与 UA 分发机制',
  },
  {
    url: '/guides/v2rayn-subscription-and-core/',
    title: 'v2rayN 如何导入订阅与切换 Xray/sing-box/Mihomo 多核心？跨平台操作教程',
    primaryKeyword: 'v2rayN 如何导入订阅链接',
    secondaryKeywords: ['v2rayN 怎么切换 sing-box 核心', 'v2rayN Tun 模式设置', 'v2rayN 订阅更新失败'],
    longTailQuestions: ['为什么 v2rayN 导入 Clash YAML 链接提示找不到服务器？', 'v2rayN 里该选 Xray 还是 sing-box 核心？', 'v2rayN 最新版支持 macOS 和 Linux 吗？'],
    searchIntent: 'How-to',
    audience: '使用 v2rayN 管理多订阅或多核心的 Windows / macOS / Linux 用户',
    contentType: '教程文章',
    pillar: 'guides',
    parentTopic: '/clients/v2rayn/',
    parentCluster: 'v2rayN 订阅分组与多核心路由实操集群',
    relatedArticles: ['/clients/v2rayn/', '/guides/subscription-formats-explained/', '/clients/sing-box/', '/guides/installation/'],
    relatedBrands: ['yifan', 'kexin', 'guangsuyun'],
    conversionIntent: 'client-tutorial',
    priority: 'P1',
    minTargetHan: 2800,
    sourceRequirements: '2dust/v2rayN 现代跨平台特性、CoreType 选择逻辑与 Base64/YAML 兼容边界',
  },
  {
    url: '/guides/shadowrocket-ios-setup/',
    title: 'Shadowrocket（小火箭）iPhone 如何添加订阅与开启配置分流？新手安全指南',
    primaryKeyword: 'Shadowrocket 如何添加订阅',
    secondaryKeywords: ['iPhone 小火箭配置分流规则', '小火箭连通性测试', '外区 Apple ID 防盗风险'],
    longTailQuestions: ['苹果小火箭怎么粘贴订阅链接？', '小火箭全局路由选“配置”还是“代理”？', '小火箭怎么开启定时自动更新节点？'],
    searchIntent: 'How-to',
    audience: 'iPhone / iPad 上首次配置 Shadowrocket 的 iOS 用户',
    contentType: '教程文章',
    pillar: 'guides',
    parentTopic: '/clients/shadowrocket/',
    parentCluster: 'iOS 小火箭首次导入、配置分流与安全获取集群',
    relatedArticles: ['/clients/shadowrocket/', '/clients/platform/ios/', '/guides/subscription/', '/safety/security/'],
    relatedBrands: ['guangsuyun', 'yifan', 'muguang'],
    conversionIntent: 'client-tutorial',
    priority: 'P0',
    minTargetHan: 2800,
    sourceRequirements: 'Shadowrocket Subscribe 流程、Routing Configuration vs Proxy 区别与外区账号安全警告',
  },
  {
    url: '/guides/clash-rule-vs-global-mode/',
    title: 'Clash 规则模式（Rule）与全局模式（Global）有什么区别？误用导致的流血与排障',
    primaryKeyword: 'Clash 规则模式与全局模式区别',
    secondaryKeywords: ['全局模式为什么很卡', 'Rule 模式国内网站走代理怎么办', 'Direct 直连模式作用'],
    longTailQuestions: ['日常用应该选 Rule 规则还是 Global 全局？', '为什么开了全局模式国内网页打不开且流量掉得飞快？', '什么时候才需要临时切到全局模式？'],
    searchIntent: 'Informational',
    audience: '分不清 Rule / Global / Direct 开关而引发速度变慢或流量剧增的新手',
    contentType: '知识文章',
    pillar: 'guides',
    parentTopic: '/guides/routing/',
    parentCluster: '出站模式与策略组命中原则集群',
    relatedArticles: ['/guides/routing/', '/guides/clash-config/', '/ai-streaming/chatgpt-region-and-block-fix/', '/troubleshooting/connected-no-internet-fix/'],
    relatedBrands: [],
    conversionIntent: 'pure-education',
    priority: 'P1',
    minTargetHan: 2600,
    sourceRequirements: 'Mihomo mode: rule/global/direct 路由优先级、国内 GeoIP 绕过与带宽成本影响',
  },
  {
    url: '/troubleshooting/all-nodes-timeout-check/',
    title: '所有机场节点突然全部超时怎么办？6 步定位本地时钟、订阅失效与入口故障',
    primaryKeyword: '所有机场节点突然超时怎么办',
    secondaryKeywords: ['节点全部红字超时', '真连接 -1ms 怎么解决', '机场节点全挂排查'],
    longTailQuestions: ['昨天还好好的今天所有节点全超时怎么排查？', '怎么区分是电脑问题还是机场全挂了？', '为什么 Ping 得通端口但延迟测试返回 -1ms？'],
    searchIntent: 'Troubleshooting',
    audience: '遭遇全节点不可用、急需快速判断本地故障或上游故障的用户',
    contentType: '排障文章',
    pillar: 'troubleshooting',
    parentTopic: '/troubleshooting/timeout/',
    parentCluster: '集群 1：系统时钟、TLS 握手与协议鉴权排障',
    relatedArticles: ['/troubleshooting/timeout/', '/guides/system-time-tls-fix/', '/safety/how-to-verify-airport-closure/', '/troubleshooting/subscription-200-empty-fix/'],
    relatedBrands: [],
    conversionIntent: 'pure-troubleshooting',
    priority: 'P0',
    minTargetHan: 3000,
    sourceRequirements: '6 层排查树（时钟偏差/套餐到期/内核协议/本地防火墙/UDP QoS/上游切换）与 PowerShell/curl 验证命令',
  },
  {
    url: '/troubleshooting/subscription-200-empty-fix/',
    title: '订阅链接返回 200 但内容为空或更新失败怎么办？代理环路与 UA 拦截修复',
    primaryKeyword: '订阅链接返回 200 但内容为空',
    secondaryKeywords: ['Clash 更新订阅失败', '机场订阅报错 YAML parse error', '关闭代理更新订阅'],
    longTailQuestions: ['导入订阅显示 200+0 字节是什么原因？', '为什么开着代理更新订阅反而一直转圈报错？', '浏览器能打开订阅链接为什么客户端更新失败？'],
    searchIntent: 'Troubleshooting',
    audience: '在拉取或自动更新订阅环节卡死、遇到空内容或解析报错的用户',
    contentType: '排障文章',
    pillar: 'troubleshooting',
    parentTopic: '/troubleshooting/subscription/',
    parentCluster: '订阅更新死循环、UA 伪装与域名阻断排查集群',
    relatedArticles: ['/troubleshooting/subscription/', '/guides/subscription/', '/guides/subscription-formats-explained/', '/troubleshooting/dns-leak-and-hijack-fix/'],
    relatedBrands: [],
    conversionIntent: 'pure-troubleshooting',
    priority: 'P0',
    minTargetHan: 2800,
    sourceRequirements: 'curl -A User-Agent 诊断、HTTP 200 Content-Length 0 原因、DNS 污染与系统代理回环清理',
  },
  {
    url: '/troubleshooting/connected-no-internet-fix/',
    title: '节点连接成功但打不开网页怎么办？端口占用、残留系统代理与异常退出修复',
    primaryKeyword: '节点连接成功但打不开网页怎么办',
    secondaryKeywords: ['关闭代理后上不了网', '7890 端口冲突', 'ERR_PROXY_CONNECTION_FAILED 修复'],
    longTailQuestions: ['节点延迟只有 30ms 但所有浏览器打不开网页是什么问题？', '为什么关掉 Clash 后国内网页也全部断网了？', 'Chrome 显示无法连接到代理服务器怎么恢复？'],
    searchIntent: 'Troubleshooting',
    audience: '节点看似连接正常或关闭软件后反而完全断网的排查用户',
    contentType: '排障文章',
    pillar: 'troubleshooting',
    parentTopic: '/troubleshooting/disconnected/',
    parentCluster: '系统代理残留、端口抢占与断网急救集群',
    relatedArticles: ['/troubleshooting/disconnected/', '/troubleshooting/tun/', '/troubleshooting/startup/', '/troubleshooting/dns-leak-and-hijack-fix/'],
    relatedBrands: [],
    conversionIntent: 'pure-troubleshooting',
    priority: 'P0',
    minTargetHan: 2800,
    sourceRequirements: 'Windows 注册表 ProxyEnable、netsh winhttp reset proxy、netstat -ano 端口排查命令',
  },
  {
    url: '/troubleshooting/dns-leak-and-hijack-fix/',
    title: 'DNS 错误与代理环境下的 DNS 泄漏怎么排查？Fake-IP 残留一键恢复方案',
    primaryKeyword: '代理 DNS 错误与泄漏怎么排查',
    secondaryKeywords: ['Fake-IP 残留 198.18.0.0 无法上网', '关闭 DNS 泄漏检测', 'Google 送中 DNS 修复'],
    longTailQuestions: ['关闭代理后网站解析出 198.18 开头 IP 怎么解决？', '怎样检测自己的代理有没有 DNS 泄漏？', 'Clash DNS 配置里 enhanced-mode 选 fake-ip 还是 redir-host？'],
    searchIntent: 'Troubleshooting',
    audience: '因 DNS 缓存污染、Fake-IP 残留或本地直连泄漏导致访问失败或风控的用户',
    contentType: '排障文章',
    pillar: 'troubleshooting',
    parentTopic: '/troubleshooting/dns/',
    parentCluster: 'Fake-IP 清理、DoH 防劫持与泄漏自测集群',
    relatedArticles: ['/troubleshooting/dns/', '/guides/tun/', '/ai-streaming/youtube/', '/guides/clash-config/'],
    relatedBrands: [],
    conversionIntent: 'pure-troubleshooting',
    priority: 'P1',
    minTargetHan: 2800,
    sourceRequirements: 'ipconfig /flushdns、nslookup 检测、198.18.0.0/16 清理与 Mihomo nameserver/fallback 分流',
  },
  {
    url: '/safety/how-to-verify-airport-closure/',
    title: '如何区分机场临时维护、域名被墙与停止运营？跑路核验流程与应急迁移',
    primaryKeyword: '如何确认机场是否停运跑路',
    secondaryKeywords: ['机场官网打不开是跑路还是被墙', '订阅更新失败怎么核实', '主备双订阅灾备策略'],
    longTailQuestions: ['机场官网突然打不开了是不是跑路了？', '怎么区分节点临时维护和长期失联？', '服务异常时怎么平滑切换到备用订阅？'],
    searchIntent: 'Informational',
    audience: '发现现有机场官网无法打开或全节点失联、需要客观核验与应急迁移的用户',
    contentType: '风险文章',
    pillar: 'safety',
    parentTopic: '/safety/closures/',
    parentCluster: '停服核验、故障归因与异构备用集群',
    relatedArticles: ['/safety/closures/', '/safety/alternatives/', '/brands/status/', '/safety/subscription-leak-and-refund-evidence/'],
    relatedBrands: ['guangsuyun', 'yifan', 'weitu'],
    conversionIntent: 'disaster-recovery',
    priority: 'P0',
    minTargetHan: 2800,
    sourceRequirements: '本地 DNS/SNI 阻断与服务器关闭的抓包/状态码区分、不限时小包备用机制',
  },
  {
    url: '/safety/subscription-leak-and-refund-evidence/',
    title: '机场订阅链接泄露风险与付费凭证留存指南：退款边界与账号防护操作',
    primaryKeyword: '机场订阅链接泄露有什么风险',
    secondaryKeywords: ['机场不退款怎么办', '在线订阅转换安全风险', '付费记录与工单取证'],
    longTailQuestions: ['把订阅链接贴给别人或公共转换站会怎样？', '订阅链接疑被泄露怎么重置密钥？', '买机场前怎么保留凭证以防扯皮？'],
    searchIntent: 'Informational',
    audience: '希望保护订阅权限安全并在购买前明晰退款证据链的理性消费者',
    contentType: '风险文章',
    pillar: 'safety',
    parentTopic: '/safety/privacy/',
    parentCluster: '订阅密钥安全、账单取证与退款边界集群',
    relatedArticles: ['/safety/privacy/', '/safety/refunds/', '/safety/avoid-scams/', '/safety/how-to-verify-airport-closure/'],
    relatedBrands: ['guangsuyun', 'muguang'],
    conversionIntent: 'consumer-protection',
    priority: 'P1',
    minTargetHan: 2800,
    sourceRequirements: '订阅 Token 重置原理、公开转换接口风险与真实账单/条款截图四项留证流程',
  },
]

// ---------------------------------------------------------------------------
// 2. High-Value Brand Comparisons (/compare/{a}-vs-{b}/)
// ---------------------------------------------------------------------------
export const BRAND_COMPARISONS = [
  {
    url: '/compare/guangsuyun-vs-feimao/',
    title: '光速云 vs 飞猫云深度对比：自研+第三方双模式与仅专属客户端该如何选？',
    primaryKeyword: '光速云和飞猫云对比',
    secondaryKeywords: ['光速云 vs 飞猫云', '双模订阅 vs 仅专属客户端对比', '99元 vs 84元年付对比'],
    brands: ['guangsuyun', 'feimao'],
    focusAngle: '客户端自由度分水岭 + 99/84 年付门槛 + 25元月付同价对比 + 147永久 vs 680/1TB门槛',
    priority: 'P0',
  },
  {
    url: '/compare/guangsuyun-vs-ermao/',
    title: '光速云 vs 二猫云套餐与架构对比：25元月付、百元不限时包与地区覆盖差异',
    primaryKeyword: '光速云和二猫云哪个好',
    secondaryKeywords: ['光速云 vs 二猫云', '147永久 vs 99/100G不限时', '25元 vs 20元月付对比'],
    brands: ['guangsuyun', 'ermao'],
    focusAngle: '147/247G vs 99/100G 不限时成本核算、极速版 25/168G vs 白猫 20/120G 及客户端状态',
    priority: 'P0',
  },
  {
    url: '/compare/guangsuyun-vs-quanqiu/',
    title: '光速云 vs 全球云参数对比审计：高度相似价目下的品牌年限、协议与订阅区别',
    primaryKeyword: '光速云和全球云区别',
    secondaryKeywords: ['光速云 vs 全球云', '99元轻量版 59G 69G 对比', '680元独享版对比'],
    brands: ['guangsuyun', 'quanqiu'],
    focusAngle: '同价位相似价目表冲突审计：2020年老牌+双模 vs 2026新品牌+仅专属端',
    priority: 'P1',
  },
  {
    url: '/compare/feimao-vs-xingdaomeng/',
    title: '飞猫云 vs 星岛梦对比评测：84元学生年付与96元小包新手选谁更合适？',
    primaryKeyword: '飞猫云和星岛梦对比',
    secondaryKeywords: ['飞猫云 vs 星岛梦', '入门年付小包横评', '150G 25元 vs 100G 19元'],
    brands: ['feimao', 'xingdaomeng'],
    focusAngle: '年付小包、月付入门门槛、不限时缺失 vs 100元/100G 对比及各自数据缺口',
    priority: 'P1',
  },
  {
    url: '/compare/wuyou-vs-lingmao/',
    title: '无忧链接 vs 灵猫网络横向对比：仅专属客户端低价门槛与不限时方案差距',
    primaryKeyword: '无忧链接和灵猫网络对比',
    secondaryKeywords: ['无忧链接 vs 灵猫网络', '79元年付 vs 85元年付', '专属客户端机场低价对比'],
    brands: ['wuyou', 'lingmao'],
    focusAngle: '同样主打仅专属客户端的入门阵营：无忧19元月付/108永久包 vs 灵猫25元月付及双优惠码冲突',
    priority: 'P1',
  },
  {
    url: '/compare/muguang-vs-weifeng/',
    title: '暮光加速 vs 微风网络对比：多档月付阶梯、起步价矛盾与 120G/200G 成本拆解',
    primaryKeyword: '暮光加速和微风网络对比',
    secondaryKeywords: ['暮光加速 vs 微风网络', '20元月付 vs 27元月付', '中端多档月付对比'],
    brands: ['muguang', 'weifeng'],
    focusAngle: '月付 20/40/100/180 vs 27/49/99/160 多档成本、年付口径冲突与优惠码条件对照',
    priority: 'P1',
  },
  {
    url: '/compare/yifan-vs-weitu/',
    title: '一翻云 vs 唯兔云全面对比：第三方通用订阅友好度、月付门槛与不限时包较量',
    primaryKeyword: '一翻云和唯兔云对比',
    secondaryKeywords: ['一翻云 vs 唯兔云', '第三方订阅机场对比', '20元 vs 29元月付对比'],
    brands: ['yifan', 'weitu'],
    focusAngle: '面向 Clash/Shadowrocket 进阶用户的第三方支持对比、98元年付 vs 119元年付、100/100G 不限时相同门槛',
    priority: 'P1',
  },
  {
    url: '/compare/kexin-vs-sujie/',
    title: '可信云 vs 速界同价对比：25元 150GB、IEPL+VLESS 标注下的客户端与声明差异',
    primaryKeyword: '可信云和速界对比',
    secondaryKeywords: ['可信云 vs 速界', '25元 150GB 机场对比', '纯第三方订阅 vs 双支持'],
    brands: ['kexin', 'sujie'],
    focusAngle: '基础档同价同流量下，可信云纯第三方+诚实未测声明 vs 速界双模式+AI场景主打的资料结构差异',
    priority: 'P2',
  },
]

// ---------------------------------------------------------------------------
// 3. Extract remaining L2 backlog topics & inspect current disk status
// ---------------------------------------------------------------------------
function extractL2BacklogTopics() {
  const results = []
  const l2Urls = NAV_CATEGORIES.flatMap(c => c.subsections.map(s => ({ pillar: c.id, pillarName: c.text, url: s.link, hubTitle: s.title })))
  for (const l2 of l2Urls) {
    const file = path.join(docsDir, l2.url.slice(1, -1), 'index.md')
    if (!fs.existsSync(file)) continue
    const raw = fs.readFileSync(file, 'utf8')
    const clusterStart = raw.search(/## .*本专题三级内容集群|## 三级内容集群|## 内容集群/)
    const faqStart = raw.indexOf('## 常见问题')
    const sec = clusterStart !== -1 ? raw.slice(clusterStart, faqStart !== -1 ? faqStart : undefined) : ''
    for (const line of sec.split(/\r?\n/)) {
      const t = line.trim()
      if (!t) continue
      if (/^\|/.test(t) && t.includes('待发布') && !/^\|[\s:-]+\|/.test(t) && !t.includes('状态标记') && !t.includes('状态')) {
        const cells = t.split('|').map(s => s.trim()).filter(Boolean)
        let name = (cells[0] || '').replace(/\*\*/g, '').replace(/`/g, '')
        if (name === '待发布选题' || name === '待发布') name = (cells[1] || '').replace(/\*\*/g, '').replace(/`/g, '')
        if (name && name.length > 4) results.push({ ...l2, topicName: name.trim() })
        continue
      }
      if (/^[-*]\s+/.test(t) && (t.includes('待发布') || t.includes('规划中'))) {
        if (t.endsWith('：') || t.endsWith(':')) continue
        const clean = t
          .replace(/^[-*]\s+/, '')
          .replace(/\*?待发布选题\*?[:：]\s*/g, '')
          .replace(/`待发布选题`/g, '')
          .replace(/（待发布选题[^）]*）/g, '')
          .replace(/\(待发布选题[^)]*\)/g, '')
          .replace(/（\s*）/g, '')
          .replace(/\(\s*\)/g, '')
          .replace(/^[:：]+/, '')
          .replace(/`+/g, '')
          .replace(/\*\*/g, '')
          .trim()
        if (clean && clean.length > 5 && !clean.startsWith('规划中三级选题')) {
          results.push({ ...l2, topicName: clean })
        }
      }
    }
  }
  return results
}

function buildAllRecords() {
  const articleTasks = []

  // L3 articles
  for (const a of L3_ARTICLES) {
    const st = mdExistsAndSubstantial(a.url, 2200)
    const existsAny = mdExistsAndSubstantial(a.url, 1)
    let status = 'planned'
    if (st.exists) status = 'published'
    else if (existsAny.exists) status = 'upgrade-needed'
    articleTasks.push({
      keyword: a.primaryKeyword,
      primaryKeyword: a.primaryKeyword,
      secondaryKeywords: a.secondaryKeywords,
      longTailQuestions: a.longTailQuestions,
      searchIntent: a.searchIntent,
      audience: a.audience,
      contentType: a.contentType,
      parentTopic: a.parentTopic,
      parentCluster: a.parentCluster,
      targetUrl: a.url,
      articleTitle: a.title,
      contentOutline: [],
      existingUrl: existsAny.exists ? a.url : null,
      relatedArticles: a.relatedArticles,
      relatedBrands: a.relatedBrands,
      conversionIntent: a.conversionIntent,
      contentPriority: a.priority,
      contentStatus: status,
      currentHanChars: existsAny.han,
      sourceRequirements: a.sourceRequirements,
      lastReviewedAt: TODAY,
    })
  }

  // Brand Independent Reviews (/reviews/{slug}/)
  for (const b of BRANDS) {
    const revUrl = `/reviews/${b.slug}/`
    const st = mdExistsAndSubstantial(revUrl, 2000)
    const existsAny = mdExistsAndSubstantial(revUrl, 1)
    articleTasks.push({
      keyword: `${b.name}评测`,
      primaryKeyword: `${b.name}怎么样 靠谱吗`,
      secondaryKeywords: [`${b.name}机场评测`, `${b.name}测速与线路分析`, `${b.name}适合谁用`],
      longTailQuestions: [`${b.name}怎么样值得买吗？`, `${b.name}支持 Clash 或 Shadowrocket 第三方订阅吗？`, `${b.name}有哪些资料冲突与使用限制？`],
      searchIntent: 'Commercial Investigation',
      audience: `搜索${b.name}真实口碑、优缺点与替代方案的决策用户`,
      contentType: '品牌评测',
      parentTopic: '/brands/reviews/',
      parentCluster: b.completeness === '高' ? '高完整度深度评测梯队' : b.completeness === '中' ? '中完整度档案评测梯队' : '基础透明披露评测梯队',
      targetUrl: revUrl,
      articleTitle: `${b.name}深度评测与资料审计：真实套餐、线路证据与适用边界（2026）`,
      contentOutline: [],
      existingUrl: existsAny.exists ? revUrl : null,
      relatedArticles: ['/brands/reviews/', '/brands/directory/', `/brands/${b.slug}/`],
      relatedBrands: [b.slug, ...b.relatedBrands.slice(0, 3)],
      conversionIntent: 'review-to-commercial',
      contentPriority: b.isFeatured ? 'P0' : b.completeness === '高' ? 'P1' : 'P2',
      contentStatus: st.exists ? 'published' : existsAny.exists ? 'upgrade-needed' : 'planned',
      currentHanChars: existsAny.han,
      sourceRequirements: `brands.ts (${b.slug})、data-conflicts.md${b.slug === 'guangsuyun' ? '、5张 MiaoKo 归档截图' : ''}`,
      lastReviewedAt: TODAY,
    })
  }

  // Brand Commercial Detail Pages (/brands/{slug}/)
  for (const b of BRANDS) {
    const comUrl = `/brands/${b.slug}/`
    const existsAny = mdExistsAndSubstantial(comUrl, 1)
    articleTasks.push({
      keyword: `${b.name}官网与套餐`,
      primaryKeyword: `${b.name}价格套餐与优惠码`,
      secondaryKeywords: [`${b.name}官网入口`, `${b.name}优惠码`, `${b.name}月付价格`],
      longTailQuestions: [`${b.name}优惠码是什么及有哪些排除条款？`, `${b.name}官方注册入口与支付方式有哪些？`],
      searchIntent: 'Transactional',
      audience: `已了解${b.name}准备核查最新套餐与优惠条件的购买用户`,
      contentType: '品牌商业页',
      parentTopic: '/brands/directory/',
      parentCluster: '31家去重品牌商业详情页',
      targetUrl: comUrl,
      articleTitle: `${b.name}套餐价格、优惠码条款与官方注册入口`,
      contentOutline: [],
      existingUrl: existsAny.exists ? comUrl : null,
      relatedArticles: [`/reviews/${b.slug}/`, '/brands/coupons/', '/brands/directory/'],
      relatedBrands: [b.slug],
      conversionIntent: 'commercial-registration',
      contentPriority: b.isFeatured ? 'P0' : b.completeness === '高' ? 'P1' : 'P2',
      contentStatus: existsAny.exists ? 'published' : 'planned',
      currentHanChars: existsAny.han,
      sourceRequirements: `brands.ts (${b.slug}) 官方链接、affiliateUrl、优惠码与冲突审计`,
      lastReviewedAt: TODAY,
    })
  }

  // Brand Comparison Pages (/compare/{a}-vs-{b}/)
  for (const cmp of BRAND_COMPARISONS) {
    const st = mdExistsAndSubstantial(cmp.url, 2200)
    const existsAny = mdExistsAndSubstantial(cmp.url, 1)
    articleTasks.push({
      keyword: cmp.primaryKeyword,
      primaryKeyword: cmp.primaryKeyword,
      secondaryKeywords: cmp.secondaryKeywords,
      longTailQuestions: [`${cmp.brands[0]} 和 ${cmp.brands[1]} 哪个更适合新手或进阶用户？`, '两者套餐价格与客户端开放度差异在哪？'],
      searchIntent: 'Comparison',
      audience: '在两家高相关性品牌之间二选一的决策用户',
      contentType: '品牌对比',
      parentTopic: '/brands/comparisons/',
      parentCluster: '同价位与同架构双品牌深度横向对比',
      targetUrl: cmp.url,
      articleTitle: cmp.title,
      contentOutline: [],
      existingUrl: existsAny.exists ? cmp.url : null,
      relatedArticles: ['/brands/comparisons/', ...cmp.brands.map(s => `/reviews/${s}/`), ...cmp.brands.map(s => `/brands/${s}/`)],
      relatedBrands: cmp.brands,
      conversionIntent: 'head-to-head-decision',
      contentPriority: cmp.priority,
      contentStatus: st.exists ? 'published' : existsAny.exists ? 'upgrade-needed' : 'planned',
      currentHanChars: existsAny.han,
      sourceRequirements: cmp.focusAngle,
      lastReviewedAt: TODAY,
    })
  }

  // Discovered / Unverified L3 backlog topics from L2 hubs (deduped against L3_ARTICLES titles)
  const backlogTopics = extractL2BacklogTopics()
  const backlogRecords = backlogTopics.map((t, i) => ({
    keyword: t.topicName,
    primaryKeyword: t.topicName,
    secondaryKeywords: [],
    longTailQuestions: [t.topicName],
    searchIntent: t.pillar === 'troubleshooting' ? 'Troubleshooting' : t.pillar === 'plans' ? 'Commercial Investigation' : t.pillar === 'guides' || t.pillar === 'clients' ? 'How-to' : 'Informational',
    audience: '细分长尾搜索用户',
    contentType: '规划长尾选题',
    parentTopic: t.url,
    parentCluster: `${t.pillarName} / ${t.hubTitle}`,
    targetUrl: null,
    articleTitle: t.topicName,
    contentOutline: [],
    existingUrl: null,
    relatedArticles: [t.url],
    relatedBrands: [],
    conversionIntent: 'topic-cluster-expansion',
    contentPriority: 'P3',
    contentStatus: 'discovered-unverified',
    currentHanChars: 0,
    sourceRequirements: `源自 ${t.url} 二级专题内容集群规划 #${i + 1}`,
    lastReviewedAt: TODAY,
  }))

  return { articleTasks, backlogRecords }
}

const { articleTasks, backlogRecords } = buildAllRecords()

// Write data/keywords/article-keyword-map.json
fs.writeFileSync(
  path.join(dataKwDir, 'article-keyword-map.json'),
  JSON.stringify(
    {
      schemaVersion: '2.0.0',
      generatedAt: TODAY,
      evidencePolicy: 'No fabricated search volume, KD, or rankings. Unverified candidate topics marked discovered-unverified.',
      totalPlannedAndPublishedTasks: articleTasks.length,
      totalDiscoveredBacklog: backlogRecords.length,
      tasks: articleTasks,
    },
    null,
    2
  ),
  'utf8'
)

// Write data/keywords/cluster-map.json
const clusters = NAV_CATEGORIES.map(cat => ({
  pillarId: cat.id,
  pillarName: cat.text,
  pillarUrl: cat.link,
  subtopics: cat.subsections.map(sub => ({
    title: sub.title,
    url: sub.link,
    publishedOrTargetedL3: articleTasks.filter(t => t.parentTopic === sub.link).map(t => ({
      title: t.articleTitle,
      url: t.targetUrl,
      primaryKeyword: t.primaryKeyword,
      status: t.contentStatus,
      hanChars: t.currentHanChars,
    })),
    discoveredBacklogTopics: backlogRecords.filter(b => b.parentTopic === sub.link).map(b => b.articleTitle),
  })),
}))
fs.writeFileSync(
  path.join(dataKwDir, 'cluster-map.json'),
  JSON.stringify({ generatedAt: TODAY, pillars: clusters }, null, 2),
  'utf8'
)

// Write data/keywords/longtail-master.csv
const masterHeader = [
  'keyword', 'primaryKeyword', 'searchIntent', 'contentType', 'pillar', 'parentTopic',
  'targetUrl', 'articleTitle', 'contentPriority', 'contentStatus', 'currentHanChars',
  'searchVolume', 'keywordDifficulty', 'lastReviewedAt'
]
const masterAll = [...articleTasks, ...backlogRecords]
const masterCsv = [
  masterHeader.join(','),
  ...masterAll.map(r => [
    csvEscape(r.keyword),
    csvEscape(r.primaryKeyword),
    csvEscape(r.searchIntent),
    csvEscape(r.contentType),
    csvEscape(r.parentTopic.split('/').filter(Boolean)[0] || ''),
    csvEscape(r.parentTopic),
    csvEscape(r.targetUrl || ''),
    csvEscape(r.articleTitle),
    csvEscape(r.contentPriority),
    csvEscape(r.contentStatus),
    csvEscape(r.currentHanChars),
    'null', // unverified - never fabricated
    'null', // unverified - never fabricated
    csvEscape(r.lastReviewedAt),
  ].join(','))
].join('\n')
fs.writeFileSync(path.join(dataKwDir, 'longtail-master.csv'), '\uFEFF' + masterCsv + '\n', 'utf8')

// Write data/keywords/content-priority.csv
const prioHeader = ['priority', 'contentStatus', 'contentType', 'targetUrl', 'parentTopic', 'primaryKeyword', 'articleTitle', 'currentHanChars', 'sourceRequirements']
const prioRows = [...articleTasks].sort((a, b) => a.contentPriority.localeCompare(b.contentPriority))
const prioCsv = [
  prioHeader.join(','),
  ...prioRows.map(r => [
    csvEscape(r.contentPriority),
    csvEscape(r.contentStatus),
    csvEscape(r.contentType),
    csvEscape(r.targetUrl),
    csvEscape(r.parentTopic),
    csvEscape(r.primaryKeyword),
    csvEscape(r.articleTitle),
    csvEscape(r.currentHanChars),
    csvEscape(r.sourceRequirements),
  ].join(','))
].join('\n')
fs.writeFileSync(path.join(dataKwDir, 'content-priority.csv'), '\uFEFF' + prioCsv + '\n', 'utf8')

// Summary log when run directly
if (import.meta.url.endsWith('sync-keyword-system.mjs')) {
  const byType = {}
  for (const t of articleTasks) {
    const k = `${t.contentType}:${t.contentStatus}`
    byType[k] = (byType[k] || 0) + 1
  }
  console.log('[sync-keyword-system] Done:', {
    articleTasks: articleTasks.length,
    backlogRecords: backlogRecords.length,
    breakdown: byType,
  })
}
