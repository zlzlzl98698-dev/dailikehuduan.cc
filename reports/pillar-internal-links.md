# 一级专题内部链接矩阵报告（Pillar Internal Links）

- **审计日期**：2026-11-23
- **校验范围**：10 个一级专题 Markdown 源文件及 `docs/.vitepress/dist/` 构建产物 HTML（由 `scripts/audit-site.mjs` 全量复核）

## 1. 一级专题内链数量与完整性统计

| 专题 | 源文件总内链数 | 唯一有效站内路由数 | 覆盖下属二级专题 | 死链数（MD / HTML） | 硬编码外部推广链接数 |
|---|---:|---:|---|---|---:|
| `/airport/` | 227 | 111 | 6 / 6 全部覆盖 | 0 / 0 | 0 |
| `/plans/` | 257 | 53 | 6 / 6 全部覆盖 | 0 / 0 | 0 |
| `/brands/` | 303 | 64 | 6 / 6 + 31 家品牌全部覆盖 | 0 / 0 | 0 |
| `/vpn/` | 130 | 64 | 6 / 6 全部覆盖 | 0 / 0 | 0 |
| `/clients/` | 126 | 61 | 6 大核心 + 6 OS + 12 扩展客户端 | 0 / 0 | 0 |
| `/ai-streaming/` | 68 | 47 | 6 / 6 全部覆盖 | 0 / 0 | 0 |
| `/routes/` | 82 | 47 | 6 / 6 全部覆盖 | 0 / 0 | 0 |
| `/guides/` | 97 | 58 | 6 / 6 + 3 篇 L3 实战指南 | 0 / 0 | 0 |
| `/troubleshooting/` | 102 | 64 | 6 / 6 + WSL2/Docker L3 指南 | 0 / 0 | 0 |
| `/safety/` | 120 | 58 | 6 / 6 全部覆盖 | 0 / 0 | 0 |

## 2. 核心跨专题跳转路径核查

所有专题均已按用户决策与操作路径在对应正文语境中自然埋设上下游链接，而非在文末堆砌重复导航：

1. **决策购买路径**：
   - `/airport/` → `/plans/`（月付/年付折算核验）→ `/brands/directory/`（条件检索）→ `/brands/<slug>/`（31 家独立档案）
   - `/airport/` → `/routes/`（IEPL/IPLC 术语与晚高峰口径）→ `/brands/<slug>/`
2. **工具配置与排障路径**：
   - `/vpn/` → `/clients/`（开源客户端选型）→ `/guides/`（订阅导入与 TUN 配置）
   - `/clients/` → `/guides/`（YAML 覆写与自动更新）→ `/troubleshooting/`（超时/200+0/DNS/TUN 排障）
3. **场景解锁与风险兜底路径**：
   - `/ai-streaming/` → `/routes/`（港日美地区与原生 IP 限制）→ `/brands/<slug>/`（各品牌声明与实测对照）
   - `/safety/` → `/brands/status/`（链接异常与历史冲突）→ `/brands/alternatives/` & `/airport/`（平滑替代与低风险试错）

## 3. 推广链接合规检查

- 全部 10 个一级专题均通过 `scripts/audit-site.mjs` 正则扫描，确认 **0 处硬编码联盟注册域名**（全部通过 `/brands/<slug>/` 或集中组件读取 `brands.ts`）。
