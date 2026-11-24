---
title: "代理客户端全平台选型指南：Clash、v2rayN 与小火箭对比"
description: "全平台代理客户端下载与选型百科：集成交互式筛选器，深入对比 Clash Verge Rev、Clash Meta、v2rayN、v2rayNG、Shadowrocket、Mihomo 与 sing-box 生态、操作系统兼容矩阵、GitHub 官方仓库 SHA256 核验及订阅格式映射。"
lastUpdated: 2026-11-23
schemaType: CollectionPage
itemListCount: 18
faq:
  - q: "第三方通用客户端和机场品牌专属客户端有什么本质区别？"
    a: "第三方通用客户端（如 Clash Verge Rev、v2rayN、Shadowrocket、Hiddify）开源或上架正规应用商店，可导入任意支持标准订阅的服务商配置并自主管理分流规则与 DNS；品牌专属客户端通常闭源、绑定单一机场账号体系，一旦更换服务商或遭遇停服即无法复用，且难以独立审计本地流量劫持与遥测行为。"
  - q: "为什么绝对不能再下载或使用 Clash for Windows（CFW）与 Clash for Android（CFA）？"
    a: "原版 Clash 内核、Clash for Windows 与 Clash for Android 均已正式归档并停止维护，既无法适配 VLESS-Reality、Hysteria 2、AnyTLS 等现代加密传输协议，也不再修复已知安全漏洞。搜索引擎上打着“中文官网”或“复活版”旗号分发的 CFW 安装包极易被植入木马。桌面端应迁移至 Clash Verge Rev 或 FlClash，安卓端应选用 Clash Meta for Android 或 v2rayNG。"
  - q: "如何核对代理客户端下载包的真实性与安全性，防止下载到钓鱼木马？"
    a: "唯一可信的校验方式是从客户端对应 GitHub 官方 Releases 页面或苹果官方 App Store 获取安装包，切勿通过第三方聚合下载站、百度搜索广告或网盘链接下载。在 Windows PowerShell 中使用 Get-FileHash 或在 macOS/Linux 终端使用 sha256sum 核对文件哈希值与官方 Release 说明是否一致，确认仓库所有者拼写无误后再执行安装。"
  - q: "Windows 安装 Clash Verge Rev 后无法启动或白屏怎么办？启用 TUN 模式需要注意什么？"
    a: "基于 Tauri 的 Clash Verge Rev 在 Windows 上依赖系统的 Microsoft Edge WebView2 运行时，精简版系统或部分 LTSC 系统缺失该组件时会出现白屏或无法渲染界面，需提前补装官方 WebView2 Runtime。若需开启 TUN 虚拟网卡接管全局或 WSL/游戏流量，必须先在软件设置中安装并启动 Service Mode（服务模式），或以管理员身份运行客户端。"
  - q: "苹果 iOS 设备为什么在国区 App Store 搜不到 Shadowrocket（小火箭）？可以用共享账号下载吗？"
    a: "受区域应用商店合规政策限制，Shadowrocket、Stash、Quantumult X 与 Surge 均未在中国大陆区 App Store 上架。必须使用非大陆区（如美区、港区、台区）个人名下注册的 Apple ID 登录商店后自行付费购买正版。严禁在设备系统设置“iCloud”中登录来源不明的第三方共享账号，否则极易被恶意开启“查找我的 iPhone”导致远程锁机勒索。"
  - q: "v2rayN 下载页面有多个压缩包，WithCore 是什么意思？v2rayNG 能直接导入 Clash 订阅链接吗？"
    a: "GitHub 上的 2dust/v2rayN Releases 会区分仅含前端外壳的包与附带 Xray/sing-box/Mihomo 内核的 WithCore 整合包，新手在 Windows 上应优先下载带 WithCore 的对应架构包（x64 或 arm64），避免打开后提示缺少核心。Android 端的 v2rayNG 仅解析 Base64 节点列表与标准分享链接，不支持复杂 Clash YAML 策略组语法，若服务商仅提供 Clash 格式订阅，安卓端应改用 FlClash 或 Clash Meta for Android。"
  - q: "为什么官方特别警告不要从 Google Play 下载 NekoBox for Android？"
    a: "NekoBox for Android 官方仓库（MatsuriDayo/NekoBoxForAndroid）已多次发布公告提示项目维护资源有限，并明确警示 Google Play 商店中出现的同名安装包属于非官方第三方控制或接管版本，存在隐私与安全性风险。新装机安卓用户建议优先评估持续活跃的 Hiddify、Karing、FlClash 或官方 sing-box（SFA）。"
  - q: "OpenWrt 软路由选 OpenClash、PassWall2、Nikki 还是 HomeProxy？能同时开启两个插件吗？"
    a: "严禁在同一个 OpenWrt 路由中同时启用两个透明代理插件，否则 iptables/nftables 规则与 DNS 端口劫持会互相冲突导致全网断联。习惯 Clash YAML 策略组且使用旧版 fw3 或 23.05 系统的用户可选 OpenClash；偏好单节点直选与 Xray/sing-box 后端可选 PassWall2；使用 OpenWrt 24.10 及以上版本（firewall4/nftables）的现代环境则优先考虑精简高效的 Nikki（原 MihomoTProxy）或原生 sing-box 方案 HomeProxy。"
  - q: "Mihomo 内核与 sing-box 内核应该怎么选？两者配置文件通用吗？"
    a: "两者配置文件并不通用：Mihomo（原 Clash.Meta）采用 YAML 格式，完整兼容传统 Clash 策略组、Proxy-Provider 与自定义脚本覆写，规则生态极其成熟，适合 Clash Verge Rev、FlClash、OpenClash；sing-box 采用结构化 JSON 格式，内存占用更低且支持全平台统一协议栈，适合追求轻量高性能或使用 Hiddify、Karing、HomeProxy 的用户。"
  - q: "导入订阅链接后提示格式错误或节点全部超时，应该优先排查哪些客户端配置？"
    a: "首先核对订阅链接格式与当前客户端是否匹配（例如把 Clash YAML 直接喂给只认 Base64 的 v2rayNG 会直接报错）；其次检查本机系统时间误差是否超过 30 秒，时间不准会导致 TLS 与 Reality 握手失败；若仅特定网页打不开或连接超时，则应依次核查系统代理端口是否被占用、TUN 虚拟网卡是否与 WSL/Docker 网段冲突以及本地 DNS 解析是否异常。"
---

# 客户端软件总览：全平台代理客户端选型与官方仓库核验中心

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>选择代理客户端的核心原则是<strong>“活跃维护、官方源可追溯、内核协议与订阅格式匹配”</strong>。桌面端优先选用基于 Mihomo 内核的 <a href="/clients/clash-verge-rev/">Clash Verge Rev</a> 或支持多核心切换的 <a href="/clients/v2rayn/">v2rayN</a>；Android 移动端依据订阅格式在 <a href="/clients/v2rayng/">v2rayNG</a>、<a href="/clients/flclash/">FlClash</a>、<a href="/clients/hiddify/">Hiddify</a> 与 <a href="/clients/karing/">Karing</a> 间选择；iOS 端需使用非大陆区个人 Apple ID 在 App Store 购买正版 <a href="/clients/shadowrocket/">Shadowrocket</a>、<a href="/clients/stash/">Stash</a>、<a href="/clients/quantumult-x/">Quantumult X</a> 或 <a href="/clients/surge/">Surge</a>；OpenWrt 软路由则根据系统版本与 <code>fw3/fw4</code> 防火墙架构在 <a href="/clients/openclash/">OpenClash</a>、<a href="/clients/passwall2/">PassWall2</a>、<a href="/clients/nikki/">Nikki</a>（要求 OpenWrt 24.10+）和 <a href="/clients/homeproxy/">HomeProxy</a> 间选型。<strong>严禁再从任何渠道下载已归档停更的 Clash for Windows 与 Clash for Android，亦切勿从 Google Play 安装非官方控制的 NekoBox 同名版本。</strong></p>
</div>

## 交互式客户端筛选器

通过下方筛选器，按操作系统、底层代理内核（Mihomo / sing-box / Xray-core / 私有核心）、入门难度与开源属性快速定位适合你当前设备的客户端，并直达对应安装教程与已核验的官方项目地址。

