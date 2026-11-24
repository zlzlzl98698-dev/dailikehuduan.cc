---
title: "Clash Verge Rev 下载安装、订阅配置与 TUN 模式进阶教程"
description: "基于 2026-11-23 核验快照，详解 Clash Verge Rev（Tauri 2 + Mihomo 内核）与旧版 Clash for Windows 的代差、全平台安装包选择与 SHA256 校验、订阅 User-Agent 机制、Service Mode 与 TUN 模式配置、Merge/Script 覆写及高频报错排障。"
lastUpdated: 2026-11-23
schemaType: SoftwareApplication
appName: Clash Verge Rev
operatingSystem: Windows, macOS, Linux
isFree: true
faq:
  - q: "Clash Verge Rev 和原来的 Clash for Windows、初代 Clash Verge 是什么关系？"
    a: "原版 Clash for Windows（CFW）与初代 Clash Verge 均已于 2023 年底归档停止维护。Clash Verge Rev 是由社区在 GitHub 官方仓库 clash-verge-rev/clash-verge-rev 持续迭代的现代继任项目，采用 Tauri 2 框架与 Mihomo（原 Clash.Meta）内核构建，原生兼容 Clash YAML 订阅并支持 VLESS-Reality、Hysteria 2 等新协议及系统级 TUN 接管。"
  - q: "Windows 打开 Clash Verge Rev 提示缺少 WebView2 或出现启动白屏怎么办？"
    a: "Clash Verge Rev 的图形界面依托操作系统内置的 Microsoft Edge WebView2 运行时渲染。若使用 Windows 10 LTSC 或第三方精简版系统导致该组件缺失，需前往微软官网下载 Evergreen Standalone Installer 独立安装包补齐运行时，或在官方 GitHub Releases 中下载内置固定版本 WebView2 的安装包。"
  - q: "为什么开启 TUN 模式开关后依然无法接管终端、Git 或游戏流量？"
    a: "仅打开界面上的 TUN 模式开关而未授权底层权限时，普通用户态进程无法在操作系统中创建 Wintun 或 utun 虚拟网卡。必须先以管理员身份运行一次客户端，在设置中安装并激活 Service Mode（服务模式），确认 DNS 配置开启了 Fake-IP 模式后，再打开 TUN 开关才能实现三层网络流量接管。"
  - q: "导入机场订阅后为什么看不到服务商宣传的 VLESS-Reality 或 Hysteria 2 节点？"
    a: "多数机场面板会根据客户端发送的 HTTP User-Agent 请求头动态裁剪下发的节点类型。若请求头被识别为旧版 Clash，面板会自动隐藏原版不支持的新协议。请在 Clash Verge Rev 设置或订阅高级选项中将 User-Agent 确认为 clash-verge 或 ClashMeta，然后重新手动更新订阅。"
  - q: "Clash Verge Rev 的 Merge（扩展配置）和 Script（扩展脚本）有什么区别？"
    a: "Merge 采用声明式 YAML 语法，适合静态前置或后置追加分流规则、注入自定义 DNS 或开启 Sniffer 域名嗅探，语法门槛低且执行稳定；Script 采用 JavaScript 函数对配置对象进行编程式加工，适合批量正则筛选节点、动态生成策略组或跨订阅重构复杂拓扑。"
  - q: "从旧版 Clash for Windows 迁移到 Clash Verge Rev 时需要卸载旧软件吗？"
    a: "强烈建议在备份好原始订阅 URL 与自定义规则后彻底卸载旧版 CFW。卸载前务必先关闭旧软件的 System Proxy 与 TUN Mode，防止旧版注册表残留的本地监听端口（如 7890）与新版默认混合端口（7897）发生抢占或引发本地代理死循环。"
  - q: "开启 TUN 模式后本地 WSL2 子系统或 Docker 容器无法联网怎么解决？"
    a: "这是由于 TUN 虚拟网卡开启全局自动路由（auto-route）后，接管或阻断了 WSL2 与 Docker 虚拟网桥的私有子网通信及内部 DNS 转发。可通过在 Merge 扩展配置中配置 route-exclude-address 排除 172.16.0.0/12 等容器网段，并将虚拟网桥域名加入 fake-ip-filter 予以解决。"
---

# Clash Verge Rev 下载安装、订阅配置与 TUN 模式进阶教程

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p><strong>Clash Verge Rev</strong> 是当前 Windows、macOS 与 Linux 桌面端主力推荐的开源代理客户端（核验日期：<code>2026-11-23</code>）。它采用 <strong>Rust / Tauri 2 框架 + Mihomo（原 Clash.Meta）内核</strong> 的双层架构，彻底解决了已停更软件 Clash for Windows 内存占用高、不支持现代抗封锁协议与存在历史安全漏洞的痛点。用户只需从 GitHub 官方仓库 <code>clash-verge-rev/clash-verge-rev</code> 下载对应芯片架构安装包，导入 Clash YAML 订阅并开启“系统代理”即可满足日常浏览器分流；搭配“服务模式（Service Mode）”启用 TUN 虚拟网卡，更可无缝接管命令行终端、IDE 开发工具及 PC 游戏的全栈 TCP/UDP 流量。</p>
</div>

## 一、 软件架构解析与基础信息核验

