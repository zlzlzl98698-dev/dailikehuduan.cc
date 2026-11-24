import fs from 'node:fs'
import path from 'node:path'
import esbuild from 'esbuild'

const root = process.cwd()
const docsDir = path.join(root, 'docs')

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

const { BRANDS, BRAND_BY_SLUG } = loadTs('docs/.vitepress/data/brands.ts')

const SUBAGENT_REVIEW_SLUGS = new Set([
  'guangsuyun',
  'feimao',
  'ermao',
  'xingdaomeng',
  'yinxingren',
  'lingdong',
  'edgenova',
])

function q(str) {
  return JSON.stringify(String(str ?? '').replace(/\r?\n/g, ' ').trim())
}

function unitCost(plan) {
  if (!plan.totalTrafficGb || plan.totalTrafficGb <= 0) return '待核实'
  if (plan.billingCycle === '年付') {
    const perMonthPrice = plan.monthlyEquivalent || Number((plan.price / 12).toFixed(2))
    return `¥${(perMonthPrice / plan.totalTrafficGb).toFixed(3)}/GB（按月均 ¥${perMonthPrice} 折算）`
  }
  return `¥${(plan.price / plan.totalTrafficGb).toFixed(3)}/GB`
}

function getLowestMonthlyPlan(b) {
  const m = b.plans.filter((p) => p.billingCycle === '月付')
  if (!m.length) return null
  return [...m].sort((a, c) => a.price - c.price)[0]
}

function getLowestAnnualPlan(b) {
  const a = b.plans.filter((p) => p.billingCycle === '年付')
  if (!a.length) return null
  return [...a].sort((x, y) => x.price - y.price)[0]
}

function getNonExpiringPlans(b) {
  return b.plans.filter((p) => p.billingCycle === '一次性付费')
}

function formatPeerTable(brand, peerSlugs) {
  const peers = [brand, ...peerSlugs.map((s) => BRAND_BY_SLUG[s]).filter(Boolean)].slice(0, 4)
  let out = `| 对比维度 | ${peers.map((p) => (p.slug === brand.slug ? `**${p.name}（本文）**` : `[${p.name}](/reviews/${p.slug}/)`)).join(' | ')} |\n`
  out += `| :--- | ${peers.map(() => ':---').join(' | ')} |\n`
  out += `| **运营起始标注** | ${peers.map((p) => `${p.foundedYear}（\`vendor\`）`).join(' | ')} |\n`
  out += `| **资料完整度与状态** | ${peers.map((p) => `${p.completeness}（\`${p.dataStatus}\`）`).join(' | ')} |\n`
  out += `| **客户端兼容模式** | ${peers.map((p) => p.clientMode).join(' | ')} |\n`
  out += `| **协议栈标注** | ${peers.map((p) => p.protocols.join(' / ')).join(' | ')} |\n`
  out += `| **最低真实月付门槛** | ${peers
    .map((p) => {
      const m = getLowestMonthlyPlan(p)
      return m ? `¥${m.price}/月（${m.trafficLabel}）` : '无独立单月档（仅年付折算或待核实）'
    })
    .join(' | ')} |\n`
  out += `| **最低年付/折算门槛** | ${peers
    .map((p) => {
      const a = getLowestAnnualPlan(p)
      return a ? `¥${a.price}/年（${a.trafficLabel}，折 ¥${a.monthlyEquivalent ?? (a.price / 12).toFixed(2)}/月）` : '未单独列出百元内年付'
    })
    .join(' | ')} |\n`
  out += `| **不限时流量包** | ${peers
    .map((p) => {
      const ne = getNonExpiringPlans(p)
      return ne.length ? `有（最低 ¥${ne[0].price}/${ne[0].trafficLabel}）` : '未收录/无'
    })
    .join(' | ')} |\n`
  out += `| **备案优惠码** | ${peers.map((p) => (p.coupon ? `\`${p.coupon}\`` : '未公开/无')).join(' | ')} |\n`
  out += `| **已知冲突或风险标记** | ${peers
    .map((p) => (p.conflicts.length ? p.conflicts[0].slice(0, 32) + '...' : p.riskFlags[0] || '常规待核实'))
    .join(' | ')} |\n`
  out += `| **套餐与注册入口** | ${peers.map((p) => `[查看 ${p.name} 套餐详情](/brands/${p.slug}/)`).join(' | ')} |\n`
  return out
}

// ---------------------------------------------------------------------------
// PART 1: Generate 24 Independent Brand Reviews (/reviews/<slug>/index.md)
// ---------------------------------------------------------------------------
function buildReviewMarkdown(b) {
  const lowestMonthly = getLowestMonthlyPlan(b)
  const lowestAnnual = getLowestAnnualPlan(b)
  const nonExpiring = getNonExpiringPlans(b)
  const hasTest = b.testRuns.length > 0
  const peers = b.relatedBrands.length ? b.relatedBrands : ['guangsuyun', 'yifan', 'ermao']

  // Determine Archetype (6 distinct structures!)
  let archetype = 'A_DUAL_HIGH'
  if (['yifan', 'kexin'].includes(b.slug)) archetype = 'B_OPEN_SUB'
  else if (b.clientMode === '仅专属客户端') archetype = 'C_CLOSED_CLIENT'
  else if (['u1s1', 'langwang', 'tiziyun'].includes(b.slug)) archetype = 'D_MID_HISTORICAL'
  else if (['sujie', 'jilian', 'guangnian', 'yuzhou'].includes(b.slug)) archetype = 'E_ENTRY_STARTER'
  else if (['dalaoyun', 'shandianshu', 'shenxing', 'yunjiexian', 'liulianyun', 'huanqiuti'].includes(b.slug)) archetype = 'F_ULTRA_BUDGET'

  const faqs = [
    {
      q: `${b.name}怎么样？目前资料可信度处于什么级别？`,
      a: `在 2026-11-23 站内审计库中，${b.name}（slug: ${b.slug}）资料完整度评级为“${b.completeness}”，主数据状态为 ${b.dataStatus}。其核心特点为${b.summary} 但所有未经本站独立晚高峰实测的宣称均需按 vendor/historical 口径审慎核验。`,
    },
    {
      q: `${b.name}支持 Clash Verge Rev、Shadowrocket（小火箭）或软路由导入吗？`,
      a:
        b.clientMode === '仅专属客户端'
          ? `不支持。原始资料明确标注 ${b.name} 采用“仅专属客户端”模式，不提供第三方通用订阅链接，因此无法导入 Clash Verge Rev、Shadowrocket、v2rayN 或 OpenWrt 软路由。`
          : b.clientMode === '第三方通用订阅' || b.clientMode === '自研+第三方订阅'
          ? `支持。资料标注 ${b.name} 为“${b.clientMode}”模式，支持导出订阅接入 ${b.clients.join('、')} 等主流客户端。首次导入前建议先关闭本地系统代理避免回环失败。`
          : `目前处于“待核实”状态。原始资料仅提及“${b.clients.join('、')}”，未明确区分是否全面开放标准 Clash YAML / Base64 订阅 URL，建议注册后先以最低月付档核实面板订阅导出栏。`,
    },
    {
      q: `${b.name}真实的最低月付价格是多少？有没有年付折算误区？`,
      a: lowestMonthly
        ? `${b.name} 真实可按单月购买的最低套餐为“${lowestMonthly.name}”，价格为 ¥${lowestMonthly.price}/月（${lowestMonthly.trafficLabel}）。${
            lowestAnnual
              ? `需要注意其“${lowestAnnual.name}”（¥${lowestAnnual.price}/年，折算约 ¥${lowestAnnual.monthlyEquivalent ?? (lowestAnnual.price / 12).toFixed(2)}/月）属于一次性预付全年的年付小包，并非单月售价。`
              : '库内未见更低价的年付折算小包。'
          }`
        : `${b.name} 在当前资料库中仅记录了“${b.plans[0]?.name || '参考起步档'}”（¥${b.plans[0]?.price || '待核实'} / ${b.plans[0]?.billingCycle || '待核实'}，${b.plans[0]?.trafficLabel || '待核实'}），缺少完整的独立多档月付价目表，购买前务必在面板核实是否存在真月付档。`,
    },
    {
      q: `${b.name}有哪些必须注意的历史资料冲突或链接异常？`,
      a:
        b.conflicts.length > 0
          ? `站内审计共记录了 ${b.conflicts.length} 项冲突/异常：${b.conflicts.join('；')}。${b.linkAnomaly ? `此外存在链接格式异常：${b.linkAnomalyNote}` : '未发现链接路由缺失。'}`
          : b.linkAnomaly
          ? `需重点警惕链接格式异常：${b.linkAnomalyNote}。在未确认官网证书与面板状态前请勿盲目大额充值。`
          : `当前两份原始清单中未发现 ${b.name} 的明显字段冲突，但节点倍率、退款细则与晚高峰吞吐仍属于待核实（unverified）事项。`,
    },
    {
      q: `${b.name}的优惠码是什么？结账时有哪些限制条件？`,
      a: b.coupon
        ? `资料备案的优惠码记录为“${b.coupon}”，适用条件说明为：${b.couponTerms}。请在下单弹窗输入后肉眼确认应付总额已扣减再付款，特价年付或入门包常被排除在折扣之外。`
        : `原始资料中 ${b.name} 暂未提供公开常驻优惠码（${b.couponTerms}），结账时以官方面板活动公告为准。`,
    },
    {
      q: `${b.name}适合用来访问 ChatGPT、Claude、Gemini 或看 Netflix 4K 吗？`,
      a: `在可用性矩阵中，${b.name} 的 AI 与流媒体支持均标注为 vendor（品牌方/历史资料声明）或 unknown（待核实）。由于 OpenAI、Anthropic 与 Netflix 对机房 IP 段风控极严，建议在客户端将 AI 与流媒体域名定向分流至日本、新加坡或美国节点，并以首月实测为准。`,
    },
    {
      q: `${b.name}有不限时（按量付费/永久有效）流量包吗？`,
      a:
        nonExpiring.length > 0
          ? `有。数据库收录了 ${nonExpiring.length} 档一次性不限时方案：${nonExpiring.map((p) => `${p.name}（¥${p.price} / ${p.trafficLabel}，折合 ${unitCost(p)}）`).join('；')}。适合作为主力月付之外的异构冷备订阅。`
          : `当前已收录的 ${b.plans.length} 档套餐中不包含一次性不限时流量包。若您需要配置主备双机场冷备，可对比光速云（¥147/247GB）、二猫云（¥99/100GB）或一翻云/唯兔云/星岛梦（¥100/100GB）。`,
    },
    {
      q: `第一次试用 ${b.name}，怎样把资金风险控制在最低？`,
      a: `严格遵循“先核验客户端开放度 → 只买最低单月付（不超过 25 元） → 保存下单四项凭证截图 → 在 20:00–23:30 晚高峰连续 3 天实测单线程 TTFB 与丢包”的四步法则，绝不首单直接购买年付或高价定制档。`,
    },
  ]

  const titleByArch = {
    A_DUAL_HIGH: `${b.name}深度评测与资料审计：${b.plans.length}档全周期套餐核算、历史测速与冲突核查（2026）`,
    B_OPEN_SUB: `${b.name}深度评测：第三方通用订阅兼容性、${b.plans.length}档价格精算与晚高峰核验指南（2026）`,
    C_CLOSED_CLIENT: `${b.name}深度评测与风险审计：仅专属客户端限制、${b.plans.length}档套餐成本与同阵营横评（2026）`,
    D_MID_HISTORICAL: `${b.name}评测与历史快照审计：已知套餐拆解、缺失/遮挡字段披露与核验方法（2026）`,
    E_ENTRY_STARTER: `${b.name}独立评测与资料缺口核查：入门定价核算、客户端模式与待核实清单（2026）`,
    F_ULTRA_BUDGET: `${b.name}评测与风险核查：超低价年付折算真相、链接/协议异常审计与安全选型边界（2026）`,
  }[archetype]

  const descByArch = `${b.name}（${b.aliases.join('/')}）独立深度评测：基于 2026-11-23 审计快照拆解其 ${b.plans.length} 档套餐真实每 GB 成本、${b.clientMode}兼容性、${b.protocols.join('/')} 协议与线路声明、${b.conflicts.length} 项数据冲突及同价位替代方案。`

  let md = `---
title: ${q(titleByArch)}
description: ${q(descByArch)}
lastUpdated: 2026-11-24
author: 代理客户端编辑部
category: 品牌独立评测
tags:
  - ${b.name}
  - ${b.name}评测
  - ${b.clientMode}
  - 机场评测
