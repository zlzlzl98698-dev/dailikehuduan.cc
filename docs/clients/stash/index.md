---
title: Stash（iOS / macOS）教程：兼容 Clash YAML 的苹果生态客户端
description: Stash 商业客户端简介（官网 stash.ws）、iOS/macOS 原生兼容 Clash YAML 策略组与覆写（Override）能力解析、付费机制说明及与 Shadowrocket/Karing 的选型对比。
lastUpdated: 2026-11-23
schemaType: SoftwareApplication
appName: Stash
operatingSystem: iOS, iPadOS, macOS
isFree: false
faq:
  - q: Stash 和 Shadowrocket（小火箭）相比最大的优势是什么？
    a: Stash 主打原生完整兼容 Clash YAML 配置体系（包括复杂的 proxy-groups 策略组、rule-providers 与 Stash 覆写），并支持 iCloud 跨 iPhone/iPad/Mac 同步配置。如果你在 Windows/Mac 桌面端习惯用 Clash Verge Rev，换到 iOS 用 Stash 几乎不需要学习两套规则语法。
  - q: Stash 是免费软件吗？在大陆区商店能买吗？
    a: Stash 属于商业付费应用（非免费开源），且未在中国大陆区 App Store 上架。具体是买断制还是含订阅/内购方案，以及各区实时价格，均以购买时非大陆区 App Store 官方商店页面展示为准。
  - q: 不想花钱买 Stash，iOS 上有没有免费兼容 Clash YAML 的替代品？
    a: 有的。免费开源的 Karing 与 Hiddify 均支持在非大陆区 App Store 下载并兼容解析常见 Clash YAML 订阅，可作为预算有限用户的平替参考。
---

# Stash（iOS / macOS）教程：兼容 Clash YAML 的苹果生态客户端

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>Stash 是专为苹果生态（iOS / iPadOS / macOS）打造的商业付费规则代理客户端，核心卖点是<strong>原生直接兼容桌面端标准的 Clash YAML 配置文件与策略组语法</strong>，并提供强大的覆写（Override）、HTTP 改写与 iCloud 多端配置同步。它非常适合桌面端使用 Clash Verge Rev、希望在 iPhone 上无缝沿用同一套机场 Clash 订阅与分流逻辑的用户。</p>
</div>

## 基础信息与来源核验说明

| 项目属性 | 核验结果（核实日期：2026-11-23） |
| --- | --- |
| **官方网站** | [Stash 官网（stash.ws）](https://stash.ws/) *(注：具体 App Store 区域链接及实时商店状态请在购买前于对应外区商店核实)* |
| **底层代理核心** | 私有/独立核心（兼容 Clash/Mihomo 规则生态） |
| **支持操作系统** | iOS、iPadOS、macOS |
| **授权与费用** | **付费应用**（闭源商业软件，当前具体买断/订阅定价以各地区 App Store 实时展示为准） |
| **支持订阅格式** | Clash YAML、Stash 覆写（Stoverride） |
| **维护状态** | 活跃维护 |

## 适用定位：什么时候该选 Stash？

在[iOS 客户端中心](/clients/platform/ios/)中，苹果用户通常面临“小火箭、Stash、圈 X、Surge”四选一。Stash 的精准定位如下：

1. **桌面与移动端规则统一**：如果你的机场服务商主要提供精心编排的 Clash YAML（带有自动测速 `url-test`、故障转移 `fallback`、AI 专用分组与流媒体分组），导入到 [Shadowrocket](/clients/shadowrocket/) 往往只会提取节点而丢失部分 Clash 策略逻辑；而 Stash 能几乎原封不动地保留策略组结构。
2. **原生 Apple 体验与 iCloud 同步**：支持 iPhone、iPad、Mac 之间的配置与覆写文件同步，界面遵循苹果原生设计规范，支持小组件与锁屏状态查看。
3. **脚本与覆写生态（Stoverride）**：支持在不修改机场原始订阅内容的前提下，通过远程或本地覆写文件追加去广告规则、DNS 调优或 HTTP 改写脚本。

## 快速上手：导入 Clash 订阅与覆写

1. **获取正版应用**：使用非大陆区（如美区、港区、日区）Apple ID 在 App Store 搜索 `Stash`，核对开发者信息后购买安装。切勿使用任何来源不明的共享账号，以免造成 iCloud 锁机风险。
2. **导入配置文件（Profiles）**：
   - 打开 Stash，在 **设置 / 配置文件** 中点击 **从 URL 下载**，粘贴机场提供的 **Clash 订阅链接**。
   - 若机场下发的是通用 Base64 链接而非 Clash YAML，需使用机场面板提供的 Clash 转换地址。
3. **配置覆写（Overrides）与按需连接**：
   - 在 **覆写（Override）** 模块中，可加载社区或自己编写的 `.stoverride` 文件，用于补充 `fake-ip-filter` 绕过列表或单独修正某些 AI 服务的域名走特定节点组。
   - **按需连接**：利用 Stash 的规则触发能力，当手机接入已部署 [OpenClash](/clients/openclash/) 或 [Nikki](/clients/nikki/) 软路由的家庭 Wi-Fi 时自动暂停本地 VPN，出门切换到蜂窝网络时自动拉起。

## 常见注意事项与防坑

- **控制规则行数，防范 iOS 内存超限（OOM）**：iOS 的 `NEPacketTunnelProvider` 网络扩展进程有严格的几十 MB 内存限制。在导入 Clash 配置时，避免加载动辄数十万条正则的庞大外部规则集，优先使用精简 `rule-providers` 或现代轻量规则以防止切换网络时掉线。
- **注意区分商店区域定价**：Stash 在不同国家/地区 App Store 的收费方式或内购包可能随版本更新调整，购买前请仔细阅读商店页面说明；如果你更看重免费开源，可以先体验 [Karing](/clients/karing/)。

## 常见问题（FAQ）

### Stash 和 Shadowrocket（小火箭）相比最大的优势是什么？

Stash 主打原生完整兼容 Clash YAML 配置体系（包括复杂的 `proxy-groups` 策略组、`rule-providers` 与 Stash 覆写），并支持 iCloud 跨 iPhone/iPad/Mac 同步配置。如果你在 Windows/Mac 桌面端习惯用 Clash Verge Rev，换到 iOS 用 Stash 几乎不需要学习两套规则语法。

### Stash 是免费软件吗？在大陆区商店能买吗？

Stash 属于商业付费应用（非免费开源），且未在中国大陆区 App Store 上架。具体是买断制还是含订阅/内购方案，以及各区实时价格，均以购买时非大陆区 App Store 官方商店页面展示为准。

### 不想花钱买 Stash，iOS 上有没有免费兼容 Clash YAML 的替代品？

有的。免费开源的 Karing 与 Hiddify 均支持在非大陆区 App Store 下载并兼容解析常见 Clash YAML 订阅，可作为预算有限用户的平替参考。