<ClientSelector />

## 一、代理客户端是什么：本地流量调度的真正职责

很多新手用户在初次接触跨境网络工具时，容易把“客户端软件”与“节点服务商（机场或自建服务器）”混为一谈。从网络工程视角来看，代理客户端本身并不提供任何海外带宽或跨境出口，它是一个运行在你本地设备（电脑、手机或路由器）上的**网络协议封装与流量调度器**。无论你购买了多高规格的 [IEPL 或 IPLC 专线服务](/routes/iepl/)，只要本地客户端选择不当、内核过旧或权限配置有误，依然会出现连接超时、DNS 泄漏或特定应用无法走代理的问题。

具体而言，一个现代代理客户端在本地承担四项核心职责：

1. **流量接管（Inbound 入站监听）**：决定本地哪些应用的数据包被送入代理核心。常见接管模式包括**系统代理（System Proxy）**与**TUN 虚拟网卡模式（TUN / VPN Mode）**。系统代理通常在本地开启 HTTP/SOCKS5 监听端口（例如 `127.0.0.1:7897`），仅对遵循系统代理环境变量的浏览器及桌面软件生效；而 [TUN 虚拟网卡模式](/guides/tun/) 会在操作系统内核层虚拟出一张网卡，接管命令行终端、游戏进程、容器、商店应用乃至不支持代理设置的客户端软件的全部 TCP/UDP 流量。
2. **规则分流与域名嗅探（Routing & Sniffer）**：客户端内置 GeoIP 数据库、Geosite 域名列表与 `RULE-SET` 规则集，用于在毫秒级判断当前请求属于“直连国内网站（DIRECT）”“经由代理节点转发（PROXY）”还是“广告屏蔽（REJECT）”。现代内核（如 Mihomo 与 sing-box）还具备 **Sniffer 域名嗅探**能力：当应用程序直接向 IP 地址发起 TLS 或 HTTP 连接时，内核可以从握手包中提取真实域名（SNI / Host）再二次匹配分流规则，这对防止流媒体与 AI 服务分流遗漏至关重要。
3. **DNS 拦截与防泄漏解析（DNS Resolution）**：当用户访问海外域名时，如果先由本地宽带运营商 DNS 解析，不仅容易拿到被污染的错误 IP，还会向目标平台暴露真实地理位置（即所谓“送中”或地区风控触发）。代理客户端通过内置 DNS 模块（配合 `Fake-IP` 或 `Redir-Host` 映射机制），将海外域名的解析请求加密推送至远程或通过代理隧道向可信上游解析，详见 [DNS 错误与泄漏排查](/troubleshooting/dns/)。
4. **协议握手与加密传输（Outbound 出站转发）**：客户端底层内核负责将本地明文或应用数据包，按照服务商下发的参数封装为特定代理协议（如 VLESS-Reality、Hysteria 2、Trojan、Shadowsocks、VMess、AnyTLS），经加密后发送至中转入口或落地服务器。如果客户端内核版本太老（例如早已停更的旧版 Clash 内核），根本不识别 `Reality` 公钥参数或基于 QUIC 的 `Hysteria 2` 协议，导入新订阅时就会直接报错或全部节点失联。

## 二、客户端与订阅服务的关系：第三方通用端 vs 品牌专属端

在实际选型中，客户端的选择与你所使用机场的接入模式强绑定。结合本站 [31 家机场品牌可核验数据库](/brands/directory/) 的梳理结果，目前市面上的服务商在客户端支持上可分为**第三方通用订阅模式**、**自研与第三方双支持模式**以及**仅限专属客户端模式**三大类。

| 对比维度 | 第三方通用客户端（强烈推荐主力） | 自研与第三方订阅双支持 | 仅品牌专属（One-Click）客户端 |
| --- | --- | --- | --- |
| **源码透明与发行渠道** | 多数在 GitHub 开源（MIT / GPLv3）或上架苹果官方 App Store | 提供官网自研软件，同时开放标准订阅地址 | 绝大多数完全闭源，仅通过服务商官网、短链或网盘分发 |
| **跨品牌迁移与备份** | 极佳。支持同时导入多家订阅、测速对比与备用节点自动故障转移 | 兼顾零配置上手与后续向 Mihomo/sing-box 迁移 | 极差。客户端写死单一登录接口，换品牌或停服后配置无法复用 |
| **分流精细度与调试** | 支持自定义 `RULE-SET`、关闭 IPv6、锁定 ChatGPT/Claude 固定节点 | 用第三方端时可完全掌控；用自研端时自由度受限 | 通常仅提供“智能分流 / 全局代理”粗粒度开关，无法查看单条连接日志 |
| **跨设备与软路由适配** | 全面覆盖 Windows/macOS/Android/iOS/Linux 及 OpenWrt 软路由 | 第三方订阅可导入软路由与全端设备 | 通常不提供 OpenWrt LuCI 插件，Linux 桌面/服务器支持常缺失 |
| **已知风险与代表品牌** | 需花 5 分钟完成订阅导入；如[一翻云](/brands/yifan/)、[可信云](/brands/kexin/)等支持通用订阅 | 如[光速云](/brands/guangsuyun/)、[梯子云](/brands/tiziyun/)、[速界](/brands/sujie/)、[大佬云](/brands/dalaoyun/)、[极连云](/brands/jilian/)、[光年梯](/brands/guangnian/)等 | 如[飞猫云](/brands/feimao/)、[隐形人](/brands/yinxingren/)、[SOGO 云](/brands/sogo/)、[闪跃](/brands/shanyue/)、[全球云](/brands/quanqiu/)、[灵猫网络](/brands/lingmao/)、[Firefly（萤火虫）](/brands/firefly/)、[无忧链接](/brands/wuyou/)等 |

从长期运维与隐私安全角度考量，**我们优先推荐支持标准第三方通用订阅的服务方案**。原因有三点：第一，开源第三方客户端经过数万名开发者与社区用户的持续审计，能够避免闭源软件在本地私自植入系统根证书、修改全局 hosts、收集剪贴板或静默占用后台带宽的风险；第二，当某个机场遭遇域名波动或节点维护时，用户可以在 [Clash Verge Rev](/clients/clash-verge-rev/) 或 [v2rayN](/clients/v2rayn/) 中无缝切换早已导入的备用[不限时流量包](/plans/non-expiring/)订阅，而无需重新下载并反复卸载多款专属软件；第三，现代 AI 与流媒体场景（如 [Claude 风控固定 IP 要求](/ai-streaming/claude/)）往往需要手动将特定域名锁定到指定节点，只有第三方客户端才能提供足够的规则控制粒度。

当然，品牌专属客户端并非毫无价值。对于完全不愿理解 URL 订阅概念、只需要在单台手机或电脑上“下载账号密码登录即用”的极简新手，或临时需要应急连接的用户，专属客户端确实降低了前五分钟的操作门槛。但在下单年付套餐前，务必在[品牌详情库](/brands/directory/)中核清该服务商是否被锁死为“仅专属客户端”，尤其是有 OpenWrt 软路由透明代理需求或 Linux 工作站需求的用户，购买仅支持专属端的品牌会导致路由器完全无法接入。

## 三、全平台分操作系统客户端深度选型

不同操作系统的底层权限模型、图形运行时、CPU 指令集架构与应用商店审核政策，直接决定了客户端的稳定性与排错路径。点击下方链接可进入对应系统的专项安装排错中心：

- [Windows 客户端中心（x64 / ARM64 / WebView2 / 服务模式）](/clients/platform/windows/)
- [macOS 客户端中心（Apple Silicon vs Intel / 网络扩展权限）](/clients/platform/macos/)
- [Android 客户端中心（APK 签名校验 / VpnService / 分应用代理）](/clients/platform/android/)
- [iOS / iPadOS 客户端中心（外区 Apple ID / 付费策略 / 防锁机）](/clients/platform/ios/)
- [Linux 客户端中心（DEB / RPM / AppImage / 无桌面服务器方案）](/clients/platform/linux/)
- [OpenWrt 软路由中心（fw3 vs fw4 / 内核版本 / 闪存空间）](/clients/platform/openwrt/)

