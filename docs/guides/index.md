---
title: "使用教程总览：机场订阅、Clash 配置、分流规则与 TUN 模式全流程指南"
description: "代理客户端从零上手全流程教程：涵盖使用前准备、Windows/Android/iPhone/macOS 分平台配置路线、Base64/Clash YAML/sing-box JSON 订阅导入、Rule/Global/Direct 代理模式、系统代理与 TUN 虚拟网卡、Fake-IP vs Redir-Host DNS、GEOSITE/Rule-Providers 分流、Merge/JS 覆写防覆盖、WebDAV 同步与 curl 命令行验证。"
lastUpdated: 2026-11-23
schemaType: CollectionPage
itemListCount: 9
faq:
  - q: "刚买完机场服务的新手，应该按什么顺序完成配置？"
    a: "建议严格按照“核对订阅模式 → 从官方渠道下载校验客户端 → 导入订阅并确认格式 → 切换 Rule 规则模式并开启系统代理 → 终端与网页实测验证 → 配置 Merge 覆写防止更新被清空”的顺序推进。在确认节点连通前不要急着修改复杂 DNS 或脚本。"
  - q: "系统代理和 TUN 模式有什么区别？日常必须开启 TUN 吗？"
    a: "系统代理只在操作系统层提供本地端口转发，仅对浏览器和遵守系统代理配置的桌面应用生效；而终端命令行（git、curl、npm）、Docker、海外联机游戏以及部分不读取系统代理的桌面软件，必须依靠 TUN 虚拟网卡从系统路由层接管。纯网页浏览开系统代理即可，开发或游戏场景建议开启 TUN。"
  - q: "为什么浏览器打开机场订阅链接显示乱码或网页，而客户端却能拉取节点？"
    a: "因为服务端会根据请求头中的 User-Agent 自动判断返回格式：普通浏览器访问通常返回 Base64 编码节点文本或面板提示页，而 Clash Verge Rev、FlClash 等客户端发送特定 User-Agent 后，服务端才会下发标准的 Clash YAML 配置文件。若在无响应时可用 curl 指定 User-Agent 排查真实响应体。"
  - q: "为什么不要直接编辑客户端下载到本地的原始订阅 YAML 文件？"
    a: "无论是手动点击“更新订阅”还是定时自动刷新，客户端都会用服务端新下发的文件完整覆盖本地原订阅文件，所有手工修改都会瞬间丢失。正确的工程做法是使用全局扩展配置（Merge）或扩展脚本（Script）机制，让本地覆写逻辑在每次更新订阅后自动叠加生效。"
  - q: "Rule（规则）、Global（全局）和 Direct（直连）三种代理模式该选哪个？"
    a: "日常长期使用必须停留在 Rule（规则）模式，做到国内网站直连、海外网站按规则走对应节点。Global（全局）模式会把所有流量包括国内网站、网银与微信一并送去海外绕一圈，仅适合在怀疑规则出错时短时排除故障；Direct（直连）则相当于关闭分流全部本地直连。"
  - q: "Fake-IP 和 Redir-Host 两种 DNS 模式在实际使用上有什么区别？"
    a: "Fake-IP 会向本机迅速返回一个 198.18.0.0/16 保留网段的虚拟映射地址，省去等待海外真实 DNS 解析的往返耗时，响应更快，但在部分需要校验真实 IP 的联机游戏、局域网容器或内网穿透环境下易产生冲突；Redir-Host 解析并下发真实 IP，兼容性高，但对内置 DNS 的防泄漏配置要求更严格。"
  - q: "为什么还能在网上搜到 Clash for Windows 和 Clash for Android？可以继续用吗？"
    a: "不能。原版 Clash、Clash for Windows 与 Clash for Android 均已停止维护并归档，不再适配 VLESS-Reality、Hysteria 2 等现代协议，且中文搜索引擎中充斥着植入窃密木马的仿冒安装包。桌面端请使用 Clash Verge Rev、FlClash 或 v2rayN，安卓端请使用 ClashMetaForAndroid、FlClash 或 v2rayNG。"
  - q: "使用在线订阅转换网站把 Base64 转成 Clash 配置安全吗？"
    a: "存在隐私与凭证泄露风险。你的订阅链接中通常包含唯一鉴权 Token，一旦提交给来路不明的第三方在线转换接口，对方服务器记录下链接即可直接盗用你的节点流量与账号。优先选择服务端原生下发的对应格式，或直接使用 Hiddify、Karing 等支持多格式本地解析的客户端。"
  - q: "Windows 开启 TUN 模式后，为什么 WSL2、Docker 或局域网设备访问变慢或断网？"
    a: "TUN 模式会生成最高优先级的虚拟网卡与默认路由规则，容易与 WSL2、Docker Desktop 的虚拟子网段以及内网保留 IP 产生路由环路或劫持冲突。解决方式是在配置文件中将 172.16.0.0/12、192.168.0.0/16 等私有网段加入 route-exclude-address 或 bypass 清单，并按需配置本地回环排除。"
  - q: "配置完成后如何不靠感觉，用客观命令确认代理真的走通了？"
    a: "打开终端运行 curl -I --proxy http://127.0.0.1:7897 https://www.google.com 核对系统代理端口连通性，再用不带 --proxy 参数的 curl -s https://api.ip.sb/geoip 验证 TUN 虚拟网卡是否已接管终端并成功返回海外落地 IP 与地区码。"
---

# 使用教程总览：机场订阅、Clash 配置、分流规则与 TUN 模式全流程指南

<div class="answer-first-box">
  <div class="answer-first-label">核心结论 · Answer First</div>
  <p>跑通任何主流代理客户端的标准路径只有五步：<strong>核对服务商是否输出通用订阅 → 从 GitHub 官方 Release 或正版商店安装校验客户端 → 导入匹配格式的订阅链接 → 保持 Rule 规则分流并按需开启系统代理或 TUN → 用终端 <code>curl</code> 实测出口并配置 Merge/JS 覆写防止更新覆盖</strong>。照此流程推进，可在 10 分钟内避开 90% 的假包中毒、规则被洗、终端不走代理与 DNS 泄漏故障。</p>
</div>

## 一、专题知识库导航（9 篇实操指南 · `itemListCount: 9`）

本总览页把零散的客户端操作串联成一条可从头走到尾的标准任务路线；需要某一步的完整 YAML 代码段、CLI 脚本或平台级截图参数时，请按下方导航进入对应的 6 篇基础专题与 3 篇深度实操专题：

