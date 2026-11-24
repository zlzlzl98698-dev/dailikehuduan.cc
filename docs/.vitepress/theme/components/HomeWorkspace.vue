<script setup lang="ts">
import { ref } from 'vue'
import { NAV_CATEGORIES } from '../../data/navigation'
import { OS_PLATFORMS } from '../../data/clients'
import { BRANDS } from '../../data/brands'
import BrandCard from './BrandCard.vue'

const activeStep = ref<number>(0)

const workflowSteps = [
  {
    step: '01',
    title: '确认设备与开源客户端',
    desc: '按 Windows / macOS / Android / iOS / Linux / OpenWrt 核对官方仓库或正规商店，避开已停更的旧版软件。',
    link: '/clients/',
    cta: '进入客户端中心',
  },
  {
    step: '02',
    title: '选择协议内核与订阅格式',
    desc: '区分 Mihomo (Clash YAML)、Xray (Base64) 与 sing-box (JSON)，防止导入报错或 200+0 字节。',
    link: '/guides/subscription/',
    cta: '查看订阅格式对照',
  },
  {
    step: '03',
    title: '分流规则、DNS 与 TUN 接管',
    desc: '配置 Fake-IP / Redir-Host 绕过内网、开启 TUN 接管 CLI 与桌面应用、排查 IPv6 与 DNS 泄漏。',
    link: '/guides/tun/',
    cta: '阅读 TUN 配置指南',
  },
  {
    step: '04',
    title: '排障定位与服务选型对照',
    desc: '先用本地排障向导排除时间与端口故障；再结合套餐折算成本与证据分级检索 31 家机场资料。',
    link: '/brands/directory/',
    cta: '检索 31 家品牌库',
  },
]

const clientGuides = [
  { title: 'Clash Verge Rev 安装与 TUN 配置', link: '/clients/clash-verge-rev/', os: 'Win / Mac / Linux', tag: 'Mihomo 主力' },
  { title: 'v2rayN 多核心切换与路由规则', link: '/clients/v2rayn/', os: 'Win / Mac / Linux', tag: 'Xray / sing-box' },
  { title: 'Shadowrocket 小火箭订阅与分流', link: '/clients/shadowrocket/', os: 'iOS / iPadOS', tag: '外区付费端' },
  { title: 'FlClash 全平台统一样式教程', link: '/clients/flclash/', os: 'Win / Android / Mac', tag: '轻量 Mihomo' },
  { title: 'v2rayNG 安卓分应用代理设置', link: '/clients/v2rayng/', os: 'Android', tag: 'Xray 轻量' },
  { title: 'Hiddify 跨平台多协议导入', link: '/clients/hiddify/', os: '全平台', tag: 'sing-box' },
  { title: 'Karing 规则兼容与配置迁移', link: '/clients/karing/', os: '全平台含 iOS', tag: 'sing-box' },
  { title: 'OpenClash 软路由透明代理指南', link: '/clients/openclash/', os: 'OpenWrt', tag: '路由网关' },
]

const troubleGuides = [
  { title: '节点全部超时 / -1ms 真连接排查', link: '/troubleshooting/timeout/', symptom: '时间同步与 TLS' },
  { title: '订阅下载失败或返回 200+0 字节', link: '/troubleshooting/subscription/', symptom: 'UA 与代理环路' },
  { title: '能测速但网页打不开或频繁断线', link: '/troubleshooting/disconnected/', symptom: '端口与保活' },
  { title: 'DNS 错误、内网失灵与泄漏检测', link: '/troubleshooting/dns/', symptom: 'Fake-IP 残留' },
  { title: '客户端白屏无法启动或核心报错', link: '/troubleshooting/startup/', symptom: 'WebView2 / 签名' },
  { title: 'TUN 模式与 WSL2 / Docker / 加速器冲突', link: '/troubleshooting/tun/', symptom: '路由表打架' },
  { title: 'Windows 系统时间偏差导致 TLS 失败', link: '/guides/system-time-tls-fix/', symptom: '实操修复' },
  { title: '机场失联停服与域名阻断区分方法', link: '/safety/closures/', symptom: '状态核验' },
]