### 3.1 Windows 客户端推荐与对比（含 CFW 停更警告与 WebView2 说明）

Windows 是代理客户端生态最成熟的桌面平台，但同时也是**历史遗留错误教程和钓鱼安装包重灾区**。选型前必须建立一条不可动摇的底线：**原版 Clash for Windows（简称 CFW）已于 2023 年底正式删库归档并停止一切维护**。截至 2026 年，任何在中文博客、网盘或搜索结果中出现的“Clash for Windows 2026 汉化最新版”“CFW 复活破解版”均属于未经验证的第三方魔改或高危木马携带体。继续使用归档版 CFW，不仅无法连接现代机场普遍采用的 `VLESS-Reality` 与 `Hysteria 2` 协议，还面临极高的本地凭证窃取风险。

目前 Windows 10 / 11 平台推荐的主力活跃客户端如下：

1. **[Clash Verge Rev](/clients/clash-verge-rev/)（新手与主流首选）**：由社区接力原版 Clash Verge 持续维护，基于 Rust + Tauri 框架打造，底层内置最新 **Mihomo（Clash.Meta）** 内核。相比老旧的 Electron 架构软件，内存占用明显降低，原生支持全局覆写脚本（Merge / Script）、可视化规则编辑、系统代理快捷键与 TUN 模式切换。
   - **WebView2 依赖提示**：Tauri 前端需要依赖 Windows 系统的 **Microsoft Edge WebView2 Runtime**。Windows 11 及更新完整的 Windows 10 通常已自带该组件；若你在精简版系统或 Windows 10 LTSC 上安装后出现“打开白屏”或“提示缺少 WebView2”，请直接前往微软官网补装 `Evergreen Standalone Installer` 后重启软件。
   - **架构区分（x64 vs ARM64）**：普通 Intel 与 AMD 处理器电脑选择 `x64` 安装包（如 `Clash.Verge_*_x64-setup.exe`）；搭载高通骁龙 X Elite/Plus 处理器的 Windows on ARM 笔记本，请务必下载 `arm64` 构建版以获得原生性能与稳定的 TUN 驱动兼容。
2. **[v2rayN](/clients/v2rayn/)（多核心与技术进阶首选）**：老牌开源神器（`2dust/v2rayN`），现已重构为支持 **Xray-core、sing-box 与 Mihomo 多核心热切换**的综合调度台。它特别适合习惯单节点链接导入、需要批量测试真实延迟、自建节点混合机场订阅或同时使用 Base64 与 Clash 格式的用户。下载 GitHub Releases 时注意区分文件名中的 `WithCore`（包含核心文件，开箱即用）与不带核心的纯界面包。
3. **[FlClash](/clients/flclash/)（跨端统一与轻量备选）**：基于 Flutter 开发的现代 Mihomo 客户端，界面交互与手机端保持高度一致，支持 WebDAV 配置同步，无需为不同设备重新适应两套操作逻辑。
4. **[Hiddify](/clients/hiddify/) 与 [Karing](/clients/karing/)（sing-box 新锐代表）**：两者均基于 `sing-box` 内核，支持自动识别 Clash YAML、Base64 与 sing-box JSON 多种订阅格式。对于追求全平台界面统一且不想自己手写配置映射的新手而言，Hiddify 与 Karing 的自动选点与开机 TUN 接管十分省心。

### 3.2 macOS 客户端选型（Intel vs Apple Silicon 芯片区分）

macOS 用户的首要排雷点是**芯片架构区分**。在 GitHub Releases 下载安装包时，Apple M1 / M2 / M3 / M4 系列芯片的 Mac 务必选择 **`arm64`（或 `aarch64` / `Apple Silicon`）** 结尾的 `.dmg` 安装包；仍在使用早期 Intel 处理器的 Mac 则必须选择 **`x64`（或 `amd64` / `x86_64`）** 包。虽然 Apple Silicon 可通过 Rosetta 2 转译运行 `x64` 软件，但网络虚拟网卡与 TUN 系统扩展在转译模式下容易出现额外 CPU 唤醒与耗电问题，强烈建议始终使用原生对应架构。

macOS 平台主要客户端定位对比如下：

- **免费开源主力**：[Clash Verge Rev](/clients/clash-verge-rev/)、[FlClash](/clients/flclash/) 与跨平台版 [v2rayN](/clients/v2rayn/) 均已提供原生 Apple Silicon 与 Intel 双架构包；若偏好 `sing-box` 生态，可选 [Hiddify](/clients/hiddify/)、[Karing](/clients/karing/) 或官方的 **SFM（sing-box for macOS）**。
- **苹果生态商业客户端**：对于已经付费购买 iOS 端工具的用户，可评估支持跨端规则一致性的 [Stash](/clients/stash/)（直接兼容 Clash YAML）或网络开发旗舰 [Surge Mac](/clients/surge/)（内置抓包、Ponte 组网、网关模式与极佳的后台低功耗表现，授权价格较高）。此外，已购买 iOS 版 [Shadowrocket](/clients/shadowrocket/) 的用户，在搭载 Apple Silicon 芯片的 Mac 上也可以直接从 App Store “iPhone 与 iPad App” 栏目安装运行，但受限于 iPadOS 兼容层，其在桌面快捷键、命令行接管与 TUN 深度控制上不如原生 macOS 客户端完善。
- **macOS 常见安全与权限弹窗处理**：由于开源客户端通常未向苹果支付每年开发者签名公证费，首次拖入“应用程序”打开时系统可能提示“无法打开，因为无法验证开发者”或“文件已损坏”。此时切勿认为安装包失效，可通过右键点击应用图标选择“打开”，或在“系统设置 → 隐私与安全性”中点击“仍要打开”（或使用 `xattr -cr` 清除隔离属性）解决；启用 TUN 模式时则需在提示框中输入开机密码以授权系统网络扩展权限。

### 3.3 Android 客户端选型（含 NekoBox Google Play 渠道警告）

Android 系统通过标准的 `VpnService` 接口接管全局流量，同时支持**分应用代理（Per-App Proxy）**——你可以精准控制仅让浏览器、Telegram、ChatGPT 走代理，而让微信、支付宝、国内银行应用与本地网盘完全绕过代理，既节省流量又避免触发金融软件的风控弹窗。

安卓端安装与选型需重点关注以下五款客户端及渠道风险：

1. **[v2rayNG](/clients/v2rayng/)**：由 `2dust` 维护的安卓端轻量开源标准工具，基于 `Xray-core` 内核，极低内存占用、后台保活稳定，是单节点链接与 Base64 订阅用户最稳妥的选择。但需要注意：**v2rayNG 不原生解析带复杂 `proxy-groups` 策略组的 Clash YAML 订阅**。如果你的机场仅下发 Clash 格式订阅，强行导入 v2rayNG 会提示找不到有效节点，此时应联系服务商获取通用 Base64 订阅链接，或直接改用下方支持 Clash 格式的客户端。
2. **[FlClash](/clients/flclash/) 与 [Clash Meta for Android（CMFA）](/clients/clash-meta/)**：用于承接原版已归档 Clash for Android（CFA）生态的现代继任者，底层均为 `Mihomo`。其中 FlClash 界面更现代、对新手规则展示更友好；CMFA 则完整保留了传统安卓 Clash 用户的操作习惯、覆写能力与第三方规则集兼容性。
3. **[Hiddify](/clients/hiddify/) 与 [Karing](/clients/karing/)**：均采用 `sing-box` 内核，适合既想在安卓上导入机场提供的 Clash YAML 订阅、又想体验更低内存占用的新协议（如 Hysteria 2 / TUIC / Reality）的用户。
4. **[NekoBox for Android](/clients/nekobox/)（重点风险警示）**：NekoBox 是早期推动 `sing-box` 在安卓端普及的重要项目，功能与可调参数非常丰富。但根据 `MatsuriDayo/NekoBoxForAndroid` 官方仓库的明确公告，**项目维护资源有限，且官方特别警示 Google Play 商店中出现的同名应用为非官方第三方控制或接管版本，严禁从 Google Play 下载安装！** 若非明确需要其特定高级参数，2026 年新装机安卓用户建议优先选择活跃维护的 FlClash、Hiddify、Karing 或官方 **SFA（sing-box for Android）**。