| 类别 | 专题名称 | 解决的核心实操问题 | 专题入口 |
| :--- | :--- | :--- | :--- |
| **基础 01** | 客户端安装标准流程 | 区分 Windows x64/ARM64、macOS 芯片架构、Linux 包格式与 SHA256 校验 | [客户端安装标准流程](/guides/installation/) |
| **基础 02** | 订阅导入与更新管理 | 识别 Base64、Clash YAML 与 sing-box JSON，读懂流量头与 User-Agent | [订阅导入与更新管理](/guides/subscription/) |
| **基础 03** | Clash YAML 配置详解 | 拆解 `proxies`、`proxy-groups`、`rules`、`dns` 与 `sniffer` 五大核心区块 | [Clash YAML 配置详解](/guides/clash-config/) |
| **基础 04** | 分流规则与策略组 | 利用 GEOSITE/GEOIP、Rule-Providers 把国内直连与 AI/流媒体彻底隔离 | [分流规则与策略组](/guides/routing/) |
| **基础 05** | TUN 模式深度配置 | 理解虚拟网卡接管、Fake-IP vs Redir-Host 选型与私有网段绕过 | [TUN 模式深度配置](/guides/tun/) |
| **基础 06** | 自动更新与配置备份 | 用 Merge 与 JS 脚本保护自定义规则不被覆盖，配置 WebDAV 跨端同步 | [自动更新与配置备份](/guides/automatic-update/) |
| **实操 07** | Clash Verge Rev 全流程 | 从下载哈希校验、Service Mode 安装、导入订阅到终端验证的逐帧指南 | [Clash Verge Rev 从零到 TUN](/guides/clash-verge-rev-setup/) |
| **实操 08** | 系统时间偏差 TLS 修复 | 一键校准 Windows 时钟漂移，解决全节点超时与 Reality 握手失败 | [系统时间偏差与 TLS 修复](/guides/system-time-tls-fix/) |
| **实操 09** | 订阅格式识别与转换 | 用单条 `curl` 看穿服务端真实响应体，理解本地转换与订阅隐私边界 | [订阅格式识别与转换原则](/guides/subscription-formats-explained/) |

## 二、新手使用流程总览（从拿到账号到稳定运行）

很多新手上手失败，往往是因为“客户端还没装对”就开始乱抄网上的复杂配置文件，或者连机场支持哪种接入方式都没看清就急着找订阅链接。按下面六步顺序推进，每一步都有明确的通过标准：

1. **阶段一 · 确认接入模式**：在 [品牌检索中心](/brands/directory/) 核对所用服务商属于“第三方通用订阅”还是“仅专属客户端”。只有提供通用订阅链接的品牌才能接入开源客户端。
2. **阶段二 · 官方安装与校验**：根据设备系统在 [客户端中心](/clients/) 挑选活跃维护工具，仅从 GitHub Releases 或外区正版 App Store 获取，完成 SHA256 哈希核验并检查本机系统时间准确无误。
3. **阶段三 · 导入匹配格式订阅**：复制服务商面板的订阅 URL 导入客户端，确认节点列表、剩余流量与到期日期已正常解析，必要时针对内核切换 YAML、Base64 或 sing-box 格式。
4. **阶段四 · 基础连网与模式切换**：将代理模式设置为 **Rule（规则）**，选择 `1x` 低延迟节点（注意 AI 服务不要选香港），按需打开**系统代理**或安装服务模式后开启 **TUN 虚拟网卡**。
5. **阶段五 · 命令行双维度验收**：用 `curl --proxy` 验证端口联通，用无代理直连命令验证 TUN 与分流是否生效，确认国内流量直连、海外出口匹配目标地区且无 DNS 泄漏。
6. **阶段六 · 规则固化与长期防护**：将高频用到的 AI 分流组、高倍率屏蔽正则写进 **Merge / JS 扩展覆写**，配置定时更新与 WebDAV 本地脱敏备份，彻底告别每次更新订阅配置归零。

## 三、使用前准备（避开 80% 返工的购前与装前检查）

### 1. 核对服务商客户端兼容性

在花时间折腾配置文件之前，先确认你的服务商是否允许使用第三方开源客户端。以本站 [31 家机场品牌库](/brands/directory/) 为例：
- **支持第三方通用订阅**：如 [光速云](/brands/guangsuyun/)、[一翻云](/brands/yifan/)、[可信云](/brands/kexin/)、[速界](/brands/sujie/)、[梯子云](/brands/tiziyun/) 等品牌提供标准订阅链接，可自由导入 Clash Verge Rev、Shadowrocket、v2rayN 或 OpenWrt 软路由。
- **仅限专属客户端（不提供订阅链接）**：如 [飞猫云](/brands/feimao/)、[隐形人](/brands/yinxingren/)、[SOGO 云](/brands/sogo/)、[闪跃](/brands/shanyue/)、[全球云](/brands/quanqiu/)、[灵猫网络](/brands/lingmao/) 等采用自研封闭客户端登录即用模式。这类服务无法导入开源客户端，也不适用下文的大多数 YAML 分流与 Merge 技巧。

### 2. 彻底远离已归档客户端与仿冒“中文官网”

原版 Clash、Clash for Windows（CFW）与 Clash for Android（CFA）均已停止维护并归档。这些停更软件既不支持 **VLESS-Reality**、**Hysteria 2**、**AnyTLS** 等现代抗干扰传输协议，在中文搜索引擎（百度、Bing 等）搜到的所谓“Clash 中文网”“CFW 汉化最新版”更频繁夹带后门木马与订阅窃取脚本。请务必阅读 [下载安全防钓鱼指南](/safety/security/)，所有开源客户端只认准 GitHub 官方仓库 Releases 页；桌面端在 GitHub 下载 [v2rayN](/clients/v2rayn/) 时还需看清压缩包命名是否带 `WithCore`（不带核心的纯界面压缩包首次启动会缺少 `xray.exe` 或 `mihomo.exe` 运行底座），而下载 [NekoBox](/clients/nekobox/) 时务必避开 Google Play 上的非官方同名第三方版本。

### 3. 本机时间校准与冲突软件清理

现代代理协议（尤其是 TLS 1.3、VLESS-Reality、Trojan 与 Hysteria 2）在建立加密连接时都会严格校验双方系统时间戳。如果 Windows 电脑主板电池老化或双系统切换导致本机时间与标准 UTC 时间偏差超过 60–90 秒，会出现**所有节点在客户端里显示超时、浏览器报 SSL 握手错误**的现象。装前请先同步系统时间（详见 [系统时间与 TLS 修复](/guides/system-time-tls-fix/)），并退出其他同时运行中的商业 VPN、校园网防代理冲突插件、系统全局加速器（如部分游戏加速器常驻虚拟网卡）或残留的旧代理后台服务，避免多张虚拟网卡同时抢夺系统默认路由表。

## 四、如何选择适用客户端（操作系统 × 内核 × 订阅格式）

选择客户端的核心逻辑是**“设备平台决定候选范围，服务商下发协议与订阅格式决定具体哪一款”**。如果不确定自己的设备适合哪一款，可以先使用 [客户端交互式筛选器](/clients/)，或直接对照下方选型矩阵：