const featuredBrands = BRANDS.filter((b) => b.isFeatured).slice(0, 6)

function openLocalSearch() {
  if (typeof document === 'undefined') return
  const btn = document.querySelector<HTMLButtonElement>('.DocSearch-Button, .VPNavBarSearch button')
  if (btn) btn.click()
}
</script>

<template>
  <div class="home-ws">
    <!-- Hero 文档情报工作台 -->
    <section class="hero-ws">
      <div class="hero-ws__left">
        <div class="hero-ws__eyebrow">
          <span class="diw-badge diw-badge--blue">代理客户端 · dailikehuduan.cc</span>
          <span class="diw-badge diw-badge--teal">文档快照：2026-11-23</span>
        </div>
        <h1 class="hero-ws__title">
          代理客户端下载指引、配置教程、故障排查与可核验品牌库
        </h1>
        <p class="hero-ws__desc">
          本站以<strong>代理客户端软件、订阅协议配置、TUN/DNS 排障与网络基础科普</strong>为主轴，提供指向官方开源仓库的安全指引；并为需要选型的用户提供 31 家去重机场品牌的价格折算、冲突审计与证据分级对照。
        </p>

        <div class="hero-ws__search-bar">
          <button type="button" class="hero-search-trigger" @click="openLocalSearch">
            <span>🔍 搜索客户端教程、报错代码、YAML 字段或 31 家品牌...</span>
            <kbd>Ctrl K</kbd>
          </button>
          <div class="hero-quick-tags">
            <span>快捷入口：</span>
            <a href="/clients/clash-verge-rev/">Clash Verge Rev</a>
            <a href="/clients/v2rayn/">v2rayN</a>
            <a href="/troubleshooting/timeout/">节点超时</a>
            <a href="/troubleshooting/subscription/">订阅 200+0 字节</a>
            <a href="/brands/directory/">31家品牌检索</a>
          </div>
        </div>

        <div class="hero-os-row">
          <span class="hero-os-label">按设备进入：</span>
          <a v-for="os in OS_PLATFORMS" :key="os.id" :href="os.url" class="hero-os-pill">
            {{ os.name }}
          </a>
        </div>
      </div>

      <!-- Hero 右侧：原创交互式客户端路径与知识导航示意（绝无虚构测速） -->
      <aside class="hero-ws__right" aria-label="客户端配置与排障工作台路径示意">
        <div class="ws-schematic">
          <div class="ws-schematic__head">
            <span class="ws-schematic__dot"></span>
            <span>Client Knowledge Workbench · 接入路径导航（非实测面板）</span>
          </div>

          <div class="ws-schematic__tabs">
            <button
              v-for="(item, idx) in workflowSteps"
              :key="item.step"
              type="button"
              class="ws-step-btn"
              :class="{ 'is-active': activeStep === idx }"
              @click="activeStep = idx"
            >
              <span class="ws-step-num">{{ item.step }}</span>
              <span>{{ item.title }}</span>
            </button>
          </div>

          <div class="ws-schematic__detail">
            <div class="ws-schematic__detail-tag">STEP {{ workflowSteps[activeStep].step }} · 建议操作路径</div>
            <h3>{{ workflowSteps[activeStep].title }}</h3>
            <p>{{ workflowSteps[activeStep].desc }}</p>
            <div class="ws-schematic__actions">
              <a :href="workflowSteps[activeStep].link" class="ws-schematic__cta">
                {{ workflowSteps[activeStep].cta }} →
              </a>
              <a href="/troubleshooting/" class="ws-schematic__sec">直接进入故障排查向导</a>
            </div>
          </div>
        </div>
      </aside>
    </section>

    <!-- 三大快速分流入口：OS / 我用什么客户端 / 我遇到什么故障 -->
    <section class="ws-section">
      <div class="diw-grid-3">
        <a href="/clients/" class="diw-card quick-entry">
          <span class="diw-badge diw-badge--blue">客户端中心</span>
          <h3>我应该选什么客户端？</h3>
          <p>按操作系统、Mihomo / sing-box / Xray 内核与是否支持第三方订阅筛选，只链接官方项目。</p>
        </a>
        <a href="/troubleshooting/" class="diw-card quick-entry">
          <span class="diw-badge diw-badge--teal">交互排障</span>
          <h3>我遇到了连不上 / 报错？</h3>
          <p>5 秒勾选系统、软件与错误症状，获取可复制验证命令，不收集任何订阅密钥。</p>
        </a>
        <a href="/brands/directory/" class="diw-card quick-entry">
          <span class="diw-badge diw-badge--slate">31 家品牌库</span>
          <h3>如何核验套餐与真实成本？</h3>
          <p>区分年付折算与真实月付门槛，透明呈现品牌资料冲突、实测归档与待核实缺口。</p>
        </a>
      </div>
    </section>

    <!-- 十大核心专题入口卡片 -->
    <section class="ws-section">
      <div class="ws-section__head">
        <div>
          <h2>十大核心专题知识库</h2>
          <p>覆盖客户端安装、使用教程、排障、AI/流媒体、线路术语、风险防坑与品牌库共 10 个一级栏目与 60 个子专题。</p>
        </div>
      </div>

      <div class="diw-grid-2">
        <article v-for="cat in NAV_CATEGORIES" :key="cat.id" class="diw-card pillar-card">
          <div class="pillar-card__head">
            <h3><a :href="cat.link">{{ cat.text }}</a></h3>
            <a :href="cat.link" class="pillar-card__all">进入专题 →</a>
          </div>
          <p class="pillar-card__desc">{{ cat.tagline }}</p>
          <div class="pillar-card__subs">
            <a v-for="sub in cat.subsections" :key="sub.link" :href="sub.link" class="pillar-sub-chip">
              {{ sub.title }}
            </a>
          </div>
        </article>
      </div>
    </section>

    <!-- 精选客户端教程 & 精选故障排查 -->
    <section class="ws-section">
      <div class="ws-split">
        <div>
          <div class="ws-section__head">
            <div>
              <h2>精选客户端安装与配置教程</h2>
              <p>区分桌面现代端与移动端生态，明确开源项目来源与版本适用范围。</p>
            </div>
            <a href="/clients/" class="ws-more-link">全部客户端 →</a>
          </div>
          <div class="guide-list">
            <a v-for="g in clientGuides" :key="g.link" :href="g.link" class="diw-card guide-item">
              <div class="guide-item__top">
                <span class="diw-badge diw-badge--blue">{{ g.tag }}</span>
                <span class="guide-item__meta">{{ g.os }}</span>
              </div>
              <strong>{{ g.title }}</strong>
            </a>
          </div>
        </div>

        <div>
          <div class="ws-section__head">
            <div>
              <h2>高频故障排查与操作指南</h2>
              <p>提供前提条件、系统命令与预期结果，拒绝空泛“重启试试”。</p>
            </div>
            <a href="/troubleshooting/" class="ws-more-link">全部排障 →</a>
          </div>
          <div class="guide-list">
            <a v-for="t in troubleGuides" :key="t.link" :href="t.link" class="diw-card guide-item">
              <div class="guide-item__top">
                <span class="diw-badge diw-badge--teal">{{ t.symptom }}</span>
                <span class="guide-item__meta">故障诊断</span>
              </div>
              <strong>{{ t.title }}</strong>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- 品牌推荐模块（明确标为编辑精选含推广合作，光速云优先） -->
    <section class="ws-section">
      <div class="ws-section__head">
        <div>
          <h2>机场品牌：编辑精选（含推广合作）</h2>
          <p>
            以下展示顺序遵循编辑部资料收录排序（<strong>光速云</strong>置顶），<strong>并非经独立实测证实的性能排行榜</strong>；注册链接均为历史推广入口（含 <code>nofollow sponsored</code>），不保证实时可用。
          </p>
        </div>
        <a href="/brands/directory/" class="ws-more-link">检索全部 31 家品牌 →</a>
      </div>

      <div class="diw-grid-3">
        <BrandCard v-for="b in featuredBrands" :key="b.slug" :brand="b" />
      </div>
    </section>

    <!-- 更新记录、信任声明与可见 FAQ -->
    <section class="ws-section">
      <div class="diw-grid-2">
        <div class="diw-card">
          <h3>最近核实与更新日志</h3>
          <ul class="ws-log-list">
            <li><strong>2026-11-23</strong>：完成 31 家机场品牌去重（合并 Firefly 与 Firefly 萤火虫），记录光速云 59GB/69GB 及多品牌链接冲突审计。</li>
            <li><strong>2026-11-23</strong>：上线 10 个一级专题 + 60 个二级子专题 + Windows/Android/iOS/macOS/Linux/OpenWrt 六大平台客户端中心。</li>
            <li><strong>2026-11-23</strong>：标注 <code>Nikki</code> 对 OpenWrt 24.10+ 的要求与 <code>NekoBox</code> Google Play 非官方版本风险警示。</li>
          </ul>
          <a href="/brands/status/" class="ws-more-link">查看品牌数据状态与冲突记录 →</a>
        </div>

        <div class="diw-card">
          <h3>常见问题（FAQ）与合规免责声明</h3>
          <details class="ws-faq" open>
            <summary>为什么“编辑精选”顺序不等于测速排行榜？</summary>
            <p>因为本站遵循透明商业披露原则：原始资料中的测速多为 2026-10-19 非晚高峰汇总或特定条件下归档，不足以支撑全站统一晚高峰横评排名，因此将商业/编辑精选次序与可验证实测分开。</p>
          </details>
          <details class="ws-faq">
            <summary>旧的 Clash for Windows 还能继续用吗？</summary>
            <p>原 Clash for Windows 已停止维护且存在安全与协议滞后问题，推荐在 Windows / macOS / Linux 迁移至活跃维护的 Clash Verge Rev 或 FlClash（均采用 Mihomo 内核）。</p>
          </details>
          <details class="ws-faq">
            <summary>本站会保存用户的订阅链接或检测密码吗？</summary>
            <p>不会。本站为纯静态生成的文档站点，排障向导仅在浏览器本地按勾选条件给出通用排查步骤与命令行验证方法，绝不要求粘贴真实订阅链接或密钥。</p>
          </details>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-ws {
  max-width: 1220px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 2rem;
}

