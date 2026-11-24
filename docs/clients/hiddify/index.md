---
title: Hiddify 下载安装与全平台多协议订阅导入教程
description: Hiddify（原 Hiddify Next）官方 hiddify/hiddify-app 全平台下载指引、基于 sing-box 的多格式订阅自动识别、分流地区设置及 Clash 规则兼容性提醒。
lastUpdated: 2026-11-23
schemaType: SoftwareApplication
appName: Hiddify
operatingSystem: Windows, Android, iOS, macOS, Linux
isFree: true
faq:
  - q: Hiddify 支持哪些格式的机场订阅链接？
    a: Hiddify 底层依托 sing-box 内核，但在导入层内置了智能解析器，可以直接识别 sing-box JSON、标准 Base64 通用订阅以及多数基础 Clash YAML 订阅。不过若订阅内包含高度定制的 Clash JavaScript 脚本或复杂专有规则字段，仍可能触发部分转换兼容限制。
  - q: Hiddify 的“自动选择（Auto）”和手选节点有什么区别？
    a: 开启 Auto 后，Hiddify 会周期性对订阅中的可用节点执行 URL 测速并自动切换到延迟最低的节点。但如果部分低延迟香港节点无法解锁 ChatGPT 或 Claude，建议手动固定切换到日本、新加坡或美国节点。
  - q: iOS 上如何下载免费的 Hiddify？
    a: Hiddify 在非大陆区 App Store 免费上架（搜索 Hiddify）。因为中国大陆区商店已下架相关代理类工具，仍需使用美区、港区或日区 Apple ID 登录 App Store 下载，但软件本身完全免费开源、无强制内购。
---

# Hiddify 下载安装与全平台多协议订阅导入教程

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>Hiddify（官方仓库 <code>hiddify/hiddify-app</code>，曾用名 Hiddify Next）是一款基于 <strong>sing-box</strong> 内核打造的全平台开源免费客户端，覆盖 Windows、Android、iOS、macOS 与 Linux。它的核心优势是“零门槛统一界面”与“多订阅格式自动识别”，同时支持 sing-box JSON、Base64 与常见 Clash YAML 导入，非常适合希望手机和电脑采用同一款免费工具的新手与跨平台用户。</p>
</div>

## 基础信息与官方来源

| 项目属性 | 核验结果（核实日期：2026-11-23） |
| --- | --- |
| **官方项目地址** | [GitHub: hiddify/hiddify-app](https://github.com/hiddify/hiddify-app) |
| **底层代理内核** | sing-box |
| **支持操作系统** | Windows、Android、iOS（非大陆区 App Store）、macOS、Linux |
| **授权与费用** | 免费开源（GPL-3.0） |
| **支持订阅格式** | sing-box JSON、Clash YAML（基础转换兼容）、Base64 通用订阅 |
| **维护状态** | 活跃维护 |

## 全平台下载与安装要点

1. **GitHub 官方下载（桌面与安卓）**：前往 `hiddify/hiddify-app` Releases 页面，根据系统选择：
   - Windows：`Hiddify-Windows-Setup-x64.exe` 或便携免安装压缩包。
   - Android：`Hiddify-Android-arm64.apk`（主流手机）或 `universal.apk`。
   - macOS：`Hiddify-MacOS.dmg`（或按官方对应架构包）。
   - Linux：`.deb`、`.rpm` 或 `.AppImage`。
2. **iOS / iPadOS 下载**：使用非大陆区 Apple ID 在 App Store 搜索 `Hiddify` 免费获取（切勿轻信大陆区同名收费山寨应用）。

## 快速上手：三步完成订阅导入与连接

1. **添加配置（New Profile）**：
   - 复制机场或自建面板的订阅链接（无论 Base64、sing-box 还是常规 Clash 链接均可尝试）。
   - 打开 Hiddify 主页，点击右上角或中间的 **`+`（添加配置文件）** → **从剪贴板添加**（或手动输入 URL）。
2. **设置分流地区（Region）**：
   - 第一次使用时，务必进入 **设置（Settings） → 配置选项（Config Options） → 地区（Region）**，将其调整为 **中国（China / CN）**。
   - **关键作用**：只有选择“中国”，Hiddify 才会自动激活内置的 `geosite-cn` 与 `geoip-cn` 直连分流规则，确保国内网页、微信与本地视频不走代理流量。
3. **点击连接并切换节点**：
   - 返回主屏幕点击中央的 **点击连接** 圆形按钮（Windows 若选“VPN/TUN 模式”需以管理员身份启动软件，日常浏览器场景选“系统代理”即可）。
   - 连接后切换至左侧/底部的 **代理（Proxies）** 标签页，可手动测速并指定特定国家或地区的落地节点。

## 兼容边界与注意事项

- **Clash 复杂规则转换局限**：Hiddify 虽能读取 Clash YAML 中的节点列表（`proxies`），但如果你依赖机场下发的极细粒度自定义 Clash `proxy-groups` 与 `rules` 覆写脚本，部分复杂字段在转换为 sing-box 规则时可能会被简化或忽略。需要 100% 原生保留 Clash 规则生态的用户，建议直接使用 [Clash Verge Rev](/clients/clash-verge-rev/) 或 [FlClash](/clients/flclash/)；追求规则转换完整度更高的 sing-box 客户端也可对比 [Karing](/clients/karing/)。
- **桌面端端口与 VPN 模式选择**：在 **设置 → 配置选项 → 服务模式（Service Mode）** 中，日常仅上网推荐使用 **System Proxy（系统代理）**；需要接管命令行终端或不支持代理设置的桌面软件时，再切换为 **VPN（TUN）** 并以管理员权限运行。

## 常见问题（FAQ）

### Hiddify 支持哪些格式的机场订阅链接？

Hiddify 底层依托 sing-box 内核，但在导入层内置了智能解析器，可以直接识别 sing-box JSON、标准 Base64 通用订阅以及多数基础 Clash YAML 订阅。不过若订阅内包含高度定制的 Clash JavaScript 脚本或复杂专有规则字段，仍可能触发部分转换兼容限制。

### Hiddify 的“自动选择（Auto）”和手选节点有什么区别？

开启 Auto 后，Hiddify 会周期性对订阅中的可用节点执行 URL 测速并自动切换到延迟最低的节点。但如果部分低延迟香港节点无法解锁 ChatGPT 或 Claude，建议手动固定切换到日本、新加坡或美国节点。

### iOS 上如何下载免费的 Hiddify？

Hiddify 在非大陆区 App Store 免费上架（搜索 Hiddify）。因为中国大陆区商店已下架相关代理类工具，仍需使用美区、港区或日区 Apple ID 登录 App Store 下载，但软件本身完全免费开源、无强制内购。