| 目标平台 | 推荐主力客户端 | 底层内核 | 原生兼容的订阅格式 | 核心特点与避坑提示 |
| :--- | :--- | :--- | :--- | :--- |
| **Windows / Linux** | [Clash Verge Rev](/clients/clash-verge-rev/) | Mihomo (Clash.Meta) | Clash / Mihomo YAML | Tauri 架构、界面现代、原生支持 Service Mode TUN 与 Merge/JS 覆写；Win 需确认含 WebView2 |
| **Windows / macOS / Linux** | [v2rayN](/clients/v2rayn/) | 多核心 (Xray / sing-box / Mihomo) | Base64、v2rayN JSON、Clash YAML | 已跨平台支持 macOS/Linux；单节点精细调试、多核心自由切换，适合进阶用户 |
| **全平台统一界面** | [FlClash](/clients/flclash/) | Mihomo (Clash.Meta) | Clash / Mihomo YAML | 基于 Flutter，桌面与安卓交互一致、内置 WebDAV 同步、开箱即用难度极低 |
| **全平台多格式通吃** | [Hiddify](/clients/hiddify/) / [Karing](/clients/karing/) | sing-box | sing-box JSON、Clash YAML、Base64 | 自动识别多种订阅格式、内存占用低，适合需要手机和电脑同一套配置逻辑的用户 |
| **Android 手机** | [Clash Meta for Android](/clients/clash-meta/) / [v2rayNG](/clients/v2rayng/) | Mihomo / Xray-core | Clash YAML / Base64 | CMFA 承接规则生态；v2rayNG 极度轻量但仅吃 Base64/单链；用 [NekoBox](/clients/nekobox/) 严禁从 Google Play 下载 |
| **iPhone / iPad** | [Shadowrocket](/clients/shadowrocket/) / [Stash](/clients/stash/) | 私有独立核心 | Base64、Shadowrocket / Clash YAML | 外区 App Store 买断付费；Stash 直接吃 Clash 配置；进阶脚本用 [Quantumult X](/clients/quantumult-x/) 或 [Surge](/clients/surge/) |
| **OpenWrt 软路由** | [OpenClash](/clients/openclash/) / [Nikki](/clients/nikki/) / [HomeProxy](/clients/homeproxy/) / [PassWall2](/clients/passwall2/) | Mihomo / sing-box / Xray | Clash YAML / sing-box / Base64 | 接管全家设备与电视/NAS；注意 **Nikki 明确要求 OpenWrt 24.10+**（`fw4/nftables`） |

## 五、四大主力平台标准配置路线

### 1. Windows 配置路线（推荐 Clash Verge Rev 或 v2rayN）

Windows 用户最常见的报错是“下错了架构包”“没装 WebView2 打不开界面”和“直接双击点 TUN 提示无权限”。详细每一步截图参数可对照 [Clash Verge Rev 从零安装指南](/guides/clash-verge-rev-setup/) 与 [Windows 平台中心](/clients/platform/windows/)：

1. **核对系统架构与下载安装包**：在 PowerShell 运行 `$env:PROCESSOR_ARCHITECTURE` 确认是 `AMD64`（选 `x64` 安装包）还是 `ARM64`。从 `clash-verge-rev/clash-verge-rev` 官方 GitHub Releases 下载安装包后，执行校验命令对比官方提供的 SHA256 值：
   ```powershell
   Get-FileHash .\Clash.Verge_*.exe -Algorithm SHA256
   ```
2. **安装程序与运行库检查**：正常完成安装；若启动白屏或无法渲染，通常是因为精简版系统缺失 Microsoft Edge WebView2 Runtime，按提示补装官方常青引导程序即可。
3. **导入订阅**：进入机场用户中心点击“复制 Clash 订阅链接”，切回软件左侧“订阅”页面粘贴导入。若导入后提示 YAML 解析报错，核对链接末尾或面板开关是否返回了 Base64 而非 Clash 格式。
4. **开启系统代理或配置 TUN**：普通网页办公直接在“设置”中打开“系统代理”；若需终端（PowerShell/Git Bash）、Docker 或桌面程序全接管，必须先点击“服务模式（Service Mode）”右侧的盾牌图标完成安装授权，重启核心后再开启 **TUN 模式**。

### 2. Android 配置路线（推荐 FlClash、CMFA 或 v2rayNG）

Android 端的核心痛点在于**下对 CPU 架构 APK**、**防止国产定制系统杀后台断流**以及**合理放行国内高频支付/网银 App**。参见 [Android 平台中心](/clients/platform/android/)：

1. **选择官方 APK 架构**：现代安卓手机绝大部分应下载 `arm64-v8a` 版本（极老旧机型用 `armeabi-v7a`，切忌在不明第三方应用市场下载）。
2. **注意格式匹配**：若服务商仅提供了 Clash 订阅，安卓端应选用 [FlClash](/clients/flclash/) 或 [Clash Meta for Android](/clients/clash-meta/)；如果选用了极其轻量的 [v2rayNG](/clients/v2rayng/)，则必须确保复制的是**通用 Base64 订阅**而非 Clash YAML，否则无法识别出节点。
3. **授予 `VpnService` 与后台保活**：首次点击连接开关时系统会弹窗提示“创建 VPN 连接请求”，必须点击允许。随后立刻进入手机“设置 → 应用管理 → 电池优化”，将该代理客户端设为**“无限制 / 允许后台高耗电”**，并在多任务视图中加锁，防止锁屏五分钟后系统自动断网。
4. **配置分应用代理（Per-App Proxy）**：国内的微信、支付宝、银行 App、高德/百度地图以及本地政务小程序完全不需要经过代理核心，在分应用代理白名单/黑名单中将其设为绕过代理，既能降低功耗又能避免风控验证。

### 3. iPhone / iPad（iOS）配置路线（推荐 Shadowrocket / Stash / Karing）

受限于区域应用商店政策，iOS 端准备工作与安卓完全不同，切勿在安全上踩红线。完整指南见 [iOS 平台中心](/clients/platform/ios/)：

1. **使用合规外区 Apple ID 自行购买**：中国大陆区 App Store 已下架主流规则代理工具。请自己注册或切换合规的非大陆区 Apple ID（如美区、港区、台区）购买正版 [Shadowrocket](/clients/shadowrocket/)、[Stash](/clients/stash/)、[Quantumult X](/clients/quantumult-x/) 或免费安装受地区限制的 [Karing](/clients/karing/)/[Hiddify](/clients/hiddify/)。**严禁在设备上直接登录淘宝购买或网上公开的未知他人共享 Apple ID 到 iCloud 设置中**，否则极易被远程锁机勒索。
2. **导入订阅链接**：复制服务商的通用订阅链接（Shadowrocket 通吃 Base64 与部分 Clash；Stash 优先复制 Clash YAML），打开客户端点击右上角 `+` 号，类型选 `Subscribe`，粘贴 URL 并保存即可拉取节点列表。
3. **核对全局路由模式**：在 Shadowrocket 首页务必将“全局路由（Global Routing）”从默认的“配置/直连”核对为**“配置（Config）”**（即 Rule 规则分流模式），切忌误选“代理（Proxy）”造成国内 App 全部绕远海外。
4. **首次系统 VPN 授权**：点击顶部连通开关，iOS 会弹出“添加 VPN 配置”提示，验证面容 ID 或锁屏密码即可接管全部流量。长期出门切换 Wi-Fi 与 5G 时，可按需开启客户端内置的“按需连接（Connect On Demand）”保持无感重连。

### 4. macOS 配置路线（推荐 Clash Verge Rev / FlClash / Stash / Surge）

