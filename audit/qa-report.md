# 站点质量与发布前 QA 审计报告（QA Report）

- **生成时间**：2026-11-24T04:29:32.178Z
- **审计脚本**：`scripts/audit-site.mjs`
- **检查汇总**：通过 **11 / 11** 项，未通过 **0** 项

## 1. 检查项明细

| 检查项 | 状态 | 详细结果 |
|---|---|---|
| 31 家去重品牌 Slug 唯一性校验 | PASS | brands.ts 共 31 条记录，唯一 slug 数 31，重复 slug：无 |
| Firefly 单一去重规范页校验 | PASS | 匹配到 1 条 Firefly 记录（slug: firefly） |
| Markdown 零硬编码推广域名与邀请链接检查 | PASS | 已扫描 188 个 Markdown 文件，0 处硬编码推广链接 |
| 10 一级 + 60 二级 + 31 品牌商业 + 31 独立评测 + 8 品牌对比 + 27 L3/客户端实战路由（docs/ 源文件） | PASS | 应有路由 187 条（一级 10 + 二级 60 + 品牌商业 31 + 独立评测 31 + 对比 8 + 扩展），docs/ 缺失 0 条 |
| 构建产物 HTML 路由完整性检查（docs/.vitepress/dist/） | PASS | dist/ 缺失 0 条路由 |
| Markdown 唯一 Title 与 H1 检查 | PASS | 重复 Title：0 组，重复 H1：0 组，缺少 H1：0 页 |
| 构建 HTML 唯一 <title> 与 <h1> 检查 | PASS | 共检查 188 个 HTML 文件；重复 <title>：0 组，重复 <h1>：0 组 |
| 构建产物 SEO 与部署基础文件（sitemap.xml / robots.txt / 404.html / .htaccess） | PASS | sitemap.xml、robots.txt、404.html 与 .htaccess 全部存在 |
| 站内 Markdown 死链检查 | PASS | 已检查 188 个 Markdown 文件，0 条站内死链 |
| 构建产物 HTML 站内死链检查 | PASS | 已检查 188 个构建 HTML 文件，0 条站内死链 |
| 关键词映射库完整性检查 (content/keyword-map.json) | PASS | 共 127 条词簇映射，31 家品牌覆盖缺口：0，字段缺失记录：0 |