pillar: brands
parentTopic: /brands/reviews/
primaryKeyword: ${q(`${b.name}怎么样 靠谱吗`)}
searchIntent: Commercial Investigation
relatedSlugs:
  - /brands/${b.slug}/
  - /brands/reviews/
  - /brands/comparisons/
  - /plans/monthly-under-20-guide/
  - /airport/client-vs-third-party-subscription/
relatedBrands:
${[b.slug, ...peers.slice(0, 3)].map((s) => `  - ${s}`).join('\n')}
faq:
${faqs.map((f) => `  - q: ${q(f.q)}\n    a: ${q(f.a)}`).join('\n')}
---

# ${titleByArch}

<div class="answer-first-box">
  <div class="answer-first-label">评测结论（Answer-First）</div>
  <p><strong>${b.name}（${b.aliases.join(' / ')}）</strong>在本站 31 家去重品牌库中的资料完整度评级为<strong>「${b.completeness}」</strong>（主证据状态：<code>${b.dataStatus}</code>，资料快照基准日：<code>${b.verifiedAt}</code>）。该品牌定位为：${b.summary} ${
    lowestMonthly
      ? `真实单月付门槛为 <strong>¥${lowestMonthly.price}/月（${lowestMonthly.trafficLabel}）</strong>`
      : `已知参考档位为 <strong>¥${b.plans[0]?.price}/${b.plans[0]?.billingCycle}（${b.plans[0]?.trafficLabel}）</strong>`
  }${
    lowestAnnual
      ? `，另设年付小包 ¥${lowestAnnual.price}/年（折合 ¥${lowestAnnual.monthlyEquivalent ?? (lowestAnnual.price / 12).toFixed(2)}/月）`
      : ''
  }。客户端交付模式标注为<strong>「${b.clientMode}」</strong>。${
    b.conflicts.length
      ? `选购前须重点核查 <strong>${b.conflicts.length} 项原始资料冲突</strong>（${b.conflicts[0]}）`
      : '目前资料未见直接字段矛盾，但线路倍率与退款细则仍需下单前实测确认'
  }${b.linkAnomaly ? `，且需警惕<strong>链接格式异常（${b.linkAnomalyNote}）</strong>` : ''}。</p>
</div>

<BrandSnapshot slug="${b.slug}" />

`

  // Six-state Data Status Table (Chapter 8.1 requirement!)
  const dataStateTable = `
### 统一六维数据可信度状态表（Data Credibility Ledger）

遵照本站「拒绝将厂商宣传包装成实测」的编辑准则，下表将 ${b.name} 当前全部资料拆解为六个标准可信度状态（\`verified\` / \`measured\` / \`vendor\` / \`historical\` / \`unverified\` / \`conflicted\`）：

| 数据状态代码 | 状态定义 | ${b.name} 对应字段与核查结果 |
| :--- | :--- | :--- |
| **\`verified\`（已核实结构事实）** | 经站内多源比对确认的客观文本与结构记录 | 品牌去重唯一标识 \`slug: ${b.slug}\`；已收录套餐档位数 **${b.plans.length} 档**；原始出处：\`${b.originalSource}\`（采集时间 \`${b.sourceUpdatedAt}\`） |
| **\`measured\`（明确条件实测）** | 具备明确测试时间、运营商环境与正负样本的测量 | ${
    b.testRuns.some((t) => t.evidence === 'measured')
      ? b.testRuns.map((t) => `${t.dateLabel}（${t.environment}）：${t.summaryNote}`).join('；')
      : '截至 2026-11-24，本站尚未对 ' + b.name + ' 进行独立晚高峰（20:00–23:30）抓包实测，拒绝伪造跑分'
  } |
| **\`vendor\`（品牌方声明）** | 源自品牌文案或面板标称参数，未经独立穿透核验 | 运营起始年份“${b.foundedYear}”；线路标签“${b.routes.map((r) => r.label).join(' / ')}”；核心声明：${b.claims.map((c) => c.statement).join('；')} |
| **\`historical\`（历史快照）** | 来自 2026-10-19 或 2026-08-09 历史汇总，存在时效衰减 | ${
    hasTest
      ? `${b.testRuns[0].dateLabel}（${b.testRuns[0].condition}）五地延迟与带宽汇总记录；仅反映历史非高峰截面`
      : `原始清单于 ${b.sourceUpdatedAt} 归档的参考价格与分类标签`
  } |
| **\`unverified\`（尚未核实缺口）** | 原始档案未记载，需用户购前或首月自测确认 | 真实节点扣费倍率（1x vs 高倍率）、同时在线设备硬上限、退款受理细则、当下面板实时可用性${b.completeness === '基础' ? '、完整多档价目表与全部落地国家列表' : ''} |
| **\`conflicted\`（存在资料冲突）** | 不同批次原始文件之间出现数值或表述不一致 | ${
    b.conflicts.length > 0
      ? b.conflicts.map((c, idx) => `(${idx + 1}) ${c}`).join('；')
      : b.linkAnomaly
      ? `推广链接格式异常：${b.linkAnomalyNote}`
      : '当前主表与分表间未发现直接数值冲突'
  } |
`

  // Deep Plan Section
  const planAnalysisSection = `
<PlanTable slug="${b.slug}" />

### 套餐每 GB 真实成本与周期锁仓精算表

许多用户在看价格表时容易把“年付折算月均价”当成“花几块钱就能买一个月”。下面我们对 ${b.name} 已收录的 **${b.plans.length} 档套餐**逐一计算**单次实付门槛**、**理论每 GB 单价**与**资金锁仓风险系数**：

| 套餐名称 | 付款周期 | 单次实付金额 | 流量配额与重置规则 | 折算月均成本 | 理论 1x 每 GB 单价 | 证据级别与选型定性 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${b.plans
  .map((p) => {
    const mEq =
      p.billingCycle === '年付'
        ? `¥${p.monthlyEquivalent ?? (p.price / 12).toFixed(2)}/月（需一次付 ¥${p.price}）`
        : p.billingCycle === '月付'
        ? `¥${p.price.toFixed(2)}/月（真实月付）`
        : '按量一次性（无月度固定摊销）'
    return `| **${p.name}** | ${p.billingCycle} | **¥${p.price}** | ${p.trafficLabel}（${p.resetCycle}） | ${mEq} | **${unitCost(p)}** | \`${p.evidence}\` · ${p.notes} |`
  })
  .join('\n')}

#### 价格体系深度拆解与使用成本模拟

1. **真实首月试错门槛（止损线核算）**：
   - ${
     lowestMonthly
       ? `${b.name} 支持单月购买的最低档位为 **${lowestMonthly.name}（¥${lowestMonthly.price}/月 · ${lowestMonthly.trafficLabel}）**。按照本站倡导的[20 元以内与入门月付选型准则](/plans/monthly-under-20-guide/)，您在首次验证该品牌与本地宽带（电信/联通/移动）晚高峰兼容性时，最大资金敞口即为 **¥${lowestMonthly.price}**。即便测试后发现不适合自己，沉没成本也严格受控。`
       : `值得高度警惕的是，${b.name} 在现有原始资料中**仅记录了 ${b.plans[0]?.name}（¥${b.plans[0]?.price} / ${b.plans[0]?.billingCycle}）**，并未列出清晰的多档月付阶梯。若其面板要求必须按年或按季起付，您的首次试错成本将显著抬升，建议参考[机场年付折算月价与盈亏平衡分析](/plans/annual-vs-monthly-cost/)计算回本周期。`
   }
2. **年付小包与长周期折算边界**：
   - ${
     lowestAnnual
       ? `表中的 **${lowestAnnual.name}（¥${lowestAnnual.price}/年，${lowestAnnual.trafficLabel}）** 折算月均虽低至 **¥${lowestAnnual.monthlyEquivalent ?? (lowestAnnual.price / 12).toFixed(2)}/月**，但它有两个硬性前提：一是必须一次性预付全年 ¥${lowestAnnual.price}；二是每月可用流量被锁定在 ${lowestAnnual.trafficLabel}（约合日均 ${((lowestAnnual.totalTrafficGb || 60) / 30).toFixed(1)}GB），且特价年付档往往不参与常规优惠码打折。只有当您主要用它收发邮件、查资料、轻度使用 AI 对话，且已通过月付确认线路稳定后，年付小包才具备真实性价比。`
       : `当前记录中 ${b.name} 未单独设立百元以内的特价年付小包，整体计费模型以常规周期套餐为主。`
   }
3. **一次性不限时流量包的备灾价值**：
   - ${
     nonExpiring.length > 0
       ? `${b.name} 提供了 **${nonExpiring.map((p) => `${p.name}（¥${p.price}/${p.trafficLabel}）`).join('、')}** 等不限时方案。按 1 倍率计算，其入门每 GB 成本为 **${unitCost(nonExpiring[0])}**。对于已有主力月付机场、只想备一个“平时不扣月租、主力故障时秒切应急”的读者，这类不限时包具有明确的容灾价值（详见[如何区分机场维护与停运及双订阅灾备](/safety/how-to-verify-airport-closure/)）。但若购买超过 ¥300 的大额不限时包，则需承担平台长期存续的信用风险。`
       : `${b.name} 目前未收录一次性不限时流量包，因此它只适合作为按周期连续使用的候选，不适合作为零月租冷备订阅。`
   }