macOS 的主要区别在于**苹果自研芯片与英特尔芯片安装包隔离**，以及**系统代理与终端环境变量分离**。参见 [macOS 平台中心](/clients/platform/macos/)：

1. **先查芯片架构再下载 `.dmg`**：在终端运行 `uname -m`，返回 `arm64`（M1/M2/M3/M4 系列 Apple Silicon）必须下载 `aarch64` / `arm64` 包；返回 `x86_64`（Intel Mac）必须下载 `x64` / `x86_64` 包，混用会损失性能甚至无法运行。
2. **处理公证提示**：从 GitHub Releases 下载的开源安装包在核对 SHA256 无误后，若双击打开遇到“无法验证开发者”，前往“系统设置 → 隐私与安全性”点击“仍要打开”并输入开机密码即可（无需关闭系统完整性保护 SIP）。
3. **区分“系统代理”与“终端代理”**：打开系统代理开关后，Safari、Chrome、Slack 等会正常走代理，但 iTerm2/Terminal 中的 `brew`、`git`、`curl` 默认不读取 macOS 系统代理设置。你可以要么复制客户端提供的终端导出命令（`export https_proxy=...`），要么在客户端“服务/辅助工具（Helper）”授权后直接开启 **TUN 模式**。
4. **双网卡与休眠重连检查**：如果 MacBook 同时插着扩展坞网线并连着 Wi-Fi，建议在网络偏好里确认主活动接口顺序，避免休眠唤醒后 Helper 路由表短暂残留导致网页打不开；遇此情况只需在客户端里关闭再重开一次 TUN 开关即可重建虚拟接口路由。

### 5. Linux 桌面与 OpenWrt 软路由配置前置路线

除常规个人电脑与手机外，研发测试主机与家庭网关也是高频代理场景，配置路线与桌面系统截然不同：

- **Linux 桌面与无桌面服务器（[Linux 平台中心](/clients/platform/linux/)）**：桌面发行版（Ubuntu / Fedora / Arch）可直接使用 Clash Verge Rev 或 FlClash 的 `.deb`、`.rpm` 或 `.AppImage` 包；若需要在无图形界面的云服务器或远程开发机长期后台运行，通常部署原生的 `mihomo` 或 `sing-box` 二进制配合 `systemd` 守护进程，再通过本地 Web 控制台或 SSH 端口转发管理节点，切勿在无桌面环境强行依赖 GUI 工具。
- **OpenWrt 软路由（[OpenWrt 平台中心](/clients/platform/openwrt/)）**：部署透明网关前必须先在路由器终端通过 `ubus call system board` 与 `uname -m` 核对三件事：OpenWrt 固件大版本、路由器 CPU 架构（如 `aarch64_cortex-a53`、`x86_64`、`mipsel`）以及防火墙后端是旧版 `iptables (fw3)` 还是现代 `nftables (fw4)`。例如新锐轻量的 [Nikki](/clients/nikki/) 明确要求 **OpenWrt 24.10 及以上版本**，而老旧 21.02 固件需退选兼容性更好的 [OpenClash](/clients/openclash/) 或 [PassWall2](/clients/passwall2/)；若固件本身以 `sing-box` 为核心底座，则优先评估官方集成方案 [HomeProxy](/clients/homeproxy/)。

## 六、订阅链接导入与格式解析（Base64 / Clash YAML / sing-box JSON）

一个看似普通的 `https://...` 订阅 URL，背后其实牵涉格式标准、请求头鉴权与服务端适配。搞懂下面四件事，订阅导入再也不会莫名报错（深度原理见 [订阅导入与更新管理](/guides/subscription/) 与 [订阅格式识别与转换原则](/guides/subscription-formats-explained/)）：

### 1. 三大主流订阅格式对照

| 订阅格式 | 原始数据长相 | 原生支持的客户端 | 适用特点 |
| :--- | :--- | :--- | :--- |
| **Base64 通用节点列表** | 一长串无空格英文字母与数字混合文本（解码后是逐行的 `vless://`、`trojan://`、`ss://`） | v2rayNG、v2rayN、Shadowrocket、Hiddify、Karing | 仅包含服务器节点信息，**不包含复杂分流规则与策略组**，完全依赖客户端本地内置规则 |
| **Clash / Mihomo YAML** | 结构化的文本缩进配置文件，含 `proxies:`、`proxy-groups:`、`rules:` 等字段 | Clash Verge Rev、FlClash、CMFA、Stash、OpenClash、Nikki | 节点与服务商预设分流规则一并下发，导入即可按规则分流，可配合 Merge 局部覆写 |
| **sing-box JSON** | 标准 JSON 对象结构，含 `inbounds`、`outbounds`、`route`、`dns` 等字段 | sing-box 官方端、Hiddify、Karing、HomeProxy、v2rayN (sing-box 核) | 强类型校验、内存效率极高，但语法严格，手工修改少一个逗号就会解析失败 |

### 2. User-Agent 协商、响应头流量字段与终端探测验证

很多机场只给你一个统一订阅 URL，却能同时在 Clash Verge Rev 里返回 YAML、在 v2rayNG 里返回 Base64，这是因为服务端读取了客户端拉取订阅时附带的 **HTTP `User-Agent` 请求头**（例如 `clash-verge/v2.x`、`mihomo`、`v2rayNG`）。如果你直接把这个链接粘贴到 Chrome 浏览器里，浏览器发送的是常规网页 `User-Agent`，服务端往往会故意返回空白页、面板跳转页或 Base64，这并不代表订阅坏了。

规范的服务端在返回订阅内容时，还会在 HTTP 响应头附带 `subscription-userinfo: upload=...; download=...; total=...; expire=...` 字段。客户端正是靠读取这四个字段（单位依次为上行字节、下行字节、总配额字节与 UNIX 到期时间戳），才在面板上画出“已用流量进度条”与“套餐到期日”。当你在客户端里遇到导入报错、拉回空列表或只看到网页 HTML 时，可以直接在终端用 `curl` 模拟客户端请求头查看真实响应头与前几行内容（注意把地址替换为你自己的真实订阅链接，且切勿在公开屏幕录屏时暴露带 token 的 URL）：

```bash
# 查看服务端对 Clash 客户端请求头返回的 HTTP 状态码、流量头信息与前 15 行配置体
curl -sD - -A "clash-verge/v2.0.0" "https://你的订阅域名/sub?token=示例" | head -n 25
```

如果响应首行是 `HTTP/2 200` 且正文中能看到 `proxies:` 字样，说明订阅链路健康；如果返回 `302` 跳转到登录页、`403 Forbidden` 或一堆 `<!DOCTYPE html>` 网页代码，则证明当前订阅域名触发了防火墙拦截、Token 已重置失效，或你在服务端拉黑了该 User-Agent。

### 3. 第三方在线订阅转换的隐私边界

当你手头只有 Base64 链接却想用 Clash Verge Rev（需要 YAML）时，切忌随便在搜索引擎找个陌生的“免费在线订阅转换站”就把链接贴进去。订阅链接中的 `token` 等同于你的账号免密通行证，恶意转换后台完全可以记录并转卖你的节点配置。安全做法是：**先看机场官网是否提供多格式切换按钮（或 `?flag=clash` 参数）；其次优先选用原生兼容多格式的 Hiddify/Karing；确需转换时仅使用本地自建的 Subconverter 实例**。

