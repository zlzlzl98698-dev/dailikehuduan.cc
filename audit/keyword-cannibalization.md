# 关键词防蚕食与规范归属边界审计（Keyword Cannibalization Audit）

- **审计日期**：2026-11-23
- **数据源**：`docs/.vitepress/data/keywords.ts` & `content/keyword-map.json`（共 127 条规划与品牌词簇映射）
- **数据口径声明**：当前工作区尚未导入线上 Google Search Console（GSC）或 Bing Webmaster Tools 导出 CSV，文中关于搜索意图切分与主题归属均标注为 **结构规划推断**，不虚构任何搜索量、KD 或自然排名数值。

## 1. 防蚕食核心原则（One Primary Intent → One Canonical Owner）

1. **一词一主归属（Single Canonical Owner）**：每一个核心搜索词簇在 `content/keyword-map.json` 中只允许绑定唯一一个 `canonicalOwner` URL；其他高关联页面仅通过规范内链与锚文本向主页面传递权重，不得另起同标题/同 H1 页面竞争同一意图。
2. **评测方法论 vs 品牌检索库 vs 单一品牌页严格分离**：方法论类页面讲“怎么选、怎么测”，数据库页提供筛选与聚合视图，单一品牌页承载 `[品牌名]+评测/官网/价格/优惠码/跑路/替代`。
3. **软件下载指引 vs 实战长教程 vs 故障排查严格分离**：软件单品页负责官方源码校验、架构选型与系统支持；L3 长教程负责端到端实操；故障页按错误症状和报错代码切入。

## 2. 高风险重叠词簇边界表（结构规划推断）

| 易混淆词簇 | 规范归属页面 (`canonicalOwner`) | 承担的独立意图 | 相邻易冲突页面与隔离边界 |
|---|---|---|---|
| `机场推荐` / `好用机场推荐` | `/airport/recommend/` | 选型方法论与场景决策框架 | `/airport/ranking/` 专讲排行口径与合作披露；`/brands/directory/` 承担 31 家交互筛选 |
| `机场排行` / `机场榜单` | `/airport/ranking/` | 解释编辑精选顺序 vs 客观实测边界 | 禁止在 `/airport/recommend/` 再放第二套“排行榜”H1 或同质表格 |
| `便宜机场` / `5.6元机场` | `/plans/budget/` | 5–15 元档成本边界与年付折算陷阱 | `/plans/one-yuan/` 专拆 1 元超低价倍率与风控；`/plans/one-cent/` 专拆体验门槛 |
| `月付机场` / `性价比机场` | `/plans/monthly/` vs `/plans/value/` | `/plans/monthly/` 主讲短周期试错防锁定；`/plans/value/` 主讲单价×倍率数学核算 | 不得在两个页面重复堆砌同一套品牌价格表，彼此通过锚文本互引 |
| `[品牌名] 评测/官网/价格/优惠码/跑路/替代` | `/brands/<slug>/`（31 家独立规范页） | 单一品牌的完整套餐、冲突审计、测速归档与 2 家真实平替 | `/brands/coupons/` 只做全站优惠码格式与适用规则汇总；`/brands/alternatives/` 只做按预算/协议的横向平替索引；`/safety/closures/` 只讲失联核验方法论，**绝不为某家品牌单独新建 `/coupons/<slug>/` 或 `/paolu/<slug>/` 凑数页面** |
| `Firefly` / `Firefly 萤火虫` | `/brands/firefly/` | 合并去重后的唯一品牌规范页 | 禁止同时存在 `/brands/firefly-yinghuochong/` 等重复 slug 页面（由 `scripts/audit-site.mjs` 强制校验） |
| `VPN推荐` / `免费VPN` / `手机VPN` / `安卓VPN` | `/vpn/recommend/` 等 6 篇 | 商业 VPN、VpnService 机制与规则代理机场的技术差异 | 商业 VPN 评估留在 `/vpn/`；需要推荐开源代理软件时统一链向 `/clients/platform/<os>/` |
| `Clash Verge Rev`（软件页） vs `Clash Verge Rev 入门全流程` | `/clients/clash-verge-rev/` vs `/guides/clash-verge-rev-setup/` | 软件页承载官方 GitHub 仓库、WebView2 前置与版本定位；实操页承载从安装到开启 TUN 的顺序步骤 | `/guides/clash-verge-rev-setup/` 的 H1 与 Title 聚焦「从零安装到 TUN 接管实战」，不抢占软件名导航词 |
| `Clash Meta` vs `Mihomo` | `/clients/clash-meta/` vs `/clients/mihomo/` | `/clients/clash-meta/` 面向 ClashMetaForAndroid 与历史用户过渡；`/clients/mihomo/` 面向内核协议能力（Reality/Hysteria2/Sniffer） | 互相链接但分别绑定客户端应用与底层内核两条意图 |
| `订阅教程` vs `订阅格式转换` vs `订阅失败 200+0 字节` | `/guides/subscription/` vs `/guides/subscription-formats-explained/` vs `/troubleshooting/subscription/` | 导入流程 / 格式差异与在线转换隐私风险 / 拉取报错排障 | 教程页写“正确怎么操作”，排障页写“报错代码和异常响应怎么修”，边界清晰 |
| `TUN 模式配置` vs `TUN 冲突` vs `Clash TUN 与 WSL2/Docker 冲突` | `/guides/tun/` vs `/troubleshooting/tun/` vs `/troubleshooting/tun-wsl-docker-conflict/` | 原理与开启方式 / 常见双网卡及系统代理冲突 / WSL2 与 Docker 专项路由修复 | 各自面向不同排查深度，L3 专项文章仅承接开发者容器场景长尾词 |
| `机场跑路`（方法） vs `[品牌名]跑路` | `/safety/closures/` vs `/brands/<slug>/` | `/safety/closures/` 负责域名阻断 vs 真失联的通用验证步骤 | 具体某家品牌的入口异常（如 `yunjiexian`、`huanqiuti`、`lingdong`）统一归属 `/brands/<slug>/` 与 `/brands/status/` |

