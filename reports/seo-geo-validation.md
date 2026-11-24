# SEO / GEO 规范核验报告：语义结构、Schema 注入与生成式检索适配

## 1. 搜索引擎与生成式引擎（GEO）优化策略
在现代搜索环境中，内容不仅要面向传统 Google / 百度爬虫（SEO），还要高度适配 Perplexity、SearchGPT、Gemini、DeepSeek 等 AI 生成式引擎的直接检索引用（GEO）。

### 核心 GEO 优化落地规范：
1. **Answer-First 结构化答案置顶**：
   所有 27 篇三级文章、31 篇品牌评测及 8 篇对比文章，正文第一段统一采用 `<div class="answer-first-box">`，在 150–200 字内以确定性陈述直接给出核心结论、关键数字、避坑要点，便于 AI 引擎零歧义抽取为直接答案。
2. **语义化数据台账与代码块**：
   关键价格、丢包测试与排障命令一律采用 Markdown 标准表格或带语言标注的代码块，拒绝纯口水化长段落。
3. **多维 FAQ 对齐与 JSON-LD 注入**：
   每篇文章均在 Frontmatter 包含 6–8 项高频问答，并在正文末尾设立对应 H2/H3 问答区。

---

## 2. 结构化数据 (Schema LD+JSON) 自动化增强
修改 `docs/.vitepress/config.ts`，在页面构建时根据路由类型动态注入符合 Schema.org 标准的结构化数据：

| 页面类型 | 注入 Schema 类型 | 关键字段与属性 | 搜索引擎展示效果 |
| :--- | :--- | :--- | :--- |
| **品牌独立评测 (`/reviews/`)** | `Service` + `Review` + `FAQPage` | `name`, `provider`, `reviewRating`, `mainEntity` | 搜索结果展现服务评分、厂商归属及富文本 FAQ 下拉卡片 |
| **品牌横向对比 (`/compare/`)** | `Article` + `ItemList` + `FAQPage` | `headline`, `itemListElement`, `mainEntity` | 展现对比专题列表、发布日期与对比要点摘要 |
| **三级长尾指南 (`/guides/ etc.)** | `TechArticle` / `HowTo` + `FAQPage` | `headline`, `step`, `mainEntity` | 展现排障步骤富文本卡片与直接答案片段 (Featured Snippet) |
| **一级与二级专题** | `CollectionPage` + `BreadcrumbList` | `hasPart`, `itemListElement` | 呈现完整的面包屑站点导航与子页面聚合展示 |

---

## 3. SEO 基础指标自动化质检结果
- **唯一 Title 检查**：重复组数 = **0 组**；
- **唯一 H1 检查**：重复组数 = **0 组**，缺失 H1 页面 = **0 页**；
- **Meta Description 覆盖**：186 篇 Markdown 均包含大于 50 字符的独立 Description；
- **基础 SEO 部署文件**：`sitemap.xml`、`robots.txt`、`404.html`、`.htaccess` 均完整生成于构建根目录。