### 4. 客户端原生自带的导入容错差异

在实际排障中经常遇到“同一条链接，在甲软件能导入，在乙软件报错”的情况：
- **Clash Verge Rev / FlClash**：严格校验 YAML 缩进与 Mihomo 内核支持的协议字段，若老旧订阅中混入了早已淘汰的非法 cipher 加密写法或重复代理组名，会直接拒绝加载配置文件并弹出红色行号提示。
- **v2rayN / Shadowrocket**：若导入链接是标准 Base64，即便其中夹杂着个别格式残缺的废弃节点行，客户端通常也会跳过损坏行并成功导入其余正常节点；但如果在 v2rayN 中误将 Clash YAML 当成 Base64 订阅更新，就会显示“未找到有效节点”。
- **Hiddify / Karing**：内置多格式自动探测引擎，能在导入阶段尝试识别 YAML、JSON 与 Base64 并转换为 sing-box 结构，但对某些高度定制的 Clash JavaScript 脚本字段无法原样继承，遇到规则偏差时仍需回到对应的原生内核客户端验证。

## 七、代理模式区别（Rule / Global / Direct）

无论使用桌面端还是移动端，连接页面最显眼的位置都有三个模式切换标签。把模式选错是最常见的“网速突然变慢”或“国内打不开”原因：

| 代理模式 | 路由决策逻辑 | 正确使用时机 | 错误使用后果 |
| :--- | :--- | :--- | :--- |
| **Rule（规则模式）** | 严格逐条匹配配置文件中的 `rules` 规则列表：国内 IP/域名直连（`DIRECT`），海外被阻断或指定服务走对应代理分组，未命中规则按兜底 `MATCH` 处理 | **99% 日常使用的唯一推荐模式** | 仅当订阅自带规则极度残缺或过时，可能误把某小众国外站分进直连 |
| **Global（全局模式）** | 忽略几乎所有分流规则，将命中客户端代理的全部请求（包括百度、淘宝、B站、公司内网与微信）强行转发给 `GLOBAL` 分组所选定的海外节点 | **仅用于临时故障排查**：当你怀疑某海外网站是因分流规则漏判才打不开时，切 Global 测一次即可验证 | 长期开 Global 会导致访问国内服务绕远日本/美国延迟暴增、国内网银触发异地登录风控，且高倍节点流量会被 B站/网盘瞬间吸干 |
| **Direct（直连模式）** | 所有流量不经过任何海外节点，全部由本地宽带直接发出（仅保留客户端抓包/DNS 记录能力） | 需要保留软件运行记录日志，但希望所有流量暂时走本地宽带时 | 打开海外网站全部超时；新手误点后容易以为“机场全线宕机” |

## 八、系统代理与 TUN 模式：接管原理与适用边界

### 1. 系统代理（System Proxy）的工作边界

点击客户端的“系统代理”开关，本质上是客户端在本地开启一个监听端口（例如 Clash Verge Rev 默认的混合端口 `127.0.0.1:7897`，v2rayN 默认的 `10808`），并调用操作系统的 API 把“HTTP/HTTPS/SOCKS 代理地址”写入系统网络设置中。

- **优点**：几乎零权限侵入，不生成虚拟网卡，开关毫秒级生效，对国内软件影响极小。
- **硬伤**：**操作系统代理只是一个“建议清单”，不是强制命令**。Chrome、Edge、Firefox（设为使用系统代理时）和微信等标准程序会主动查询这个端口；而 Windows CMD/PowerShell、macOS Terminal、WSL2、`git`、`curl`、`npm`、`pip`、Docker Engine、Java/Python 脚本、Steam 游戏本体以及部分 Electron/游戏启动器**根本不会读取系统代理**，于是出现“浏览器能上 Google，终端 `git clone` 却卡死超时”的经典撕裂局面。
- **环境变量临时替代方案**：如果不想开 TUN，仅想让当前终端窗口走代理，可以在命令行手动注入临时变量（关闭终端窗口即失效）：
  ```bash
  # Linux / macOS Bash/Zsh（假设混合端口为 7897）
  export http_proxy="http://127.0.0.1:7897" https_proxy="http://127.0.0.1:7897" all_proxy="socks5://127.0.0.1:7897"
  ```
  ```powershell
  # Windows PowerShell 临时设置
  $env:HTTP_PROXY="http://127.0.0.1:7897"; $env:HTTPS_PROXY="http://127.0.0.1:7897"
  ```
- **防断网提醒**：如果开启了系统代理后直接用任务管理器强杀客户端进程（而非正常退出），系统设置里残存的 `127.0.0.1:7897` 指向一个已死掉的端口，会导致电脑重启前所有浏览器显示“代理服务器无响应”。正常关闭软件或手动关闭系统“使用代理服务器”开关即可恢复。

### 2. TUN 模式（虚拟网卡接管）

开启 **TUN 模式** 后，客户端底层内核（Mihomo / sing-box）会在操作系统中注册一张虚拟网络适配器（如 `Meta` / `utun` 网卡），并向系统路由表注入默认流量路由规则。此时无论软件本身有没有“代理意识”，只要它想发 TCP 或 UDP 数据包出网，操作系统内核都会直接把三层 IP 数据包塞进这张虚拟网卡，由代理核心统一按分流规则拆包转发（完整工程解析见 [TUN 模式深度配置](/guides/tun/)）。

- **开启前提**：修改系统网卡与路由表需要高权限。Windows 必须在客户端内预先安装并启动 **Service Mode（服务模式）** 或用管理员身份运行；macOS 需输入开机密码授权后台 Helper；Linux 需授予二进制文件 `cap_net_admin` 能力或以服务运行。
- **常见问题与冲突隔离**：
  - 当开启 TUN 后遇到 WSL2 无法访问外网、Docker 容器断网或局域网 NAS/打印机无法直连时，属于典型的虚拟子网路由冲突，务必将 `10.0.0.0/8`、`172.16.0.0/12`、`192.168.0.0/16` 与本地环回网段列入路由排除列表，详细排查步聚请直接查阅 [TUN 与 WSL/Docker 冲突排查](/troubleshooting/tun-wsl-docker-conflict/) 与 [TUN 故障专修](/troubleshooting/tun/)。
  - 若使用部分对网络延迟或反作弊高度敏感的联机游戏（如 Valorant、部分主机端加速），开启全局 TUN 可能改变 NAT 类型，此时可改用分应用/进程规则放行或切换至专项优化方案。

## 九、DNS 配置核心：Fake-IP vs Redir-Host 怎么选？

在没有代理的传统网络里，DNS 由宽带运营商直接下发；但在代理环境里，**客户端必须接管 DNS 解析**。如果放任本地宽带 DNS 直接解析海外域名，不仅会被污染返回错误 IP，还会导致客户端在规则匹配时因为只看见“被污染后的假 IP”而无法按域名精确分流，甚至把国内 CDN 节点错误解析到海外服务器引发网速雪崩（参阅 [Clash YAML 配置详解](/guides/clash-config/) 与 [DNS 异常排查](/troubleshooting/dns/)）。