**安卓 APK 架构与后台保活提示**：在 GitHub Releases 下载 `.apk` 时，近五年上市的主流手机几乎全部为 64 位 ARM 处理器，应优先下载 **`arm64-v8a`** 版本，安装包体积比 `universal` 全架构包更小且运行效率更高；老旧 32 位设备或部分电视盒子才需考虑 `armeabi-v7a`。国产手机系统（MIUI/HyperOS、ColorOS、OriginOS、HarmonyOS）普遍存在激进的后台杀进程机制，务必在系统电池设置中将代理客户端设为“无限制/允许后台高耗电”，并在多任务界面锁定应用卡片，否则息屏几分钟后代理进程就会被系统回收导致断网。

### 3.4 iOS / iPadOS 客户端选型（付费应用与外区 Apple ID 安全警告）

受苹果生态封闭性与应用商店区域监管政策影响，iOS 端无法像桌面或安卓那样自由侧载 GitHub 安装包（除非使用企业证书或极少数内测名额），绝大多数稳定方案均通过**非中国大陆区 App Store** 发行。

| 客户端名称 | 收费与开源属性 | 支持订阅格式 | 核心定位与适用人群 |
| --- | --- | --- | --- |
| **[Shadowrocket（小火箭）](/clients/shadowrocket/)** | 付费买断（外区 App Store，非开源） | Base64 通用订阅、Shadowrocket 配置、部分 Clash/SIP008 | iOS 普及率最高的轻量级主力工具，协议覆盖全面（含 VLESS-Reality、Hysteria 2），适合 90% 的 iPhone 用户 |
| **[Stash](/clients/stash/)** | 付费应用（具体价格以当地商店展示为准） | Clash YAML、Mihomo 兼容规则、Stash 覆写 | 主打直接无缝读取桌面端 Clash 配置文件与策略组语法，适合习惯 Clash 规则体系的苹果生态用户 |
| **[Quantumult X（圈 X）](/clients/quantumult-x/)** | 付费应用（外区 App Store） | QX 专用配置、节点资源解析（Parser） | 主打精细化 HTTP 重写（Rewrite）、MitM 脚本解密、去广告与高定制分流，适合熟悉规则语法的进阶玩家 |
| **[Surge](/clients/surge/)** | 免费下载含高阶内购授权（非开源） | Surge `.conf` 专用配置 | 专业级网络调试套件，兼具深度抓包、Ponte 内网穿透、接管局域网流量与极佳稳定性，适合开发者与重度生产力用户 |
| **[Hiddify](/clients/hiddify/) / [Karing](/clients/karing/) / [sing-box (SFI)](/clients/sing-box/)** | 免费开源（依托外区 App Store 上架） | sing-box JSON、部分支持 Clash YAML / Base64 | 预算敏感型或追求跨系统配置完全统一的 `sing-box` 用户可选方案（具体商店区域上架状态随地区策略动态变化） |

> [!CAUTION] 外区 Apple ID 购买与严禁使用共享账号的铁律
> 1. 千万不要在“设置”最顶部的 **iCloud / Apple 账户** 登录任何他人提供、淘宝购买或网盘分享的所谓“免费共享小火箭账号”。一旦原账号持有人在后台开启“丢失模式”，你的整部 iPhone 会被瞬间远程锁定并面临勒索风险。
> 2. 正确做法是自行注册一个非大陆区（如美区）个人 Apple ID，通过正规渠道购买礼品卡充值后，**仅在 App Store 商店右上角头像内切换登录下载软件**，下载完成后即可切换回自己的国区主账号，完全不影响日常 iCloud 照片同步与微信支付。软件后续更新时需重新验证购买该应用的 Apple ID。

### 3.5 Linux 客户端选型（桌面包格式与无桌面服务器方案）

Linux 用户群体的使用场景明显分化为**图形桌面工作站**与**无桌面服务器 / SSH 终端环境（Headless）**两类：

- **Linux 桌面端（Ubuntu / Debian / Fedora / Arch）**：[Clash Verge Rev](/clients/clash-verge-rev/)、[v2rayN](/clients/v2rayn/)、[FlClash](/clients/flclash/)、[Hiddify](/clients/hiddify/) 与 [Karing](/clients/karing/) 均提供官方 Linux 构建。Ubuntu、Debian 与 Mint 用户下载 `.deb` 包（`sudo apt install ./xxx.deb`）；Fedora、RHEL 与 openSUSE 用户下载 `.rpm` 包；通用发行版或不想污染系统依赖库时可选 `.AppImage` 单文件镜像（注意 Ubuntu 22.04/24.04 运行 AppImage 前通常需要安装 `libfuse2`）。桌面端启用 TUN 模式同样需要授予核心二进制 `cap_net_admin` 权限或启动后台服务守护进程。
- **Linux 无桌面 / 服务器 / 容器环境（Headless）**：在纯命令行 SSH 环境下无法运行 GUI 窗口。此时有两种标准方案：第一，若需要网页可视化面板来管理订阅与分流，可部署开源项目 **v2rayA**，启动后通过本地浏览器访问其 WebUI（默认端口 `2017`）完成订阅更新与透明代理接管；第二，对于追求极致精简与稳定性的工程环境，推荐直接使用原生命令行核心 [Mihomo](/clients/mihomo/) 或 [sing-box](/clients/sing-box/)，将其注册为 `systemd` 守护服务，并在服务端关闭冗余日志输出，或结合外部控制台（如 Metacubexd / Zashboard）通过 RESTful API 远程切换节点。

### 3.6 OpenWrt 软路由客户端选型（fw3/fw4 与 Nikki 24.10+ 要求）

将代理直接部署在 OpenWrt / ImmortalWrt 软路由或旁路由上，可以让家中智能电视（Apple TV、Sony/LG TV）、游戏主机（PS5、Switch、Xbox）与全屋 IoT 设备无需单独安装客户端即可获得稳定的跨境网络能力。但软路由环境的排错复杂度远高于单机，选型前必须核对三个核心指标：**OpenWrt 版本与防火墙架构（`fw3` iptables vs `fw4` nftables）**、**路由器 CPU 指令集与剩余闪存空间**、以及**插件唯一性原则**。

| 软路由插件 | 底层核心 | 适用 OpenWrt 环境与防火墙 | 核心特点与选型建议 |
| --- | --- | --- | --- |
| **[OpenClash](/clients/openclash/)** | Mihomo (Clash.Meta) | 兼容 `fw3` (iptables) 与 `fw4` (nftables) | 生态最成熟、LuCI 图形面板功能最丰富，原生适配 Clash YAML 与高级覆写，适合老旧版本系统及重度规则玩家；需确保已安装 `dnsmasq-full`、`kmod-tun` 等基础依赖 |
| **[PassWall2](/clients/passwall2/)** | Xray / sing-box / Mihomo | 兼容 `fw3` 与 `fw4` | 专注于单节点订阅列表与直观分流规则，适合习惯 Base64 节点链接的用户；注意闪存较小的硬路由可能放不下 Xray + sing-box 双核心二进制 |
| **[Nikki（原 MihomoTProxy）](/clients/nikki/)** | Mihomo (Clash.Meta) | **强制要求 OpenWrt 24.10+（`firewall4` / `nftables`）** | 专为现代 nftables TProxy 架构设计的轻量级 Mihomo 透明代理套件，脚本结构比 OpenClash 更清爽、启动速度更快。**严禁在 OpenWrt 21.02 / 22.03 / 23.05 旧版强行安装** |
| **[HomeProxy](/clients/homeproxy/)** | sing-box | 面向 `firewall4` / `nftables`（OpenWrt / ImmortalWrt 新版） | 原生深度集成 `sing-box` 与 `nftables` 的轻量 LuCI 插件，资源占用极低，适合使用节点分享链接或 sing-box 分流规则的现代硬/软路由 |

> [!WARNING] 软路由绝对禁区：多插件并行冲突
> 切勿为了“备用”而同时在 OpenWrt 上启用 OpenClash 和 PassWall2（或 Nikki 与 HomeProxy 同时运行）。透明代理依赖对路由表、`mangle` / `nftables` 链与 `53` 号 DNS 端口的独占式劫持，双开必然导致 DNS 死循环、局域网全员断网或 CPU 跑满死机。切换插件前，务必先完整“停用并关闭”当前插件的后台服务。

