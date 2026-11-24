---
title: "Clash Meta 客户端生态与 ClashMetaForAndroid（CMFA）安装配置教程"
description: "基于 2026-11-23 核验数据，全面厘清原版 Clash、Clash.Meta 与 Mihomo 内核的演进时间线，详解 Android 端 ClashMetaForAndroid（CMFA）下载安装、订阅导入、分应用代理、后台保活及从停更 CFA/CFW 迁移指南。"
lastUpdated: 2026-11-23
schemaType: SoftwareApplication
appName: Clash Meta for Android
operatingSystem: Android, Windows, macOS, Linux
isFree: true
faq:
  - q: "Clash Meta 和 Mihomo 是同一个东西吗？"
    a: "是的。Clash.Meta 是开源社区在原版 Clash 基础上扩展现代协议栈的分支项目，在 2023 年底原版 Clash 归档事件后，官方团队 MetaCubeX 将 Clash.Meta 内核正式更名为 Mihomo（仓库地址 MetaCubeX/mihomo）。日常语境中的“Clash Meta 客户端”，在安卓端特指官方维护的 ClashMetaForAndroid（CMFA），在桌面端则指搭载 Mihomo 内核的 Clash Verge Rev 或 FlClash。"
  - q: "原来的 Clash for Android（CFA）还能继续用吗？"
    a: "强烈不建议继续使用。原版 Clash for Android（CFA）早在 2023 年 11 月就已彻底删库停止维护，其内置旧内核完全不支持 VLESS-Reality、Hysteria 2、TUIC v5 与 AnyTLS 等主流抗封锁协议，且在新版 Android 14/15/16 系统上存在后台崩溃与安全漏洞风险。请直接备份订阅链接后迁移至 ClashMetaForAndroid 或 FlClash。"
  - q: "下载 ClashMetaForAndroid 时应该选 arm64-v8a、armeabi-v7a 还是 universal 版本？"
    a: "2018 年以后上市的绝大多数 Android 智能手机与平板均采用 64 位 ARM 处理器，应优先下载体积精简、运行效率最高的 arm64-v8a-release.apk；仅极老旧的 32 位安卓设备或早年电视盒子才需要 armeabi-v7a；若实在不确定设备芯片架构，可下载包含全指令集的 universal-release.apk。"
  - q: "为什么在 ClashMetaForAndroid 中导入机场订阅后提示配置无效或无法拉取？"
    a: "最常见的三个原因是：第一，误将服务商提供的 Base64 纯节点链接当成 Clash YAML 订阅导入；第二，导入前未关闭手机上已失效的旧 VPN 连接导致网络请求死循环；第三，部分机场要求特定 User-Agent 请求头才下发 Meta 节点。建议先断开所有 VPN，确认复制的是 Clash/Mihomo 专用订阅链接后重新拉取。"
  - q: "安卓手机锁屏几分钟后 ClashMetaForAndroid 就自动断网怎么解决？"
    a: "这是国产定制安卓系统（如小米 HyperOS/MIUI、OPPO ColorOS、vivo OriginOS、荣耀 MagicOS）的省电杀后台机制所致。需进入手机系统设置的应用管理中，将 CMFA 的省电策略设为“无限制（允许后台高耗电）”，开启“允许自启动”，并在多任务切换界面将 CMFA 卡片向下滑动加锁。"
  - q: "开启 CMFA 后微信发不出图片、网银 App 报错或局域网投屏失效怎么办？"
    a: "这是因为全局 VPN 接口接管了所有应用的流量，导致国内高敏金融应用触发异地 IP 风控或局域网组播包被丢弃。请进入 CMFA 的“设置 → 网络”，开启“绕过私有网络”，再开启“访问控制模式（分应用代理）”，选择“排除已选应用模式”并将微信、支付宝、手机银行及视频投屏 App 勾选排除。"
  - q: "安卓端用 ClashMetaForAndroid 好还是 FlClash 好？"
    a: "两者底层均搭载相同的 Mihomo 内核，协议兼容性完全一致。CMFA 延续了经典 Clash for Android 的原生界面布局，提供极细致的本地覆写（Override）与网络参数微调，适合习惯经典布局的进阶安卓用户；FlClash 采用 Flutter 构建，在安卓与 Windows/macOS 电脑端拥有完全一致的卡片式 UI 且支持 WebDAV 云同步，适合多设备跨平台用户。"
---