.hero-ws {
  display: grid;
  grid-template-columns: 1.15fr 0.95fr;
  gap: 1.75rem;
  align-items: stretch;
  padding: 1.75rem;
  border-radius: 16px;
  background: linear-gradient(145deg, var(--diw-surface) 0%, var(--diw-surface-alt) 100%);
  border: 1px solid var(--diw-border);
  margin-bottom: 2rem;
}

.hero-ws__eyebrow {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.hero-ws__title {
  margin: 0 0 0.75rem;
  font-size: 2rem;
  line-height: 1.26;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-1);
}

.hero-ws__desc {
  margin: 0 0 1.15rem;
  font-size: 0.96rem;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

.hero-ws__search-bar {
  margin-bottom: 1rem;
}

.hero-search-trigger {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.72rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--diw-border-strong);
  background: var(--diw-surface);
  color: var(--vp-c-text-3);
  font-size: 0.88rem;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.hero-search-trigger:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-text-1);
}

.hero-search-trigger kbd {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  padding: 0.15rem 0.45rem;
  border-radius: 5px;
  border: 1px solid var(--diw-border);
  background: var(--diw-surface-alt);
}

.hero-quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.55rem;
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
}

.hero-quick-tags a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.hero-quick-tags a:hover {
  text-decoration: underline;
}