4. **节点倍率（Multiplier）对真实单价的放大效应**：
   - 在原始资料中，${b.name} 的全部套餐倍率字段均处于 **\`${b.plans[0]?.multiplier || '待核实'}\`** 状态。根据[机场线路倍率计费规则](/routes/multiplier-billing-explained/)，如果面板中部分 IEPL/IPLC 或流媒体原生节点标注为 \`2x\` 或 \`3x\` 倍率，那么表面 150GB 的套餐在全程挂载 2x 节点时实际仅能传输 75GB 数据，等效每 GB 成本会直接翻倍。导入订阅后务必先查看节点名称后缀中的倍率标记。
5. **优惠码 \`${b.coupon || '无公开码'}\` 的核验与排除条款**：
   - 资料登记的优惠信息为：**优惠码 \`${b.coupon || '暂无'}\`**（条款说明：*${b.couponTerms}*）。根据全站[套餐优惠与优惠码核验台账](/brands/coupons/)的审计经验，请在结算页输入优惠码后确认应付金额确实发生扣减再行支付；如遇双优惠码记录（例如历史码与新码并存），以面板接口实时返回的有效折扣为准。
`

  const clientDeepSection =
    b.clientMode === '仅专属客户端'
      ? `
### 为什么“仅专属客户端”是选型时最大的分水岭？

根据数据库核对，**${b.name}** 的客户端交付模式明确归类为 **「仅专属客户端（Closed Client Only）」**（关联说明：*${b.clients.join('、')}*）。在决定是否为其付费前，您必须清楚这一架构带来的 **1 项便利** 与 **5 项硬性限制**（详见[自研专属客户端 vs 第三方通用订阅全解析](/airport/client-vs-third-party-subscription/)）：

1. **唯一便利：零门槛账号密码直连**
   - 您不需要去 GitHub 区分 \`x64\` 与 \`arm64\` 安装包，不需要理解 YAML 语法、\`Proxy-Groups\` 策略组或 \`Fake-IP\` 原理。从官方面板下载专属客户端后，输入注册邮箱与密码即可一键开启智能或全局代理，对完全不想折腾软件配置纯新手较为直观。
2. **硬性限制一：彻底无缘 Clash Verge Rev / FlClash / Shadowrocket / v2rayN**
   - 因为后台**不提供通用订阅链接（Subscription URL）**，您无法将 ${b.name} 的节点导入自己熟悉的开源客户端，也无法使用自己精心维护的 \`Global Merge\` 或 \`Script\` 分流覆写脚本。
3. **硬性限制二：无法部署于 OpenWrt 软路由 / 旁路由 / NAS**
   - 家庭局域网共享、Apple TV、PS5/Switch 游戏主机加速以及 Docker 容器透明代理均高度依赖 [OpenClash](/clients/openclash/)、[PassWall2](/clients/passwall2/) 或 [Nikki](/clients/nikki/) 读取订阅链接。仅专属客户端模式意味着**无法在路由器层面实现全家无感分流**。
4. **硬性限制三：无法构建跨品牌 Mihomo 自动故障转移（Failover）**
   - 在开源客户端中，用户可以同时导入两家机场的订阅并通过 \`fallback\` 策略组实现断线自动切换；而专属客户端属于独立封闭进程，一旦当前服务商维护，您必须手动退出该软件再去启动另一款客户端。
5. **硬性限制四：AI 与流媒体分流粒度受制于官方内置规则**
   - 当某个香港节点打开网页版 ChatGPT 遭遇地区限制，或某个新加坡节点看 YouTube 触发“送中（CN）”时，您无法自己写一条 \`DOMAIN-SUFFIX,openai.com,US-Node\` 规则单独分流，只能手动切换整个客户端的全局出站节点。
6. **硬性限制五：闭源二进制程序的权限与网络冲突自检**
   - 专属客户端在 Windows / macOS 上同样会安装虚拟网卡驱动或修改系统代理注册表。如果您电脑上同时装有 Clash Verge Rev、v2rayN、WSL2 或企业内网 VPN，极易发生网卡路由抢占（排查方法见[节点连接成功但打不开网页修复](/troubleshooting/connected-no-internet-fix/)与[Windows TUN 与 WSL2/Docker 冲突排查](/troubleshooting/tun-wsl-docker-conflict/)）。

#### 专属客户端安全运行与本地网络自检命令

如果您确属轻度单机用户、决定使用 ${b.name} 的官方专属客户端，建议在安装与首次连接后打开 PowerShell 执行以下安全与连通性自检：

\`\`\`powershell
# 1. 检查专属客户端拉起的本地监听端口与进程路径，确认未抢占其他开发工具端口
netstat -ano | findstr "LISTENING"

# 2. 检查系统虚拟网卡状态，避免与已安装的 Mihomo / Wintun 网卡同时开启导致路由死锁
Get-NetAdapter | Where-Object { $_.Status -eq "Up" } | Select-Object Name, InterfaceDescription, Status

# 3. 开启专属客户端后，验证出口 IP 所属国家与 ASN 是否与所选节点一致
curl.exe -s https://api.ip.sb/geoip
\`\`\`
`
      : `
### 客户端兼容矩阵与开源工具标准接入指南

**${b.name}** 的客户端模式在数据库中标注为 **「${b.clientMode}」**，声明协议栈为 **\`${b.protocols.join(' / ')}\`**，原始资料提及的客户端范围包括：**${b.clients.join('、')}**。

| 操作系统平台 | 推荐首选开源客户端 | 备选客户端 | 订阅格式与内核要求 | 对应实操教程 |
| :--- | :--- | :--- | :--- | :--- |
| **Windows 10 / 11** | **[Clash Verge Rev](/clients/clash-verge-rev/)** | [v2rayN](/clients/v2rayn/) / [FlClash](/clients/flclash/) | Mihomo YAML / Xray & sing-box 多核 | [Clash Verge Rev 从零安装到 TUN 全流程](/guides/clash-verge-rev-setup/) |
| **macOS (Apple Silicon / Intel)** | **[Clash Verge Rev](/clients/clash-verge-rev/)** | [FlClash](/clients/flclash/) / [Stash](/clients/stash/) | Mihomo YAML（支持原生 Service Mode） | [Clash Verge Rev 订阅导入与 UA 排雷](/guides/clash-verge-rev-import-subscription/) |
| **iOS / iPadOS** | **[Shadowrocket（小火箭）](/clients/shadowrocket/)** | [Stash](/clients/stash/) / [Karing](/clients/karing/) | 通用 Subscribe / Clash YAML | [Shadowrocket 添加订阅与配置分流指南](/guides/shadowrocket-ios-setup/) |
| **Android** | **[FlClash](/clients/flclash/)** / **[CMFA](/clients/clash-meta/)** | [v2rayNG](/clients/v2rayng/) / [Hiddify](/clients/hiddify/) | Mihomo YAML / Base64 通用订阅 | [v2rayN / v2rayNG 多核心订阅教程](/guides/v2rayn-subscription-and-core/) |
| **OpenWrt 软路由** | **[OpenClash](/clients/openclash/)** / **[Nikki](/clients/nikki/)** | [PassWall2](/clients/passwall2/) / [HomeProxy](/clients/homeproxy/) | 需确认面板开放通用订阅 URL | [OpenWrt 软路由客户端选型中心](/clients/platform/openwrt/) |

${
  b.clientMode === '待核实'
    ? `> **重要核实提醒**：由于 ${b.name} 在原始资料中关于“是否同时提供自研端与标准第三方订阅链接”的表述未做严格区分（标记为 \`待核实\`），如果您是冲着在 OpenWrt 软路由或 Clash Verge Rev 中使用而购买，**务必先用最低单月付档登录面板，确认仪表盘存在「一键导入 Clash / 复制通用订阅链接」按钮**。`
    : ''
}

#### 首次导入订阅的命令行预检与防回环规范

在将 ${b.name} 的订阅链接导入桌面客户端前，建议先按以下步骤在终端验证订阅响应头并排除代理死循环（详见[订阅返回 200 但内容为空排查](/troubleshooting/subscription-200-empty-fix/)）：

\`\`\`powershell
# 1. 导入前先关闭本地旧客户端的系统代理与 TUN 模式，用 curl 检查订阅响应头与剩余流量字节
curl.exe -I -s -L -A "clash-verge/v2.2.3" "你的订阅链接"

# 2. 导入并开启系统代理（以 Clash Verge Rev 默认 7897 端口为例）后，测试真实 HTTPS 握手延迟
curl.exe -o NUL -s -w "HTTP=%{http_code} | TCP=%{time_connect}s | TLS=%{time_appconnect}s | TTFB=%{time_starttransfer}s\n" -x http://127.0.0.1:7897 https://cp.cloudflare.com/generate_204
\`\`\`
`

  const routeAndTestSection = `
<NetworkPathDiagram slug="${b.slug}" />

### 线路架构、协议栈与节点地区分布核查

1. **线路类型声明与证据边界**：
   - 在原始资料中，${b.name} 的传输线路标注为：**${b.routes.map((r) => `${r.label}（\`${r.evidence}\`）`).join('、')}**。
   - 按照[IEPL 与 IPLC 专线技术解析](/routes/iepl-vs-iplc-difference/)以及[机场推荐里 IEPL 专线的真实意义](/airport/iepl-meaning-and-value/)的核验标准，商业机场标称的“IEPL/IPLC 专线”或“BGP 三网优化”均属于 \`vendor\`（品牌方声明）。在实际工程部署中，大多数月付 15–30 元档位的套餐采用的是“国内多线 BGP 入口汇聚 → 跨境内网专线或加密公网隧道 → 海外机房落地”的混合架构。普通用户无需迷信营销名词，而应重点考察晚高峰（20:00–23:30）跨运营商入口是否丢包。
2. **协议栈与客户端内核要求**：
   - ${b.name} 标注的协议为 **\`${b.protocols.join(' / ')}\`**。${
     b.protocols.some((p) => p.toLowerCase().includes('vless') || p.toLowerCase().includes('hysteria') || p.toLowerCase().includes('anytls'))
       ? '其中 VLESS（含 Reality）与 Hysteria 2 等现代抗干扰协议对本地系统时钟精度（误差不得超过 90 秒）以及客户端内核版本有严格要求，必须使用 Mihomo（原 Clash.Meta）或 sing-box / Xray 新版内核，不可使用早已停更的旧版 Clash for Windows（详见[系统时间偏差导致 TLS 与节点超时修复](/guides/system-time-tls-fix/)）。'
       : b.protocols.some((p) => p.includes('待核实'))
       ? '由于原始资料未明确公开底层传输协议（或被封装在专属客户端内部），建议在连接后通过客户端日志或面板节点列表核实具体协议类型。'
       : 'Trojan 与 Shadowsocks 属于兼容性极广的成熟协议，在主流 Mihomo、sing-box、Xray 与 Shadowrocket 客户端中均可直接解析。'
   }
3. **节点覆盖地区（Regions）**：
   - 已知覆盖地区包括：**${b.regions.join('、')}**。${
     b.regions.some((r) => r.includes('待核实'))
       ? '注意其中部分地区存在资料记录不一致或缺失，属于待核实（`unverified`）范围，实际可用地区及各地区节点数量以激活订阅后拉取的列表为准。'
       : '主力覆盖集中在香港、台湾、日本、新加坡、美国五高频区域，能够满足常规网页检索、开发文档查阅与跨区流媒体访问需求。'
   }

<PerformanceReport slug="${b.slug}" />

### 测速证据审计：如何正确看待 ${b.name} 的性能记录？

${
  hasTest
    ? `数据库收录了 ${b.name} 的一组测速记录（时间标签：**\`${b.testRuns[0].dateLabel}\`**，测试条件：**\`${b.testRuns[0].condition}\`**，证据级别：**\`${b.testRuns[0].evidence}\`**）：

| 测试落地地区 | 记录延迟 (Latency) | 记录下载速率 (Download) | 证据状态与工程解读 |
| :--- | :--- | :--- | :--- |
${b.testRuns[0].rows
  .map(
    (r) =>
      `| **${r.region}** | ${r.latencyMs !== null ? `${r.latencyMs} ms` : '未量化'} | **${r.downloadSpeed}** | \`${b.testRuns[0].evidence}\` · ${
        r.region.includes('香港')
          ? '近岸低延迟梯队，适合低交互延迟网页与常规接口请求'
          : r.region.includes('新加坡') || r.region.includes('日本') || r.region.includes('台湾')
          ? '亚太主力落地，常用于 AI 服务分流与流媒体跨区解锁'
          : '跨太平洋长距离链路，受 TCP 窗口与晚高峰出口影响较大'
      } |`
  )
  .join('\n')}

**关键审计警示**：${b.testRuns[0].summaryNote} 在全站 31 家品牌中，有 15 家品牌的 \`2026-10-19 非晚高峰\` 五地延迟与下载数值分布高度接近，且未附带测试客户端名称、单线程/多线程参数与本地运营商（电信/联通/移动）信息。因此，**上表绝不能被当成今日晚高峰的实时速度承诺**。购买首月请务必参照[如何判断机场晚高峰是否稳定（20:00–23:30 实操验证法）](/airport/evening-peak-stability-test/)在您自己的宽带下复测。`
    : `截至 \`2026-11-24\`，原始资料库中**未包含 ${b.name} 的任何按地区量化延迟或带宽测试数据**（证据状态为 \`unknown / Not Tested\`）。

**为什么没有测速图反而体现了本站的客观性？** 互联网上大量推广站会用同一张伪造的 Speedtest 截图换个标题贴给几十家不同机场。本站严格遵守「零伪造」铁律：原始档案没有实测数据，就如实展示为空白并列出待核实缺口。若您决定以小额月付试水 ${b.name}，请按[晚高峰稳定性标准化验证指南](/airport/evening-peak-stability-test/)在本地测量单线程 TTFB、15 分钟连续丢包率与 25MB 样本下载吞吐。`
}
`

  const aiStreamingSection = `
<AvailabilityMatrix slug="${b.slug}" />

### AI 生产力工具与流媒体解锁兼容性深度分析

结合上方可用性监测矩阵面板与[ChatGPT 地区不支持与降智 5 层排查](/ai-streaming/chatgpt-region-and-block-fix/)、[Netflix 解锁失败与自制剧检查指南](/ai-streaming/netflix-unlock-check-guide/)，评估 ${b.name} 的跨区应用表现时必须遵循以下工程事实：

1. **ChatGPT / Claude / Gemini 的风控与节点选择**：
   - 在 ${b.name} 的资料记录中，AI 服务状态为：${b.aiServices.map((s) => `**${s.service}**（\`${s.status}\` / \`${s.evidence}\`：${s.note}）`).join('；')}。
   - **实战排雷**：无论任何机场，**香港节点普遍不受 OpenAI 网页版与 Claude 支持**（常提示 \`Unsupported Country\` 或仅移动端 App 可连），而 Google Gemini 对机房广播 IP 极易触发地区漂移（俗称“送中”）。如果您使用支持规则分流的客户端，请务必在配置中把 \`geosite:openai\`、\`geosite:anthropic\` 与 \`geosite:google-gemini\` 单独绑定到 **日本、新加坡或美国** 的低风险落地节点，并开启 \`dns.respect-rules: true\` 防止 DNS 泄漏。
2. **Netflix / Disney+ / YouTube / TikTok 解锁边界**：
   - 流媒体状态记录为：${b.streaming.map((s) => `**${s.service}**（\`${s.status}\` / \`${s.evidence}\`）`).join('、')}。
   - **自制剧 vs 全区剧差异**：几乎任何未死掉的海外代理节点都能打开 Netflix 观看《怪奇物语》等自制剧（Originals），只有具备干净 DNS 解锁或原生 ISP/住宅 IP 的节点才能观看非自制第三方版权剧并显示对应地区排名前十榜单。此外，部分亚太共享机房 IP 在观看 YouTube 时可能偶发广告区域识别异常，切换至日本或美国主力节点即可恢复。