在 Mihomo 与主流规则客户端中，DNS 工作模式主要有两种截然不同的流派：

| 对比维度 | Fake-IP 模式（现代默认推荐） | Redir-Host 模式（传统真实 IP 模式） |
| :--- | :--- | :--- |
| **工作机理** | 当软件请求解析某个域名时，内核不等待远端真实 DNS 结果，瞬间返回一个 `198.18.0.0/16` 保留段的虚假内网 IP 给软件，同时在内存记录“该 Fake-IP 对应哪个域名”；等软件发连接请求时，内核直接用真实域名通过远端节点去解析和建连 | 客户端收到 DNS 查询后，先通过配置的国内 DoH（`nameserver`）或海外防污染 DoH（`fallback`）向真实上游查询出真实公网 IP，再把真实 IP 返回给软件，随后连接该 IP 并通过 `sniffer` 嗅探域名做补充校验 |
| **响应速度** | **极快，几乎零 DNS 往返阻塞** | 略慢半拍，依赖上游 DoH 响应速度 |
| **DNS 泄漏风险** | 极低（海外域名全程不在本地发起真实 DNS 查询） | 若 `nameserver` 与 `fallback` 分流规则配置不当，存在海外域名先向本地运营商发包的风险 |
| **兼容性局限** | 若部分联机游戏、企业 VPN、Docker 容器或局域网设备直接校验返回的 IP 段是否属于真实公网地址，看见 `198.18.x.x` 会报错拒连；可将对应域名或程序加入 `fake-ip-filter` 排除名单 | **兼容性最稳**，所有应用拿到的都是真实 IP，适合做旁路由网关或复杂内网开发调试环境 |

**实用选型建议**：日常 Windows/macOS 个人电脑配合 Clash Verge Rev 使用，保持现代默认的 **Fake-IP + 域名嗅探（Sniffer）** 即可获得最快的网页打开速度；如果发现某款特定游戏客户端、公司内网客户端或本地测试容器在 Fake-IP 下连接异常，再把对应域名加入 `fake-ip-filter`，或者整机切换为配置好国内/海外双上游分流的 **Redir-Host**。

### 关键 DNS 字段的职责分工（防止“DNS 死循环”与国内 CDN 绕路）

无论是 Fake-IP 还是 Redir-Host，检查 Mihomo 配置文件的 `dns:` 区块时，务必认清以下四类地址池的先后职责：

1. **`default-nameserver`（引导解析器，必须填纯 IP）**：专门用来解析下面 `nameserver` / `fallback` 里填写的 DoH/DoT 域名（例如解析 `dns.alidns.com` 自身对应的 IP）。此处**严禁填域名或海外地址**，通常固定填 `223.5.5.5`、`119.29.29.29` 等国内纯净递归 IP，否则开机瞬间就会因为“鸡生蛋、蛋生鸡”而全部断网。
2. **`proxy-server-nameserver`（节点域名解析器）**：专门用于把机场节点配置里的中转域名（如 `hk01.example.com`）解析成服务器真实 IP。一般同样建议走国内高速 DoH（如 `https://dns.alidns.com/dns-query`），避免把节点入口域名发去海外解析导致第一跳绕道国外。
3. **`nameserver`（常规查询主池）**：日常域名查询的默认上游。建议配置 1–2 个国内低延迟 DoH（阿里 `223.5.5.5`、腾讯 `1.12.12.12`），配合 `respect-rules: true` 或 `nameserver-policy` 为国内域名直连提供最近的本地 CDN 节点，看 B 站、下载网盘不再跑到海外去。
4. **`fallback`（防污染兜底池，仅在海外查询时触发）**：配置支持远端或加密传输的防污染 DNS（如 Cloudflare `https://1.1.1.1/dns-query`、Google `https://dns.google/dns-query`），确保未被国内规则命中的海外域名经由代理隧道获取无污染真实解析结果。

## 十、规则分流核心语法（GEOSITE / GEOIP / Rule-Providers）

客户端的规则文件（`rules:`）严格遵循**“从上到下，命中即止（First Match Wins）”**的匹配顺序。理解这条铁律，就能自己改出既快又稳的分流策略（详细语法与模板见 [分流规则与策略组配置](/guides/routing/)）：

1. **精确域名与关键字规则（优先级最高，放在最前）**
   例如 `DOMAIN-SUFFIX,openai.com,AI专用组`、`DOMAIN-SUFFIX,anthropic.com,AI专用组`、`DOMAIN-KEYWORD,github,研发办公组`。这类规则直接按域名字符串匹配，**完全不触发本地 GeoIP 查询**，最精准且性能开销最小。
2. **进程名规则（仅桌面端与本地路由生效）**
   例如 `PROCESS-NAME,Code.exe,研发办公组` 或 `PROCESS-NAME,WeChat.exe,DIRECT`。适合把特定本地软件整体放行或强制送入代理，但在 OpenWrt 软路由网关上（不跑本机进程）不会生效。
3. **远程动态规则集（`RULE-SET` / `Rule-Providers`）**
   现代 Mihomo 与 sing-box 早已不再把几万条规则硬编码写死在订阅文件里，而是通过 `rule-providers` 定时从 GitHub 开源规则库拉取分类好的规则包（如 `applications`、`private`、`cn`、`gfw`、`openai`、`netflix`、`youtube`），每次更新只需几秒，维护成本极低。
4. **内置地理库（`GEOSITE` 与 `GEOIP`）**
   - `GEOSITE,cn,DIRECT`：根据开源域名数据库把国内常用服务直接放行。
   - `GEOIP,LAN,DIRECT,no-resolve` 与 `GEOIP,CN,DIRECT`：注意局域网与常规域名分流后才落到 IP 判断。务必留意**能用域名分流的尽量不要触发提前解析 IP**，在后置规则合理加上 `no-resolve` 参数，可防止为了一条国内规则把海外域名在本地提前解析造成污染或拖慢首包。
5. **最终兜底规则（`MATCH` —— 必须放在最后一行）**
   任何未命中前面数百条规则的陌生海外域名，统一落入 `MATCH,代理主力组`。如果把 `MATCH` 误放在前面，后面的所有精细分流规则都会彻底失效。

**AI 与流媒体隔离实战原则**：把 [ChatGPT](/ai-streaming/chatgpt/)、`Claude`、`Gemini` 对应的 `RULE-SET` 放到普通代理组之前，并单独绑定一个只包含日本/新加坡/美国节点、禁用 `url-test` 自动乱跳的 `AI专用组`；把 [Netflix](/ai-streaming/netflix/)、[Disney+](/ai-streaming/disney/)、[YouTube](/ai-streaming/youtube/) 指向对应的 `流媒体组`；其余普通网页走 `1x` 香港或日常组。这样既能防止香港 IP 访问 AI 报错，又能避免看 4K 视频误耗昂贵节点流量。