为什么桌面端用户应当选择 Clash Verge Rev 作为主力代理工具？答案在于其底层 GUI 框架与代理转发引擎的解耦式设计。传统桌面客户端多基于 Electron 构建，每次启动都必须完整拉起一个独立的 Chromium 浏览器实例与 Node.js 运行时，常驻内存往往高达 300MB 至 600MB；而 Clash Verge Rev 采用基于 Rust 语言的 **Tauri 2 框架**，直接调用操作系统原生的 WebView 组件（Windows 端为 Edge WebView2、macOS 端为 WKWebView、Linux 端为 WebKitGTK）负责界面渲染，通过高性能 Rust 后端管理系统托盘、权限提权服务与配置文件读写，并拉起独立的 **Mihomo 内核进程** 处理网络数据包转发。

这种架构不仅将安装包体积压缩至十余兆字节，还将日常后台常驻内存控制在 50MB 至 120MB 区间，同时支持在软件设置中一键无缝切换 Mihomo 的稳定版（Release）与预览版（Alpha）核心。根据本站 `2026-11-23` 客户端数据库核验快照，Clash Verge Rev 的核心技术规格如下表所示：

| 项目属性 | 核验结果（核实日期：2026-11-23） |
| --- | --- |
| **软件名称与别名** | Clash Verge Rev（常简称为 Clash Verge） |
| **官方源码仓库** | [GitHub: clash-verge-rev/clash-verge-rev](https://github.com/clash-verge-rev/clash-verge-rev) |
| **底层代理内核** | [Mihomo（原 Clash.Meta）](/clients/mihomo/)，支持 Release 与 Alpha 双版本热切换 |
| **GUI 跨平台框架** | Tauri 2（Rust 后端 + 系统原生 WebView 前端） |
| **支持操作系统与架构** | Windows 10/11（x64 / ARM64）、macOS（Apple Silicon arm64 / Intel x64）、Linux（DEB / RPM / AppImage） |
| **软件授权与费用** | 免费开源（GPL-3.0 协议，无任何内置付费墙或广告） |
| **支持订阅与配置格式** | 标准 Clash YAML、Mihomo 扩展 YAML（支持 Merge 声明式合并与 JavaScript 脚本覆写） |
| **默认本地监听端口** | 混合端口（Mixed Port）默认 `7897`（同时兼容 HTTP 与 SOCKS5 代理请求，支持自定义修改） |
| **当前维护状态** | 活跃维护（社区主力演进分支，切勿与已归档的旧版软件混淆） |

在实际部署过程中，许多用户容易将 Clash Verge Rev 与早期已停更客户端混为一谈。为了进一步看清技术演进路线，我们需要从协议兼容性、内存开销与规则覆写能力三个维度对比它与历史软件的本质代差。若希望横向查阅全平台工具矩阵，也可先访问[代理客户端大全总览](/clients/)。

## 二、 与已停更 Clash for Windows（CFW）及初代版本的本质代差

为什么在 2026 年绝对不能继续下载或使用所谓的“Clash for Windows 汉化最新版”？直接原因是原版 Clash 核心、Clash for Windows（CFW）以及初代 `zzzgydi/clash-verge` 仓库均已在 2023 年 11 月前后相继归档停更（Archived）。由于原版 CFW 是闭源商业免费软件，官方停更后不仅历史版本中的远程配置渲染 XSS 漏洞无法得到官方补丁修复，互联网搜索引擎上涌现的各类“CFW 中文网”“Clash 官网下载站”更是重灾区——大量黑灰产在旧版安装包中植入剪切板劫持木马或窃取订阅凭证的后门。

除了严峻的供应链安全隐患，旧版 CFW 内置的 Clash Premium 闭源核心在技术协议栈上已与现代机场及自建生态严重脱节。当前主流服务商普遍采用基于 TLS 伪装偷取的 **VLESS-Reality**、基于 QUIC 改良抗丢包的 **Hysteria 2**、**TUIC v5** 以及规避 TLS 指纹特征的 **AnyTLS** 协议。旧版 CFW 完全无法识别这些新兴协议字段，导入现代订阅时会直接抛出 `proxy type error` 或丢失半数以上主力节点。下表详细对比了三代桌面客户端的技术代差：

| 对比维度 | Clash Verge Rev（现役主力） | 初代 Clash Verge（已归档） | Clash for Windows / CFW（已停更闭源） |
| --- | --- | --- | --- |
| **维护状态与安全性** | **活跃开源维护**，代码透明可审计，持续修复依赖漏洞 | 2023 年底归档停更，Tauri 1 旧依赖不再更新 | 2023 年 11 月彻底停更且闭源，市面流通包极易含木马 |
| **默认搭载代理核心** | **Mihomo（Clash.Meta）** 新版核心 | 早期 Clash.Meta / 原版 Clash | Clash Premium 闭源旧核心 |
| **现代抗封锁协议支持** | 原生支持 **VLESS-Reality、Hysteria 2、TUIC v5、AnyTLS、WireGuard** | 仅支持早期 Meta 协议，缺失新特性与 AnyTLS | **不支持** Reality、Hysteria 2、TUIC 等现代协议 |
| **GUI 框架与内存占用** | **Tauri 2**，后台常驻约 50MB–120MB，冷启动极快 | Tauri 1，资源占用较低但存在多窗口渲染旧 Bug | **Electron**，常驻内存高达 300MB–600MB 以上 |
| **配置覆写与扩展体系** | **Merge（YAML 扩展）+ Script（JS 脚本）** 链式处理 | 基础 Merge 与早期 Script，缺乏可视化调试器 | `Parsers` 预处理语法（与现代客户端不直接互通） |
| **规则集与域名嗅探** | 原生支持 `.mrs` 二进制高效规则集与独立 `sniffer` 模块 | 仅支持传统文本规则集与实验性嗅探 | 仅支持传统 YAML/Text 规则集，无现代 Sniffer 模块 |
| **TUN 虚拟网卡提权方式** | 独立 **Service Mode（系统级守护服务）**，无需每次弹窗授权 | 早期服务模式在部分 Windows 11 更新后失效 | 需手动安装服务或每次以管理员身份拉起主程序 |

通过上述对比可以明确得出结论：无论你是初次配置代理的新手，还是习惯了 CFW 界面逻辑的老用户，全面迁移至 Clash Verge Rev 都是保障设备安全与节点连通率的必经之路。关于如何识别各类高危假冒安装包，可进一步查阅[安全防骗与李鬼客户端识别指南](/safety/avoid-scams/)。

## 三、 Windows / macOS / Linux 各架构安装包选择与 SHA256 校验

在下载 Clash Verge Rev 时，如何确保获取的是未经篡改的官方正版文件并准确匹配本机硬件架构？唯一可信的下载渠道是 GitHub 官方仓库 `clash-verge-rev/clash-verge-rev` 的 Releases 页面。由于该项目针对不同操作系统、CPU 指令集以及系统 WebView2 环境编译了十余种构建产物，选错后缀名会导致程序无法安装、双击报错或运行在低效的指令转译层上。

### 1. 全平台安装包命名规则与选型对照

在官方 Releases 展开 `Assets` 列表后，请严格按照下表核对你的操作系统与处理器类型：

| 操作系统 | 适用硬件与系统环境 | 推荐下载文件名特征 | 备选包类型与特殊说明 |
| --- | --- | --- | --- |
| **Windows 10 / 11（主流 PC）** | Intel 酷睿 / AMD 锐龙 64 位处理器 | `Clash.Verge_*_x64-setup.exe` | 便携版可选 `x64_portable.zip`；精简版系统可选内置运行时版 `x64_fixed_webview2-setup.exe` |
| **Windows 10 / 11（ARM 笔记本）** | 高通骁龙 Snapdragon X Elite / Plus、Surface Pro ARM | `Clash.Verge_*_arm64-setup.exe` | 原生 ARM64 编译，切勿误装 x64 版以免影响虚拟网卡驱动加载 |
| **macOS（Apple Silicon）** | Apple M1 / M2 / M3 / M4 全系列芯片 Mac | `Clash.Verge_*_aarch64.dmg` | 原生适配 Apple 芯片，无需 Rosetta 2 转译，功耗与性能最优 |
| **macOS（Intel 芯片）** | 2020 年及更早的老款 Intel 处理器 Mac | `Clash.Verge_*_x64.dmg` | 专供 x86_64 架构老款 MacBook / iMac 使用 |
| **Linux（Debian / Ubuntu / Mint）** | x86_64 桌面或 ARM64 开发板 | `clash-verge_*_amd64.deb`（或 `arm64.deb`） | 推荐使用 `sudo apt install ./xxx.deb` 自动解决依赖关系 |
| **Linux（Fedora / RHEL / openSUSE）** | x86_64 / aarch64 桌面发行版 | `clash-verge-*.x86_64.rpm` | 适用 `dnf` 或 `rpm` 包管理器环境 |
| **Linux（Arch / 通用发行版）** | 各类支持 FUSE 的 Linux 桌面 | `clash-verge_*_amd64.AppImage` | 赋予可执行权限后直接运行，Arch 用户亦可通过 AUR 构建 |

### 2. 下载后 SHA256 哈希值校验步骤

为了防范下载过程中遭遇中间人劫持或文件损坏，安装前应当养成本地校验 SHA256 摘要的习惯。将本地计算出的哈希字符串与 GitHub Releases 页面附带的校验文件进行比对，完全一致方可运行。

- **Windows PowerShell 校验命令**：
```powershell
# 进入下载目录并计算安装包 SHA256 哈希值
Get-FileHash -Path "$HOME\Downloads\Clash.Verge_*_x64-setup.exe" -Algorithm SHA256
```

- **macOS 与 Linux 终端校验命令**：
```bash
# macOS 使用 shasum -a 256，Linux 使用 sha256sum
shasum -a 256 ~/Downloads/Clash.Verge_*_aarch64.dmg
sha256sum ~/Downloads/clash-verge_*_amd64.deb
```

### 3. 各平台安装与系统安全拦截放行实操

不同操作系统对未支付商业数字签名费用的开源软件设有不同的拦截机制，按以下规范操作即可安全放行：

1. **Windows 安装与 SmartScreen 放行**：双击 `x64-setup.exe` 时，若 Windows Defender SmartScreen 弹出蓝色提示框“Windows 已保护你的电脑”，在核对 SHA256 无误的前提下，点击 **更多信息（More info）** → **仍要运行（Run anyway）**。建议安装路径保持默认的英文目录（如 `C:\Program Files\Clash Verge`），避免包含中文字符或特殊符号导致底层 Mihomo 核心读取 GeoIP 数据库失败。更多 Windows 环境细节见[Windows 平台代理客户端指南](/clients/platform/windows/)。
2. **macOS Gatekeeper 隔离属性移除**：将 `.dmg` 镜像中的 `Clash Verge.app` 拖入 `Applications`（应用程序）文件夹后，由于开源应用未绑定苹果付费开发者证书，首次双击往往会弹出“Clash Verge 已损坏，无法打开。你应该将它移到废纸篓”或“无法验证开发者”。此时切勿删除应用，打开 macOS“终端（Terminal）”执行以下命令移除下载隔离扩展属性即可正常打开：
```bash
sudo xattr -rd com.apple.quarantine "/Applications/Clash Verge.app"
```
详细的苹果电脑权限配置可参阅[macOS 平台客户端选型与授权](/clients/platform/macos/)。
3. **Linux 桌面包安装与内核二进制赋权**：在 Ubuntu 或 Debian 桌面环境下，进入下载目录执行 `sudo apt install ./clash-verge_*_amd64.deb`。如果希望在普通桌面用户下无需每次输入 root 密码即可开启 TUN 模式，可针对安装目录内置的 `verge-mihomo` 二进制文件授予网络管理能力（Capabilities）：
```bash
sudo setcap cap_net_admin,cap_net_bind_service=+ep /usr/bin/verge-mihomo
```
更多发行版适配说明请参考[Linux 平台客户端部署教程](/clients/platform/linux/)。

## 四、 订阅导入、User-Agent 请求头机制与开启系统代理

完成软件安装后，如何将机场服务商或自建面板的节点准确导入 Clash Verge Rev 并建立代理连接？整个流程围绕“订阅拉取 → 请求头协商 → 节点策略选择 → 系统代理接管”四个环节展开。如果对完整的图文向导感兴趣，也可同步对照[Clash Verge Rev 从零安装到启用 TUN 的完整步骤](/guides/clash-verge-rev-setup/)。

### 1. 订阅链接格式识别与导入规范

Clash Verge Rev 底层运行的是 Mihomo 内核，因此它**原生识别的是 YAML 格式的 Clash / Mihomo 订阅配置**（文件内容以 `port:`、`proxies:`、`proxy-groups:`、`rules:` 等结构化键值组成）。

1. 登录你的服务商后台（若尚未选购可靠服务，可参考[稳定机场推荐与评测总览](/airport/recommend/)或前往[机场品牌大全目录](/brands/directory/)核对支持 Clash/Mihomo 订阅的服务商），点击“一键订阅”或“复制 Clash 订阅链接”。
2. 切记不要复制仅包含 `vmess://`、`ss://` 的纯 Base64 节点链接（若服务商仅提供 Base64 通用订阅，需先按[2026 订阅格式识别与转换原则](/guides/subscription-formats-explained/)进行本地或受信后端转换）。
3. 打开 Clash Verge Rev 主界面，点击左侧导航栏的 **订阅（Profiles）**。
4. 在顶部 URL 输入框中粘贴 `https://` 开头的订阅链接，点击右侧 **导入（Import）** 按钮。若网络正常，2 至 5 秒内下方列表就会生成一张带有服务商名称、已用流量进度条及更新时间的订阅卡片。
5. **激活配置**：鼠标左键点击该订阅卡片，使其边框高亮并显示激活标识，随后切换到左侧 **代理（Proxies）** 页面即可看到完整的策略组与节点列表。

### 2. User-Agent（请求头）设置对现代协议下发的关键影响

为什么有些用户导入订阅后，发现列表里只有老旧的 Shadowsocks 或 Trojan 节点，而机场明明宣传部署了 VLESS-Reality 与 Hysteria 2 专线？这涉及机场面板（如 SSPanel、V2Board、Xboard）的 **HTTP User-Agent 动态识别机制**。

由于旧版 Clash for Windows 遇到 `vless` 或 `hysteria2` 字段会直接报错崩溃，绝大多数机场面板在接收到订阅请求时，都会先检查客户端发来的 `User-Agent` 字符串：
- 如果请求头不包含 `meta`、`mihomo` 或 `verge` 关键字（例如被用户手动改成了旧版 `ClashForWindows/0.20.39`），面板后端会自动过滤掉所有 VLESS-Reality、Hysteria 2 与 AnyTLS 节点，仅下发旧版兼容子集。
- Clash Verge Rev 默认发送包含 `clash-verge` 的现代 User-Agent，绝大多数新版面板均已将其加入白名单并下发全量 Mihomo 协议配置。
- **排障调整方法**：如果遇到个别老旧面板未能识别 `clash-verge` 导致下发空节点或缺失 Reality 节点，可在“订阅”页面右键对应订阅卡片 → 选择 **编辑信息（Edit Info）**，在 **User Agent** 一栏手动填入 `ClashMeta` 或 `mihomo/1.18.0`，保存后再次点击卡片上的刷新按钮拉取最新节点。更多订阅导入原理可阅读[订阅链接使用与安全管理指南](/guides/subscription/)。

### 3. 开启系统代理（System Proxy）与出站模式选择

对于 80% 以上的日常网页浏览、观看流媒体视频及使用支持系统代理的桌面软件，开启 **系统代理（System Proxy）** 是最轻量、兼容性最稳妥的方式：

1. 在左侧 **代理（Proxies）** 页面顶部，确认当前出站模式选中为 **规则（Rule）**。在此模式下，软件会严格依照订阅内置的分流规则，让中国大陆网站与局域网流量走 `DIRECT`（直连），仅将 Google、GitHub、[ChatGPT](/ai-streaming/chatgpt/)、[Netflix](/ai-streaming/netflix/) 等境外目标域名送入代理节点。
2. 点击左侧 **设置（Settings）**，找到 **系统代理（System Proxy）** 开关并将其打开。此时软件会自动修改操作系统的 WinINet / macOS Network Proxy 配置，将系统 HTTP/SOCKS 代理指向本地 `127.0.0.1:7897`。
3. 如需让局域网内的手机、平板或游戏主机共享当前电脑的代理网络，可在设置中打开 **允许局域网连接（Allow LAN）**，然后在移动设备的 Wi-Fi 代理设置中填入电脑的内网 IP（如 `192.168.1.x`）与端口 `7897`。

## 五、 Service Mode（服务模式）与 TUN 虚拟网卡深度配置

什么时候仅靠“系统代理”是不够的？当你在命令行终端（PowerShell、CMD、Terminal）中执行 `git clone`、`npm install`、`pip` 拉取代码，或者运行不遵循操作系统代理环境变量的客户端软件（如外服 PC 游戏、Telegram 桌面端默认设置、部分 IDE AI 插件）时，流量会直接绕过 `7897` 端口直连出境，导致连接超时。此时就必须启用 **TUN 模式（虚拟网卡模式）**，在操作系统网络栈的第三层（IP 层）创建一个虚拟网络接口（Windows 上通常显示为 `Meta` 或 `Mihomo` 适配器），通过修改系统路由表将所有进程的 TCP 与 UDP 数据包统一接管至 Mihomo 内核。

### 1. 为什么必须先安装 Service Mode（服务模式）？

在 Windows、macOS 与 Linux 系统中，创建虚拟网卡并改写全局路由表属于高危特权操作，普通用户权限（Standard User）会被操作系统内核直接拒绝。如果每次都右键“以管理员身份运行”Clash Verge Rev 主程序，不仅每次开机自启都会弹出烦人的 UAC 授权框，还会导致从软件内拖拽文件或唤起外部链接时出现权限继承异常。

**Service Mode（服务模式）** 的设计正是为了解决这一矛盾：它通过一次性管理员授权，在操作系统后台注册一个轻量级的系统级守护服务（`clash-verge-service`）。此后 Clash Verge Rev 主界面只需以普通用户权限启动，通过本地 IPC 安全通道通知后台服务拉起拥有网卡控制权限的 Mihomo 核心。

**安装与启用服务模式的标准步骤**：
1. 完全退出当前正在运行的 Clash Verge Rev（注意在系统托盘图标右键点击“退出”）。
2. 在桌面或开始菜单找到 Clash Verge Rev 图标，右键选择 **以管理员身份运行**（macOS/Linux 用户直接正常打开，后续步骤会触发系统密码授权框）。
3. 进入左侧 **设置（Settings）** → 找到 **服务模式（Service Mode）** 右侧的盾牌或设置图标并点击。
4. 在弹出的窗口中点击 **安装（Install）**。等待数秒后，服务状态指示变为 **已安装 / 已运行（Installed / Running，通常显示为绿色盾牌图标）**。
5. 此时即可打开上方的 **TUN 模式（TUN Mode）** 开关，并在网络连接面板中观察到名为 `Meta` 的虚拟网卡已成功激活。

### 2. TUN 协议栈（System vs gVisor vs Mixed）选型对比

在 Clash Verge Rev 的“Clash 设置”或 TUN 高级选项中，提供了三种底层网络协议栈实现。针对不同桌面环境与吞吐量需求，可按以下标准抉择：

| TUN 协议栈类型 | 底层实现机制 | 吞吐性能与 CPU 占用 | 适用场景与选型建议 |
| --- | --- | --- | --- |
| **System（系统栈）** | 直接复用操作系统内核原生的 TCP/IP 协议栈处理数据包重组 | **性能最高、CPU 占用最低**，适合千兆宽带跑满高速专线 | Windows 10/11 与现代 macOS 桌面环境的高性能首选 |
| **gVisor（用户态栈）** | 采用 Google 开源的用户态网络栈在内存中独立处理 TCP/UDP 连接 | 兼容性与隔离性极强，但高并发下载时 CPU 与内存开销偏高 | 当 System 栈在特定 Linux 内核或老旧系统上出现连接重置时使用 |
| **Mixed（混合栈 / 默认推荐）** | **TCP 流量交由高性能 `System` 栈处理，UDP 流量交由 `gVisor` 栈处理** | 兼顾大带宽下载速度与游戏/语音/QUIC 的 UDP 转发稳定性 | **日常综合办公、4K 视频与外服游戏的最佳默认选项** |

### 3. 命令行验证 TUN 模式与 Fake-IP 是否真正生效

开启 TUN 模式后，如何用客观证据确认终端流量已被虚拟网卡接管？由于 Mihomo 的 TUN 模式依赖 **Fake-IP（虚假 IP 映射）** 机制来实现零延迟防泄漏分流（即客户端向本地请求域名解析时，内核立即返回一个位于 `198.18.0.1/16` 保留网段的虚拟 IP，待应用向该虚拟 IP 发起连接时再由内核映射回真实域名进行规则匹配），我们只需在终端执行一条 DNS 查询命令即可验证：

```powershell
# 在 Windows PowerShell 或 macOS/Linux 终端中执行
nslookup www.google.com
```

- **验证通过的证据**：如果终端输出的 `Address` 为 `198.18.x.x`（例如 `198.18.0.15`），说明 TUN 虚拟网卡的 DNS 劫持（`dns-hijack`）与 Fake-IP 内存映射表已完全接管系统流量。
- **验证失败的排查**：如果输出的是被污染的异常 IP 或超时，说明虚拟网卡未成功接管本地 `53` 端口查询，请检查服务模式是否掉线或第三方杀毒软件是否拦截了网卡驱动。更多底层原理可参阅[TUN 模式原理与跨平台配置指南](/guides/tun/)以及[DNS 污染原理与防泄漏配置](/troubleshooting/dns/)。

## 六、 Merge 扩展配置与 JavaScript Script 覆写实战

为什么进阶用户推崇 Clash Verge Rev？除了开箱即用的基础功能外，最核心的生产力工具在于其位于 **订阅（Profiles）** 页面下半部分的 **全局扩展配置（Merge）** 与 **全局扩展脚本（Script）**。

在日常使用机场订阅时，每次服务商自动更新订阅文件，都会把用户直接在原 YAML 文件里手改的自定义规则、端口或 DNS 参数全部覆盖冲掉。通过 Clash Verge Rev 的覆写管道（Override Pipeline），客户端会在每次拉取最新机场订阅后，自动按顺序执行你预设的 Merge 合并项与 Script 脚本，动态生成最终喂给 Mihomo 内核的运行配置，从而实现“订阅自动更新”与“个性化规则永久生效”的完美统一。

### 1. 全局扩展配置（Merge）声明式注入示例

Merge 采用特殊的声明式前置/后置语法（如 `prepend-rules:`、`append-rules:`、`prepend-proxies:`），无需编写任何代码即可向任意订阅顶部优先插入自定义分流规则，或强制开启域名嗅探（Sniffer）与防断连的 `fake-ip-filter`。

操作路径：进入 **订阅（Profiles）** → 右键 **全局扩展配置（Merge）**（或新建一个 Merge 类型的配置卡片并右键勾选“全局启用”）→ 选择 **编辑文本**，粘贴以下经过实测验证的配置模板：

```yaml
# 1. 强制开启 Mihomo 域名嗅探，解决部分软件/游戏绕过 DNS 直接连 IP 导致分流失效的问题
sniffer:
  enable: true
  force-dns-mapping: true
  parse-pure-ip: true
  override-destination: false
  sniff:
    HTTP:
      ports: [80, 8080-8880]
      override-destination: true
    TLS:
      ports: [443, 8443]
    QUIC:
      ports: [443, 8443]
  skip-domain:
    - "Mijia Cloud"
    - "+.push.apple.com"

# 2. 补充 Fake-IP 免劫持白名单，防止 Windows 联网状态图标提示“无 Internet”及内网/游戏联机异常
dns:
  fake-ip-filter:
    - "*.lan"
    - "*.local"
    - "+.msftconnecttest.com"
    - "+.msftncsi.com"
    - "localhost.ptlogin2.qq.com"
    - "+.srv.nintendo.net"
    - "+.stun.playstation.net"
    - "xbox.*.microsoft.com"
    - "+.battlenet.com.cn"

# 3. 在机场原有规则的最顶部优先插入自定义分流规则（按从上到下顺序优先命中）
prepend-rules:
  - DOMAIN-SUFFIX,local,DIRECT
  - IP-CIDR,192.168.0.0/16,DIRECT,no-resolve
  - IP-CIDR,10.0.0.0/8,DIRECT,no-resolve
  - IP-CIDR,172.16.0.0/12,DIRECT,no-resolve
  - DOMAIN-SUFFIX,anthropic.com,PROXY
  - DOMAIN-SUFFIX,claude.ai,PROXY
  - DOMAIN-SUFFIX,chatgpt.com,PROXY
  - DOMAIN-SUFFIX,openai.com,PROXY
```

> [!TIP] 策略组名称匹配提示
> 上述 `prepend-rules` 中的 `PROXY` 需要替换为你所导入机场订阅中的真实主策略组名称（例如部分机场主策略组命名为 `节点选择`、`🚀 节点选择` 或 `Proxy`）。如果不确定不同机场的策略组命名，或者经常在多个机场订阅之间切换，建议使用下方的 JavaScript 扩展脚本动态读取第一个策略组名称。

### 2. 全局扩展脚本（Script）编程式覆写示例

当你需要跨多个不同命名的机场订阅自动注入规则，或者希望自动剔除高倍率节点、按地区重组策略组时，JavaScript 扩展脚本提供了完整的数据结构操控能力。在 **全局扩展脚本（Script）** 中点击编辑，客户端会将订阅 YAML 解析为标准 JS 对象 `config` 传入 `main(config)` 函数：

```javascript
function main(config) {
  // 安全校验：确保订阅中包含有效的策略组
  if (!config["proxy-groups"] || config["proxy-groups"].length === 0) {
    return config;
  }

  // 自动获取当前订阅的第一个主策略组名称，避免硬编码报错
  const primaryGroup = config["proxy-groups"][0].name;

  // 定义需要强制置顶的自定义规则
  const customRules = [
    "PROCESS-NAME,Tailscale.exe,DIRECT",
    "PROCESS-NAME,zerotier-one_x64.exe,DIRECT",
    `DOMAIN-SUFFIX,chatgpt.com,${primaryGroup}`,
    `DOMAIN-SUFFIX,claude.ai,${primaryGroup}`,
    `DOMAIN-SUFFIX,gemini.google.com,${primaryGroup}`
  ];

  // 将自定义规则合并到原有规则数组的最前方
  config.rules = [...customRules, ...(config.rules || [])];

  return config;
}
```

想要深入掌握 YAML 各模块字段含义与自动化订阅维护技巧，可进一步阅读[Clash 配置文件结构详解](/guides/clash-config/)、[分流规则与策略组编写指南](/guides/routing/)以及[订阅自动更新与覆写维护策略](/guides/automatic-update/)。

## 七、 常见报错诊断与高频排障对照表

在日常使用 Clash Verge Rev 的过程中，如果遇到无法启动、拉取订阅失败、节点全部超时或局部软件断网，切勿盲目重装系统或频繁重置配置。请对照下表按“现象 → 根因 → 排查修复动作”逐项核验：

| 故障现象与报错代码 | 核心触发根因 | 标准化排查与修复步骤 | 深度延伸专题 |
| --- | --- | --- | --- |
| **启动后窗口纯白屏，或弹窗提示 `WebView2 Runtime not found`** | 操作系统为精简版 Windows 10/11，缺失 Microsoft Edge WebView2 渲染组件；或显卡驱动硬件加速冲突 | 1. 下载安装微软官方 WebView2 Evergreen 独立安装包；2. 或改用 GitHub Releases 中的 `fixed_webview2` 安装包 | [客户端无法启动与白屏修复](/troubleshooting/startup/) |
| **导入订阅报错 `error sending request`、`status 403` 或 `200+0` 空内容** | 1. 导入前已开启了失效的系统代理导致请求死循环；2. 订阅链接混入空格或为 Base64 格式；3. 机场拦截了当前 UA | 1. 先关闭系统代理与 TUN 模式再尝试直连更新；2. 在订阅编辑信息中将 User-Agent 改为 `ClashMeta`；3. 核对订阅是否过期 | [订阅更新失败与 200+0 排查](/troubleshooting/subscription/) |
| **代理页所有节点延迟测试均显示 `Timeout` 或 `-1`** | 1. 本机系统时间误差超过 90 秒导致 TLS/Reality 握手被拒；2. 核心文件被杀毒软件隔离；3. 机场入口遭遇封锁 | 1. 打开系统时间设置点击“立即同步”（校准见[系统时间与 TLS 修复](/guides/system-time-tls-fix/)）；2. 切换单节点测试浏览器能否实际打开网页 | [节点全部超时排查决策树](/troubleshooting/timeout/) |
| **开启 TUN 模式后开关自动弹回，或游戏/终端依然直连** | 未安装 Service Mode（服务模式），或配置文件中 `dns.enable` 被设为 `false` 导致 Fake-IP 未启动 | 1. 以管理员身份运行一次软件，确认“服务模式”为绿色已运行状态；2. 在 Clash 设置中确认开启内置 DNS 与 Fake-IP | [TUN 模式不生效排查指南](/troubleshooting/tun/) |
| **开启 TUN 模式后本地 WSL2 子系统或 Docker 容器无法联网** | TUN 虚拟网卡的 `auto-route` 抢占了 `vEthernet (WSL)` 虚拟网桥路由，或拦截了容器内部 DNS 转发 | 在扩展配置中为 `tun` 块添加 `route-exclude-address` 排除 `172.16.0.0/12` 网段，并配置 `fake-ip-filter` | [TUN 与 WSL2/Docker 冲突修复](/troubleshooting/tun-wsl-docker-conflict/) |
| **退出软件或电脑关机重启后，浏览器提示 `ERR_PROXY_CONNECTION_FAILED`** | 软件非正常退出（如直接强制关机或进程崩溃），导致 Windows 注册表中的手动代理开关 `127.0.0.1:7897` 未被自动清除 | 重新打开 Clash Verge Rev 再正常关闭一次“系统代理”开关；或进入系统“网络和 Internet → 代理”手动关闭“使用代理服务器” | [代理断连与浏览器无网修复](/troubleshooting/disconnected/) |

## 本专题三级内容集群与延伸阅读

为了帮助你从零基础安装一路进阶到多端协同与内核级调优，我们将与 Clash Verge Rev 强相关的深度内容拆解为以下三个三级专题集群（含本站已发布实操指南与规划中的待发布选题）：

### 集群一：入门部署与跨平台迁移实操
- **已发布关联指南**：
  - [Clash Verge Rev 从零安装到启用 TUN 的完整步骤](/guides/clash-verge-rev-setup/)：面向零基础用户的保姆级配置清单与虚拟网卡状态核验。
  - [2026 订阅格式识别与转换原则](/guides/subscription-formats-explained/)：厘清 Clash YAML、Mihomo 扩展配置、sing-box JSON 与 Base64 通用链接的边界。
  - [Windows 系统时间同步与 TLS 握手报错修正](/guides/system-time-tls-fix/)：解决因 CMOS 电池老化或双系统时区冲突导致的节点大面积 `-1` 超时。
  - [全平台客户端安装与架构核对指南](/guides/installation/)：涵盖 Windows、macOS、Linux 安装包签名与隔离解除规范。
- **规划中待发布选题**（纯文本预告，后续上线）：
  - 《从 Clash for Windows 迁移至 Clash Verge Rev：Parsers 转换 Merge/Script 逐行对照表》（待发布选题）
  - 《Windows 10 LTSC / 企业精简版离线部署 WebView2 与 Clash Verge Rev 便携版制作手册》（待发布选题）

### 集群二：TUN 虚拟网卡、开发环境共存与进阶覆写
- **已发布关联指南**：
  - [Clash TUN 模式与 WSL2 / Docker 虚拟网桥冲突修复方案](/troubleshooting/tun-wsl-docker-conflict/)：针对开发者群体的子网路由排除与 DNS 转发共存实践。
  - [Mihomo（原 Clash.Meta）开源核心与生态客户端指南](/clients/mihomo/)：深入解析 Clash Verge Rev 底层引擎的 Sniffer 嗅探、`.mrs` 规则集与链式代理语法。
  - [Clash YAML 配置文件结构与字段详解](/guides/clash-config/)：掌握 `proxies`、`proxy-groups`、`rule-providers` 与 `dns` 模块的标准写法。
  - [分流规则原理与自定义策略组配置](/guides/routing/)：理解 `DOMAIN-SUFFIX`、`GEOIP`、`PROCESS-NAME` 的匹配优先级与 `no-resolve` 防泄漏关键参数。
- **规划中待发布选题**（纯文本预告，后续上线）：
  - 《Clash Verge Rev 全局扩展脚本（JavaScript）实战：利用 `dialer-proxy` 自动串联中转机场与静态住宅 IP》（待发布选题）
  - 《JetBrains IDE / VS Code 终端 / Git / SSH 在 Clash Verge Rev 系统代理与 TUN 模式下的最优分流实践》（待发布选题）

### 集群三：同类桌面客户端横向选型与服务商适配
- **已发布关联指南**：
  - [FlClash 跨平台客户端下载与配置指南](/clients/flclash/)：同样搭载 Mihomo 内核、基于 Flutter 构建的轻量跨桌面与安卓统一界面替代方案。
  - [v2rayN 下载安装、多核心切换与路由规则教程](/clients/v2rayn/)：适合需要同时管理单条分享链接及切换 Xray-core / sing-box / Mihomo 的多核用户。
  - [Hiddify 全平台客户端使用教程](/clients/hiddify/)与[Karing 规则兼容型客户端指南](/clients/karing/)：基于 sing-box 内核且兼容 Clash 订阅的跨平台备选工具。
  - [AI 与流媒体解锁专题（ChatGPT / Claude / Netflix）](/ai-streaming/)：结合 Clash Verge Rev 的分流策略组，将 AI 对话与流媒体域名精准路由至纯净落地节点。
- **规划中待发布选题**（纯文本预告，后续上线）：
  - 《2026 桌面端 Mihomo GUI 横评：Clash Verge Rev vs FlClash vs Clash Nyanpasu 内存占用与覆写能力实测》（待发布选题）

## 常见问题（FAQ）

### Clash Verge Rev 和原来的 Clash for Windows、初代 Clash Verge 是什么关系？

原版 Clash for Windows（CFW）与初代 Clash Verge 均已于 2023 年底归档停止维护。Clash Verge Rev 是由社区在 GitHub 官方仓库 `clash-verge-rev/clash-verge-rev` 持续迭代的现代继任项目，采用 Tauri 2 框架与 Mihomo（原 Clash.Meta）内核构建，原生兼容 Clash YAML 订阅并支持 VLESS-Reality、Hysteria 2 等新协议及系统级 TUN 接管。

### Windows 打开 Clash Verge Rev 提示缺少 WebView2 或出现启动白屏怎么办？

Clash Verge Rev 的图形界面依托操作系统内置的 Microsoft Edge WebView2 运行时渲染。若使用 Windows 10 LTSC 或第三方精简版系统导致该组件缺失，需前往微软官网下载 Evergreen Standalone Installer 独立安装包补齐运行时，或在官方 GitHub Releases 中下载内置固定版本 WebView2 的安装包。

### 为什么开启 TUN 模式开关后依然无法接管终端、Git 或游戏流量？

仅打开界面上的 TUN 模式开关而未授权底层权限时，普通用户态进程无法在操作系统中创建 Wintun 或 utun 虚拟网卡。必须先以管理员身份运行一次客户端，在设置中安装并激活 Service Mode（服务模式），确认 DNS 配置开启了 Fake-IP 模式后，再打开 TUN 开关才能实现三层网络流量接管。

### 导入机场订阅后为什么看不到服务商宣传的 VLESS-Reality 或 Hysteria 2 节点？

多数机场面板会根据客户端发送的 HTTP User-Agent 请求头动态裁剪下发的节点类型。若请求头被识别为旧版 Clash，面板会自动隐藏原版不支持的新协议。请在 Clash Verge Rev 设置或订阅高级选项中将 User-Agent 确认为 `clash-verge` 或 `ClashMeta`，然后重新手动更新订阅。

### Clash Verge Rev 的 Merge（扩展配置）和 Script（扩展脚本）有什么区别？

Merge 采用声明式 YAML 语法，适合静态前置或后置追加分流规则、注入自定义 DNS 或开启 Sniffer 域名嗅探，语法门槛低且执行稳定；Script 采用 JavaScript 函数对配置对象进行编程式加工，适合批量正则筛选节点、动态生成策略组或跨订阅重构复杂拓扑。

### 从旧版 Clash for Windows 迁移到 Clash Verge Rev 时需要卸载旧软件吗？

强烈建议在备份好原始订阅 URL 与自定义规则后彻底卸载旧版 CFW。卸载前务必先关闭旧软件的 System Proxy 与 TUN Mode，防止旧版注册表残留的本地监听端口（如 `7890`）与新版默认混合端口（`7897`）发生抢占或引发本地代理死循环。

### 开启 TUN 模式后本地 WSL2 子系统或 Docker 容器无法联网怎么解决？

这是由于 TUN 虚拟网卡开启全局自动路由（`auto-route`）后，接管或阻断了 WSL2 与 Docker 虚拟网桥的私有子网通信及内部 DNS 转发。可通过在 Merge 扩展配置中配置 `route-exclude-address` 排除 `172.16.0.0/12` 等容器网段，并将虚拟网桥域名加入 `fake-ip-filter` 予以解决。