`

  const conflictAndRiskSection = `
### 历史资料冲突、风险标志与待核实字段台账

在 ` + '`audit/data-conflicts.md`' + ` 与 ` + '`brands.ts`' + ` 交叉审计中，关于 **${b.name}** 共提取出以下风险与待核实事项，请在付款前逐条对照：

#### 1. 已记录的资料冲突与异常（Conflicts & Anomalies）
${
  b.conflicts.length > 0
    ? b.conflicts.map((c, i) => `- **冲突记录 #${i + 1}**：${c}`).join('\n')
    : '- 当前两份原始资料清单之间未出现直接的数值矛盾记录。'
}
${
  b.linkAnomaly
    ? `- **链接格式异常警示（Link Anomaly）**：\`${b.linkAnomalyNote}\`。在访问注册面板时，请留意浏览器地址栏是否正常跳转至登录/注册路由，若出现白屏或 404，请先核实其主域名状态（参见[如何判断机场官网是否真实](/brands/how-to-verify-airport-legitimacy/)）。`
    : ''
}

#### 2. 风险提示清单（Risk Flags）
${b.riskFlags.map((r, i) => `- **风险点 #${i + 1}**：${r}`).join('\n')}

#### 3. 品牌方核心声明溯源（Vendor Claims Provenance）
${b.claims.map((c) => `- 声明内容：「*${c.statement}*」 —— 证据分级：\`${c.evidence}\`，记录来源：\`${c.source}\``).join('\n')}

#### 4. 下单前必查的“待核实缺口”清单（Unverified Gaps Checklist）
1. **节点计费倍率明细**：确认主力香港/日本/新加坡/美国节点是否为 \`1.0x\` 标准倍率，有无隐藏的 \`2x–5x\` 高倍率家宽或专线节点；
2. **同时在线设备数与 IP 限制**：确认个人多设备（手机 + 电脑 + 平板）同时在线是否受限，避免因超限触发自动封禁；
3. **退款与售后响应条款**：核实面板 TOS 是否规定“虚拟商品概不退款”，并按[订阅泄露风险与付费凭证留存指南](/safety/subscription-leak-and-refund-evidence/)保存购前四项截图。
`

  const audienceSection = `
### 七类典型用户画像选型建议（有条件结论）

我们拒绝给出“无脑推荐”或“一棍子打死”的绝对化结论。根据 ${b.name} 的真实参数结构（${b.clientMode}、${
    lowestMonthly ? `最低月付 ¥${lowestMonthly.price}` : `起步档 ¥${b.plans[0]?.price}/${b.plans[0]?.billingCycle}`
  }、完整度「${b.completeness}」），针对七类不同需求的用户建议如下：

| 用户类型 | 是否推荐选 ${b.name}？ | 条件判断与替代/实操建议 |
| :--- | :--- | :--- |
| **1. 零基础纯新手用户** | **${
    b.clientMode === '仅专属客户端' && lowestMonthly && lowestMonthly.price <= 25
      ? '有条件适合（仅限单机月付试水）'
      : lowestMonthly && lowestMonthly.price <= 25 && !b.linkAnomaly
      ? '适合以最低月付档试错'
      : '不建议作为首单首选'
  }** | ${
    b.clientMode === '仅专属客户端'
      ? '专属客户端省去了配置 YAML 的麻烦，但必须接受无法用 Clash/小火箭的限制，且首单只建议买单月付。'
      : lowestMonthly
      ? `首单建议仅购买 ¥${lowestMonthly.price} 月付档配合 Clash Verge Rev 或 Shadowrocket 实测，切勿直接年付。`
      : '因缺少清晰的低门槛单月付资料或存在历史待核实项，新手建议优先考虑资料完整度高的双模月付品牌。'
  } |
| **2. 轻度查资料 / 极低频用户** | **${
    lowestAnnual && lowestAnnual.price <= 110
      ? '可在月付验证通过后考虑年付小包'
      : nonExpiring.length > 0 && nonExpiring[0].price <= 150
      ? '适合考虑其百元级不限时流量包'
      : '性价比较一般'
  }** | ${
    lowestAnnual
      ? `虽有 ¥${lowestAnnual.price}/年（${lowestAnnual.trafficLabel}）小包，但须先确认稳定性，或对比光速云 ¥147/247GB、二猫云 ¥99/100GB 不限时包。`
      : '若月均用量不足 20GB，单独购买支持第三方订阅的百元不限时包往往比按月续费更划算。'
  } |
| **3. 多设备与家庭软路由用户** | **${
    b.clientMode === '仅专属客户端'
      ? '明确不适合（一票否决）'
      : b.clientMode === '自研+第三方订阅' || b.clientMode === '第三方通用订阅'
      ? '有条件适合（需核实并发条款）'
      : '需先核实是否开放通用订阅'
  }** | ${
    b.clientMode === '仅专属客户端'
      ? '仅专属客户端无法导出订阅至 OpenWrt 软路由（OpenClash/Nikki）或 Apple TV，软路由用户请直接绕道。'
      : '软路由与多终端汇聚对订阅格式和并发连接数要求高，建议参照 /airport/multi-device/ 配置局域网收敛。'
  } |
| **4. ChatGPT / Claude / Gemini 重度用户** | **${
    b.clientMode === '仅专属客户端' ? '谨慎（缺乏自定义分流粒度）' : '有条件适合（需配置美日新分流）'
  }** | AI 平台风控取决于具体落地 IP 纯净度。支持第三方订阅时可通过 Mihomo 规则将 AI 域名锁死在美/日/新节点；专属端则只能整体切节点。 |
| **5. 4K 流媒体（Netflix / YouTube）用户** | **${
    b.plans.some((p) => (p.totalTrafficGb || 0) >= 200) ? '中大流量档可作为候选' : '流量配额偏紧，需留意倍率'
  }** | 4K 视频每小时消耗约 7GB–15GB 流量（详见 /plans/traffic-100gb-vs-300gb/），选购前务必确认主力节点为 1 倍率且晚高峰单线程吞吐达标。 |
| **6. 远程办公 / 开发者（WSL2 / Docker）** | **${
    b.clientMode === '仅专属客户端' ? '不推荐（易与开发环境网卡冲突）' : '适合配合开源客户端 TUN/规则使用'
  }** | 开发者需要精细控制 \`route-exclude-address\` 与 Git/SSH 终端代理，强烈建议使用支持标准订阅的机场配合 Clash Verge Rev。 |
| **7. 追求极致低价 / 预算高度敏感用户** | **理性评估风险收益比** | 任何低于 ¥10/月的折算价均伴随年付锁仓、共享超售或链接异常风险，建议守住 ¥15–¥25 真月付试错底线。 |
`

  const peerSection = `
### 同价位与同类型品牌横向对比

为了避免孤立看单一品牌，我们将 **${b.name}** 与定位相近的 **${peers.map((s) => BRAND_BY_SLUG[s]?.name).filter(Boolean).join('、')}** 放在同一套口径下进行横向对照（仅对同口径已知参数做事实列举，不作伪造跑分排名）：

${formatPeerTable(b, peers)}

如需查阅更完整的双品牌对决分析，可进一步阅读[品牌横向对比中心](/brands/comparisons/)。
`

  // Assemble chapters in DIFFERENT order per Archetype (Chapter 7.4 requirement!)
  if (archetype === 'A_DUAL_HIGH') {
    md += `## 一、直接评测结论与六维数据可信度状态\n${dataStateTable}\n---\n`
    md += `## 二、${b.plans.length} 档套餐完整分析：月付、年付折算与不限时成本核算\n${planAnalysisSection}\n---\n`
    md += `## 三、历史资料冲突与优惠码条款专项审计\n${conflictAndRiskSection}\n---\n`
    md += `## 四、线路架构、协议声明与 2026-10-19 历史测速复核\n${routeAndTestSection}\n---\n`
    md += `## 五、客户端兼容模式与跨平台接入验证\n${clientDeepSection}\n---\n`
    md += `## 六、AI 工具与流媒体解锁表现分析\n${aiStreamingSection}\n---\n`
    md += `## 七、同价位品牌横向比较\n${peerSection}\n---\n`
    md += `## 八、优势、限制与七类用户选择建议\n${audienceSection}\n---\n`
  } else if (archetype === 'B_OPEN_SUB') {
    md += `## 一、核心评测结论：为什么第三方通用订阅对进阶用户至关重要？\n${dataStateTable}\n---\n`
    md += `## 二、全平台开源客户端兼容性与订阅导入实操\n${clientDeepSection}\n---\n`
    md += `## 三、${b.plans.length} 档套餐价格计算与真实每 GB 成本精算\n${planAnalysisSection}\n---\n`
    md += `## 四、线路类型、协议栈与测速证据边界\n${routeAndTestSection}\n---\n`
    md += `## 五、AI 生产力与流媒体分流适配分析\n${aiStreamingSection}\n---\n`
    md += `## 六、资料冲突、透明度评价与购前核查清单\n${conflictAndRiskSection}\n---\n`
    md += `## 七、同类第三方订阅品牌横向对比\n${peerSection}\n---\n`
    md += `## 八、适用人群画像与选型决策建议\n${audienceSection}\n---\n`
  } else if (archetype === 'C_CLOSED_CLIENT') {
    md += `## 一、直接评测结论与“仅专属客户端”定位核查\n${dataStateTable}\n---\n`
    md += `## 二、专属客户端架构深度剖析：操作便利性与五大生态限制\n${clientDeepSection}\n---\n`
    md += `## 三、${b.plans.length} 档套餐完整拆解：年付小包、月付阶梯与不限时核算\n${planAnalysisSection}\n---\n`
    md += `## 四、品牌资料冲突、去重溯源与异常审计\n${conflictAndRiskSection}\n---\n`
    md += `## 五、线路声明与历史非晚高峰测速评估\n${routeAndTestSection}\n---\n`
    md += `## 六、无自定义分流下的 AI 与流媒体兼容性边界\n${aiStreamingSection}\n---\n`
    md += `## 七、同阵营专属端与双模品牌横向比较\n${peerSection}\n---\n`
    md += `## 八、谁适合买、谁应避开？七类用户选择建议\n${audienceSection}\n---\n`
  } else if (archetype === 'D_MID_HISTORICAL') {
    md += `## 一、评测结论与历史资料快照状态审计\n${dataStateTable}\n---\n`
    md += `## 二、缺失字段、截图遮挡与历史冲突专项拆解\n${conflictAndRiskSection}\n---\n`
    md += `## 三、已收录 ${b.plans.length} 档套餐成本分析与下单前核对要点\n${planAnalysisSection}\n---\n`
    md += `## 四、线路、协议与测速资料完备度评估\n${routeAndTestSection}\n---\n`
    md += `## 五、客户端模式核查与安全接入规范\n${clientDeepSection}\n---\n`
    md += `## 六、AI 与流媒体可用性边界分析\n${aiStreamingSection}\n---\n`
    md += `## 七、同档位高完整度替代品牌横向对比\n${peerSection}\n---\n`
    md += `## 八、用户选择建议与试错风险控制\n${audienceSection}\n---\n`
  } else if (archetype === 'E_ENTRY_STARTER') {
    md += `## 一、直接评测结论与基础档案完整度说明\n${dataStateTable}\n---\n`
    md += `## 二、入门套餐定价核算与“资料缺口”透明披露\n${planAnalysisSection}\n---\n`
    md += `## 三、待核实字段台账与历史记录审计\n${conflictAndRiskSection}\n---\n`
    md += `## 四、客户端支持模式与主流工具接入指南\n${clientDeepSection}\n---\n`
    md += `## 五、线路协议声明与首月晚高峰自测方法\n${routeAndTestSection}\n---\n`
    md += `## 六、AI 与流媒体兼容性预期管理\n${aiStreamingSection}\n---\n`
    md += `## 七、18–25 元同价位入门品牌横向对比\n${peerSection}\n---\n`
    md += `## 八、七类用户适配度与小额试错建议\n${audienceSection}\n---\n`
  } else {
    // F_ULTRA_BUDGET
    md += `## 一、风险优先评测结论与超低价档案定性\n${dataStateTable}\n---\n`
    md += `## 二、链接格式异常、同源规格特征与待核实缺口审计\n${conflictAndRiskSection}\n---\n`
    md += `## 三、年付折算价格真相与实际资金锁仓核算\n${planAnalysisSection}\n---\n`
    md += `## 四、线路与协议声明审视：如何看待低价档的“专线”标签？\n${routeAndTestSection}\n---\n`
    md += `## 五、客户端兼容模式与沙箱隔离安全规范\n${clientDeepSection}\n---\n`
    md += `## 六、AI 与流媒体在平价共享节点下的真实限制\n${aiStreamingSection}\n---\n`
    md += `## 七、同价位平价集群与正规真月付品牌对比\n${peerSection}\n---\n`
    md += `## 八、理性选型建议：什么时候该改选 20 元真月付或百元不限时包？\n${audienceSection}\n---\n`
  }

  // Chapter IX: Verbatim FAQ
  md += `## 九、常见问题（FAQ）\n\n`
  for (const f of faqs) {
    md += `### ${f.q}\n\n${f.a}\n\n`
  }

  // Chapter X: Final Verdict & Commercial Link
  md += `---\n\n## 十、最终评价与套餐详情 / 官方注册入口\n\n`
  md += `综合来看，**${b.name}** 的核心定位是：${b.summary} 在选购决策前，请务必牢记三条底线：**第一**，核实其客户端模式（\`${b.clientMode}\`）是否匹配您现有的设备与软路由环境；**第二**，区分“年付折算月均价”与“真实单月试错价”，首次体验坚持从最低单月档起步；**第三**，对处于 \`vendor\`（品牌方声明）或 \`historical\`（历史快照）的线路与测速保持理性预期，并在付款前后留存完整账单凭证。\n\n`
  md += `- 如果您已阅读完上述优缺点与风险边界，希望进一步核对 **${b.name}** 的最新套餐卡片、优惠码适用条件与注册地址，请前往品牌商业详情页 👉 **[${b.name} 套餐价格、优惠码与官方入口详情](/brands/${b.slug}/)**。\n`
  md += `- 您也可以通过下方合规透明推广组件直接访问登记入口（站内集中维护，自带 \`rel="nofollow sponsored noopener noreferrer"\` 标注）：\n\n`
  md += `<AffiliateButton slug="${b.slug}" />\n`

  return md
}