## 四、三大核心客户端专题导读

### 4.1 Clash Verge Rev 专题导读（现代桌面 Mihomo 标准）

作为原版 Clash Verge 停止维护后的社区主力继承者，[Clash Verge Rev](/clients/clash-verge-rev/) 已经成为 2026 年 Windows、macOS 与 Linux 桌面端事实上的 Mihomo 图形标准。相比早期同类工具，它的优势不仅在于 Tauri 框架带来的较低内存占用（通常稳定在几十 MB 级别），更在于将“开箱即用”与“深度覆写”平衡得十分出色。

对于初次上手的用户，建议按照 [Clash Verge Rev 新手图文设置指南](/guides/clash-verge-rev-setup/) 完成基础四步：导入订阅 → 切换至 `Rule` 规则模式 → 在设置页核对默认端口并开启开机自启 → 根据是否使用命令行/游戏/微软商店决定是否安装服务模式开启 TUN。对于有精细化需求的用户，其内置的 **全局扩展脚本（Global Merge / Script）** 可以在不破坏机场订阅原始更新的基础上，自动向配置文件注入自定义规则（例如把公司内网域名设为 `DIRECT`、把 Claude 与 ChatGPT 强制固定到特定地区手动选择组）。切记不要直接手动修改由机场 URL 下载下来的原始缓存 YAML 文件，因为每次触发[订阅自动更新](/guides/automatic-update/)时本地直接修改都会被远程拉取的新配置覆盖；所有个人定制都应当通过 Merge 或 JavaScript 覆写脚本实现，详细配置逻辑见 [Clash 配置文件结构解析](/guides/clash-config/)。

### 4.2 v2rayN / v2rayNG 专题导读（2dust 多核心与轻量订阅生态）

由开发者 `2dust` 维护的桌面端 [v2rayN](/clients/v2rayn/) 与安卓端 [v2rayNG](/clients/v2rayng/)，共同构成了中文代理圈寿命最长、体量最轻的开源工具体系。近年来 `v2rayN` 经历了里程碑式的跨平台重构：它不仅早就突破了“只能运行 V2Ray”的局限，支持一键切换 **Xray-core、sing-box 与 Mihomo** 三大底层内核，还正式提供了对 macOS（x64/arm64）与 Linux（DEB/AppImage）的官方发行支持。

理解这一对兄弟软件的关键在于区分它们的**配置承载能力**：桌面端 `v2rayN` 由于集成了 `sing-box` 与 `Mihomo` 内核作为可选后端，几乎能够通吃 Base64 节点列表、标准节点分享链接以及经过映射转化的 Clash YAML 配置，极其适合“自己搭了一个 VPS 节点 + 买了两家机场做备用 + 需要对单个节点精准测速与路由”的进阶用户。而移动端 `v2rayNG` 为了保持极致轻量与低功耗，定位是纯粹的 `Xray-core` 节点管理器：它接收机场下发的 Base64 通用订阅或 `vless://` / `trojan://` / `ss://` 单条分享链接，配合内置的轻量路由预设（绕过局域网及大陆地址）运行。如果你习惯机场预先编排好的复杂“流媒体自动测速组、AI 独立分组”等 Clash YAML 策略组功能，安卓端建议直接配合 [FlClash](/clients/flclash/) 或 [Clash Meta for Android](/clients/clash-meta/) 使用，避免在 v2rayNG 中反复折腾手工分流规则。

### 4.3 Shadowrocket 专题导读（iOS 小火箭生态与排查要点）

在 iOS 生态中，[Shadowrocket（俗称小火箭）](/clients/shadowrocket/) 凭借极高的装机普及率、极低的单次买断成本以及对新协议的快速跟进能力，长期稳居苹果用户首选位置。与桌面端动辄数百行的 YAML 策略配置不同，Shadowrocket 面向手机触屏交互做了高度收敛：绝大多数机场后台都提供“一键导入 Shadowrocket”按钮，点击后会自动拉起 App 并写入加密节点列表。

然而，新手在使用小火箭时最常踩中三个隐性坑位：第一是**默认全局路由配置未开启分流**，部分用户在添加完节点后直接开启连接，未在“全局路由”中切换为“配置（Config）”而留在了“代理（Proxy）”或“直连（Direct）”，导致要么访问淘宝微信全部绕道海外消耗大量[机场流量](/routes/multipliers/)，要么打开海外网站依然直连超时；第二是**连通性测试方式误判**，小火箭默认节点列表测试多为 TCP Ping（只测三次握手延迟，不代表真实代理通路可用或能否解锁流媒体），建议在设置中将测速方式切换为 `URLTest`（或 `CONNECT`），通过真实请求返回状态码判断节点是否存活；第三是**多端共用误区**，虽然支持在 Apple Silicon Mac 上运行 iOS 版小火箭，但 iOS 端配置文件与桌面端 Clash YAML 并不直接等价，跨设备同步时建议依托支持通用订阅的服务商分别下发对应客户端格式，而不要试图把某端导出文件强行互拷。

## 五、Mihomo 与 sing-box 双核心生态深度对比

随着原版 Clash 退出历史舞台与 V2Ray 原生架构的老化，2026 年的开源代理内核已经收敛为 **Mihomo（原 Clash.Meta）** 与 **sing-box** 双雄并立的格局（外加聚焦 Xray 协议栈的 `Xray-core`）。了解两大底层核心的技术路线差异，能帮你彻底看懂为什么不同客户端之间配置文件不能随便混用。

| 比较维度 | Mihomo（原 Clash.Meta）核心生态 | sing-box 核心生态 |
| --- | --- | --- |
| **仓库与起源** | `MetaCubeX/mihomo`，在原 Clash 基础上重写并扩展现代协议栈 | `SagerNet/sing-box`，全新设计的通用网络代理平台与路由引擎 |
| **配置格式体系** | **YAML 格式**，高度兼容历史 Clash 语法、`proxy-groups` 策略组与 `Provider` | **结构化 JSON 格式**，严格区分 `inbounds`、`outbounds`、`route` 与 `dns` 模块 |
| **现代协议支持** | 原生支持 VLESS-Reality、Hysteria 2、TUIC v5、AnyTLS、Shadowsocks、Trojan、VMess | 原生支持 VLESS-Reality、Hysteria 2、TUIC v5、AnyTLS、ShadowTLS、WireGuard、SSH 等 |
| **规则与分流效率** | 引入二进制 `.mrs` 规则集（Rule-Set），加载数十万条域名规则仅占极少内存 | 采用二进制 `.srs` 规则集（Rule-Set），内存占用控制与路由匹配开销表现极佳 |
| **TUN 与网络栈** | 支持 `system`、`gvisor` 与 `mixed`（推荐 TCP 走系统栈 + UDP 走 gvisor） | 同样提供 `system`、`gvisor`、`mixed` 栈，并在移动端官方客户端深度优化内存限制 |
| **机场后台原生支持** | **极高**，几乎所有提供第三方订阅的机场均默认下发标准 Clash/Mihomo YAML | **中等上升中**，部分老牌机场未单独提供 sing-box JSON 转换，需依赖客户端封装转换 |
| **代表客户端矩阵** | [Clash Verge Rev](/clients/clash-verge-rev/)、[FlClash](/clients/flclash/)、[CMFA](/clients/clash-meta/)、[OpenClash](/clients/openclash/)、[Nikki](/clients/nikki/) | 官方 [sing-box (SFA/SFI/SFM)](/clients/sing-box/)、[Hiddify](/clients/hiddify/)、[Karing](/clients/karing/)、[HomeProxy](/clients/homeproxy/) |