# Clash Meta 客户端生态与 ClashMetaForAndroid（CMFA）安装配置教程

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>常说的“<strong>Clash Meta</strong>”现已正式演进为由 MetaCubeX 团队维护的 <strong>Mihomo 开源内核生态</strong>（核验日期：<code>2026-11-23</code>）。在 Android 移动端，其官方正统图形客户端为 <code>MetaCubeX/ClashMetaForAndroid</code>（简称 <strong>CMFA</strong>），完整承接了早已停更的原版 Clash for Android（CFA）规则体系；在 Windows、macOS 与 Linux 桌面端，则由 [Clash Verge Rev](/clients/clash-verge-rev/) 与 [FlClash](/clients/flclash/) 担任主力 GUI 前端。凡是仍在使用旧版 CFA 或 CFW 的用户，务必立即更换至 CMFA 或现代 Mihomo 客户端，以获得对 VLESS-Reality、Hysteria 2、AnyTLS 等新协议的原生支持及安全保障。</p>
</div>

## 一、 从原版 Clash、Clash.Meta 到 Mihomo 的演进时间线与生态定位

为什么在搜索“Clash Meta 下载”时，看到的官方仓库名称却是 `mihomo` 或 `ClashMetaForAndroid`？要彻底理清这一命名脉络，避免掉入搜索引擎中大量假冒“Clash 中文官网”的钓鱼陷阱，我们需要回顾过去三年中文开源代理生态经历的关键演进节点。

1. **第一阶段：初代 Clash 与 CFA / CFW 时代（2018 年 – 2023 年 11 月，已归档终结）**
   早期由 Dreamacro 开发的原版 `clash` 内核开创了基于 YAML 规则分流的代理范式，并衍生出桌面端的 `Clash for Windows (CFW)` 与安卓端的 `Clash for Android (CFA)`。然而，原版开源 Clash 核心功能更新缓慢，闭源的 Clash Premium 核心也不支持 VLESS、Reality、Hysteria 等新兴抗封锁协议。2023 年 11 月，随着原版 Clash 宣布删库归档，CFW 与 CFA 等关联项目在数日内相继停止维护。**自此之后，互联网上任何打着“CFA / CFW 2026 官方更新版”旗号的安装包，100% 属于第三方篡改包或植入恶意广告、盗号木马的黑灰产作品。**
2. **第二阶段：Clash.Meta 社区突围与协议革新（2021 年 – 2023 年底）**
   早在原版停更前，开源社区团队 MetaCubeX 就为了突破原版协议限制，创立了开源分支 `Clash.Meta`。该分支不仅开源实现了原闭源 Premium 的 TUN 虚拟网卡、Rule-Providers 规则集与 Script 脚本特性，更率先引入了 **VLESS-Reality（XTLS-Vision）**、**Hysteria 2**、**TUIC v5**、**Sniffer 域名嗅探**与 **GeoSite/MRS 二进制数据库**，迅速成为主流机场与高级玩家的事实标准。
3. **第三阶段：内核正式更名为 Mihomo 与多端 GUI 繁荣（2023 年底 – 2026 年至今）**
   为了彻底与已归档的原版 Clash 划清界限并规避潜在的代码商标争议，MetaCubeX 团队将内核项目 `Clash.Meta` 正式更名为 **[Mihomo](/clients/mihomo/)**（GitHub 仓库 `MetaCubeX/mihomo`）。与此同时，为了照顾广大安卓用户的搜索习惯，其官方维护的 Android 图形客户端保留了 `ClashMetaForAndroid`（简称 **CMFA**）的仓库名称，但在底层完全同步编译最新的 Mihomo 内核。

根据本站 `2026-11-23` 客户端数据库核验记录，ClashMetaForAndroid 及关联生态的基础信息如下表所示：

