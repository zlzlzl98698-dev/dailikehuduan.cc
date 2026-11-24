---
title: "macOS 代理客户端中心：M系列芯片与 Intel 版本安装区分"
description: macOS 苹果电脑代理客户端选型指南：对比 Clash Verge Rev、v2rayN、FlClash、Hiddify、Stash 与 Surge Mac，详解 arm64 与 x64 架构区分、Gatekeeper 隔离解除与系统代理/TUN 授权。
lastUpdated: 2026-11-23
schemaType: TechArticle
faq:
  - q: 怎么知道自己的 Mac 应该下载 arm64（aarch64）还是 x64（x86_64）安装包？
    a: 点击屏幕左上角苹果图标 →“关于本机”：若“芯片”显示 Apple M1/M2/M3/M4 系列，属于 Apple Silicon 架构，应下载 arm64 / aarch64 版本；若显示“处理器”为 Intel Core，则下载 x64 / x86_64 版本。在终端运行 `uname -m` 也能直接确认（arm64 或 x86_64）。
  - q: Mac 打开刚下载的客户端提示“应用已损坏，无法打开”怎么办？
    a: 这通常是 macOS Gatekeeper 对未经过 Apple 公证（Notarized）的开源软件添加的隔离属性（com.apple.quarantine），并非文件真的损坏。确认文件来自 GitHub 官方 Releases 后，在终端执行 `xattr -rd com.apple.quarantine "/Applications/应用名.app"` 即可正常打开。
  - q: 在 M 系列芯片的 Mac 上能不能直接用 iOS 买的 Shadowrocket？
    a: 可以。Apple Silicon（M1 及以上）Mac 支持在 Mac App Store 的“iPhone 与 iPad App”标签页下直接安装已购的 Shadowrocket，但它受限于 iOS 兼容沙盒，系统级 TUN 接管命令行与 Docker 流量的能力不如原生的 Clash Verge Rev 或 Surge Mac。
---

# macOS 客户端中心：Apple Silicon 与 Intel 安装包区分

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>macOS 用户挑选开源客户端时，第一要务是核对芯片架构：<strong>M1/M2/M3/M4 系列 Apple Silicon 电脑务必下载 <code>aarch64.dmg</code> / <code>arm64.dmg</code></strong>，老款 Intel Mac 下载 <code>x64.dmg</code> / <code>amd64.dmg</code>（部分软件也提供体积更大的 <code>universal.dmg</code> 通用包）。主力推荐开源免费的 <strong>Clash Verge Rev</strong> 或 <strong>v2rayN</strong>；苹果生态重度用户可选商业软件 <strong>Stash</strong> 或 <strong>Surge Mac</strong>。</p>
</div>

## macOS 主流客户端选型对照

| 客户端 | 架构支持 | 授权方式 | 核心特性与定位 | 详情教程 |
| --- | --- | --- | --- | --- |
| **Clash Verge Rev** | `aarch64` / `x64` | 免费开源 | 现役桌面 Mihomo 主力，支持菜单栏托盘、系统代理与增强 TUN | [查看教程](/clients/clash-verge-rev/) |
| **v2rayN** | `arm64` / `x64` | 免费开源 | 跨平台版本已原生支持 macOS，兼容 Xray/sing-box/Mihomo 多核 | [查看教程](/clients/v2rayn/) |
| **FlClash** | `arm64` / `x64` | 免费开源 | Flutter 原生构建，跨桌面与手机端操作一致 | [查看教程](/clients/flclash/) |
| **Hiddify / Karing** | Universal / 分架构 | 免费开源 | 基于 sing-box，适合需要多格式订阅自动转换的用户 | [Hiddify](/clients/hiddify/) / [Karing](/clients/karing/) |
| **sing-box (SFM)** | App Store | 免费开源 | 官方原生 macOS 客户端，轻量省电，需 sing-box JSON 订阅 | [查看教程](/clients/sing-box/) |
| **Stash / Surge Mac** | Universal | 付费商业 | 深度契合 macOS 网络扩展、增强模式与 iCloud 多端同步 | [Stash](/clients/stash/) / [Surge](/clients/surge/) |

## 10 秒确认 Mac 芯片架构（避免装错运行慢）