**双核选型实用判断**：如果你购买的机场直接提供高质量的 Clash/Mihomo 订阅（包含分组好的地区测速组、AI 独立分组、流媒体分组），且你在桌面端希望方便地使用 JavaScript 脚本覆写或使用图形界面逐个切换节点，**Mihomo 生态（Clash Verge Rev / FlClash / OpenClash / Nikki）是目前生态衔接最顺滑、调试成本最低的路线**。相反，如果你追求跨手机与电脑的极简一致性、关注移动端长期后台驻留的低内存上限（尤其是 iOS Network Extension 严格限制内存上限约 50MB 的场景下），或者你已经熟悉 JSON 结构化路由与 `HomeProxy` 软路由部署，那么 **sing-box 生态（官方客户端 / Hiddify / Karing / HomeProxy）** 会展现出非常优异的资源利用率。值得注意的是，[Hiddify](/clients/hiddify/) 与 [Karing](/clients/karing/) 之所以备受新手青睐，正是因为它们在 sing-box 底层之上内置了“Clash 订阅到 sing-box 配置的自动转换层”，让用户不必等待机场专门适配即可享受 sing-box 核心的性能红利。

## 六、操作系统 × 客户端 × 协议全维度兼容矩阵表

下表汇总了本站收录的 18 个核心软件与生态项目在操作系统、底层内核、主流现代协议、订阅格式及发行定位上的核心对照，方便在跨设备部署前一次性核验兼容性：

| 客户端 / 项目 | 支持系统 | 底层内核 | VLESS-Reality / Hysteria 2 / AnyTLS | 主要支持订阅格式 | 开源与定价 | 入门难度 |
| --- | --- | --- | --- | --- | --- | --- |
| **[Clash Verge Rev](/clients/clash-verge-rev/)** | Win / macOS / Linux | Mihomo | 完整支持 | Clash / Mihomo YAML | 开源免费 | 新手友好 |
| **[v2rayN](/clients/v2rayn/)** | Win / macOS / Linux | 多核心切换 | 完整支持（取决于核心） | Base64 / JSON / YAML | 开源免费 | 进阶配置 |
| **[FlClash](/clients/flclash/)** | Win / Android / macOS / Linux | Mihomo | 完整支持 | Clash / Mihomo YAML | 开源免费 | 新手友好 |
| **[Hiddify](/clients/hiddify/)** | Win / Android / iOS / macOS / Linux | sing-box | 完整支持 | sing-box JSON / YAML / Base64 | 开源免费 | 新手友好 |
| **[Karing](/clients/karing/)** | Win / Android / iOS / macOS / Linux | sing-box | 完整支持 | Clash YAML / JSON / Base64 | 开源免费 | 新手友好 |
| **[Clash Meta (CMFA)](/clients/clash-meta/)** | Android（主） | Mihomo | 完整支持 | Clash / Mihomo YAML | 开源免费 | 进阶配置 |
| **[v2rayNG](/clients/v2rayng/)** | Android | Xray-core | 支持 VLESS-Reality；Hysteria 2 需插件或核心版本配合 | Base64 节点列表 / 分享链接 | 开源免费 | 新手友好 |
| **[Shadowrocket](/clients/shadowrocket/)** | iOS / iPadOS（可运行于 M 系 Mac） | 私有独立核心 | 完整支持主流新协议 | Base64 / 专属配置 / 部分 Clash | 闭源付费 | 新手友好 |
| **[Stash](/clients/stash/)** | iOS / macOS | 私有独立核心 | 需核对当前商店版更新说明 | Clash YAML / Stash 覆写 | 闭源付费 | 进阶配置 |
| **[Quantumult X](/clients/quantumult-x/)** | iOS / iPadOS | 私有独立核心 | 部分新协议支持需核对版本说明 | QX 专用配置 / 资源解析 | 闭源付费 | 进阶配置 |
| **[Surge](/clients/surge/)** | iOS / macOS | 私有独立核心 | 持续更新支持现代协议 | Surge `.conf` 配置 | 闭源含内购 | 专业/路由 |
| **[NekoBox](/clients/nekobox/)** | Android / Win / Linux | sing-box | 完整支持 | sing-box / Base64 / 部分 Clash | 开源免费（注意维护与渠道风险） | 进阶配置 |
| **[Mihomo 核心](/clients/mihomo/)** | 全平台 CLI / 服务 | Mihomo | 原生支持 | Mihomo / Clash YAML | 开源免费 | 专业/路由 |
| **[sing-box](/clients/sing-box/)** | 全平台 CLI 及 SFA/SFI/SFM | sing-box | 原生支持 | sing-box JSON | 开源免费 | 专业/路由 |
| **[OpenClash](/clients/openclash/)** | OpenWrt | Mihomo | 完整支持 | Clash / Mihomo YAML | 开源免费 | 专业/路由 |
| **[PassWall2](/clients/passwall2/)** | OpenWrt | 多核心切换 | 完整支持 | Base64 / 分享链接 | 开源免费 | 专业/路由 |
| **[Nikki](/clients/nikki/)** | OpenWrt 24.10+ | Mihomo | 完整支持 | Mihomo / Clash YAML | 开源免费 | 专业/路由 |
| **[HomeProxy](/clients/homeproxy/)** | OpenWrt / ImmortalWrt (fw4) | sing-box | 完整支持 | 节点链接 / sing-box 出站 | 开源免费 | 专业/路由 |

## 七、安装包选择及官方仓库核验（GitHub Releases + SHA256）

在网络代理工具的部署流程中，**最大的安全风险往往不是节点本身，而是下载到了被搜索引擎广告或山寨站调包的“带毒客户端”**。过去两年中，大量假冒的中文网站（例如伪造成官方域名的 `.net`、`.cn` 或 `.org` 站点）通过购买搜索竞价排名诱导用户下载修改版安装包，一旦运行就会在本地静默窃取浏览器 Cookie、加密货币钱包助记词或机场订阅链接。因此，本站绝不链接任何未经核实的第三方聚合下载站，所有安装包均应遵循以下“**仓库所有者精准确认 + SHA256 哈希核验**”原则（更多防骗技巧见 [客户端安全防钓鱼指南](/safety/security/)）：

### 7.1 已核验官方源清单（2026-11-23 核验）

在浏览器访问 GitHub Releases 页面时，请务必逐字核对地址栏中的 `所有者/仓库名` 是否与下表完全一致（警惕仅仅替换一个字母或增加 `-cn` 后缀的李鬼仓库）：

| 客户端 / 核心 | 已核验官方仓库或商店来源 | 下载文件名选型核心提示 |
| --- | --- | --- |
| **Clash Verge Rev** | `github.com/clash-verge-rev/clash-verge-rev` | Windows 选 `x64-setup.exe`（或 ARM64）；macOS 区分 `aarch64.dmg` (M芯片) 与 `x64.dmg` (Intel) |
| **v2rayN** | `github.com/2dust/v2rayN` | Windows 新手优先选包含内核的 `v2rayN-windows-64-WithCore.zip` |
| **v2rayNG** | `github.com/2dust/v2rayNG` | Android 主流设备优先选 `arm64-v8a.apk`，确认包大小及开发者签名一致 |
| **FlClash** | `github.com/chen08209/FlClash` | 区分桌面端 `setup.exe` / `dmg` / `deb` 与安卓 `arm64-v8a.apk` |
| **Hiddify** | `github.com/hiddify/hiddify-app` | 全平台发布于同一 Releases 页，iOS 端同时通过官方 App Store 分发 |
| **Karing** | `github.com/KaringX/karing` | 支持桌面端、安卓 APK 与 iOS App Store（需确认账户区域上架情况） |
| **Clash Meta for Android** | `github.com/MetaCubeX/ClashMetaForAndroid` | 承接原 CFA 生态，安卓下载对应 `arm64-v8a` 发布包 |
| **Mihomo 内核** | `github.com/MetaCubeX/mihomo` | 核心二进制仓库；Linux 用户区分 `amd64` / `arm64` 及 `compatible` 指令集级别 |
| **sing-box 官方生态** | `sing-box.sagernet.org`（官方站点与文档） | 可在此查询官方 SFA / SFI / SFM 与各架构服务端发布通道 |
| **NekoBox for Android** | `github.com/MatsuriDayo/NekoBoxForAndroid` | **仅限 GitHub 官方源核验，严禁从 Google Play 下载同名第三方接管包** |
| **OpenClash / PassWall2 / Nikki / HomeProxy** | `vernesong/OpenClash`、`xiaorouji/openwrt-passwall2`、`nikkinikki-org/OpenWrt-nikki`、`immortalwrt/homeproxy` | 软路由安装 `.ipk` 或 `.apk`（OpenWrt 新版包管理器）前必须核对路由器平台架构与系统版本 |
| **Shadowrocket / Quantumult X / Surge / Stash** | 苹果官方 App Store（`apps.apple.com`）与 Surge 官网 `nssurge.com` / Stash 官网 `stash.ws` | App Store 核验开发者名称；非大陆区商店购买，拒绝第三方 IPA 签名分发页 |