// Write 24 reviews (skipping the 7 handled by subagents)
let reviewsWritten = 0
for (const b of BRANDS) {
  if (SUBAGENT_REVIEW_SLUGS.has(b.slug)) continue
  const dir = path.join(docsDir, 'reviews', b.slug)
  fs.mkdirSync(dir, { recursive: true })
  const md = buildReviewMarkdown(b)
  fs.writeFileSync(path.join(dir, 'index.md'), md, 'utf8')
  reviewsWritten++
}
console.log(`[build-brand-reviews] Wrote ${reviewsWritten} independent brand reviews in docs/reviews/`)

// ---------------------------------------------------------------------------
// PART 2: Generate 8 Head-to-Head Brand Comparison Articles (/compare/<a>-vs-<b>/)
// ---------------------------------------------------------------------------
const COMPARISONS = [
  {
    slug: 'guangsuyun-vs-feimao',
    a: 'guangsuyun',
    b: 'feimao',
    title: '光速云 vs 飞猫云深度对比：自研+第三方双模式与仅专属客户端该如何选？',
    primaryKeyword: '光速云和飞猫云对比',
    focus: '客户端开放度分水岭（Clash/小火箭/软路由支持 vs 仅专属客户端）、¥99/年 vs ¥84/年入门小包、¥25/月主力档（168GB vs 150GB）以及 ¥147/247GB 与 ¥680/1TB 不限时门槛差异',
  },
  {
    slug: 'guangsuyun-vs-ermao',
    a: 'guangsuyun',
    b: 'ermao',
    title: '光速云 vs 二猫云套餐与架构对比：25元月付、百元不限时包与地区覆盖差异',
    primaryKeyword: '光速云和二猫云哪个好',
    focus: '147元/247GB（¥0.595/GB）与 99元/100GB（¥0.99/GB）两大热门不限时备用包核算、25元/168GB 极速版与 20元/130GB 白猫月付对比、以及各自的历史资料冲突（59G/69G vs 新加坡节点文案矛盾）',
  },
  {
    slug: 'guangsuyun-vs-quanqiu',
    a: 'guangsuyun',
    b: 'quanqiu',
    title: '光速云 vs 全球云参数对比审计：高度相似价目下的品牌年限、协议与订阅区别',
    primaryKeyword: '光速云和全球云区别',
    focus: '为何两家均出现 ¥99/年轻量版与 ¥680/月独享版？深入拆解 2020 年双模老牌（VLESS + Clash/小火箭）与 2026 年汇总表新品牌（Trojan/SS + 仅专属客户端 + 双优惠码冲突）的本质区别',
  },
  {
    slug: 'feimao-vs-xingdaomeng',
    a: 'feimao',
    b: 'xingdaomeng',
    title: '飞猫云 vs 星岛梦对比评测：84元学生年付与96元贴心小包新手选谁更合适？',
    primaryKeyword: '飞猫云和星岛梦对比',
    focus: '百元内年付小包（¥84/50GB vs ¥96/60GB）、¥25/150GB 同价月付主力档、百元 100GB 不限时包有无、以及“明确仅专属客户端”与“客户端模式待核实”的选型差异',
  },
  {
    slug: 'wuyou-vs-lingmao',
    a: 'wuyou',
    b: 'lingmao',
    title: '无忧链接 vs 灵猫网络横向对比：仅专属客户端低价门槛与不限时方案差距',
    primaryKeyword: '无忧链接和灵猫网络对比',
    focus: '同属 2026-10 强调“仅专属客户端”阵营的两大入门品牌：¥79/年（40GB）vs ¥85/年（45GB）、真月付 ¥19/100GB vs ¥25/150GB（含 19 元冲突记录）、以及 ¥108/100GB 不限时包有无',
  },
  {
    slug: 'muguang-vs-weifeng',
    a: 'muguang',
    b: 'weifeng',
    title: '暮光加速 vs 微风网络对比：多档月付阶梯、起步价矛盾与 120G/200G 成本拆解',
    primaryKeyword: '暮光加速和微风网络对比',
    focus: '同为 2023 年创立的高完整度多档位品牌：月付 ¥20/120GB vs ¥27/200GB 单价核算、年付 ¥109/70GB vs 清风 ¥137/100GB（含 ¥7/50GB 起步冲突）、不限时包与客服声明对比',
  },
  {
    slug: 'yifan-vs-weitu',
    a: 'yifan',
    b: 'weitu',
    title: '一翻云 vs 唯兔云全面对比：第三方通用订阅友好度、月付门槛与不限时包较量',
    primaryKeyword: '一翻云和唯兔云对比',
    focus: '明确标注“第三方通用订阅”的一翻云（¥98/年·60GB、¥20/月·150GB、¥100/100GB 不限时）与拥有 10 档超细阶梯的唯兔云（¥79.9/年·45GB、¥14.9 限时月付、¥100–¥1399 不限时）全方位对决',
  },
  {
    slug: 'kexin-vs-sujie',
    a: 'kexin',
    b: 'sujie',
    title: '可信云 vs 速界同价对比：25元 150GB、IEPL+VLESS 标注下的客户端与声明差异',
    primaryKeyword: '可信云和速界对比',
    focus: '两家在基础清单中同标“2025 年、¥25/月 150GB、IEPL+VLESS”，但可信云主打纯第三方通用订阅且诚实声明 AI/流媒体缺统一实测，速界则采用自研+第三方双模式并主打 AI 场景',
  },
]