| 项目属性 | 核验结果（核实日期：2026-11-23） |
| --- | --- |
| **Android 官方项目名称** | Clash Meta for Android（简称 CMFA） |
| **官方 GitHub 仓库** | [GitHub: MetaCubeX/ClashMetaForAndroid](https://github.com/MetaCubeX/ClashMetaForAndroid) |
| **底层代理内核** | [Mihomo（原 Clash.Meta）](/clients/mihomo/) |
| **适用操作系统** | Android 手机、平板与安卓电视盒子（桌面端请使用 [Clash Verge Rev](/clients/clash-verge-rev/) 或 [FlClash](/clients/flclash/)） |
| **软件授权与费用** | 免费开源（GPL-3.0 协议，无内置收费与广告） |
| **支持订阅格式** | 标准 Clash YAML、Mihomo 扩展 YAML（支持 Rule-Providers 与本地配置覆写） |
| **支持构建架构** | `arm64-v8a`（主流 64 位手机）、`armeabi-v7a`（老旧 32 位设备）、`x86_64`（模拟器/x86 平板）、`universal`（通用包） |
| **当前维护状态** | 活跃维护（原 Clash for Android 生态的唯一官方正统继承者） |

## 二、 什么是“Clash Meta 客户端”？全平台 Mihomo GUI 家族全景对比

许多刚接触代理工具的用户常问：“我买了一家支持 Clash Meta 协议的机场，在电脑、安卓手机、苹果手机和软路由上分别该下载哪个软件？”

必须明确一个核心概念：**Clash.Meta（现 Mihomo）是一个没有图形界面的底层命令行转发内核**。普通用户在日常设备上安装的，都是封装了该内核的图形化前端（GUI 客户端）。由于不同操作系统的图形框架与权限机制截然不同，开源社区围绕 Mihomo 内核打造了各司其职的客户端矩阵。下表为你梳理了当前主流 Mihomo 系客户端的定位与选型边界：

| 客户端名称 | 适用操作系统 | 底层内核与 UI 技术栈 | 核心交互特点与差异化优势 | 维护状态与选型建议 |
| --- | --- | --- | --- | --- |
| **ClashMetaForAndroid (CMFA)** | **Android** | Mihomo + Android 原生 Kotlin/Java | 100% 延续经典 CFA 界面布局，提供极细致的 Android `VpnService` 网络参数、本地覆写与分应用绕过控制 | **活跃维护**；习惯经典 CFA 操作逻辑的安卓用户首选 |
| **[FlClash](/clients/flclash/)** | **Android / Windows / macOS / Linux** | Mihomo + Flutter 跨平台引擎 | 手机与电脑端界面完全统一（Material You 风格），支持 WebDAV 跨设备同步配置与仪表盘流量监控 | **活跃维护**；追求手机与电脑操作一致性的跨平台首选 |
| **[Clash Verge Rev](/clients/clash-verge-rev/)** | **Windows / macOS / Linux** | Mihomo + Rust / Tauri 2 | 桌面端功能最强大的旗舰 GUI，支持 Service Mode 守护进程、TUN 虚拟网卡及 Merge/JS 链式脚本覆写 | **活跃维护**；Windows/Mac/Linux 桌面端主力首选 |
| **Clash Nyanpasu** | Windows / macOS / Linux | Mihomo (支持多核切换) + Tauri | 同样派生自早期 Clash Verge 生态，注重现代动效与多内核实验性支持 | 社区维护；可作为桌面端备选方案 |
| **Clash Mi** | Android / iOS / Windows / macOS | Mihomo + Flutter | Karing 团队推出的轻量级纯 Mihomo 配置客户端，主打极简导入体验 | 社区维护；适合无需复杂本地脚本的轻量用户 |
| **[OpenClash](/clients/openclash/)** | **OpenWrt 软路由** | Mihomo + LuCI 网页管理前端 | 软路由领域功能最全的透明代理插件，支持 Fake-IP/Redir-Host 切换、策略组自动测速与局域网设备分流 | **活跃维护**；兼容 OpenWrt 旧版 `fw3` 与新版 `fw4` |
| **[Nikki（原 MihomoTProxy）](/clients/nikki/)** | **OpenWrt 24.10+ 软路由** | Mihomo + 原生 `nftables` / LuCI | 专为现代 OpenWrt 24.10+（`firewall4`）架构编写的轻量透明代理套件，结构精简、转发效率极高 | **活跃维护**；新版 OpenWrt 软路由玩家极力推荐 |

> [!IMPORTANT] iOS（iPhone / iPad）用户的特别说明
> 由于苹果 App Store 的沙盒机制与闭源商业生态限制，iOS 端主流客户端通常不直接运行 Go 编译的开源 Mihomo 二进制文件，而是采用独立开发的核心去兼容 Clash YAML 语法或新协议。iPhone 用户若希望无缝使用机场的 Clash Meta 订阅，推荐选择商业买断制软件 **[Shadowrocket（小火箭）](/clients/shadowrocket/)**、原生兼容 Clash YAML 策略组的 **[Stash](/clients/stash/)**，或免费开源基于 sing-box 内核且支持 Clash 订阅转换的 **[Karing](/clients/karing/)**。详见[iOS 平台客户端选型指南](/clients/platform/ios/)。

## 三、 Android 端 ClashMetaForAndroid（CMFA）下载与安装全流程

在安卓手机或平板上部署 ClashMetaForAndroid 时，如何选对 APK 安装包并通过系统安全校验？请严格遵循以下标准化步骤，更多安卓端通用安全准则也可参阅[Android 平台代理客户端指南](/clients/platform/android/)。

### 1. 识别 GitHub Releases 中的 APK 架构与构建变体

打开官方仓库 `MetaCubeX/ClashMetaForAndroid` 的 Releases 页面后，你会看到多个以 `cmfa-` 开头的 `.apk` 文件。理解文件名中的两段标识符即可精准选型：

1. **按 CPU 指令集架构区分**：
   - `arm64-v8a`：**99% 现代安卓手机与平板的必选项**（涵盖高通骁龙 8/7/6 系列、联发科天玑系列、Google Tensor 等 64 位 ARM 芯片）。安装包体积最小、内存占用最低。
   - `armeabi-v7a`：仅适用于十年前的老旧 32 位安卓手机，或部分采用 32 位固件的低端电视盒子（Android TV）。
   - `x86_64`：适用于运行在 PC 上的 Android 模拟器（如蓝叠、MuMu、WSA）或极少数 Intel 芯片安卓平板。
   - `universal`：整合了上述所有架构动态库的全量通用包，体积约为单架构包的三倍，仅在完全不清楚设备型号时作为兜底选择。
2. **按构建后缀变体区分（`meta` vs `foss`）**：
   - 标准版（如 `cmfa-2.11.x-meta-arm64-v8a-release.apk`）：官方完整构建版本，推荐所有常规用户下载。
   - 开源纯净版（文件名含 `foss`）：专为 F-Droid 等自由软件仓库编译的变体，移除了部分非自由闭源依赖库，核心代理功能与标准版无异。

### 2. 安卓系统安装拦截放行与签名核验

由于 CMFA 未在国内各手机厂商应用商店上架，从 GitHub 下载 APK 后首次点击安装时，国产手机系统（如小米 HyperOS、华为鸿蒙 HarmonyOS、OPPO、vivo）通常会弹出“未经应用商店安全检测”“高风险病毒应用”或要求开启“纯净模式”密码验证。

- **安全前提核验**：只要你确认下载链接直接来自 `https://github.com/MetaCubeX/ClashMetaForAndroid/releases`，且文件 SHA256 哈希与官方发布页一致，系统的风险提示便纯粹属于针对代理工具的品类拦截而非真木马。
- **放行操作**：在安装弹窗中点击“了解风险”→ 勾选“已了解此应用存在风险”→ 点击“仍然安装”（华为/荣耀设备需先在系统“设置 → 系统和更新 → 纯净模式”中关闭增强防护；小米设备可在安装拦截页点击右上角设置临时关闭“安全守护”）。
- **版本升级注意**：由于不同发布渠道（如 GitHub Release 官方签名 vs F-Droid 自动构建签名）的 APK 数字签名证书不同，升级新版本时必须下载与旧版相同签名体系的 APK 才能直接覆盖安装；若提示“签名不一致”，需先备份订阅 URL、卸载旧版后再安装新版。

### 3. 导入机场订阅与启动 VpnService 代理

完成安装后，按以下五步即可完成节点导入与系统级流量接管：

1. **获取订阅链接**：登录你所使用的机场服务商面板（若尚无可用节点，可查阅[便宜高性价比机场推荐](/plans/budget/)或[机场排行榜单](/airport/ranking/)挑选原生支持 Mihomo/Meta 协议的服务商），复制 **Clash 订阅链接**（或面板中标注为 **Clash Meta / Mihomo** 的专用订阅 URL）。
2. **新建远程配置**：打开手机上的 ClashMetaForAndroid，点击主界面中间的 **配置（Profiles）** 卡片 → 点击右上角的 **`+` 号（新配置）** → 选择 **从 URL 导入（Import from URL）**。
3. **填写配置参数**：
   - **名称（Name）**：输入便于辨认的服务商名称（如 `主力专线机场`）。
   - **URL**：长按粘贴刚才复制的 `https://` 订阅链接（注意检查首尾不要多出空格或换行符）。
   - **自动更新（Auto Update）**：强烈建议填入 `720`（每 12 小时）或 `1440`（每 24 小时），确保机场更换防封中转入口域名时手机能自动同步。
4. **保存并激活配置**：点击右上角的 **保存（磁碟图标）**，软件会立即发起 HTTP 请求下载并校验 YAML 文件。下载完成后会自动返回“配置”列表页，**务必手指点击一下刚才新建的配置条目，使其左侧圆圈变为实心选中状态**。
5. **启动代理与授权**：返回 CMFA 主界面，点击最顶部的 **已停止（点击启动）** 卡片。首次启动时，Android 系统会弹出标准的 `网络连接请求（VpnService）` 授权对话框，提示应用将创建 VPN 连接以监控网络流量，点击 **确定 / 始终允许**。当顶部卡片变为蓝色/彩色的 **运行中（Running）** 且状态栏出现钥匙或 VPN 小图标，即代表代理已成功启动。

### 4. 策略组测速与节点切换

代理启动后，主界面原本灰色的 **代理（Proxies）** 卡片会变为可点击状态。进入“代理”页面后：
- 点击右下角的 **闪电图标（URL Test 连通性测试）**，CMFA 会通过真实的 HTTP `204` 请求测试当前策略组下所有节点的握手延迟（单位为 `ms`）。
- 相比单纯的 ICMP Ping，这里的 URL 测速代表节点已经完成了完整的 TLS/Reality 加密握手。点击任意带有绿色延迟数值的节点即可切换线路；你也可以点击右上角的三点菜单，调整节点排序方式（按延迟排序或按名称排序）及切换出站模式（日常务必保持 **规则模式 / Rule Mode**）。

## 四、 Android 端进阶调优：分应用代理、后台保活与覆写（Override）

很多安卓用户虽然成功连上了节点，但在日常高频使用中却面临三大困扰：**锁屏待机几分钟后 VPN 自动掉线**、**开启代理后微信图片加载慢或手机银行闪退**、以及**切换 Wi-Fi 与 5G 移动数据时出现 DNS 解析卡死**。针对 Android 移动网络的特殊性，我们需要在 CMFA 中完成以下三项核心进阶调优。

### 1. 分应用代理（Access Control）与局域网绕过配置

在 Android 系统中，CMFA 通过系统级 `VpnService` 创建虚拟网卡接口，默认会将手机上所有 App 的网络请求全部送入 Mihomo 内核进行规则匹配。虽然订阅中的 `GEOIP,CN,DIRECT` 规则能让国内流量直连，但部分网银 App（如各大国有银行客户端、云闪付）、政企内网办公软件（钉钉打卡、企业微信内网连接）以及依赖局域网 DLNA/AirPlay 组播协议的电视投屏应用，只要检测到流量经过了本地虚拟网卡接口，就会出现连接重置或安全警告。

**标准化分应用绕过操作步骤**：
1. 在 CMFA 主界面先停止代理运行（修改核心网络参数需在停止状态下生效）。
2. 点击 **设置（Settings）** → **网络（Network）**。
3. 确认开启 **绕过私有网络（Bypass Private Networks）** 与 **DNS 劫持（DNS Hijacking）**，确保手机访问家里路由器后台 `192.168.x.1` 或 NAS 存储时直接走物理 Wi-Fi 网卡。
4. 向下滚动找到 **访问控制模式（Access Control Mode）**，点击并选择 **黑名单模式 / 排除已选应用（Exclude Selected Apps）**。
5. 点击下方的 **访问控制应用包列表（Access Control Packages）**，在右上角搜索或滑动列表，将 **微信、支付宝、各家手机银行、云闪付、12306、高德/百度地图、Bilibili、智能家居控制（米家）** 等纯国内高频应用全部勾选上。
6. 返回主界面重新启动代理。此时被勾选的国内 App 在操作系统底层就完全绕过了 `VpnService` 虚拟隧道，既彻底消除了金融风控与投屏失败隐患，又能大幅降低 Mihomo 内核的并发连接开销与手机耗电量。

### 2. 国产定制 Android 系统后台保活（防杀后台断连）对照表

为什么手机亮屏时刷海外网页飞快，一旦息屏放进口袋超过 5 分钟，再掏出手机就发现节点全部无响应甚至 CMFA 已经被系统强行关闭？这是因为国内手机厂商（小米、OPPO、vivo、华为、荣耀）为了延长续航，内置了极为激进的墓碑机制与后台功耗清理策略。请对照你的手机品牌执行以下保活设置：

| 手机品牌与系统版本 | 省电策略解除路径 | 多任务锁定与自启动关键设置 |
| --- | --- | --- |
| **小米 / Redmi（HyperOS / MIUI）** | 长按 CMFA 图标 → 应用信息 → **省电策略** → 选择 **无限制** | 开启 **自启动**；打开最近任务视图，长按或下拉 CMFA 卡片点击 **锁头图标**；在“手机管家 → 电池 → 右上角设置”中将“锁屏后断开数据”设为从不 |
| **OPPO / 一加 / Realme（ColorOS）** | 长按图标 → 应用详情 → **耗电管理** → 开启 **允许完全后台行为** 与 **允许应用自启动** | 在多任务界面点击 CMFA 卡片上方三点菜单选择 **锁定**；进入“设置 → 系统设置 → 开发者选项”确认未开启“不保留活动” |
| **vivo / iQOO（OriginOS）** | 系统设置 → 电池 → **后台耗电管理** → 找到 CMFA 设为 **允许后台高耗电** | 在权限管理中开启 **自启动** 与 **关联启动**；在后台多任务界面下拉卡片加锁 |
| **华为 / 荣耀（HarmonyOS / MagicOS）** | 系统设置 → 电池 → **应用启动管理** → 找到 CMFA 关闭“自动管理”，在弹窗中手动勾选 **允许自启动、允许关联启动、允许后台活动** | 在多任务切换界面将 CMFA 卡片向下拉动出现锁头标志；在“设置 → 移动网络 → 高级”中开启“休眠时始终保持网络连接” |
| **三星（One UI） / 原生 Pixel** | 应用信息 → **电池** → 选择 **不受限制（Unrestricted）** | 进入“设备维护 → 电池 → 后台使用限制”，将 CMFA 加入 **从不休眠的应用** 名单 |

同时，还建议在 CMFA 自身的 **设置 → 应用（App）** 中开启 **显示网速通知（Show Traffic in Notification）**，通过常驻前台通知栏进一步提升进程在 Android 系统中的存活性优先级。

### 3. CMFA 本地覆写（Override）与 Sniffer 域名嗅探配置

在移动网络环境下，许多手机 App（如 Telegram、部分海外手游或内置 HTTPDNS 的客户端）会绕过系统 DNS 直接向远程 IP 发起连接，导致基于域名的分流规则失效。CMFA 在 **设置（Settings）→ 覆写（Override）** 中提供了图形化的全局参数覆盖面板，无需手写代码即可强化分流精度：

- **开启域名嗅探（Sniffer）**：在“覆写 → 域名嗅探”中将策略设为 `启用（Enabled）`，并开启 `强制 DNS 映射` 与 `解析纯 IP 连接`，让 Mihomo 内核自动从 TLS 握手的 SNI 字段中还原真实目标域名。
- **DNS 增强模式调整**：在“覆写 → DNS”中，确认 `增强模式（Enhanced Mode）` 为 `Fake-IP`，并将上游 `NameServer` 设置为高可靠的国内 DoH（如 `https://dns.alidns.com/dns-query` 或 `223.5.5.5`），防止切换蜂窝移动网络时因运营商默认 DNS 劫持导致订阅更新失败。如果遇到复杂的 DNS 解析故障，可对照[DNS 错误与防泄漏排查指南](/troubleshooting/dns/)进行深度诊断。

## 五、 从已停更的 CFA（Clash for Android）与 CFW 平滑迁移指南

如果你或身边的朋友手机上依然装着图标为灰色猫咪、版本号停留在 `2.5.12` 的旧版 Clash for Android（CFA），请按以下标准化步骤在 3 分钟内完成无损迁移：

1. **第一步：从旧版 CFA 导出订阅地址**
   打开旧版 CFA → 进入 **配置（Profiles）** → 点击当前使用的订阅右侧的 **三点菜单** → 选择 **编辑（Edit）** → 长按复制 **URL** 栏中的完整订阅链接并保存到手机备忘录。
   *注意：不要使用旧版 CFA 的“导出配置备份文件”直接导入新版，因为旧版备份中往往固化了过时的旧格式参数，重新通过 URL 拉取能让机场面板根据新版 CMFA 的 User-Agent 下发最新的 VLESS-Reality 与 Hysteria 2 节点。*
2. **第二步：记录分应用代理名单并彻底卸载旧版**
   如果你之前在旧版 CFA 中配置过分应用代理白名单/黑名单，可先截图留存。随后在旧版中停止代理，长按桌面旧版 CFA 图标选择 **卸载**。尽管 CMFA 的 Android 应用包名（`com.github.metacubex.clash.meta`）与原版 CFA（`com.github.kr328.clash`）相互独立、可以共存，但同时保留两个代理软件极易造成 VPN 授权抢占与混淆。
3. **第三步：在 CMFA 或 FlClash 中重新导入**
   打开新安装的 ClashMetaForAndroid（或跨平台界面更现代的 [FlClash](/clients/flclash/)），按前文第三节步骤粘贴订阅 URL 导入即可。若你是电脑端用户寻找 Clash Meta 替代方案，请直接阅读 [Clash Verge Rev 桌面端完整教程](/clients/clash-verge-rev/)。

## 六、 常见故障现象与排障速查表

当 ClashMetaForAndroid 在使用中出现异常时，可按照下表快速定位问题环节并执行修复动作：

| 故障症状与报错提示 | 核心成因分析 | 快速修复步骤 | 关联深度排障专题 |
| --- | --- | --- | --- |
| **导入订阅报错 `Invalid Config`、`mapping values are not allowed` 或内容为空** | 1. 误复制了 Base64 节点链接（适用 v2rayNG）或网页登录地址；2. 机场订阅已过期或流量耗尽；3. 开启了坏死代理导致请求被阻断 | 1. 确认从机场面板复制的是 **Clash / Mihomo 专用订阅**（原理见[订阅格式识别指南](/guides/subscription-formats-explained/)）；2. 关闭所有 VPN 后用移动 5G 流量重新拉取 | [订阅更新失败与 200+0 排查](/troubleshooting/subscription/) |
| **URL 测速全部显示 `Timeout` 或点击启动后无法打开任何海外网页** | 1. 手机系统时间未开启自动同步，误差超 90 秒导致 TLS 握手失败；2. 所选节点正在维护；3. 误选了 `DIRECT`（直连）全局出站模式 | 1. 在手机系统设置中开启“自动设置日期和时间”；2. 在 CMFA“代理”页右上角确认出站模式为 **规则（Rule）** 并切换其他地区节点 | [节点全部超时排查决策树](/troubleshooting/timeout/) |
| **切换 Wi-Fi 与移动数据网络后，所有国内与国外 App 均处于断网假死状态** | 移动网络与宽带切换瞬间，虚拟网卡绑定的上游物理网络接口失效，或本地 DNS 缓存未及时刷新 | 在 CMFA 主界面点击顶部卡片 **停止** 再重新 **启动** 一次以重建 `VpnService` 路由；并在“设置 → 网络”中开启 **自动路由接口检测** | [代理频繁断连与网络恢复](/troubleshooting/disconnected/) |
| **连接正常，但打开 ChatGPT / Claude 官方安卓 App 提示 `Something went wrong` 或不支持当前地区** | 1. 当前选中的是香港节点（OpenAI/Anthropic 封禁香港 IP）；2. 机场落地 IP 属于高危机房段；3. 未安装完整的 Google Play 服务框架 | 1. 将 AI 策略组或主节点切换至 **美国、日本、新加坡或台湾** 专线节点；2. 确保 CMFA 的分应用代理未将 ChatGPT App 误加入排除名单 | [ChatGPT 访问报错与节点配置](/ai-streaming/chatgpt/) |

## 本专题三级内容集群与延伸阅读

围绕 Clash Meta（Mihomo）在安卓移动端与跨平台生态的深度应用，我们将关联技术专题划分为以下三个三级内容集群（包含本站已上线教程与规划中的待发布选题）：

### 集群一：Mihomo 内核原理与跨平台客户端协同
- **已发布关联指南**：
  - [Mihomo（原 Clash.Meta）开源核心与生态客户端指南](/clients/mihomo/)：深入剖析 Mihomo 内核的协议栈演进、Sniffer 域名嗅探、`.mrs` 二进制规则集与 `dialer-proxy` 链式代理架构。
  - [FlClash 跨平台客户端下载与配置指南](/clients/flclash/)：基于 Flutter + Mihomo 构建的现代客户端，支持 Android 与 Windows/macOS 界面统一及 WebDAV 云端备份。
  - [Clash Verge Rev 桌面端下载安装与 TUN 模式教程](/clients/clash-verge-rev/)：Windows、macOS 与 Linux 电脑端搭载 Mihomo 内核的旗舰 GUI 教程。
  - [OpenClash 软路由安装与透明代理教程](/clients/openclash/)与[Nikki（MihomoTProxy）现代软路由指南](/clients/nikki/)：将 Mihomo 核心部署在家庭网关路由器上，实现全家设备免装客户端透明分流。
- **规划中待发布选题**（纯文本预告，后续上线）：
  - 《ClashMetaForAndroid (CMFA) vs FlClash 深度横评：安卓 15/16 后台耗电、内存占用与规则加载速度实测》（待发布选题）
  - 《利用 WebDAV 实现手机端 CMFA / FlClash 与电脑端 Clash Verge Rev 配置及自定义规则同步》（待发布选题）

### 集群二：Android 移动端其他主流内核客户端横向选型
- **已发布关联指南**：
  - [Android 平台代理客户端下载与安全总览](/clients/platform/android/)：汇总安卓平台三大内核（Mihomo / Xray / sing-box）客户端的官方渠道与架构选型表。
  - [v2rayNG 安卓端下载、Base64 订阅导入与分流教程](/clients/v2rayng/)：搭载 Xray-core 的老牌轻量安卓客户端，适合直接导入单条节点分享链接与通用订阅。
  - [Hiddify 全平台客户端指南](/clients/hiddify/)与[Karing 规则兼容型客户端教程](/clients/karing/)：基于新一代 sing-box 内核且原生支持直接导入 Clash Meta 订阅的安卓/iOS 全能工具。
  - [NekoBox for Android 使用与渠道风险警示](/clients/nekobox/)：解析早期 sing-box 安卓客户端的配置方式，并重点警示勿从 Google Play 下载被第三方接管的同名版本。
- **规划中待发布选题**（纯文本预告，后续上线）：
  - 《Android TV 电视盒子与投影仪代理部署指南：CMFA / FlClash / v2rayNG 遥控器适配与流媒体解锁实操》（待发布选题）

### 集群三：订阅规则进阶、安全防骗与流媒体解锁
- **已发布关联指南**：
  - [Clash YAML 配置文件结构详解](/guides/clash-config/)与[分流规则及策略组编写指南](/guides/routing/)：看懂移动端订阅文件背后的 `proxy-groups` 与规则匹配优先级。
  - [安全防骗指南：如何识别假冒 Clash 中文官网与跑路机场](/safety/avoid-scams/)：揭露搜索引擎竞价广告中伪装成 Clash Meta 官网的盗号安装包套路。
  - [多设备同时在线与家庭共享机场推荐](/airport/multi-device/)：针对手机、平板、电脑同时挂载 CMFA 与 Clash Verge Rev 的用户，挑选不限设备数的高性价比服务商。
  - [Netflix / YouTube / Disney+ 流媒体解锁配置专题](/ai-streaming/netflix/)：配合 CMFA 策略组实现移动端高清流媒体跨区播放。
- **规划中待发布选题**（纯文本预告，后续上线）：
  - 《ClashMetaForAndroid 本地覆写（Override）高级玩法：在不修改机场远程订阅的前提下注入自建落地节点》（待发布选题）

## 常见问题（FAQ）

### Clash Meta 和 Mihomo 是同一个东西吗？

是的。`Clash.Meta` 是开源社区在原版 Clash 基础上扩展现代协议栈的分支项目，在 2023 年底原版 Clash 归档事件后，官方团队 MetaCubeX 将 `Clash.Meta` 内核正式更名为 `Mihomo`（仓库地址 `MetaCubeX/mihomo`）。日常语境中的“Clash Meta 客户端”，在安卓端特指官方维护的 `ClashMetaForAndroid`（CMFA），在桌面端则指搭载 Mihomo 内核的 Clash Verge Rev 或 FlClash。

### 原来的 Clash for Android（CFA）还能继续用吗？

强烈不建议继续使用。原版 Clash for Android（CFA）早在 2023 年 11 月就已彻底删库停止维护，其内置旧内核完全不支持 VLESS-Reality、Hysteria 2、TUIC v5 与 AnyTLS 等主流抗封锁协议，且在新版 Android 14/15/16 系统上存在后台崩溃与安全漏洞风险。请直接备份订阅链接后迁移至 ClashMetaForAndroid 或 FlClash。

### 下载 ClashMetaForAndroid 时应该选 arm64-v8a、armeabi-v7a 还是 universal 版本？

2018 年以后上市的绝大多数 Android 智能手机与平板均采用 64 位 ARM 处理器，应优先下载体积精简、运行效率最高的 `arm64-v8a-release.apk`；仅极老旧的 32 位安卓设备或早年电视盒子才需要 `armeabi-v7a`；若实在不确定设备芯片架构，可下载包含全指令集的 `universal-release.apk`。

### 为什么在 ClashMetaForAndroid 中导入机场订阅后提示配置无效或无法拉取？

最常见的三个原因是：第一，误将服务商提供的 Base64 纯节点链接当成 Clash YAML 订阅导入；第二，导入前未关闭手机上已失效的旧 VPN 连接导致网络请求死循环；第三，部分机场要求特定 User-Agent 请求头才下发 Meta 节点。建议先断开所有 VPN，确认复制的是 Clash/Mihomo 专用订阅链接后重新拉取。

### 安卓手机锁屏几分钟后 ClashMetaForAndroid 就自动断网怎么解决？

这是国产定制安卓系统（如小米 HyperOS/MIUI、OPPO ColorOS、vivo OriginOS、荣耀 MagicOS）的省电杀后台机制所致。需进入手机系统设置的应用管理中，将 CMFA 的省电策略设为“无限制（允许后台高耗电）”，开启“允许自启动”，并在多任务切换界面将 CMFA 卡片向下滑动加锁。

### 开启 CMFA 后微信发不出图片、网银 App 报错或局域网投屏失效怎么办？

这是因为全局 VPN 接口接管了所有应用的流量，导致国内高敏金融应用触发异地 IP 风控或局域网组播包被丢弃。请进入 CMFA 的“设置 → 网络”，开启“绕过私有网络”，再开启“访问控制模式（分应用代理）”，选择“排除已选应用模式”并将微信、支付宝、手机银行及视频投屏 App 勾选排除。

### 安卓端用 ClashMetaForAndroid 好还是 FlClash 好？

两者底层均搭载相同的 Mihomo 内核，协议兼容性完全一致。CMFA 延续了经典 Clash for Android 的原生界面布局，提供极细致的本地覆写（Override）与网络参数微调，适合习惯经典布局的进阶安卓用户；FlClash 采用 Flutter 构建，在安卓与 Windows/macOS 电脑端拥有完全一致的卡片式 UI 且支持 WebDAV 云同步，适合多设备跨平台用户。