## 3. 已发布的 L3 专项文章与未发布 Backlog 隔离机制

1. **已发布 L3 文章**（见 `navigation.ts` 与 `keywords.ts`）：
   - `/guides/clash-verge-rev-setup/`
   - `/guides/system-time-tls-fix/`
   - `/guides/subscription-formats-explained/`
   - `/troubleshooting/tun-wsl-docker-conflict/`
2. **待发布 L3 Backlog**（见 `audit/backlog.md`）：
   - 在未补齐可复制真实配置与验证前置条件前，标记为 `status: 'backlog'`，**不生成空白 Markdown 占位页**，避免拉低整站平均质量并防止触发 thin-content 蚕食。

## 4. 后续引入真实 GSC / Bing 数据后的复审流程

当具备线上真实搜索表现导出数据时，执行以下步骤更新边界：

1. 使用 `node scripts/import-keywords-csv.mjs <export.csv> --source gsc` 将真实 `clicks`、`impressions`、`ctr`、`position` 写入 `content/keyword-map.json` 的 `observedMetrics` 字段（缺项保留 `null`，绝不补猜）。
2. 筛查 `status: 'candidate'` 的新发现长尾词，判断其意图是否已被现有 `canonicalOwner` 覆盖：
   - 若已被覆盖：合并进对应条目的 `variants` 与 FAQ，强化内链；
   - 若属于独立高需求实操问题且现有 L2 篇幅无法承载：提升为 `audit/backlog.md` 的 L3 新文需求。
3. 核查同一查询在 GSC 中是否出现多页面交替获得展示（URL 摇摆），若存在则合并段落、统一规范链接锚文本并调整 Title/H1 区分度。