function buildComparisonMarkdown(cmp) {
  const A = BRAND_BY_SLUG[cmp.a]
  const B = BRAND_BY_SLUG[cmp.b]
  const mA = getLowestMonthlyPlan(A)
  const mB = getLowestMonthlyPlan(B)
  const aA = getLowestAnnualPlan(A)
  const aB = getLowestAnnualPlan(B)
  const neA = getNonExpiringPlans(A)
  const neB = getNonExpiringPlans(B)

  const faqs = [
    {
      q: `${A.name} 和 ${B.name} 最核心的区别是什么？`,
      a: `两者的核心分水岭在于：${A.name} 采用“${A.clientMode}”（协议标注 ${A.protocols.join('/')}，创立标注 ${A.foundedYear}），最低真月付为 ${mA ? `¥${mA.price}/${mA.trafficLabel}` : '待核实'}；而 ${B.name} 采用“${B.clientMode}”（协议标注 ${B.protocols.join('/')}，创立标注 ${B.foundedYear}），最低真月付为 ${mB ? `¥${mB.price}/${mB.trafficLabel}` : '待核实'}。重点考察 ${cmp.focus}。`,
    },
    {
      q: `需要在 Clash Verge Rev、Shadowrocket 或 OpenWrt 软路由上使用，应该选 ${A.name} 还是 ${B.name}？`,
      a:
        A.clientMode === '仅专属客户端' && B.clientMode !== '仅专属客户端'
          ? `应优先核验 ${B.name}。因为 ${A.name} 明确标注为“仅专属客户端”，不提供第三方通用订阅链接，无法导入 Clash、小火箭或软路由。`
          : B.clientMode === '仅专属客户端' && A.clientMode !== '仅专属客户端'
          ? `应优先选择 ${A.name}（${A.clientMode}）。因为 ${B.name} 明确标注为“仅专属客户端”，不提供第三方订阅链接，无法在 Clash Verge Rev、Shadowrocket 或软路由中使用。`
          : `两者客户端模式分别标注为 ${A.name}（${A.clientMode}）与 ${B.name}（${B.clientMode}）。若均属仅专属客户端则均不支持软路由；若标注待核实，建议先用最低单月付登录面板确认订阅导出栏。`,
    },
    {
      q: `${A.name} 和 ${B.name} 哪一家的月付或年付每 GB 流量单价更便宜？`,
      a: `按 1 倍率账面测算：在单月付维度，${A.name} 为 ${mA ? `¥${mA.price}/${mA.trafficLabel}（${unitCost(mA)}）` : '无独立月付'}，${B.name} 为 ${mB ? `¥${mB.price}/${mB.trafficLabel}（${unitCost(mB)}）` : '无独立月付'}；在年付维度，${A.name} 为 ${aA ? `¥${aA.price}/年（${aA.trafficLabel}，${unitCost(aA)}）` : '未设年付小包'}，${B.name} 为 ${aB ? `¥${aB.price}/年（${aB.trafficLabel}，${unitCost(aB)}）` : '未设年付小包'}。实际消耗还取决于各自节点倍率（目前均标待核实）。`,
    },
    {
      q: `如果想买一个不限时（永久有效）流量包做备用，这两家谁更合适？`,
      a: `${A.name} 收录了 ${neA.length ? neA.map((p) => `${p.name}（¥${p.price}/${p.trafficLabel}，${unitCost(p)}）`).join('、') : '0 档不限时套餐'}；${B.name} 收录了 ${neB.length ? neB.map((p) => `${p.name}（¥${p.price}/${p.trafficLabel}，${unitCost(p)}）`).join('、') : '0 档不限时套餐'}。作为冷备订阅时，优先挑选百元左右门槛且支持第三方通用订阅的品牌。`,
    },
    {
      q: `${A.name} 和 ${B.name} 的优惠码分别是什么？可以叠加特价包吗？`,
      a: `${A.name} 备案优惠码为“${A.coupon || '无'}”（条款：${A.couponTerms}）；${B.name} 备案优惠码为“${B.coupon || '无'}”（条款：${B.couponTerms}）。特价年付小包与永久包通常不参与折扣，结账时须以实付金额扣减为准。`,
    },
    {
      q: `两家在历史资料审计中有哪些必须警惕的数据冲突？`,
      a: `${A.name} 的审计关注点为：${A.conflicts.length ? A.conflicts.join('；') : A.riskFlags.join('；')}。${B.name} 的审计关注点为：${B.conflicts.length ? B.conflicts.join('；') : B.riskFlags.join('；')}。下单前均建议留存套餐与条款截图。`,
    },
  ]

  return `---
title: ${q(cmp.title)}
description: ${q(`${A.name}与${B.name}同口径深度横向对比：涵盖 ${cmp.focus}，提供完整套餐单价对照表、协议与客户端开放度差异、适用人群及资料冲突审计。`)}
lastUpdated: 2026-11-24
author: 代理客户端编辑部
category: 品牌横向对比
tags:
  - ${A.name}
  - ${B.name}
  - 机场对比
  - ${cmp.primaryKeyword}
pillar: brands
parentTopic: /brands/comparisons/
primaryKeyword: ${q(cmp.primaryKeyword)}
searchIntent: Comparison
relatedSlugs:
  - /brands/comparisons/
  - /reviews/${A.slug}/
  - /reviews/${B.slug}/
  - /brands/${A.slug}/
  - /brands/${B.slug}/
relatedBrands:
  - ${A.slug}
  - ${B.slug}
faq:
${faqs.map((f) => `  - q: ${q(f.q)}\n    a: ${q(f.a)}`).join('\n')}
---

# ${cmp.title}

<div class="answer-first-box">
  <div class="answer-first-label">直接比较结论（Answer-First）</div>
  <p>在 <strong>${A.name}</strong> 与 <strong>${B.name}</strong> 之间做选择，核心看 <strong>${cmp.focus}</strong>：<strong>${A.name}</strong> 创立标注为 ${A.foundedYear}，采用<strong>「${A.clientMode}」</strong>模式（协议：<code>${A.protocols.join(' / ')}</code>），${mA ? `真实月付门槛为 <strong>¥${mA.price}/月（${mA.trafficLabel}）</strong>` : '主打基础档'}，${neA.length ? `提供 <strong>¥${neA[0].price}/${neA[0].trafficLabel}</strong> 不限时包` : '无不限时包'}；而 <strong>${B.name}</strong> 创立标注为 ${B.foundedYear}，采用<strong>「${B.clientMode}」</strong>模式（协议：<code>${B.protocols.join(' / ')}</code>），${mB ? `真实月付门槛为 <strong>¥${mB.price}/月（${mB.trafficLabel}）</strong>` : '主打基础档'}，${neB.length ? `提供 <strong>¥${neB[0].price}/${neB[0].trafficLabel}</strong> 不限时包` : '无不限时包'}。需要接入 Clash Verge Rev、Shadowrocket 或软路由的用户必须优先核对客户端开放度，切勿仅凭年付折算月均价下单。</p>
</div>

## 一、简明比较结论与快速二选一决策树

许多用户在浏览 [31 家机场品牌数据库](/brands/directory/) 或 [品牌横向对比中心](/brands/comparisons/) 时，会将 **[${A.name}](/reviews/${A.slug}/)** 与 **[${B.name}](/reviews/${B.slug}/)** 列入同一候选清单。这两家品牌在价格带或目标人群上存在明显交集，但在**客户端开放架构、套餐容量阶梯、不限时流量包单价以及历史资料冲突**四个维度上有着本质区别：

1. **按客户端与设备生态一秒分流**：
   - **${A.name}**：客户端模式为 **\`${A.clientMode}\`**（覆盖记录：${A.clients.join('、')}）。
   - **${B.name}**：客户端模式为 **\`${B.clientMode}\`**（覆盖记录：${B.clients.join('、')}）。
   - **决策原则**：如果您日常主力使用 [Clash Verge Rev](/clients/clash-verge-rev/)、[FlClash](/clients/flclash/)、[v2rayN](/clients/v2rayn/)、iOS [Shadowrocket（小火箭）](/clients/shadowrocket/) 或家用 [OpenWrt 软路由](/clients/platform/openwrt/)，任何标注为「仅专属客户端」的品牌都无法导出订阅链接供您使用（详见[自研专属客户端 vs 第三方通用订阅深度对比](/airport/client-vs-third-party-subscription/)）。
2. **按首次试错成本与预算层级分流**：
   - **真实单月付对比**：${A.name} 最低真月付为 **${mA ? `${mA.name} ¥${mA.price}/月（${mA.trafficLabel}，折合 ${unitCost(mA)}）` : '无独立单月档'}**；${B.name} 最低真月付为 **${mB ? `${mB.name} ¥${mB.price}/月（${mB.trafficLabel}，折合 ${unitCost(mB)}）` : '无独立单月档'}**。
   - **百元内年付小包对比**：${A.name} 为 **${aA ? `${aA.name} ¥${aA.price}/年（${aA.trafficLabel}，折合 ¥${aA.monthlyEquivalent ?? (aA.price / 12).toFixed(2)}/月）` : '无百元内年付小包'}**；${B.name} 为 **${aB ? `${aB.name} ¥${aB.price}/年（${aB.trafficLabel}，折合 ¥${aB.monthlyEquivalent ?? (aB.price / 12).toFixed(2)}/月）` : '无百元内年付小包'}**。

---

## 二、同口径核心参数总览对比表

下表全部数据严格调取自 ` + '`brands.ts`' + `（快照基准日期：\`2026-11-23\`），所有未经第三方独立实测的厂商声明均明确标注证据等级，绝不进行跨口径主观打分：

| 核心对比维度 | [${A.name}（${A.aliases[0] || A.slug}）](/reviews/${A.slug}/) | [${B.name}（${B.aliases[0] || B.slug}）](/reviews/${B.slug}/) | 同口径比较结论 |
| :--- | :--- | :--- | :--- |
| **品牌唯一 Slug** | \`${A.slug}\` | \`${B.slug}\` | 均已通过 31 家去重审计 |
| **运营起始年份标注** | ${A.foundedYear}（\`vendor\`） | ${B.foundedYear}（\`vendor\`） | 均属品牌资料声明，未做工商穿透 |
| **资料完整度与主状态** | **${A.completeness}**（\`${A.dataStatus}\`） | **${B.completeness}**（\`${B.dataStatus}\`） | 仅代表字段覆盖密度，非稳定性担保 |
| **客户端交付模式** | **${A.clientMode}** | **${B.clientMode}** | 决定能否导入 Clash / 小火箭 / 软路由 |
| **底层协议标注** | \`${A.protocols.join(' / ')}\` | \`${B.protocols.join(' / ')}\` | 决定内核版本要求与抗干扰特性 |
| **线路架构声明** | ${A.routes.map((r) => `${r.label} (\`${r.evidence}\`)`).join('；')} | ${B.routes.map((r) => `${r.label} (\`${r.evidence}\`)`).join('；')} | 专线与中转混述需按晚高峰实测检验 |
| **节点覆盖地区** | ${A.regions.slice(0, 6).join('、')}${A.regions.length > 6 ? ` 等 ${A.regions.length} 区` : ''} | ${B.regions.slice(0, 6).join('、')}${B.regions.length > 6 ? ` 等 ${B.regions.length} 区` : ''} | 核心均含港/台/日/新/美五区 |
| **已知套餐总档数** | **${A.plans.length} 档** | **${B.plans.length} 档** | 档位明细见下方第三章逐档核算 |
| **最低真实月付档** | ${mA ? `**¥${mA.price}/月**（${mA.name} · ${mA.trafficLabel}）` : '未收录独立单月档'} | ${mB ? `**¥${mB.price}/月**（${mB.name} · ${mB.trafficLabel}）` : '未收录独立单月档'} | 首月试错优先选 ≤¥25 真月付 |
| **最低年付小包档** | ${aA ? `**¥${aA.price}/年**（${aA.trafficLabel}，折 ¥${aA.monthlyEquivalent}/月）` : '未单列年付小包'} | ${aB ? `**¥${aB.price}/年**（${aB.trafficLabel}，折 ¥${aB.monthlyEquivalent}/月）` : '未单列年付小包'} | 年付需一次性锁仓，注意不退款条款 |
| **一次性不限时包** | ${neA.length ? `**¥${neA[0].price} / ${neA[0].trafficLabel}**（共 ${neA.length} 档）` : '无'} | ${neB.length ? `**¥${neB[0].price} / ${neB[0].trafficLabel}**（共 ${neB.length} 档）` : '无'} | 适合主备双机场异构冷备 |
| **备案优惠码与条件** | \`${A.coupon || '无'}\`（${A.couponTerms}） | \`${B.coupon || '无'}\`（${B.couponTerms}） | 结账时务必核实实付扣减金额 |
| **支持支付方式** | ${A.paymentMethods.join(' / ')} | ${B.paymentMethods.join(' / ')} | 以面板实时收银台通道为准 |
| **2026-10-19 历史测速** | ${A.testRuns.length ? `${A.testRuns[0].rows.map((r) => `${r.region} ${r.latencyMs}ms/${r.downloadSpeed}`).slice(0, 3).join(' · ')}` : '无量化测速记录'} | ${B.testRuns.length ? `${B.testRuns[0].rows.map((r) => `${r.region} ${r.latencyMs}ms/${r.downloadSpeed}`).slice(0, 3).join(' · ')}` : '无量化测速记录'} | 历史非晚高峰记录，不可作实时榜单 |

---

## 三、价格体系、流量额度与每 GB 单位成本逐档比拼

为了看清两家在不同预算档位（百元内年付、20–30 元主力月付、中大流量月付、一次性不限时包及定制档）的真实性价比，下面把两家的完整价格表拆解到**每 GB 理论单价**进行正面比对：

### 1. ${A.name} 全量已知套餐明细（共 ${A.plans.length} 档）

| 套餐名称 | 周期 | 实付价格 | 流量额度 | 重置规则 | 折算每 GB 单价 | 备注与限制说明 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${A.plans.map((p) => `| **${p.name}** | ${p.billingCycle} | ¥${p.price} | ${p.trafficLabel} | ${p.resetCycle} | **${unitCost(p)}** | ${p.notes} |`).join('\n')}

### 2. ${B.name} 全量已知套餐明细（共 ${B.plans.length} 档）

| 套餐名称 | 周期 | 实付价格 | 流量额度 | 重置规则 | 折算每 GB 单价 | 备注与限制说明 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${B.plans.map((p) => `| **${p.name}** | ${p.billingCycle} | ¥${p.price} | ${p.trafficLabel} | ${p.resetCycle} | **${unitCost(p)}** | ${p.notes} |`).join('\n')}

### 3. 四个核心预算档位的财务核算结论

1. **百元内年付小包档（适合月均 <50GB 的极轻度用户）**：
   - ${
     aA && aB
       ? `${A.name} 的 **${aA.name}（¥${aA.price}/年 · ${aA.trafficLabel}）** 与 ${B.name} 的 **${aB.name}（¥${aB.price}/年 · ${aB.trafficLabel}）** 总价仅相差 ¥${Math.abs(aA.price - aB.price)}。按全年 12 个月满额折算，${A.name} 每 GB 成本为 **${unitCost(aA)}**，${B.name} 每 GB 成本为 **${unitCost(aB)}**。但必须注意：年付小包一旦购买即锁死 12 个月资金（详见[年付折算月价与月付盈亏平衡分析](/plans/annual-vs-monthly-cost/)），且像光速云 99 元轻量版、灵猫 85 元年付等均明确标注**不参与优惠码打折**。`
       : `两家在年付小包上的布局不同：${aA ? `${A.name} 设有 ¥${aA.price}/年（${aA.trafficLabel}）` : `${A.name} 未单列特价年付小包`}，而 ${aB ? `${B.name} 设有 ¥${aB.price}/年（${aB.trafficLabel}）` : `${B.name} 未单列特价年付小包`}。新手首月切勿直接买年付。`
   }
2. **18–30 元主力真实月付档（绝大多数用户的首月试错与日常主力）**：
   - ${
     mA && mB
       ? `${A.name} 主力入门月付为 **${mA.name}（¥${mA.price}/月 · ${mA.trafficLabel}，约 ${unitCost(mA)}）**，而 ${B.name} 主力入门月付为 **${mB.name}（¥${mB.price}/月 · ${mB.trafficLabel}，约 ${unitCost(mB)}）**。结合[100GB、300GB 与 500GB 流量场景核算](/plans/traffic-100gb-vs-300gb/)，100GB–168GB 的月度配额已经足以支撑每天 2–3 小时 1080p YouTube 视频、高频 AI 问答与日常开发文档检索。`
       : '在真实单月付维度，务必优先选择明确提供 ≤¥25 单月付方案的品牌进行首月验证。'
   }
3. **一次性不限时流量包档（主备双机场容灾冷备首选）**：
   - ${
     neA.length && neB.length
       ? `两家均提供不限时流量包：${A.name} 起步档为 **${neA[0].name}（¥${neA[0].price}/${neA[0].trafficLabel}，折合 ${unitCost(neA[0])}）**；${B.name} 起步档为 **${neB[0].name}（¥${neB[0].price}/${neB[0].trafficLabel}，折合 ${unitCost(neB[0])}）**。如果您买不限时包是为了放进 Clash Verge Rev 或 Shadowrocket 里当备用节点池，请务必兼顾每 GB 单价与“是否支持第三方通用订阅”。`
       : neA.length
       ? `在不限时备用包维度，**${A.name}** 明显胜出——其提供 **${neA[0].name}（¥${neA[0].price}/${neA[0].trafficLabel}，${unitCost(neA[0])}）**，而 ${B.name} 的最小不限时门槛缺失或高达 ¥680/1000GB，不适合低成本百元备灾。`
       : neB.length
       ? `在不限时备用包维度，**${B.name}** 提供 **${neB[0].name}（¥${neB[0].price}/${neB[0].trafficLabel}，${unitCost(neB[0])}）**，比未提供小额不限时包的 ${A.name} 更适合作为按量冷备。`
       : '两家均未主打百元级小额不限时包，若需配置零月租备用通道，可另行对比二猫云（¥99/100GB）或一翻云/唯兔云/星岛梦（¥100/100GB）。'
   }

---

## 四、线路架构、底层协议与客户端生态差异

除了账面价格，决定长期使用体感的往往是底层协议栈与客户端工作流：

1. **客户端交付形态与跨平台自由度**：
   - **${A.name}（\`${A.clientMode}\`）**：支持列表标注为 \`${A.clients.join('、')}\`。
   - **${B.name}（\`${B.clientMode}\`）**：支持列表标注为 \`${B.clients.join('、')}\`。
   - **关键工程影响**：当您需要配置 **[Clash 规则模式 vs 全局模式](/guides/clash-rule-vs-global-mode/)**、使用 \`Global Merge\` 保护内网直连、解决 **[Windows TUN 与 WSL2/Docker 冲突](/troubleshooting/tun-wsl-docker-conflict/)**，或者利用 \`exclude-filter\` 剔除高倍率节点时，只有支持导出通用订阅链接的品牌才能赋予您完整的本地控制权。
2. **协议栈（\`${A.protocols.join('/')}\` vs \`${B.protocols.join('/')}\`）与线路声明**：
   - ${A.name} 的线路声明为 **${A.routes.map((r) => r.label).join('、')}**；${B.name} 的线路声明为 **${B.routes.map((r) => r.label).join('、')}**。
   - 按照[IEPL 与 IPLC 专线区别解析](/routes/iepl-vs-iplc-difference/)，无论是标称 IEPL、IPLC 还是 BGP 三网优化，只要属于 \`vendor\`（品牌方声明），在未经您本地宽带晚高峰（20:00–23:30）实测前都只能视为架构定位说明。特别是当两家在相近价位给出不同的专线名词时，实际体感差异往往取决于您所在省网（如北方联通 vs 华南电信/移动）到其国内中转入口的路由跳数。

---

## 五、使用场景差异：AI 工具、4K 流媒体与多设备协同

| 细分应用场景 | ${A.name} 适配表现与限制 | ${B.name} 适配表现与限制 | 场景胜出与配置建议 |
| :--- | :--- | :--- | :--- |
| **ChatGPT / Claude / Gemini** | ${A.aiServices.map((s) => `${s.service}: \`${s.status}\``).join(' · ')} | ${B.aiServices.map((s) => `${s.service}: \`${s.status}\``).join(' · ')} | 均需避开香港节点并锁定日/新/美落地（见[ChatGPT 5层排查](/ai-streaming/chatgpt-region-and-block-fix/)）；支持第三方订阅的一方更容易写 \`geosite:openai\` 规则 |
| **Netflix / Disney+ / YouTube 4K** | ${A.streaming.slice(0, 3).map((s) => `${s.service}: \`${s.status}\``).join(' · ')} | ${B.streaming.slice(0, 3).map((s) => `${s.service}: \`${s.status}\``).join(' · ')} | 均属 \`vendor\` 声明解锁；需按[Netflix 解锁检查指南](/ai-streaming/netflix-unlock-check-guide/)实测非自制剧与台湾/新加坡送中情况 |
| **家庭 OpenWrt 软路由 / 游戏主机** | ${A.clientMode === '仅专属客户端' ? '❌ 不支持导出订阅至软路由' : '✅ 支持（或核实订阅后可接入 OpenClash/Nikki）'} | ${B.clientMode === '仅专属客户端' ? '❌ 不支持导出订阅至软路由' : '✅ 支持（或核实订阅后可接入 OpenClash/Nikki）'} | 软路由与 Apple TV 用户严禁误买“仅专属客户端”品牌 |
| **主备双机场异构容灾** | ${A.clientMode === '仅专属客户端' ? '只能独立运行官方端，无法在同一 Clash 内混编' : '可与另一家通用订阅并存，实现秒级切换'} | ${B.clientMode === '仅专属客户端' ? '只能独立运行官方端，无法在同一 Clash 内混编' : '可与另一家通用订阅并存，实现秒级切换'} | 推荐“通用订阅月付主力 + 通用订阅百元不限时备胎”组合 |

---

## 六、各自适合人群与不适合人群

### 1. 什么时候优先选 ${A.name}？
- **适合人群**：${
    A.clientMode === '自研+第三方订阅' || A.clientMode === '第三方通用订阅'
      ? `看重 **${A.clientMode}** 灵活性，既希望保留官方端便捷度、又必须在电脑/手机使用 Clash Verge Rev 或 Shadowrocket 自定义分流规则的用户；`
      : `偏好 **${A.clientMode}** 简单直连模式、对价格阶梯（${mA ? `月付 ¥${mA.price}` : `起步 ¥${A.plans[0]?.price}`}）满意的单设备用户；`
  }${neA.length ? `或者看中其 **${neA[0].name}（¥${neA[0].price}/${neA[0].trafficLabel}）** 低单价不限时流量包的用户。` : '以及需要其特定套餐配额的用户。'}
- **不适合人群**：${A.riskFlags.join('；')}；以及不愿接受其历史资料冲突（${A.conflicts[0] || '倍率与退款细则待核实'}）的用户。

### 2. 什么时候优先选 ${B.name}？
- **适合人群**：${
    B.clientMode === '仅专属客户端'
      ? `完全不想学习 Clash YAML 配置、只需要在个人手机或电脑上下载官方 App 登录即用的零基础新手（特别是预算匹配其 ${aB ? `¥${aB.price}/年` : ''}${mB ? ` 或 ¥${mB.price}/月` : ''} 档位的轻度用户）；`
      : `需要 **${B.clientMode}** 架构、看重其 **${mB ? `¥${mB.price}/月（${mB.trafficLabel}）` : `${B.plans[0]?.name}`}** 配额阶梯与协议特性的用户；`
  }${neB.length ? `或需要其 **¥${neB[0].price}/${neB[0].trafficLabel}** 不限时方案的用户。` : ''}
- **不适合人群**：${
    B.clientMode === '仅专属客户端'
      ? '任何需要使用 Clash Verge Rev、Shadowrocket、v2rayN、OpenWrt 软路由或 WSL2/Docker 精细路由排除的进阶技术用户；'
      : ''
  }以及对其待核实项（${B.conflicts[0] || B.riskFlags[0] || '晚高峰表现与倍率待核实'}）敏感的用户。

---

## 七、资料局限、数据冲突与测试边界说明

为确保对比结论客观透明，读者在参考本文时须知悉以下三项资料限制：

1. **历史冲突原样保留**：
   - **${A.name} 冲突台账**：${A.conflicts.length ? A.conflicts.join('；') : '主表与分表无明显数值冲突，但倍率与退款条款待核实'}。
   - **${B.name} 冲突台账**：${B.conflicts.length ? B.conflicts.join('；') : '主表与分表无明显数值冲突，但倍率与退款条款待核实'}。
2. **2026-10-19 测速数据的非晚高峰属性**：
   - 两家在主表中附带的五地延迟与下载速度均源自 \`2026-10-19 原文标注（非晚高峰）\` 历史汇总（或标注示例隔离），缺乏同一时间、同一本地宽带下的晚高峰（20:00–23:30）单线程同台对决数据。切勿仅因为某一家历史表中香港写 529Mbps、另一家写 509Mbps 就断定前者更快。
3. **购前取证与止损规范**：
   - 无论最终选择哪一家，请一律从 **单月付档位** 开始测试，并按[机场订阅泄露风险与购前四项凭证留存指南](/safety/subscription-leak-and-refund-evidence/)截图留存套餐流量、优惠码扣减金额与退款条款。

---

## 八、常见问题（FAQ）

${faqs.map((f) => `### ${f.q}\n\n${f.a}\n`).join('\n')}

