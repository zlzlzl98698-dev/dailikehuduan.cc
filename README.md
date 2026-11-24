<div align="center">

<img src="./docs/public/images/site-avatar.png" alt="代理客户端 Logo" width="108" height="108" style="border-radius: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);" />

# 代理客户端 · dailikehuduan.cc

**现代网络代理客户端全平台技术文档 · TUN/DNS 系统级排障手册 · 31 家机场品牌可核验数据库**

[![VitePress](https://img.shields.io/badge/VitePress-v1.6.4-4338ca?style=for-the-badge&logo=vite&logoColor=white)](https://vitepress.dev/)
[![Vue 3](https://img.shields.io/badge/Vue-3.5-42b883?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Static Pages](https://img.shields.io/badge/SSG%20Pages-188%2B%20HTML-10b981?style=for-the-badge)](https://dailikehuduan.cc/)
[![Automated QA](https://img.shields.io/badge/QA%20Audit-11%2F11%20PASS-blueviolet?style=for-the-badge)](./audit/qa-report.md)
[![License](https://img.shields.io/badge/License-MIT-gray?style=for-the-badge)](./LICENSE)

[🌐 访问正式站点](https://dailikehuduan.cc/) · [📖 站点地图](https://dailikehuduan.cc/sitemap.xml) · [🔍 质量审计报告](./audit/qa-report.md) · [🚨 SEO预防性报告](./Preventive_SEO_Audit_Report.md)

</div>

---

## 📌 项目概述

**代理客户端（dailikehuduan.cc）** 是一套遵循技术 SEO 与生成式搜索引擎（GEO/AEO）规范构建的权威开源知识库与全平台客户端技术指南。

项目基于 **VitePress 1.6 + Vue 3 + TypeScript** 架构构建，输出 188+ 个完全预渲染的纯静态 HTML 页面，提供从零基础客户端下载安装、TUN/TAP 虚拟网卡接管、DNS 泄露与污染防护，到流媒体/AI 针对性分流规则与 31 家主流机场品牌深度横向横评的完整解决方案。

---

## 🌟 核心技术特性

<table>
  <tr>
    <td width="50%">
      <h3>⚡ 零 CSR 阻塞与极速爬取 (Zero-JS SSG)</h3>
      <p>所有页面均在构建阶段编译为静态 HTML。核心内容完全包含在初始 DOM 中，无需任何客户端 JavaScript 运行即可被 Googlebot、Bingbot、Baiduspider、yisouspider 等爬虫完整抓取解析。</p>
    </td>
    <td width="50%">
      <h3>🤖 GEO / AEO 生成式搜索优化</h3>
      <p>每个核心专题与问答页均采用 <strong>Answer-First（首段结论直出）</strong> 规范排版，内建结构化对比表格、<code>&lt;details&gt;</code> 原生交互问答对，以及贴合正文语义的 Schema.org JSON-LD 结构化数据。</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🛡️ 站群风控隔离与反作弊合规</h3>
      <p>全站严禁硬编码外部推广链接，所有转介链接由统一数据层 <code>brands.ts</code> 严格包裹 <code>rel="nofollow sponsored noopener"</code>，杜绝 PageRank 传递惩罚；不伪造测速截图与虚假用户评分。</p>
    </td>
    <td width="50%">
      <h3>📱 全终端、全内核客户端知识图谱</h3>
      <p>覆盖 Windows、macOS、iOS、Android、Linux、OpenWrt 路由器以及 Apple TV tvOS 全平台，涵盖 Clash Verge Rev、Sing-box、Surge、Shadowrocket、Loon、Stash 等主流工具的内核机制与配置指导。</p>
    </td>
  </tr>
</table>

---

## 🗺️ 内容架构全景

本知识库采用高度结构化的 **三级专题矩阵**，全站包含 188+ 个完全规范化的独立页面：

```
docs/
├── clients/              # [一级] 全平台代理客户端选型与安装配置（13 个子专题）
├── protocols/            # [一级] 核心传输协议与混淆技术解析（Shadowsocks/VLESS/Trojan/Hysteria2/TUIC）
├── rules/                # [一级] 智能分流规则编写、GEOIP/GEOSITE 规则集与黑白名单
├── troubleshooting/      # [一级] TUN 虚拟网卡冲突、系统代理未释放、SSL 握手失败全排查（10+ 深度手册）
├── ai-streaming/         # [一级] ChatGPT/Claude 报错 403 规避、YouTube 4K 送中与 Netflix 解锁
├── routes/               # [一级] 直连/BGP/IEPL/IPLC 专线原理、倍率计算与高峰晚抖动分析
├── plans/                # [一级] 机场套餐选型、按量不限时与周期付对比指南
├── brands/               # [一级] 31 家主流机场品牌基础商业信息、套餐架构与测速归档
├── reviews/              # [一级] 31 家独立深度品牌评测（含光速云万字旗舰评测与实测数据归档）
├── compare/              # [一级] 8 篇旗舰级 Head-to-Head 双品牌深度横评矩阵
├── safety/               # [一级] 网络安全防护、DNS 泄露预防、中间人攻击防范与合规常识
├── guides/               # [一级] 新手扫盲、跨平台配置迁移与自动化更新手册
└── about/                # [一级] 评测方法论、数据溯源原则与免责声明
```

### 31 家去重品牌客观归档
项目对市面上常见的 31 家机场品牌建立独立可溯源的数据档案，严控资料冲突与营销包装：

> 光速云（旗舰深度评测）、暮光加速、飞猫云、微风网络、星岛盟、二猫云、无忧云、微图云、萤火虫、U1S1、灵猫云、一帆云、搜狗云、山月云、全球云、银杏人、速捷云、苏荷云、速致、魔戒、肥猫云、速云、翼游、蓝海、云际、快狗、极客云、梯子云、灵动云、浪网、边缘节点 EdgeNova。

---

## 🛠️ 技术栈与依赖

- **静态站点生成器**：[VitePress](https://vitepress.dev/) `v1.6.4`
- **UI 框架与组件**：[Vue 3](https://vuejs.org/) `v3.5.46`
- **样式与设计系统**：原生 CSS 变量 + 纯手写响应式现代化卡片主题
- **矢量图标库**：[Lucide Vue Next](https://lucide.dev/)
- **类型安全**：TypeScript 5.x
- **多端搜索支持**：VitePress 内置 MiniSearch 本地引擎，支持一键无缝接入 Algolia DocSearch

---

## 🚀 快速开始

### 环境依赖
- [Node.js](https://nodejs.org/) `>= 18.0.0`
- `npm` 或 `pnpm` / `yarn`

### 本地开发与预览
```bash
# 1. 克隆代码仓库
git clone https://github.com/zlzlz198698-dev/dailikehuduan.cc.git
cd dailikehuduan.cc

# 2. 安装项目依赖
npm install

# 3. 启动本地开发热更新服务器 (默认端口 5173)
npm run docs:dev

# 4. 执行全站静态编译 (输出至 docs/.vitepress/dist 并注入 Apache 规则)
npm run docs:build

# 5. 启动生产构建预览服务
npm run docs:preview
```

---

## 🧪 自动化质量保证与风控审计

本项目内置完善的自动化静态代码质检脚本，在每次发布前严格保证数据的一致性与合规性：

```bash
npm run audit:qa
```

质检脚本自动执行 **11 项硬性合规检查**：
1. **Slug 唯一性**：31 家品牌 Slug 100% 独立无冲突。
2. **单一规范页约束**：防范重复品牌实体冲突。
3. **零硬编码推广链接**：全局扫描 188+ Markdown 文件，禁止裸写返利 URL。
4. **路由完整性**：187 条生产路由双向核验（Markdown 源文件 ⇋ dist 静态产物）。
5. **SEO 标题唯一性**：Markdown 与构建产物 `title` 及 `<h1>` 标签零重复。
6. **基础设施就绪**：`sitemap.xml`、`robots.txt`、`404.html`、`.htaccess` 完整性。
7. **全站死链检查**：0 站内死链、0 无效相对路径。
8. **关键词映射库覆盖**：127+ 核心搜索词簇精准对齐。

---

## 🌐 搜索引擎与站长平台验证接入

本项目的 SEO Head 系统支持在构建时通过环境变量自动注入主流搜索引擎的验证凭据：

```bash
# 构建前设置环境变量（可选，在 CI/CD 或本地环境设置）
export GOOGLE_SITE_VERIFICATION="your-google-verification-code"
export BING_SITE_VERIFICATION="your-bing-xml-or-meta-hash"
export BAIDU_SITE_VERIFICATION="codeva-xxxxxxxxxx"
export SHENMA_SITE_VERIFICATION="your-shenma-token"

npm run docs:build
```

验证 Meta 标签将自动内联至每个静态 HTML 的 `<head>` 区域，无需客户端 JavaScript 介入。

---

## 🚢 部署指南

### Apache Web 服务器（推荐）
项目已内置生产级 `deploy/apache/.htaccess`，并在 `postbuild` 阶段自动复制至构建目录。支持：
- HTTPS 强制重定向与 `www` 转非 `www` 规范化 301 重写
- 强制保留 URL 尾部斜杠（Trailing Slash），避免重复页面分流
- 静态资源（SVG/WebP/PNG/CSS/JS）长效缓存策略
- 严密拦截 `.git`、`.env`、Markdown 源文件等敏感路径

### Nginx 配置参考
```nginx
server {
    listen 80;
    server_name dailikehuduan.cc www.dailikehuduan.cc;
    return 301 https://dailikehuduan.cc$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.dailikehuduan.cc;
    return 301 https://dailikehuduan.cc$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dailikehuduan.cc;
    root /var/www/dailikehuduan.cc/docs/.vitepress/dist;
    index index.html;

    # 规范化尾部斜杠
    rewrite ^([^.\?]*[^/])$ $1/ permanent;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~* \.(webp|png|jpg|jpeg|svg|ico|css|js|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

---

## ⚖️ 免责声明与版权

1. **中立性声明**：本项目所有评测内容均基于客观技术原理、网络协议规范及历史公开信息编写。我们不鼓励、不诱导用户从事任何违反所在地法律法规的网络行为。
2. **数据实效性**：各服务商的技术架构、套餐价格、线路类型与优惠码具有时效性，请以服务商官方实际结账页面为准。
3. **开源许可**：本项目遵循 [MIT License](./LICENSE) 协议开放。

---

<div align="center">
  <sub>Built with ❤️ for a faster, safer, and cleaner open web · © 2026 dailikehuduan.cc</sub>
</div>
