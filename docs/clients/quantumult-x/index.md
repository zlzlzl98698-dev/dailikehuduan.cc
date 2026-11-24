---
title: Quantumult X（圈 X）iOS 下载、节点资源与重写脚本使用指南
description: Quantumult X（圈 X）App Store 官方页面信息、QX 专用配置与资源解析器（Parser）机制、Rewrite/MitM 优势以及不支持原生 Clash YAML 和新协议核查注意事项。
lastUpdated: 2026-11-23
schemaType: SoftwareApplication
appName: Quantumult X
operatingSystem: iOS, iPadOS
isFree: false
faq:
  - q: Quantumult X（圈 X）可以直接导入机场给的 Clash 订阅链接吗？
    a: 不直接原生支持。Quantumult X 使用自己独立的 INI 风格配置格式（[server_remote]、[filter_remote]、[rewrite_remote]）。导入第三方机场节点通常需要机场面板直接提供“Quantumult X 订阅”，或在节点资源（server_remote）处借助资源解析器（Resource Parser）转换，无法直接照搬 Clash 复杂策略组。
  - q: Quantumult X 支持 VLESS-Reality 或 Hysteria 2 协议吗？
    a: 由于 Quantumult X 采用私有独立核心，其对 VLESS 等新协议的支持进度与节点参数兼容性需严格核对当前版本的官方更新日志与机场订阅说明。如果你的主力机场全线采用 VLESS-Reality 或 Hysteria 2，务必确认 QX 当前版本是否支持或优先考虑 Shadowrocket / Karing / Stash。
  - q: 圈 X 适合完全不懂代码的新手吗？
    a: 上手门槛高于 Shadowrocket。圈 X 的强项在于 HTTP 重写（Rewrite）、MitM 解密脚本、定时任务（Task）与精细分流策略；如果只是为了稳定浏览网页和看视频，买 Shadowrocket 会省心很多。
---

# Quantumult X（圈 X）iOS 下载、节点资源与重写脚本使用指南

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>Quantumult X（中文社区俗称“圈 X”或 QX）是 iOS / iPadOS 平台极具可玩性的付费代理与网络调试客户端，主打强大的 <strong>HTTP 重写（Rewrite）、MitM 证书解密、定时任务脚本与直观的彩虹分流策略图标</strong>。不过它使用独立的配置语法，<strong>不直接原生兼容 Clash YAML</strong>，且对部分新协议的支持情况需以当前商店版本更新说明为准，更适合愿意研究规则语法的进阶 iOS 用户。</p>
</div>

## 基础信息与官方来源

| 项目属性 | 核验结果（核实日期：2026-11-23） |
| --- | --- |
| **官方商店链接** | [App Store（Quantumult X）](https://apps.apple.com/app/quantumult-x/id1443988620) |
| **底层代理核心** | 私有/独立核心 |
| **支持操作系统** | iOS、iPadOS |
| **授权与费用** | 外区 App Store 买断制付费应用（以实时商店标价为准） |
| **支持订阅格式** | Quantumult X 专用配置、节点资源（配合资源解析器） |
| **维护状态** | 活跃维护 |

## 定位差异：为什么进阶玩家偏爱圈 X？

在[iOS 客户端中心](/clients/platform/ios/)的四款常见付费/内购工具中，Quantumult X 的不可替代性集中在“网络请求级可编程能力”：
1. **Rewrite（请求/响应改写）与 MitM**：可以针对指定域名在本地拦截并修改 HTTP Header 或响应体，常用于去除特定应用内冗余模块、脚本增强或网页调试。
2. **Task 定时脚本**：支持按 Cron 表达式在后台或手动运行 JavaScript 脚本，常见于机场流量剩余查询弹窗、节点状态卡片或自动化签到调试。
3. **直观的分流策略组视图**：通过颜色与自定义图标区分“流媒体”、“AI 服务”、“自动测速”和“国内直连”，排查哪条分流命中了哪条规则非常直观。

## 快速上手：配置结构与节点资源导入

Quantumult X 的配置体系核心由三段远程资源构成（区别于 Clash 的单文件全包）：
1. **节点资源（`[server_remote]`）**：进入软件右下角 **风车图标（设置） → 节点 → 引用（资源）**，点击右上角 **`+`** 添加机场面板提供的 **Quantumult X 节点订阅链接**。
   - **资源解析器（Resource Parser）**：若机场面板只下发通用 Base64 链接而非标准 QX 格式，可在配置中关联开源的“资源解析器”URL，由解析器在拉取订阅时实时将通用节点转换为 QX 可识别语法。
2. **分流规则（`[filter_remote]`）**：在 **分流 → 引用** 中加载远程分流列表（决定哪些域名走代理、哪些直连、哪些拦截）。
3. **重写与脚本（`[rewrite_remote]`）**：按需启用，初学者不建议一次性添加大量来路不明的重写与 MitM 规则，以免引起 HTTPS 证书信任报警或耗电增加。

## 关键注意事项与边界

- **协议兼容性务必先核对**：相较于紧跟上游内核迭代的 [Shadowrocket](/clients/shadowrocket/) 或基于 `sing-box` 的 [Karing](/clients/karing/)，Quantumult X 对部分新兴传输协议（如特定 VLESS-Reality 参数组合、Hysteria 2 等）的支持取决于对应发行版本的更新支持范围。若你的服务商仅提供这类新协议节点，购买前请先核对服务商的 QX 兼容说明或 App Store 版本历史。
- **不直接识别复杂 Clash YAML**：不要直接把 Clash 订阅地址填进 QX 的配置下载栏，必须确认服务商后台有专属 QX 导出按钮，或明确已配置后端订阅转换。
- **仅使用个人非大陆区 Apple ID**：切勿购买来源不明的共享账号并在系统 iCloud 登录，防范锁机风险。

## 常见问题（FAQ）

### Quantumult X（圈 X）可以直接导入机场给的 Clash 订阅链接吗？

不直接原生支持。Quantumult X 使用自己独立的 INI 风格配置格式（`[server_remote]`、`[filter_remote]`、`[rewrite_remote]`）。导入第三方机场节点通常需要机场面板直接提供“Quantumult X 订阅”，或在节点资源（`server_remote`）处借助资源解析器（Resource Parser）转换，无法直接照搬 Clash 复杂策略组。

### Quantumult X 支持 VLESS-Reality 或 Hysteria 2 协议吗？

由于 Quantumult X 采用私有独立核心，其对 VLESS 等新协议的支持进度与节点参数兼容性需严格核对当前版本的官方更新日志与机场订阅说明。如果你的主力机场全线采用 VLESS-Reality 或 Hysteria 2，务必确认 QX 当前版本是否支持或优先考虑 Shadowrocket / Karing / Stash。

### 圈 X 适合完全不懂代码的新手吗？

上手门槛高于 Shadowrocket。圈 X 的强项在于 HTTP 重写（Rewrite）、MitM 解密脚本、定时任务（Task）与精细分流策略；如果只是为了稳定浏览网页和看视频，买 Shadowrocket 会省心很多。