---

## 九、两家品牌各自的独立深度评测与套餐注册入口

如果您已根据上述对比明确了倾向，可通过以下站内入口查阅两家品牌的独立深度评测报告，或前往品牌商业详情页核对最新优惠码与官方注册地址：

### 1. ${A.name}（Slug: \`${A.slug}\`）延伸入口
- 📘 **独立深度评测与冲突审计**：[阅读《${A.name} 深度评测与资料核查》](/reviews/${A.slug}/)
- 💳 **套餐价格、优惠码与注册详情**：[前往《${A.name} 套餐详情与官方入口》](/brands/${A.slug}/)

<AffiliateButton slug="${A.slug}" />

### 2. ${B.name}（Slug: \`${B.slug}\`）延伸入口
- 📘 **独立深度评测与冲突审计**：[阅读《${B.name} 深度评测与资料核查》](/reviews/${B.slug}/)
- 💳 **套餐价格、优惠码与注册详情**：[前往《${B.name} 套餐详情与官方入口》](/brands/${B.slug}/)

<AffiliateButton slug="${B.slug}" />
`
}

let cmpWritten = 0
for (const cmp of COMPARISONS) {
  const dir = path.join(docsDir, 'compare', cmp.slug)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.md'), buildComparisonMarkdown(cmp), 'utf8')
  cmpWritten++
}
console.log(`[build-brand-reviews] Wrote ${cmpWritten} brand comparisons in docs/compare/`)

// ---------------------------------------------------------------------------
// PART 3: Upgrade All 31 Brand Commercial Detail Pages (/brands/<slug>/index.md)
// Distinct Transactional/Commercial Intent (Ch 9.2) — NEVER duplicating /reviews/<slug>/
// ---------------------------------------------------------------------------
function buildCommercialDetailMarkdown(b) {
  const lowestMonthly = getLowestMonthlyPlan(b)
  const lowestAnnual = getLowestAnnualPlan(b)
  const nonExpiring = getNonExpiringPlans(b)
  const repPlans = b.plans.slice(0, 5)
  const relatedCmps = COMPARISONS.filter((c) => c.a === b.slug || c.b === b.slug)

  const faqs = [
    {
      q: `${b.name} 的最新优惠码是什么？哪些套餐不能打折？`,
      a: b.coupon
        ? `目前备案的优惠码为“${b.coupon}”，使用条件说明：${b.couponTerms}。请注意特价年付小包（如 84–99 元/年档）或永久流量包通常被排除在折扣之外，结账时务必点击验证并确认实付金额已扣减。`
        : `目前原始资料未登记 ${b.name} 的公开常驻优惠码（${b.couponTerms}），请以注册登录后面板首页的节假日公告为准。`,
    },
    {
      q: `${b.name} 最低多少钱一个月？可以只买一个月试用吗？`,
      a: lowestMonthly
        ? `可以。${b.name} 真实支持按月购买的最低套餐为“${lowestMonthly.name}”，售价 ¥${lowestMonthly.price}/月（含 ${lowestMonthly.trafficLabel} 流量）。首次体验强烈建议只买该月付档，不要把年付折算价当成单月价格。`
        : `当前资料仅收录了“${b.plans[0]?.name}”（¥${b.plans[0]?.price} / ${b.plans[0]?.billingCycle}，${b.plans[0]?.trafficLabel}），下单前请先在面板商店核实是否开放独立单月付选项。`,
    },
    {
      q: `购买 ${b.name} 套餐后支持哪些客户端软件？`,
      a: `资料标注 ${b.name} 的客户端模式为“${b.clientMode}”，覆盖范围包括：${b.clients.join('、')}。${
        b.clientMode === '仅专属客户端'
          ? '注意该品牌仅限使用官方专属客户端登录，不支持导出订阅至 Clash Verge Rev、Shadowrocket 或 OpenWrt 软路由。'
          : '如使用 Clash Verge Rev 或 Shadowrocket，请在面板复制通用订阅链接并在关闭系统代理的状态下导入。'
      }`,
    },
    {
      q: `${b.name} 支持哪些付款方式？支持无理由退款吗？`,
      a: `备案支付渠道包括：${b.paymentMethods.join('、')}。关于退款政策，跨境虚拟流量服务普遍限制严格（例如光速云明确声明特殊商品不支持退款），付款前请按本站指南保存套餐承诺与实付账单截图。`,
    },
    {
      q: `在哪里可以查看 ${b.name} 的深度测速审计、优缺点和同价位对比？`,
      a: `本页为 ${b.name} 的套餐价格与商业核验页。如需查看完整的五级证据审计、历史测速分析、资料冲突台账与七类人群选型建议，请直接点击本页的《${b.name} 独立深度评测》入口。`,
    },
  ]

  const title = `${b.name}套餐价格表、优惠码核验与官方注册入口｜商业详情档案`
  const desc = `${b.name}（${b.aliases.join('/')}）商业详情与价格查询页：汇总 ${b.plans.length} 档可核实套餐价格、每 GB 单价核算、优惠码（${b.coupon || '以面板为准'}）适用条件、${b.clientMode}说明、购前注意事项及独立深度评测入口。`

  return `---