.hero-os-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
}

.hero-os-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.hero-os-pill {
  padding: 0.3rem 0.68rem;
  border-radius: 7px;
  border: 1px solid var(--diw-border-strong);
  background: var(--diw-surface);
  color: var(--vp-c-text-1);
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
}

.hero-os-pill:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

/* Right Schematic */
.ws-schematic {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: #0b1220;
  color: #e2e8f0;
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 1.1rem;
}

.ws-schematic__head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.74rem;
  color: #94a3b8;
  margin-bottom: 0.8rem;
}

.ws-schematic__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0d9488;
}

.ws-schematic__tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
  margin-bottom: 0.85rem;
}

.ws-step-btn {
  text-align: left;
  padding: 0.52rem 0.65rem;
  border-radius: 8px;
  border: 1px solid #1e293b;
  background: #111c30;
  color: #cbd5e1;
  font-size: 0.78rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.ws-step-btn.is-active {
  border-color: #38bdf8;
  background: rgba(2, 132, 199, 0.18);
  color: #f8fafc;
}

.ws-step-num {
  font-family: var(--vp-font-family-mono);
  color: #38bdf8;
  font-weight: 700;
}

.ws-schematic__detail {
  background: #111c30;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 0.9rem 1rem;
}

.ws-schematic__detail-tag {
  font-family: var(--vp-font-family-mono);
  font-size: 0.72rem;
  color: #2dd4bf;
  margin-bottom: 0.3rem;
}

.ws-schematic__detail h3 {
  margin: 0 0 0.35rem;
  font-size: 1rem;
  color: #f8fafc;
}

.ws-schematic__detail p {
  margin: 0 0 0.75rem;
  font-size: 0.82rem;
  line-height: 1.55;
  color: #94a3b8;
}

.ws-schematic__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.ws-schematic__cta {
  padding: 0.42rem 0.85rem;
  border-radius: 7px;
  background: #0284c7;
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
}

.ws-schematic__sec {
  font-size: 0.8rem;
  color: #38bdf8;
  text-decoration: none;
}

.ws-section {
  margin-bottom: 2.3rem;
}

.ws-section__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.ws-section__head h2 {
  margin: 0 0 0.25rem;
  font-size: 1.38rem;
}

.ws-section__head p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--vp-c-text-3);
}