## 十一、订阅更新与覆写保护（Merge / JS 覆盖防丢失）

几乎每个认真研究过 YAML 分流的新手都踩过同一个坑：花了半小时在 Clash Verge Rev 的配置文件列表里右键“编辑文件”，加上了公司内网直连规则和 AI 分组；结果三天后客户端自动更新了一次订阅，**所有心血瞬间被服务商新下发的 YAML 覆盖得一干二净**。

解决这个问题的唯一正确架构，是利用现代客户端的**“非破坏性覆写层”**（完整代码与语法范例见 [自动更新与配置备份指南](/guides/automatic-update/)）。客户端加载配置的完整执行链路为：**云端原始订阅下载 → 局部 Merge/Script → 全局 Merge → 全局 Script → 生成运行时文件交给内核**。也就是说，只要把个人规则写进全局扩展层，云端不管怎么刷新节点 IP，你的定制规则都会在内存中重新叠加到最新配置之上：

- **方法 A：全局扩展配置（Merge YAML）** — 你只需要写一个包含增量或替换区块的小片段（例如利用 Clash Verge Rev 专用的 `prepend-rules` 把公司内网和 AI 域名插到 `rules:` 最顶部，或用 `tun:` 块开启私有网段排除）。云端更新节点列表后，客户端自动合入你的规则片段，互不干扰。
  ```yaml
  # 示例：全局扩展 Merge（只追加规则与 TUN 排除，不触碰原始节点）
  prepend-rules:
    - DOMAIN-SUFFIX,internal.corp,DIRECT
    - DOMAIN-SUFFIX,openai.com,节点选择
  tun:
    route-exclude-address:
      - 192.168.0.0/16
      - 172.16.0.0/12
  ```
- **方法 B：全局扩展脚本（JavaScript Script）** — 当你需要按节点名称动态筛选（例如写一段正则把所有名称含 `2x|3x|5x|官网|剩余流量` 的信息行节点自动剔除出 `url-test` 测速组，或者自动生成一个排除了香港节点的 `AI-Auto` 策略组）时，用 20 行标准 JavaScript `main(config)` 函数处理传入的 `config` 对象即可一劳永逸。

同时注意配置合理的定时更新间隔（一般 **12–24 小时** 更新一次即可，切忌设置 5 分钟高频刷新触发服务商拉黑封号）；如果长期不开启客户端，打开软件后建议先手动点击一次“刷新订阅”，防止连上已经被服务商轮换失效的旧入口 IP。

## 十二、多设备配置同步与 WebDAV 备份策略

当你同时拥有 Windows 台式机、MacBook 笔记本与 Android 手机时，重复维护三套规则和覆写脚本非常低效。你可以采用以下两类同步与收敛方案：

1. **私有 WebDAV 脱敏备份（Clash Verge Rev / FlClash 等）**
   利用支持 WebDAV 的私有云盘或自建存储服务，开启客户端设置里的“WebDAV 同步备份”，可以将本地全局 Merge 文件、JS 扩展脚本与界面偏好一键同步到新设备。实际同步时建议仅同步“扩展规则、脚本与界面设置”，或通过独立密码锁保护的个人私有库同步；**安全红线**：千万不要把包含真实明文订阅 URL Token 的完整配置文件公开分享到 GitHub 公共仓库、公共 Gist 或未设密码的网盘分享链接里，否则订阅链接极易被自动化爬虫扫走盗刷，甚至导致面板触发异常并发风控被封号。
2. **家庭超多终端收敛方案：升级至 OpenWrt 软路由**
   当家里同时有电脑、多部手机、平板、Apple TV、PS5 游戏机甚至 NAS 需要接入，且接近或超过部分服务商的在线设备数限制时，在每台终端单独维护客户端不如在主路由或旁路由部署 [OpenClash](/clients/openclash/)、[Nikki](/clients/nikki/)、[PassWall2](/clients/passwall2/) 或 [HomeProxy](/clients/homeproxy/) 统一作为透明网关。全屋所有联网设备在网关眼里通常只算作 1 个出口终端环境，还能无感覆盖不支持安装客户端的电视与主机（详情参阅 [多设备与家庭共享方案](/airport/multi-device/)）。需注意的是，旁路由模式下需要合理规划局域网设备的默认网关与 DNS 指向，否则一旦软路由重启或核心崩溃，全家设备都会失去网络连通性，因此保留一台备用路由器切换或手机热点应急路径同样重要。

## 十三、配置完成后的可验证检查（命令行与端口核验）

不要只靠“浏览器好像能打开一个网页”来判断配置是否完美。花 30 秒在终端执行以下四步实证检查，立刻看清端口监听、代理生效、TUN 接管、分流隔离以及 DNS 防泄漏的真实状态：

```bash
# 第一步：检查本地混合代理端口是否正在监听（Clash Verge Rev 默认 7897；v2rayN 默认 10808）
# Windows PowerShell 可用：netstat -ano | findstr 7897
# macOS / Linux 可用：lsof -i :7897 或 ss -tulnp | grep 7897

# 第二步：强制走本地代理端口验证海外连通性（验证系统代理链路）
curl -I --proxy http://127.0.0.1:7897 https://www.google.com
# 成功预期：返回 HTTP/1.1 200 Connection established 与 HTTP/2 200（或 301/302）

# 第三步：不带 --proxy 参数直接请求海外 IP 归属接口（验证 TUN 虚拟网卡是否接管终端）
curl -s https://api.ip.sb/geoip
# 若开启了 TUN，此处应返回代理节点的海外 IP、国家代码与 ASN；若仍返回本地国内运营商 IP，说明未开 TUN 或终端未接管

# 第四步：验证国内网站是否保持正确直连（检查 Rule 分流是否把国内流量误送去海外）
curl -s https://myip.ipip.net
# 成功预期：返回你本机真实的国内宽带省份与运营商名称，而不是香港/日本节点 IP
```