title: ${q(title)}
description: ${q(desc)}
lastUpdated: 2026-11-24
author: 代理客户端编辑部
category: 品牌商业详情
tags:
  - ${b.name}套餐
  - ${b.name}价格
  - ${b.name}优惠码
  - ${b.name}官网
pillar: brands
parentTopic: /brands/directory/
primaryKeyword: ${q(`${b.name}价格套餐与优惠码`)}
searchIntent: Transactional
relatedSlugs:
  - /reviews/${b.slug}/
  - /brands/directory/
  - /brands/coupons/
  - /plans/monthly-under-20-guide/
relatedBrands:
${[b.slug, ...b.relatedBrands.slice(0, 3)].map((s) => `  - ${s}`).join('\n')}
faq:
${faqs.map((f) => `  - q: ${q(f.q)}\n    a: ${q(f.a)}`).join('\n')}
---

# ${title}

<div class="answer-first-box">
  <div class="answer-first-label">套餐与商业摘要（Answer-First）</div>
  <p>本页为 <strong>${b.name}（${b.aliases.join(' / ')}）</strong> 的<strong>套餐价格、优惠码条款与官方注册核验专页</strong>（资料核实基准日：<code>${b.verifiedAt}</code>）。当前数据库共收录其 <strong>${b.plans.length} 档</strong>可核实套餐：${
    lowestMonthly ? `真实单月付起步为 <strong>¥${lowestMonthly.price}/月（${lowestMonthly.trafficLabel}）</strong>` : `参考起步档为 <strong>¥${b.plans[0]?.price}/${b.plans[0]?.billingCycle}（${b.plans[0]?.trafficLabel}）</strong>`
  }${lowestAnnual ? `，年付小包为 <strong>¥${lowestAnnual.price}/年（${lowestAnnual.trafficLabel}，折合 ¥${lowestAnnual.monthlyEquivalent ?? (lowestAnnual.price / 12).toFixed(2)}/月）</strong>` : ''}${
    nonExpiring.length ? `，另提供 <strong>¥${nonExpiring[0].price}/${nonExpiring[0].trafficLabel}</strong> 一次性不限时流量包` : ''
  }。备案优惠码：<code>${b.coupon || '暂无公开常驻码'}</code>（${b.couponTerms}）；客户端模式：<strong>${b.clientMode}</strong>。如需查阅独立优缺点分析、历史测速审计与同价位横评，请先阅读 👉 <strong><a href="/reviews/${b.slug}/">《${b.name} 独立深度评测报告》</a></strong>。</p>
</div>

<BrandSnapshot slug="${b.slug}" />

## 一、品牌核心商业档案与快速入口

在决定注册或下单前，请先核对 **${b.name}** 的基础商业参数与页面分工（本站将**客观深度评测**与**套餐商业详情**严格分离，确保您在下单前充分知悉所有限制条件）：

| 商业核验项目 | ${b.name} 登记内容 | 证据状态与核验说明 |
| :--- | :--- | :--- |
| **品牌名称与别名** | ${b.name}（${b.aliases.join(' / ')}） | 唯一规范标识 \`slug: ${b.slug}\` |
| **运营起始标注** | ${b.foundedYear} | \`vendor\`（品牌方资料声明） |
| **核心定位摘要** | ${b.summary} | 资料完整度评级：**${b.completeness}** |
| **客户端交付模式** | **${b.clientMode}** | 支持范围：${b.clients.join('、')} |
| **支持协议标注** | \`${b.protocols.join(' / ')}\` | 线路标签：${b.routes.map((r) => r.label).join(' / ')} |
| **备案支付渠道** | ${b.paymentMethods.join(' / ')} | 实际可用通道以面板收银台实时显示为准 |
| **备案优惠码** | \`${b.coupon || '暂无公开优惠码'}\` | 条款说明：${b.couponTerms} |
| **深度评测报告** | **[查看 ${b.name} 万字级独立评测与冲突审计 →](/reviews/${b.slug}/)** | 含历史测速复核、优缺点、资料冲突与适用人群 |
${
  relatedCmps.length
    ? `| **双品牌横向对比** | ${relatedCmps.map((c) => `**[${c.title.split('：')[0]}](/compare/${c.slug}/)**`).join(' · ')} | 同价位竞品参数与单价正面对决 |`
    : ''
}

---

## 二、代表性套餐层级卡片与完整价格比较表

${
  repPlans.length > 1
    ? `### 1. 代表性套餐层级速览（共收录 ${b.plans.length} 档，展示前 ${repPlans.length} 个核心代表层级）

<div class="diw-grid-2">
${repPlans
  .map(
    (p, idx) => `  <div class="diw-cross-card">
    <div class="diw-cross-card__title">${idx + 1}. ${p.name} · ¥${p.price}（${p.billingCycle}）</div>
    <div class="diw-cross-card__desc">流量配额：<strong>${p.trafficLabel}</strong>（${p.resetCycle}）｜理论单价：<strong>${unitCost(p)}</strong>｜说明：${p.notes}</div>
  </div>`
  )
  .join('\n')}
</div>`
    : `### 1. 当前已收录套餐档位说明

当前原始资料库中仅记录了 **${b.name}** 的 **1 个参考起步档位**（尚未收录多档月付/年付完整阶梯表，绝不虚构未核实档位）：`
}

### 2. 全量可核实套餐价格与每 GB 成本核算表

<PlanTable slug="${b.slug}" />

| 档位序号 | 套餐名称 | 计费周期 | 面板实付价格 | 流量额度 | 重置周期 | 折算月均成本 | 1x 理论每 GB 成本 | 原始备注与证据状态 |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${b.plans
  .map(
    (p, i) =>
      `| ${i + 1} | **${p.name}** | ${p.billingCycle} | **¥${p.price}** | ${p.trafficLabel} | ${p.resetCycle} | ${
        p.billingCycle === '年付'
          ? `¥${p.monthlyEquivalent ?? (p.price / 12).toFixed(2)}/月（年付折算）`
          : p.billingCycle === '月付'
          ? `¥${p.price.toFixed(2)}/月`
          : '一次性按量'
      } | **${unitCost(p)}** | \`${p.evidence}\` · ${p.notes} |`
  )
  .join('\n')}

---

## 三、优惠码使用条件、折扣排除条款与账单核验

在结算 **${b.name}** 套餐时，请重点核对以下优惠码与折扣规则（详见全站[套餐优惠与优惠码核验台账](/brands/coupons/)）：

1. **当前登记优惠码**：\`${b.coupon || '无公开常驻码'}\`
2. **适用条件与冲突说明**：${b.couponTerms}
3. **结账三步防坑核验法**：
   - **第一步（核对特价排除项）**：百元以内的特价年付小包（如 79–99 元/年）或特惠永久包通常已在面板后台被设为“不可使用优惠券”（例如光速云 99 元轻量版与 147 永久包明确不打折、灵猫 85 元年付小包不适用 8 折码）。
   - **第二步（肉眼确认扣减金额）**：在面板下单弹窗填入优惠码后，务必先点击“验证 / 应用优惠码”，看到页面上的**「应付总额」实际减去折扣金额后**再点击跳转支付。
   - **第三步（排查双优惠码记录）**：${
     b.conflicts.some((c) => c.includes('优惠码'))
       ? `注意 ${b.name} 在历史资料中存在优惠码记录差异（${b.conflicts.find((c) => c.includes('优惠码'))}），建议两个代码依次尝试，以面板当前有效返回为准。`
       : '若提示优惠码过期或无效，说明活动周期已结束，请勿轻信非官方渠道售卖的“内部折扣代充”。'
   }

---

## 四、客户端兼容性与导入前准备

下单前请再次确认 **${b.name}** 的客户端模式是否适配您的主力设备：

- **客户端交付模式**：**\`${b.clientMode}\`**
- **资料提及客户端**：${b.clients.join('、')}
- **协议栈支持**：\`${b.protocols.join(' / ')}\`

${
  b.clientMode === '仅专属客户端'
    ? `> **⚠️ 购前硬性限制提醒**：${b.name} 采用**仅专属客户端**架构，**不提供 Clash / Shadowrocket / v2rayN 通用订阅链接**。如果您需要配置 [OpenWrt 软路由](/clients/platform/openwrt/)、Apple TV 或在 [Clash Verge Rev](/clients/clash-verge-rev/) 中自定义分流规则，请勿购买该品牌，可前往[自研客户端与第三方订阅机场对比指南](/airport/client-vs-third-party-subscription/)挑选开放订阅的品牌。`
    : `> **✅ 第三方客户端接入指南**：如果您计划在桌面端或移动端使用开源客户端，建议在付款获取订阅后依次阅读：[Clash Verge Rev 从零安装到 TUN 全流程](/guides/clash-verge-rev-setup/)、[Shadowrocket（小火箭）iPhone 订阅配置指南](/guides/shadowrocket-ios-setup/) 或 [v2rayN 多核心订阅切换教程](/guides/v2rayn-subscription-and-core/)。`
}

---

## 五、购买前注意事项与风险提示（Pre-Purchase Checklist）

为保障您的资金与账号安全，在点击下方注册入口前请完成以下四项核查：

1. **严守“首单真实月付”原则**：除非某品牌没有月付档且您已充分评估锁仓风险，否则首次测试一律优先购买 **${
    lowestMonthly ? `¥${lowestMonthly.price}/月（${lowestMonthly.name}）` : '最低短周期档位'
  }**，在本地宽带晚高峰（20:00–23:30）实测满意后再考虑续费（参见[20 元以内月付机场选型指南](/plans/monthly-under-20-guide/)）。
2. **核查已知资料冲突与风险标记**：
${[...b.conflicts.map((c) => `   - **资料冲突提醒**：${c}`), ...b.riskFlags.map((r) => `   - **风险标志**：${r}`)].join('\n')}
${
  b.linkAnomaly
    ? `   - **⚠️ 链接格式异常提示**：\`${b.linkAnomalyNote}\`。打开外部面板时请仔细核对域名与 HTTPS 证书状态（详见[如何核实机场官网真伪](/brands/how-to-verify-airport-legitimacy/)）。`
    : ''
}
3. **留存购前四项凭证快照**：请按[订阅泄露风险与付费凭证留存指南](/safety/subscription-leak-and-refund-evidence/)保存「套餐流量与退款条款截图、优惠码扣减截图、支付流水号、首次 \`subscription-userinfo\` 响应头」。
4. **先看评测再下单**：如果您还没看过完整的线路分析、测速审计与同价位竞品对比，请先阅读 👉 **[《${b.name} 独立深度评测与资料审计》](/reviews/${b.slug}/)**。

---

## 六、常见问题（商业与购买 FAQ）

${faqs.map((f) => `### ${f.q}\n\n${f.a}\n`).join('\n')}

---

## 七、官方注册入口与深度评测跳转

- 📘 **还没想好是否适合自己？** 先看完整优缺点与同价位竞品分析 👉 **[阅读《${b.name} 独立深度评测》](/reviews/${b.slug}/)**
- 🔍 **想和其他品牌横向比价？** 前往 **[31 家品牌数据库多维筛选器](/brands/directory/)** 或 **[品牌横向对比中心](/brands/comparisons/)**
- 🌐 **已确认套餐与限制条件？** 通过下方合规透明推广组件前往 **${b.name}** 登记入口：

<AffiliateButton slug="${b.slug}" />
`
}

let commercialWritten = 0
for (const b of BRANDS) {
  const dir = path.join(docsDir, 'brands', b.slug)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.md'), buildCommercialDetailMarkdown(b), 'utf8')
  commercialWritten++
}
console.log(`[build-brand-reviews] Upgraded ${commercialWritten} brand commercial detail pages in docs/brands/<slug>/`)
