---
title: NekoBox for Android（及 NekoRay）状态核实与下载安全警示
description: NekoBox for Android（MatsuriDayo/NekoBoxForAndroid）官方项目状态核实、严禁从 Google Play 下载第三方接管版本的特别警告、sing-box 兼容性说明与推荐替代客户端。
lastUpdated: 2026-11-23
schemaType: SoftwareApplication
appName: NekoBox for Android
operatingSystem: Android, Windows, Linux
isFree: true
faq:
  - q: 为什么代理客户端知识库将 NekoBox 标为“维护注意”而不是直接推荐？
    a: 根据原官方项目仓库 MatsuriDayo/NekoBoxForAndroid 的公开状态，该项目维护资源有限、更新节奏相对放缓，更重要的是官方已明确警告 Google Play 商店中上架的 NekoBox 同名版本并非原作者掌控的发布渠道。对于新装机用户，选用活跃维护的 Hiddify、Karing 或官方 SFA 更稳妥。
  - q: 我已经在手机上从 Google Play 安装了 NekoBox，怎么办？
    a: 建议立即在备份好自己的机场订阅链接后卸载该版本，改从官方 GitHub Releases 核验安装，或直接迁移到同样基于 sing-box 内核且活跃维护的 Hiddify / Karing / 官方 sing-box (SFA)。
  - q: 电脑端的 NekoRay 还能继续用吗？
    a: NekoRay 为桌面端早期基于 sing-box/Xray 的开源客户端，同样存在上游仓库维护停滞问题。桌面端新装机更建议选用 Clash Verge Rev、v2rayN 或 Hiddify。
---

# NekoBox for Android（及 NekoRay）状态核实与安全警示

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>NekoBox for Android（及桌面衍生项目 NekoRay）曾是早期推动 sing-box 在中文社区普及的重要开源客户端，但目前处于<strong>维护注意（Caution）</strong>状态：原官方项目维护资源有限，且仓库明确警示 <strong>Google Play 商店上的同名 NekoBox 应用属于第三方控制版本，严禁下载</strong>。如果你是新装机用户，建议直接选用同样基于 sing-box 且保持高频维护的 <strong>Hiddify</strong>、<strong>Karing</strong> 或官方 <strong>sing-box (SFA)</strong>。</p>
</div>

## 基础信息与维护状态核验

| 项目属性 | 核验结果（核实日期：2026-11-23） |
| --- | --- |
| **官方 GitHub 仓库** | [GitHub: MatsuriDayo/NekoBoxForAndroid](https://github.com/MatsuriDayo/NekoBoxForAndroid) |
| **底层代理内核** | sing-box |
| **涉及平台** | Android（NekoBox）；Windows / Linux（早期衍生端 NekoRay） |
| **授权与费用** | 免费开源 |
| **支持订阅格式** | sing-box JSON、Base64 通用订阅、部分 Clash 规则 |
| **维护状态** | **维护注意（Caution）**：维护资源有限，Google Play 存在第三方非官方包 |

## 为什么必须发布渠道安全警示？

> [!WARNING] 严禁通过 Google Play 下载或更新 NekoBox
> 在 `MatsuriDayo/NekoBoxForAndroid` 项目主页与历史公告中，官方已明确指出：**Google Play 上架的同名 NekoBox 已被第三方接管，并非原开发者发布与签名控制的正版应用**。在未知第三方控制下的代理客户端拥有手机 `VpnService` 全部网络流量权限，存在极高的隐私泄露与被植入恶意代码风险。

如果你因为特定配置习惯仍需使用 NekoBox，请务必遵守以下底线：
1. **唯一可信来源**：仅从 `github.com/MatsuriDayo/NekoBoxForAndroid/releases` 获取 APK，并在下载后核对官方发布的校验信息。
2. **切勿在第三方中文站、电报频道转发包或 Google Play 下载**。

## 现有用户的配置兼容与迁移建议

NekoBox 的核心优势在于基于 sing-box 支持极全的协议与细粒度路由参数调节（如自定义出站、链式代理与灵活的路由规则编辑器）。但随着 sing-box 内核自身不断演进（例如 1.11/1.12 之后的字段变更），长期缺乏高频同步更新的封装端在遇到机场下发最新协议参数时容易出现解析失败或报错。

因此，我们建议现有 NekoBox / NekoRay 用户按以下路径平滑迁移：

| 你当前的偏好 | 推荐迁移目标 | 迁移成本与特点 |
| --- | --- | --- |
| **追求原汁原味 sing-box 生态** | [官方 sing-box (SFA)](/clients/sing-box/) | 原生团队长期同步更新，支持现代 `.srs` 规则集与最新传输参数 |
| **需要导入 Clash/Base64 多格式订阅** | [Karing](/clients/karing/) 或 [Hiddify](/clients/hiddify/) | 同样免费开源、基于 sing-box 内核，可直接导入原有 Base64/Clash 链接 |
| **桌面端使用 Base64 / 多核心节点** | [v2rayN](/clients/v2rayn/) | 新版已内置 sing-box 与 Xray 双核切换，持续高频维护 |

## 若仍需临时使用官方 GitHub 版 NekoBox 的基础要点

1. **导入订阅**：在左上角菜单选择 **分组（Groups）** → 右上角创建新分组 → 类型选 **订阅（Subscription）** 并粘贴 Base64 或兼容链接，保存后点击“更新当前分组”。
2. **路由与 DNS**：进入 **设置 → 路由设置**，确保开启 **绕过局域网及中国大陆**，避免国内访问被转发导致延迟升高。
3. **测试连接**：在分组内使用 **URL Test** 替代纯 TCP Ping，验证实际节点可用性。

## 常见问题（FAQ）

### 为什么代理客户端知识库将 NekoBox 标为“维护注意”而不是直接推荐？

根据原官方项目仓库 `MatsuriDayo/NekoBoxForAndroid` 的公开状态，该项目维护资源有限、更新节奏相对放缓，更重要的是官方已明确警告 Google Play 商店中上架的 NekoBox 同名版本并非原作者掌控的发布渠道。对于新装机用户，选用活跃维护的 Hiddify、Karing 或官方 SFA 更稳妥。

### 我已经在手机上从 Google Play 安装了 NekoBox，怎么办？

建议立即在备份好自己的机场订阅链接后卸载该版本，改从官方 GitHub Releases 核验安装，或直接迁移到同样基于 sing-box 内核且活跃维护的 Hiddify / Karing / 官方 sing-box (SFA)。

### 电脑端的 NekoRay 还能继续用吗？

NekoRay 为桌面端早期基于 sing-box/Xray 的开源客户端，同样存在上游仓库维护停滞问题。桌面端新装机更建议选用 Clash Verge Rev、v2rayN 或 Hiddify。
