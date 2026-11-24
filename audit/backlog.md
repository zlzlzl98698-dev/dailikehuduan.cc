# 内容扩展与 L3 长尾文章 Backlog（Content Backlog）

- **维护日期**：2026-11-23
- **关联数据文件**：`docs/.vitepress/data/keywords.ts`、`content/keyword-map.json`、`audit/keyword-cannibalization.md`
- **口径说明**：在未接入实时 GSC/Bing 流量数据的当前阶段，以下选题均属于 **结构规划推断**，按技术刚需与反蚕食原则排序，**严禁在缺乏实操验证或数据支撑时批量生成低质占位文章**。

## 1. 已上线基础盘（当前不重复建设）

- 站点架构已覆盖 **10 个一级专题页 + 60 个二级子专题页 + 31 个去重机场品牌详情页**，以及客户端单品教程（18 个客户端 + 6 个操作系统平台中心）与 4 篇核心 L3 实战长文（`clash-verge-rev-setup`、`system-time-tls-fix`、`subscription-formats-explained`、`tun-wsl-docker-conflict`）。
- 本 Backlog 仅记录 **后续 L3 专题深度文章** 与 **品牌数据补核待办**。

## 2. L3 深度实操文章 Backlog（仅记录规划，暂不建空页）

| 优先级 | 计划路由 (`targetUrl`) | 核心目标词 (`seedKeyword`) | 规范边界（不与现有页面冲突） | 发布前置核验要求 | 状态 |
|---|---|---|---|---|---|
| P2 | `/guides/clash-verge-rev-dns-template/` | Clash Verge Rev DNS 泄露修复 | 承接可复制的 `dns` YAML 覆写片段与 DoH/IPv6 校验；不抢占 `/troubleshooting/dns/` 的故障总览意图 | 实机验证 Mihomo 最新配置字段（`respect-rules`、`nameserver-policy`）无废弃语法 | `backlog`（结构规划推断） |
| P2 | `/guides/openwrt-2410-nikki-migration/` | OpenWrt 24.10 Nikki 替换 OpenClash | 专讲 OpenWrt 24.10+ firewall4/nftables 迁移步骤；不重复 `/clients/nikki/` 的软件简介 | 在真实 OpenWrt 24.10+ 环境或官方 README 中核对最新 opkg/apk 包名与服务命令 | `backlog`（结构规划推断） |
| P2 | `/troubleshooting/macos-clash-verge-tun-permission/` | macOS Clash Verge Rev TUN 权限 | 专讲 Apple Silicon macOS 下 Service Mode 辅助工具授权失败与重装流程；不与 `/troubleshooting/startup/` 重叠 | 核对最新 Clash Verge Rev macOS release 的 Service Mode 脚本与系统设置路径 | `backlog`（结构规划推断） |
| P3 | `/guides/sing-box-ruleset-srs-guide/` | sing-box `.srs` 二进制规则集写法 | 补充 `/clients/sing-box/` 未展开的 rule-set 迁移语法，面向规则作者 | 核对 sing-box 1.10+ 官方文档废弃字段（如旧 geoip/geosite 迁移） | `backlog`（结构规划推断） |
| P3 | `/ai-streaming/claude-multi-device-ip-hygiene/` | Claude 多设备防风控切换指南 | 补充 `/ai-streaming/claude/` 的多终端路由锁定细节 | 基于可验证策略组配置撰写，不虚构封号概率百分比 | `backlog`（结构规划推断） |

## 3. 31 家品牌数据待补核 Backlog（按数据缺口优先级）

> 以下条目属于既有 `/brands/<slug>/` 页面的内容增强待办，**不得为此额外新建重复品牌页面**。

1. **链接异常与双参数复核（优先级：高）**：
   - `yunjiexian`（云界线）：核实无 `#/` 入口可达性与 `HBaZ91c6` / `aycnwNUi` 哪个为现行推广码。
   - `liulianyun`（榴莲云）：核实 `com#/` 入口及底层真实协议类型（当前 `unknown`）。
   - `huanqiuti`（环球梯）：核实无 `#/` 入口可达性。
   - `lingdong`（灵动云）、`langwang`（浪网）、`edgenova`（边缘节点）：核实 `2026-08-09` 历史入口当前有效性、浪网 `截150G` 遮挡值、EdgeNova 极界年付算价异常。
2. **数据串行与冲突复核（优先级：高）**：
   - `guangsuyun`（光速云）：核实 59GB vs 69GB、3/4/7 档套餐与 2026-08-19 归档截图（SS vs Vless/AnyTLS）的当前一致性。
   - `yuzhou`（宇宙云）与 `weitu`（唯兔云）：核实宇宙云 ¥96/年对应的真实月流量（GB）与客户端模式，消除汇总表串行影响。
3. **缺少实测样本的品牌补测（优先级：中）**：
   - 为目前 `testRuns` 为空的品牌（如 `yinxingren`、`tiziyun`、`kexin`、`sujie`、`jilian`、`guangnian`、`yuzhou`、`shandianshu`、`shenxing`、`yunjiexian`、`liulianyun`、`huanqiuti`、`langwang`、`edgenova`）在统一测试环境（记录运营商、测试时段 20:00–23:30 晚高峰、单线程工具、测试客户端版本）下补齐可验证 `measured` 数据；在取得真实环境测试结果前，页面继续严格保持 `Not Tested / 待核实`。

## 4. 运营与数据导入待办

- 站点上线并完成索引后，定期导出 GSC 与 Bing 查询 CSV，运行：
  ```bash
  node scripts/import-keywords-csv.mjs ./exports/gsc-queries.csv --source gsc
  ```
- 根据真实展示与点击反馈，从 `content/keyword-map.json` 的 `candidate` 状态词中筛选长尾意图并更新本 Backlog。