.ws-more-link {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  white-space: nowrap;
}

.quick-entry {
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.quick-entry h3 {
  margin: 0;
  font-size: 1.05rem;
  color: var(--vp-c-text-1);
}

.quick-entry p {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.55;
  color: var(--vp-c-text-2);
}

.pillar-card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
}

.pillar-card__head h3 {
  margin: 0;
  font-size: 1.08rem;
}

.pillar-card__head a {
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.pillar-card__all {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--vp-c-brand-1) !important;
}

.pillar-card__desc {
  margin: 0 0 0.75rem;
  font-size: 0.83rem;
  color: var(--vp-c-text-3);
}

.pillar-card__subs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.pillar-sub-chip {
  font-size: 0.78rem;
  padding: 0.26rem 0.6rem;
  border-radius: 6px;
  background: var(--diw-surface-alt);
  border: 1px solid var(--diw-border);
  color: var(--vp-c-text-2);
  text-decoration: none;
}

.pillar-sub-chip:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.ws-split {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
}

.guide-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
}

.guide-item {
  text-decoration: none;
  color: inherit;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.guide-item__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.4rem;
}

.guide-item__meta {
  font-size: 0.72rem;
  color: var(--vp-c-text-3);
}

.guide-item strong {
  font-size: 0.88rem;
  line-height: 1.4;
  color: var(--vp-c-text-1);
}

.ws-log-list {
  margin: 0.6rem 0 0.8rem;
  padding-left: 1.15rem;
  font-size: 0.85rem;
  line-height: 1.65;
  color: var(--vp-c-text-2);
}

.ws-faq {
  border-top: 1px solid var(--diw-border);
  padding: 0.6rem 0;
  font-size: 0.86rem;
}

.ws-faq summary {
  font-weight: 600;
  cursor: pointer;
  color: var(--vp-c-text-1);
}

.ws-faq p {
  margin: 0.45rem 0 0;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

@media (max-width: 960px) {
  .hero-ws,
  .ws-split {
    grid-template-columns: 1fr;
  }
  .hero-ws__title {
    font-size: 1.6rem;
  }
}

@media (max-width: 600px) {
  .home-ws {
    padding: 1rem 0.85rem;
  }
  .hero-ws {
    padding: 1.1rem;
  }
  .ws-schematic__tabs,
  .guide-list {
    grid-template-columns: 1fr;
  }
}
</style>