### 7.2 本地 SHA256 校验实操命令

从 GitHub Releases 下载安装包后，在页面底部展开 `Assets` 或查看发布说明中的 `SHA256` 校验列表（若官方附带 `.sha256` 文本文件也可一并下载对比）。安装前在终端执行对应系统的单行命令，核对输出的 64 位十六进制字符串是否与官方完全一致：

```powershell
# Windows PowerShell（将路径替换为实际下载的安装包路径）
Get-FileHash "$env:USERPROFILE\Downloads\Clash.Verge_x64-setup.exe" -Algorithm SHA256
```

```bash
# macOS 终端校验命令
shasum -a 256 ~/Downloads/Clash.Verge_aarch64.dmg

# Linux 终端校验命令
sha256sum ~/Downloads/Clash.Verge_amd64.deb
```

如果计算出的哈希值与官方页面哪怕相差一个字符，都说明文件在下载过程中损坏或已被中间人篡改，**必须立即删除并重新获取**。

## 八、订阅导入方式与格式映射全解

选好并安全安装客户端之后，下一步就是将机场服务商提供的订阅连接写入软件。不同的客户端接收完全不同的数据格式，弄错格式是导致“导入报错 400/解析失败/节点列表为空”的首要原因，详细原理也可配合阅读 [订阅链接是什么](/guides/subscription/) 与 [订阅格式全解（YAML / Base64 / JSON）](/guides/subscription-formats-explained/)。

### 8.1 四种常见订阅导入路径

1. **一键导入（URL Scheme 唤起）**：点击机场面板上的“一键导入 Clash / 小火箭”，浏览器会尝试唤起本地注册的协议头（如 `clash://install-config?url=...` 或 `shadowrocket://add/...`）。这种方式最省事，但在部分内置浏览器（如微信、QQ 浏览器）或隐私拦截插件下常被阻断，且容易出现同一台电脑安装了多个 Clash 系客户端时唤起错软件的情况。
2. **手动复制订阅 URL 导入（最稳妥通用）**：在服务商控制面板点击“复制订阅地址”，打开本地客户端进入 Profiles / 订阅管理页粘贴该 `https://...` 链接并点击更新。建议同时在客户端配置中打开[自动更新订阅](/guides/automatic-update/)（通常设置 12 至 24 小时同步一次），以便服务商更换域名入口或更新节点 IP 后自动生效。
3. **二维码扫描导入**：适合手机端操作。电脑登录机场后台展示订阅二维码，用手机端 Shadowrocket、v2rayNG 或 FlClash 右上角扫一扫直接添加，避免在手机小键盘上手动输入冗长的 Token 链接。
4. **本地文件导入 / 配置转换**：当机场域名在本地网络环境下遭到 DNS 污染、导致客户端直接请求订阅 URL 报 `Timeout` 或 `EOF` 时，可通过浏览器下载机场提供的离线 `.yaml` 配置文件并直接拖入客户端；若是客户端不支持机场的原生格式（例如机场只提供 Clash YAML 但你想用 v2rayNG，或者你想把 Base64 转成完整策略组），应优先使用服务商官方提供的格式参数切换（如 URL 末尾附加 `?flag=clash` 或 `?flag=v2ray`），切忌随意将私密订阅 Token 粘贴到来源不明的公共在线转换网站中，以防订阅流量被第三方盗刷。

### 8.2 主流订阅格式与客户端映射对照

| 机场下发格式 | 数据形态特征 | 原生支持的客户端 | 若格式不匹配的常见报错与解决对策 |
| --- | --- | --- | --- |
| **Clash / Mihomo YAML** | 明文文本，含 `proxies:`、`proxy-groups:`、`rules:` 缩进结构 | Clash Verge Rev、FlClash、CMFA、Stash、OpenClash、Nikki（Hiddify/Karing 内置转换支持） | 强行导入 `v2rayNG` 会报错“无效订阅/无节点”；请改用 Mihomo 系端或切换机场的 Base64 订阅链接 |
| **Base64 通用节点列表** | 一整段无换行随机字母数字字符串，解码后为多行 `vless://`、`vmess://`、`ss://`、`trojan://` | v2rayNG、v2rayN、Shadowrocket、PassWall2、HomeProxy | 直接导入 Clash Verge Rev 会提示 YAML 解析失败；需在机场后台选择“Clash 订阅”或使用 `v2rayN` / `Karing` |
| **sing-box JSON** | 严谨的 JSON 对象，包含 `inbounds`、`outbounds`、`route`、`dns` 数组 | 官方 sing-box（SFA/SFI/SFM）、Hiddify、Karing、NekoBox | 原生不兼容老式 Clash 客户端；机场若未提供专用 JSON，可选用自带转换能力的 Karing 或 Hiddify |
| **Surge `.conf` / QX 专用配置** | INI 段落式文本，含 `[General]`、`[Proxy]`、`[Rule]` 等区块 | Surge、Quantumult X（各自独立语法不完全通用） | 通常需在机场面板专门复制对应标签页链接，或开启客户端自带的资源解析功能 |

## 九、常见配置错误、排查矩阵与版本核验日志

即便安装好了正确版本的客户端并成功导入了订阅，初次运行或切换网络环境时仍常遇到“节点明明有延迟却打不开网页”“打开后过十分钟就断流”“开启 TUN 导致 WSL 或 Docker 无法联网”等问题。下表总结了五类最高频的配置错误及直达排查路径：

| 高频故障现象 | 核心诱因分析 | 快速排查与修复入口 |
| --- | --- | --- |
| **所有 VLESS / Trojan / Reality 节点握手失败或超时** | 本机系统时钟与国际标准时间误差超过 30 至 60 秒，导致 TLS 证书校验或 Reality 时间戳验证直接被服务器拒绝 | 核对并开启系统时间自动同步，详见 [系统时间偏差导致 TLS/Reality 失败修复](/guides/system-time-tls-fix/) 与 [连接超时排查](/troubleshooting/timeout/) |
| **开启 TUN 虚拟网卡后 WSL2、Docker 或局域网设备失联** | TUN 虚拟网段（如 `198.18.0.1/16`）与容器虚拟桥接网段发生路由表抢占，或未排除私有网段直连 | 在客户端配置路由排除规则或切换 `mixed` 栈，详见 [TUN 与 WSL/Docker 冲突修复](/troubleshooting/tun-wsl-docker-conflict/) 与 [TUN 故障排查](/troubleshooting/tun/) |
| **订阅导入报 SSL 错误、网络超时或返回空节点** | 机场订阅域名被本地宽带劫持、本地正开着另一款代理软件冲突，或复制链接时多带了空格/选错了客户端格式 | 关闭冲突代理尝试直连或切换备用订阅域，详见 [订阅拉取与解析失败排查](/troubleshooting/subscription/) |
| **能连上代理，但网页打不开或海外服务依然提示地区不支持** | 客户端 DNS 设置不当导致本地 ISP DNS 泄漏，或者本地未关闭的 IPv6 流量直接穿透绕过了代理隧道 | 启用远程加密 DNS 并关闭不稳定 IPv6 出站，详见 [DNS 错误与泄漏检测](/troubleshooting/dns/) 与 [AI 及流媒体诊断](/ai-streaming/) |
| **软件打开即闪退、端口被占用或代理突然断开** | 端口 `7890`/`7897` 与其他软件冲突，系统存在残留服务未退出，或系统休眠后内核进程异常挂起 | 检查端口占用与防火墙拦截规则，详见 [客户端启动异常](/troubleshooting/startup/) 与 [连接频繁断开排查](/troubleshooting/disconnected/) |

### 客户端版本、归档状态与术语核验日志（2026-11-23）