在 Windows PowerShell 环境下，如果不习惯使用 `curl.exe`（注意在传统 PowerShell 中 `curl` 默认是 `Invoke-WebRequest` 的别名），建议明确输入 `curl.exe` 调用系统内置版，或者直接使用原生测试命令先探测端口是否成功放行监听：

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 7897
```

若 `TcpTestSucceeded` 返回 `True`，证明客户端核心已经成功接管本地混合端口；若返回 `False`，则说明核心根本未启动、服务崩溃或端口被其他软件占用（例如本地端口改成了 `7890` 或 `10808`），此时无需再去排查浏览器或节点，应直接回到客户端“设置”中核对真实监听端口号。

如果你发现第二步能通、第三步不通，说明**系统代理正常但 TUN 模式未开启或未生效**；如果第四步返回的居然也是香港或日本 IP，说明你不小心开启了 **Global 全局模式**，或者订阅规则把国内测速接口分流错了，请立刻切回 `Rule` 模式核对规则。此外，在浏览器中可顺手检查当前页面的 DNS 解析记录是否全部经由预期上游完成，防止存在隐蔽的本地 ISP 泄漏。

## 十四、常见错误对照与专项排障入口

遇到报错时先对照症状定位层级，再进入对应专项排障手册，避免盲目卸载重装把已有配置洗掉（全部工具与交互诊断可进入 [故障排查中心](/troubleshooting/)）：

| 报错现象 / 异常状态 | 最可能的根因 | 第一时间自检动作 | 对应深度排障入口 |
| :--- | :--- | :--- | :--- |
| **导入订阅报 Network Error / 解析失败** | 订阅域名被本地污染阻断、代理环路（开着旧失效代理拉新订阅）或格式不匹配 | 临时关闭系统代理后重试拉取；用 `curl` 看服务端返回文本格式 | [订阅更新失败排查](/troubleshooting/subscription/) |
| **所有节点测速全部超时（Timeout）** | 电脑系统时间偏差超 90 秒导致 TLS 失败、套餐过期或入口全挂 | 立即核对系统时钟与时区；切换手机热点测试排除本地宽带阻断 | [系统时间与 TLS 修复](/guides/system-time-tls-fix/) & [节点连接超时排查](/troubleshooting/timeout/) |
| **能连上且绿灯，但浏览器还是打不开网页** | 客户端系统代理未打开、端口被占（7897 冲突）或残留死端口代理 | 检查 `netstat` 端口监听状态；核对系统代理开关与浏览器扩展冲突 | [连上却无法上网排查](/troubleshooting/disconnected/) |
| **国内网站变慢、视频打不开或 AI 提示风控** | 误开 Global 全局模式、DNS 污染或把香港节点分给了 ChatGPT | 切回 `Rule` 模式；检查国内站点是否走 `DIRECT`、AI 是否指向日/新/美 | [DNS 泄漏与污染排查](/troubleshooting/dns/) |
| **客户端双击无反应、闪退或安装报权限失败** | Windows 缺少 WebView2、macOS 下载错芯片架构或残留后台进程 | 核对 `x64/arm64` 安装包；补装 WebView2 Runtime 并校验 SHA256 | [客户端启动异常排查](/troubleshooting/startup/) |
| **开 TUN 后断网、WSL2/Docker/内网连不上** | Service Mode 未正确运行或虚拟网卡劫持了 Docker/局域网私有网段 | 关闭 TUN 恢复网络后，向路由表追加私有网段排除清单 | [TUN 专修](/troubleshooting/tun/) & [WSL/Docker 冲突排查](/troubleshooting/tun-wsl-docker-conflict/) |

## 十五、常见问题（FAQ）

### 刚买完机场服务的新手，应该按什么顺序完成配置？

建议严格按照“核对订阅模式 → 从官方渠道下载校验客户端 → 导入订阅并确认格式 → 切换 Rule 规则模式并开启系统代理 → 终端与网页实测验证 → 配置 Merge 覆写防止更新被清空”的顺序推进。在确认节点连通前不要急着修改复杂 DNS 或脚本。

### 系统代理和 TUN 模式有什么区别？日常必须开启 TUN 吗？

系统代理只在操作系统层提供本地端口转发，仅对浏览器和遵守系统代理配置的桌面应用生效；而终端命令行（`git`、`curl`、`npm`）、Docker、海外联机游戏以及部分不读取系统代理的桌面软件，必须依靠 TUN 虚拟网卡从系统路由层接管。纯网页浏览开系统代理即可，开发或游戏场景建议开启 TUN。

### 为什么浏览器打开机场订阅链接显示乱码或网页，而客户端却能拉取节点？

因为服务端会根据请求头中的 `User-Agent` 自动判断返回格式：普通浏览器访问通常返回 Base64 编码节点文本或面板提示页，而 Clash Verge Rev、FlClash 等客户端发送特定 `User-Agent` 后，服务端才会下发标准的 Clash YAML 配置文件。若在无响应时可用 `curl` 指定 `User-Agent` 排查真实响应体。

### 为什么不要直接编辑客户端下载到本地的原始订阅 YAML 文件？

无论是手动点击“更新订阅”还是定时自动刷新，客户端都会用服务端新下发的文件完整覆盖本地原订阅文件，所有手工修改都会瞬间丢失。正确的工程做法是使用全局扩展配置（Merge）或扩展脚本（Script）机制，让本地覆写逻辑在每次更新订阅后自动叠加生效。

### Rule（规则）、Global（全局）和 Direct（直连）三种代理模式该选哪个？

日常长期使用必须停留在 **Rule（规则）**模式，做到国内网站直连、海外网站按规则走对应节点。Global（全局）模式会把所有流量包括国内网站、网银与微信一并送去海外绕一圈，仅适合在怀疑规则出错时短时排除故障；Direct（直连）则相当于关闭分流全部本地直连。

### Fake-IP 和 Redir-Host 两种 DNS 模式在实际使用上有什么区别？

Fake-IP 会向本机迅速返回一个 `198.18.0.0/16` 保留网段的虚拟映射地址，省去等待海外真实 DNS 解析的往返耗时，响应更快，但在部分需要校验真实 IP 的联机游戏、局域网容器或内网穿透环境下易产生冲突；Redir-Host 解析并下发真实 IP，兼容性高，但对内置 DNS 的防泄漏配置要求更严格。

### 为什么还能在网上搜到 Clash for Windows 和 Clash for Android？可以继续用吗？

不能。原版 Clash、Clash for Windows 与 Clash for Android 均已停止维护并归档，不再适配 VLESS-Reality、Hysteria 2 等现代协议，且中文搜索引擎中充斥着植入窃密木马的仿冒安装包。桌面端请使用 [Clash Verge Rev](/clients/clash-verge-rev/)、[FlClash](/clients/flclash/) 或 [v2rayN](/clients/v2rayn/)，安卓端请使用 [ClashMetaForAndroid](/clients/clash-meta/)、FlClash 或 [v2rayNG](/clients/v2rayng/)。

### 使用在线订阅转换网站把 Base64 转成 Clash 配置安全吗？

存在隐私与凭证泄露风险。你的订阅链接中通常包含唯一鉴权 Token，一旦提交给来路不明的第三方在线转换接口，对方服务器记录下链接即可直接盗用你的节点流量与账号。优先选择服务端原生下发的对应格式，或直接使用 [Hiddify](/clients/hiddify/)、[Karing](/clients/karing/) 等支持多格式本地解析的客户端。

### Windows 开启 TUN 模式后，为什么 WSL2、Docker 或局域网设备访问变慢或断网？

TUN 模式会生成最高优先级的虚拟网卡与默认路由规则，容易与 WSL2、Docker Desktop 的虚拟子网段以及内网保留 IP 产生路由环路或劫持冲突。解决方式是在配置文件中将 `172.16.0.0/12`、`192.168.0.0/16` 等私有网段加入 `route-exclude-address` 或 bypass 清单，并按需配置本地回环排除。

### 配置完成后如何不靠感觉，用客观命令确认代理真的走通了？

打开终端运行 `curl -I --proxy http://127.0.0.1:7897 https://www.google.com` 核对系统代理端口连通性，再用不带 `--proxy` 参数的 `curl -s https://api.ip.sb/geoip` 验证 TUN 虚拟网卡是否已接管终端并成功返回海外落地 IP 与地区码。
