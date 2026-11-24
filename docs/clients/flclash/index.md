---
title: FlClash 下载与配置教程：基于 Flutter 的全平台 Mihomo 客户端
description: FlClash 官方 chen08209/FlClash 下载校验、Windows/Android/macOS/Linux 多端安装、Clash YAML 订阅导入、WebDAV 配置同步及芯片架构区分指南。
lastUpdated: 2026-11-23
schemaType: SoftwareApplication
appName: FlClash
operatingSystem: Windows, Android, macOS, Linux
isFree: true
faq:
  - q: FlClash 和 Clash Verge Rev 都用 Mihomo 内核，新手该怎么选？
    a: 两者底层核心一致。FlClash 基于 Flutter 构建，不依赖 Windows WebView2 组件，界面极其简洁且支持 Android 与桌面端完全统一的操作体验，适合追求轻便、跨电脑手机多端同步（WebDAV）的用户；如果你习惯深入编写 JavaScript/YAML 复杂全局覆写脚本，则 Clash Verge Rev 更强。
  - q: FlClash 的 WebDAV 同步会同步机场流量余额吗？
    a: WebDAV 同步的是客户端配置档案、规则覆写与软件设置，便于你在手机和电脑之间一键迁移订阅列表；实际节点实时状态与流量信息仍需在新设备上触发一次订阅刷新。
  - q: macOS 下载 FlClash 时为什么打不开或提示架构不兼容？
    a: 请务必核对 GitHub Releases 中的文件后缀：M1/M2/M3/M4 芯片 Mac 选择 arm64（aarch64）.dmg，Intel 芯片 Mac 选择 x64（amd64）.dmg。如提示“无法验证开发者”，在确认来源为官方仓库后执行 `xattr -rd com.apple.quarantine` 解除隔离即可。
---

# FlClash 下载与配置教程：轻量全平台 Mihomo 客户端

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>FlClash（官方仓库 <code>chen08209/FlClash</code>）是一款基于 Flutter 框架与 <strong>Mihomo（Clash.Meta）</strong> 内核开发的全平台代理客户端，同时覆盖 Windows、Android、macOS 与 Linux。它无需依赖 Windows WebView2，界面轻量直观，支持标准 Clash/Mihomo YAML 订阅、TUN 接管与 WebDAV 多端同步，非常适合同时使用安卓手机与桌面电脑的 Clash 生态用户。</p>
</div>

## 基础信息与官方来源

| 项目属性 | 核验结果（核实日期：2026-11-23） |
| --- | --- |
| **官方项目地址** | [GitHub: chen08209/FlClash](https://github.com/chen08209/FlClash) |
| **底层代理内核** | Mihomo（Clash.Meta） |
| **支持操作系统** | Windows（x64 / ARM64）、Android（arm64-v8a / armeabi-v7a）、macOS（Apple Silicon / Intel）、Linux（DEB / RPM / AppImage） |
| **授权与费用** | 免费开源（GPL-3.0） |
| **支持订阅格式** | Clash YAML、Mihomo YAML |
| **维护状态** | 活跃维护 |

## 全平台安装包选择与安全校验

从 `chen08209/FlClash` 的 GitHub Releases 页面下载时，务必核对本机平台与芯片架构：

- **Windows**：常规电脑下载 `windows-amd64-setup.exe`（安装包）或便携解压包；高通骁龙笔记本选 `windows-arm64`。因为采用 Flutter 渲染，即使精简版 Windows 10 缺失 WebView2 也能直接启动。
- **Android**：近几年主流安卓手机选择 `android-arm64-v8a.apk`；老旧 32 位设备选 `armeabi-v7a`。
- **macOS**：Apple Silicon（M 系列）下载 `macos-arm64.dmg`；Intel Mac 下载 `macos-x64.dmg`（切勿混淆架构，详见[macOS 架构区分说明](/clients/platform/macos/)）。
- **Linux**：Debian/Ubuntu 系选择 `.deb`，RedHat/Fedora 系选择 `.rpm`，跨发行版可选 `.AppImage`。

安装前建议在本地核对文件 SHA256 值（以 Linux/macOS 为例）：

```bash
sha256sum FlClash-*.dmg
```

## 订阅导入、模式切换与常用功能

1. **导入订阅**：打开 FlClash，进入左侧/底部的 **配置（Profiles）** 页面，点击右下角 **`+` 号 → URL 导入**，粘贴服务商提供的 Clash 订阅链接。
2. **开启代理**：
   - 在 **仪表盘（Dashboard）** 点击右下角绿色启动按钮。
   - **桌面端**：可在仪表盘直接切换“系统代理”开关与“虚拟网卡（TUN）”开关（开启 TUN 时如提示需要提权，按弹窗授予管理员权限或安装服务即可）。
   - **Android 端**：首次启动需允许系统的 `VpnService` 网络权限，并建议在“访问控制”中勾选排除国内银行或高频内网应用。
3. **分流规则模式**：
   - **规则（Rule）**：日常首选，按订阅内置规则自动分流国内直连与海外节点。
   - **全局（Global）**：所有流量统一走选定策略组，仅适合临时测试单节点连通性。
4. **WebDAV 跨设备同步**：如果你在电脑和安卓手机上都装了 FlClash，可在 **设置 → 备份与恢复** 中填入第三方支持的 WebDAV 网盘地址，上传后即可在另一台设备一键拉回订阅列表与自定义分组。

## 注意事项与常见坑

- **macOS 架构与隔离属性**：在 macOS 上下载 `.dmg` 时注意核对 `arm64` 与 `x64`；拖入 `/Applications` 后若无法打开，执行 `xattr -rd com.apple.quarantine "/Applications/FlClash.app"`。
- **国产安卓杀后台**：Android 端锁屏断网通常是系统省电限制所致，请将 FlClash 设为“后台无限制”并锁定最近任务卡片。
- **仅识别 Clash/Mihomo 格式**：若你的服务商只下发 Base64 通用节点链接而无 Clash 转换地址，请参考[2026 订阅格式识别与转换原则](/guides/subscription-formats-explained/)或改用 [v2rayNG](/clients/v2rayng/) / [Hiddify](/clients/hiddify/)。

## 常见问题（FAQ）

### FlClash 和 Clash Verge Rev 都用 Mihomo 内核，新手该怎么选？

两者底层核心一致。FlClash 基于 Flutter 构建，不依赖 Windows WebView2 组件，界面极其简洁且支持 Android 与桌面端完全统一的操作体验，适合追求轻便、跨电脑手机多端同步（WebDAV）的用户；如果你习惯深入编写 JavaScript/YAML 复杂全局覆写脚本，则 Clash Verge Rev 更强。

### FlClash 的 WebDAV 同步会同步机场流量余额吗？

WebDAV 同步的是客户端配置档案、规则覆写与软件设置，便于你在手机和电脑之间一键迁移订阅列表；实际节点实时状态与流量信息仍需在新设备上触发一次订阅刷新。

### macOS 下载 FlClash 时为什么打不开或提示架构不兼容？

请务必核对 GitHub Releases 中的文件后缀：M1/M2/M3/M4 芯片 Mac 选择 `arm64`（`aarch64`）`.dmg`，Intel 芯片 Mac 选择 `x64`（`amd64`）`.dmg`。如提示“无法验证开发者”，在确认来源为官方仓库后执行 `xattr -rd com.apple.quarantine` 解除隔离即可。