为确保全站文档对软件名称、开源仓库归属、系统版本前提与停更状态的严谨一致性，以下核验记录会随工程迭代同步更新，防止新手用户在过时攻略误导下走弯路：

| 核验对象 | 当前状态 | 核验结论与术语口径 | 官方参考来源 |
| --- | --- | --- | --- |
| **Clash / Clash for Windows / CFA** | **已归档停止维护** | 原项目已删除/归档，严禁从第三方镜像站下载所谓“延续版 CFW”；桌面端统一引导迁移至 Clash Verge Rev 或 FlClash，安卓端引导至 CMFA | [Clash Meta 生态说明](/clients/clash-meta/) |
| **Clash.Meta → Mihomo** | 活跃维护 | 原 Clash.Meta 内核已更名为 Mihomo，仓库归属 `MetaCubeX/mihomo`，配置文件仍兼容常规 Clash YAML 并支持扩展字段与 `.mrs` 规则集 | `github.com/MetaCubeX/mihomo` |
| **Clash Verge → Clash Verge Rev** | 活跃维护 | 原版 Clash Verge 停止后由社区接力维护为 Clash Verge Rev，仓库为 `clash-verge-rev/clash-verge-rev`，内置 Mihomo 内核 | [Clash Verge Rev 专题](/clients/clash-verge-rev/) |
| **NekoBox for Android** | **维护注意** | 官方仓库明确提示维护资源有限，且特别警示 **Google Play 上的同名包为非官方第三方控制版本**，仅允许从 GitHub Releases 核验下载 | [NekoBox 风险与状态页面](/clients/nekobox/) |
| **OpenWrt-nikki（原 MihomoTProxy）** | 活跃维护 | 项目已从 MihomoTProxy 更名为 Nikki，**明确要求 OpenWrt 24.10 及以上版本**（`firewall4` / `nftables`），不兼容旧版 21.02/22.03/23.05 | [Nikki 软路由专题](/clients/nikki/) |
| **v2rayN 跨平台版本** | 活跃维护 | v2rayN 已不再局限于 Windows，官方 `2dust/v2rayN` Releases 同时提供 macOS（x64/arm64）与 Linux（DEB/AppImage）构建及多核心切换 | [v2rayN 多核心教程](/clients/v2rayn/) |
| **Stash 官方商店链接** | 部分待核实 | Stash 为 iOS/macOS 商业付费软件，官网为 `stash.ws`，不同地区 App Store 上架状态与定价需以实时商店页面为准 | [Stash 客户端说明](/clients/stash/) |

## 十、常见问题（FAQ）

### 第三方通用客户端和机场品牌专属客户端有什么本质区别？

第三方通用客户端（如 Clash Verge Rev、v2rayN、Shadowrocket、Hiddify）开源或上架正规应用商店，可导入任意支持标准订阅的服务商配置并自主管理分流规则与 DNS；品牌专属客户端通常闭源、绑定单一机场账号体系，一旦更换服务商或遭遇停服即无法复用，且难以独立审计本地流量劫持与遥测行为。

### 为什么绝对不能再下载或使用 Clash for Windows（CFW）与 Clash for Android（CFA）？

原版 Clash 内核、Clash for Windows 与 Clash for Android 均已正式归档并停止维护，既无法适配 VLESS-Reality、Hysteria 2、AnyTLS 等现代加密传输协议，也不再修复已知安全漏洞。搜索引擎上打着“中文官网”或“复活版”旗号分发的 CFW 安装包极易被植入木马。桌面端应迁移至 Clash Verge Rev 或 FlClash，安卓端应选用 Clash Meta for Android 或 v2rayNG。

### 如何核对代理客户端下载包的真实性与安全性，防止下载到钓鱼木马？

唯一可信的校验方式是从客户端对应 GitHub 官方 Releases 页面或苹果官方 App Store 获取安装包，切勿通过第三方聚合下载站、百度搜索广告或网盘链接下载。在 Windows PowerShell 中使用 `Get-FileHash` 或在 macOS/Linux 终端使用 `sha256sum` 核对文件哈希值与官方 Release 说明是否一致，确认仓库所有者拼写无误后再执行安装。

### Windows 安装 Clash Verge Rev 后无法启动或白屏怎么办？启用 TUN 模式需要注意什么？

基于 Tauri 的 Clash Verge Rev 在 Windows 上依赖系统的 Microsoft Edge WebView2 Runtime，精简版系统或部分 LTSC 系统缺失该组件时会出现白屏或无法渲染界面，需提前补装官方 WebView2 组件。若需开启 TUN 虚拟网卡接管全局或 WSL/游戏流量，必须先在软件设置中安装并启动 Service Mode（服务模式），或以管理员身份运行客户端。

### 苹果 iOS 设备为什么在国区 App Store 搜不到 Shadowrocket（小火箭）？可以用共享账号下载吗？

受区域应用商店合规政策限制，Shadowrocket、Stash、Quantumult X 与 Surge 均未在中国大陆区 App Store 上架。必须使用非大陆区（如美区、港区、台区）个人名下注册的 Apple ID 登录商店后自行付费购买正版。严禁在设备系统设置“iCloud”中登录来源不明的第三方共享账号，否则极易被恶意开启“查找我的 iPhone”导致远程锁机勒索。

### v2rayN 下载页面有多个压缩包，WithCore 是什么意思？v2rayNG 能直接导入 Clash 订阅链接吗？

GitHub 上的 `2dust/v2rayN` Releases 会区分仅含前端外壳的包与附带 Xray/sing-box/Mihomo 内核的 `WithCore` 整合包，新手在 Windows 上应优先下载带 `WithCore` 的对应架构包（x64 或 arm64），避免打开后提示缺少核心。Android 端的 v2rayNG 仅解析 Base64 节点列表与标准分享链接，不支持复杂 Clash YAML 策略组语法，若服务商仅提供 Clash 格式订阅，安卓端应改用 FlClash 或 Clash Meta for Android。

### 为什么官方特别警告不要从 Google Play 下载 NekoBox for Android？

NekoBox for Android 官方仓库（`MatsuriDayo/NekoBoxForAndroid`）已多次发布公告提示项目维护资源有限，并明确警示 Google Play 商店中出现的同名安装包属于非官方第三方控制或接管版本，存在隐私与安全性风险。新装机安卓用户建议优先评估持续活跃的 Hiddify、Karing、FlClash 或官方 sing-box（SFA）。

### OpenWrt 软路由选 OpenClash、PassWall2、Nikki 还是 HomeProxy？能同时开启两个插件吗？

严禁在同一个 OpenWrt 路由中同时启用两个透明代理插件，否则 iptables/nftables 规则与 DNS 端口劫持会互相冲突导致全网断联。习惯 Clash YAML 策略组且使用旧版 fw3 或 23.05 系统的用户可选 OpenClash；偏好单节点直选与 Xray/sing-box 后端可选 PassWall2；使用 OpenWrt 24.10 及以上版本（firewall4/nftables）的现代环境则优先考虑精简高效的 Nikki（原 MihomoTProxy）或原生 sing-box 方案 HomeProxy。

### Mihomo 内核与 sing-box 内核应该怎么选？两者配置文件通用吗？

两者配置文件并不通用：Mihomo（原 Clash.Meta）采用 YAML 格式，完整兼容传统 Clash 策略组、Proxy-Provider 与自定义脚本覆写，规则生态极其成熟，适合 Clash Verge Rev、FlClash、OpenClash；sing-box 采用结构化 JSON 格式，内存占用更低且支持全平台统一协议栈，适合追求轻量高性能或使用 Hiddify、Karing、HomeProxy 的用户。

### 导入订阅链接后提示格式错误或节点全部超时，应该优先排查哪些客户端配置？

首先核对订阅链接格式与当前客户端是否匹配（例如把 Clash YAML 直接喂给只认 Base64 的 v2rayNG 会直接报错）；其次检查本机系统时间误差是否超过 30 秒，时间不准会导致 TLS 与 Reality 握手失败；若仅特定网页打不开或连接超时，则应依次核查系统代理端口是否被占用、TUN 虚拟网卡是否与 WSL/Docker 网段冲突以及本地 DNS 解析是否异常。