M 系列 Mac 虽然可以通过 Rosetta 2 转译运行 Intel (`x64`) 软件，但不仅功耗更高，还可能造成核心二进制性能折损甚至与 TUN 权限不兼容。打开“终端（Terminal）”执行：

```bash
uname -m
```

- 返回 **`arm64`**：你的设备是 Apple Silicon（M1/M2/M3/M4 等），下载文件名含 **`aarch64`** 或 **`arm64`** 的 `.dmg` 包。
- 返回 **`x86_64`**：你的设备是 Intel 芯片 Mac，下载文件名含 **`x64`**、**`amd64`** 或 **`x86_64`** 的 `.dmg` 包。
- 若项目 Releases 提供 **`universal.dmg`**，则同时包含两套二进制代码，通用于上述所有 Mac。

## 解除 macOS Gatekeeper 隔离提示（“已损坏”修复）

绝大多数开源项目没有购买每年昂贵的苹果开发者公证签名，从浏览器下载并拖入 `/Applications` 后，首次打开往往会弹出“无法验证开发者”或“已损坏，建议移到废纸篓”。

在**已核验安装包来自 GitHub 官方 Releases**的前提下，执行以下标准终端命令清除下载隔离标记（以 Clash Verge 为例，其他软件替换对应 `.app` 名称）：

```bash
# 查看隔离属性（可选）
xattr -l "/Applications/Clash Verge.app"

# 清除隔离标记（需确保应用已拖入 /Applications 目录）
xattr -rd com.apple.quarantine "/Applications/Clash Verge.app"
```

若使用 `brew install --cask` 安装第三方维护的开源包，可加入 `--no-quarantine` 参数免除手动清除步骤。更多启动异常处理见[客户端无法启动处理](/troubleshooting/startup/)。

## macOS 下系统代理 vs TUN 增强模式

1. **系统代理（System Proxy）**：客户端自动修改 macOS **系统设置 → 网络 → 当前 Wi-Fi/以太网 → 代理** 中的 HTTP/HTTPS 与 SOCKS 开关。浏览器与主流桌面应用生效，但终端 `brew`、`git`、`curl` 默认不走系统 HTTP 代理（除非手动 `export https_proxy=...`）。
2. **TUN 增强模式**：通过系统网络扩展或 `utun` 虚拟接口接管几乎所有应用和终端流量。首次在 Clash Verge Rev 中开启 TUN 时会弹窗请求管理员密码授权，完成后即可在终端直接 `curl -I https://www.google.com` 验证出口连通性。
3. **退出前务必关闭代理**：若直接强制杀掉进程，macOS 网络设置中的系统代理开关可能残留未清除，导致断网；排查方法可参照[连不上或频繁断线排查](/troubleshooting/disconnected/)。

## 常见问题（FAQ）

### 怎么知道自己的 Mac 应该下载 arm64（aarch64）还是 x64（x86_64）安装包？

点击屏幕左上角苹果图标 →“关于本机”：若“芯片”显示 Apple M1/M2/M3/M4 系列，属于 Apple Silicon 架构，应下载 `arm64` / `aarch64` 版本；若显示“处理器”为 Intel Core，则下载 `x64` / `x86_64` 版本。在终端运行 `uname -m` 也能直接确认（`arm64` 或 `x86_64`）。

### Mac 打开刚下载的客户端提示“应用已损坏，无法打开”怎么办？

这通常是 macOS Gatekeeper 对未经过 Apple 公证（Notarized）的开源软件添加的隔离属性（`com.apple.quarantine`），并非文件真的损坏。确认文件来自 GitHub 官方 Releases 后，在终端执行 `xattr -rd com.apple.quarantine "/Applications/应用名.app"` 即可正常打开。

### 在 M 系列芯片的 Mac 上能不能直接用 iOS 买的 Shadowrocket？

可以。Apple Silicon（M1 及以上）Mac 支持在 Mac App Store 的“iPhone 与 iPad App”标签页下直接安装已购的 Shadowrocket，但它受限于 iOS 兼容沙盒，系统级 TUN 接管命令行与 Docker 流量的能力不如原生的 Clash Verge Rev 或 Surge Mac。
