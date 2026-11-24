---
title: "客户端安装标准流程：架构核对、SHA256 校验与系统权限授权"
description: "全平台代理客户端安全安装标准流程：涵盖 GitHub 官方仓库溯源、Windows/macOS/Linux/Android/iOS/OpenWrt 架构识别、SHA256 哈希核验命令与权限依赖修复。"
lastUpdated: 2026-11-23
schemaType: TechArticle
faq:
  - q: "怎么判断我从网上下载的代理客户端是不是官方正版，有没有被加料？"
    a: "唯一可靠的方法是“核对 GitHub 仓库所有者 + 比对 SHA256 校验值”。先从客户端真实开源地址的 Releases 页面下载安装包及其发布的 .sha256 / 校验文本，再用本机 PowerShell Get-FileHash 或 Linux/macOS sha256sum 命令计算，两个 64 位十六进制字符串必须一模一样。"
  - q: "为什么在百度或 Bing 搜索客户端名称排第一的中文网站不能下载？"
    a: "绝大多数桌面代理开源项目在 GitHub 托管且没有所谓“中文官方下载站”。搜索广告或 SEO 伪造站（如高仿 clash 域名）经常把已停更软件或篡改过的客户端打包后提供高速下载，极易被植入木马或恶意篡改浏览器主页。"
  - q: "Windows Defender 拦截或报毒开源核心（如 mihomo.exe、xray.exe）怎么办？"
    a: "部分 Go 语言编译的代理程序因打包压缩或无商业代码签名而容易触发启发式误报。只要确认文件来自 GitHub 官方 Releases 且 SHA256 与官方页面一致，即可在 Windows 安全中心将客户端所在目录加入排除项后恢复使用。"
  - q: "macOS 提示“无法打开，因为无法验证开发者”或“文件已损坏”时，怎么安全解除？"
    a: "先核实安装包确系从官方 GitHub Releases 下载、且芯片架构（Apple Silicon 选 arm64/aarch64，Intel 选 x64）以及 SHA256 全部无误，再把 .app 拖入应用程序目录，使用终端命令 xattr -rd com.apple.quarantine 清除隔离标记，切勿直接对来路不明文件执行解除。"
  - q: "Windows 下安装 Clash Verge Rev 选 setup.exe 安装版还是 portable 便携版更好？"
    a: "对多数普通桌面用户，推荐使用标准 setup.exe 安装版，因为开机自启、系统服务模式（Service Mode）注册和卸载清理更稳定；只有需要在多台公共/办公电脑间随 U 盘携带时才使用便携版，且仍须注意工作机上的防火墙与运行目录权限。"
  - q: "安卓手机下载 APK 时看到 arm64-v8a、armeabi-v7a 和 universal 怎么挑？"
    a: "近六年主流安卓手机与平板处理器几乎全部属于 64 位 ARM 架构，首选体积更精简的 arm64-v8a；极老旧的 32 位安卓设备才选 armeabi-v7a；若实在无法确认设备芯片型号，直接下载 universal 通用包即可兼容所有架构。"
  - q: "在 OpenWrt 软路由安装客户端插件和桌面端安装有什么本质区别？"
    a: "OpenWrt 安装前必须同时核对三项环境：OpenWrt 发行版本（如 Nikki 明确要求 24.10 及以上）、路由器 CPU 架构（如 x86_64、aarch64_cortex-a53）以及底层防火墙架构（firewall3 iptables 还是 firewall4 nftables），且同一台路由严禁同时开启两款透明代理插件。"
---

# 客户端安装标准流程：架构核对、SHA256 校验与系统权限授权

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>代理客户端掌握着整台设备的明文 DNS 查询与网络出口控制权，安全安装的底线是<strong>“只信官方仓库或正规商店、先查处理器架构、必核 SHA256 哈希、合规授予系统权限”</strong>。严格走完本页的四个标准步骤，可以彻底规避搜索引擎山寨钓鱼包、架构选错崩溃与残缺依赖引发的白屏闪退。</p>
</div>

在跨平台网络工具的使用过程中，超过一半的“客户端打不开”“弹窗报错”或“订阅莫名被盗刷”，源头都发生在安装阶段：要么是在搜索引擎误点了高仿“中文官网”广告下载到带剪贴板木马的二次打包程序；要么是 macOS M 系列电脑误装了 Intel 芯片包、Windows 缺了 WebView2 运行时、或者下载了已被声明存在第三方风险的商店衍生包。本专题汇总截至 **2026-11-23** 已核实的官方发布渠道、六大操作系统架构识别指令、可复制文件哈希比对命令及首次运行赋权操作，建立一套可反复复用的安全装机规范。

---

## 第一步：官方可信发布渠道核验清单

永远不要从国内聚合下载站、论坛网盘转发链接或搜索引擎赞助商广告页下载代理客户端。以下是本站 [客户端软件中心](/clients/) 已核验的官方开源仓库与正规商店归属清单（更多细节与维护预警见 [客户端下载安全防钓鱼](/safety/security/)）：

| 客户端名称 | 适用操作系统 | 底层代理核心 | 唯一可信官方发布渠道 | 安装包特别提示 |
| :--- | :--- | :--- | :--- | :--- |
| **[Clash Verge Rev](/clients/clash-verge-rev/)** | Windows / macOS / Linux | Mihomo | GitHub: `clash-verge-rev/clash-verge-rev` | 切勿与已停止维护归档的 Clash for Windows 混淆 |
| **[v2rayN](/clients/v2rayn/)** | Windows / macOS / Linux | Xray / sing-box / Mihomo | GitHub: `2dust/v2rayN` | 新手首选含核心完整包（`WithCore`），防缺少核心无法启动 |
| **[FlClash](/clients/flclash/)** | Windows / Android / macOS / Linux | Mihomo | GitHub: `chen08209/FlClash` | 基于 Flutter 跨端，安装包需严格区分 `arm64` 与 `x64` |
| **[Hiddify](/clients/hiddify/)** | Windows / Android / iOS / macOS / Linux | sing-box | GitHub: `hiddify/hiddify-app` | 全平台多协议自动识别，iOS 版可在非大陆区 App Store 获取 |
| **[Karing](/clients/karing/)** | Windows / Android / iOS / macOS / Linux | sing-box | GitHub: `KaringX/karing` | 兼容 Clash 与 sing-box 规则；iOS 上架区域随商店政策变化 |
| **[v2rayNG](/clients/v2rayng/)** | Android | Xray-core | GitHub: `2dust/v2rayNG` | 轻量化安卓主力，仅识别节点/Base64 订阅而非复杂 Clash YAML |
| **[Clash Meta (CMFA)](/clients/clash-meta/)** | Android | Mihomo | GitHub: `MetaCubeX/ClashMetaForAndroid` | 承接原版已归档 CFA 的安卓规则生态 |
| **[NekoBox](/clients/nekobox/)** | Android | sing-box | GitHub: `MatsuriDayo/NekoBoxForAndroid` | **高危警示**：严禁下载 Google Play 上已被第三方接管的同名应用 |
| **[Shadowrocket](/clients/shadowrocket/)** | iOS / iPadOS | 独立核心 | 非大陆区苹果官方 **App Store** | 付费买断制应用，严禁登录来路不明共享 Apple ID 以防锁机 |
| **[Stash](/clients/stash/)** / **[QX](/clients/quantumult-x/)** / **[Surge](/clients/surge/)** | iOS / macOS | 独立核心 | 苹果官方 **App Store** 或开发者官网 | 均为付费或含高级内购商业软件，按需购买正版授权 |
| **[OpenClash](/clients/openclash/)** / **[Nikki](/clients/nikki/)** | OpenWrt 软路由 | Mihomo | GitHub: `vernesong/OpenClash` / `nikkinikki-org/OpenWrt-nikki` | Nikki 明确要求 **OpenWrt 24.10 及以上**版本 |

---

## 第二步：10 秒查清本机处理器架构与系统版本

下载安装包前，用一行终端命令确认自己的硬件架构和操作系统形态，能避免“下载完双击提示此应用无法在你的电脑上运行”：

| 操作系统 | 本地查询指令 | 返回值对照与推荐下载文件名特征 | 常见安装踩坑点 |
| :--- | :--- | :--- | :--- |
| **Windows 10/11** | `$env:PROCESSOR_ARCHITECTURE` | `AMD64` → 选 **`x64`** / `win64`；`ARM64` → 选 **`arm64`** | 误把 `x86` 或 `arm64` 装到普通 Intel/AMD 电脑；部分安装器缺 WebView2 |
| **macOS** | `uname -m` | `arm64`（M1/M2/M3/M4 芯片）→ 选 **`aarch64`** / `arm64`；`x86_64` → 选 **`x64`** | Apple Silicon 机型若误装 `x64` 会依赖 Rosetta 转译且更耗电 |
| **Linux 桌面** | `uname -m` 与 `cat /etc/os-release` | `x86_64` → 选 **`amd64`**；Debian/Ubuntu 用 `.deb`，Fedora/RHEL 用 `.rpm`，通用选 `.AppImage` | AppImage 下载后必须手动赋可执行权限（`chmod +x`）且部分发行版需 `libfuse2` |
| **Android** | 系统设置“关于手机”查处理器 | 近六年手机统一选 **`arm64-v8a`**；极老旧机选 `armeabi-v7a`；不确定选 `universal` | 华为鸿蒙或国内定制系统弹窗阻拦侧载 APK 安装权限 |
| **OpenWrt 路由** | `cat /etc/openwrt_release` 与 `opkg print-architecture` | 区分 `23.05` vs `24.10+`，确认架构（如 `x86_64`、`aarch64_cortex-a53`）与 `fw3/fw4` | 在 23.05 旧固件强装要求 24.10+ 的 Nikki，或在同一路由双开两个透明代理插件 |

---

## 第三步：下载后执行 SHA256 文件完整性校验

无论是直接从 GitHub Releases 下载，还是由朋友协助离线拷贝安装包，在双击安装之前务必比对一次 SHA256 哈希值（通常在 Releases 页面最底部的 `Assets` 列表或 `.sha256` / `checksums.txt` 文件中给出）：

```powershell
# Windows PowerShell 计算文件 SHA256（将路径替换为实际下载的安装包文件名）
Get-FileHash .\Clash.Verge_x64-setup.exe -Algorithm SHA256
```

```bash
# macOS 终端计算 SHA256
shasum -a 256 ./Clash.Verge_*_aarch64.dmg

# Linux 终端计算 SHA256
sha256sum ./Clash.Verge_*_amd64.deb
```

**验收判读标准**：将终端输出的那串 64 位十六进制字母数字（忽略大小写差异）与官方 GitHub Releases 页面公布的对应条目逐位核对。**哪怕只有最后一位不匹配，也绝不运行安装包**——它要么在传输中被截断损坏，要么已经在下载链路上遭遇篡改劫持。

---

## 第四步：六大平台首次运行依赖修复与系统赋权

通过 SHA256 校验并完成基础文件拷贝后，按照对应系统完成以下首次运行初始化操作：

### 1. Windows 10 / 11：补齐 WebView2 与服务模式
- **WebView2 运行时缺失白屏**：基于 Tauri 架构的桌面软件（如 Clash Verge Rev）依赖系统内的 Microsoft Edge WebView2 Runtime。如果启动后窗口全白、闪退或报错提示找不到 WebView2，前往微软官网下载“常青引导程序（Evergreen Bootstrapper）”安装，或者直接选用内置渲染引擎的 [FlClash](/clients/flclash/) 便携包。详见 [Windows 客户端中心](/clients/platform/windows/)。
- **杀软误报核心文件**：由于部分 Go 语言编译的代理核心文件缺乏昂贵的商业代码签名，Windows 安全中心偶尔会把 `mihomo.exe` 或 `xray.exe` 隔离。确认文件通过官方 SHA256 校验后，在“Windows 安全中心 → 病毒和威胁防护 → 管理设置 → 添加排除项”中将客户端安装文件夹加入白名单并还原核心。
- **安装 Service Mode**：若后续需要开 TUN 接管命令行流量，在客户端设置中顺手安装一次 Service Mode 系统服务，可省去日后每次手动右键以管理员运行。

### 2. macOS：安全处理应用隔离属性
- 把挂载 `.dmg` 镜像中的 `.app` 图标拖入“应用程序（Applications）”文件夹后，首次打开若遭遇“无法验证开发者”或系统报错“已损坏，建议移到废纸篓”，在确保源包哈希一致的前提下，于终端执行以下命令移除 Apple Gatekeeper 隔离标记：
  ```bash
  xattr -rd com.apple.quarantine "/Applications/Clash Verge.app"
  ```
- 随后正常双击打开，当开启系统代理或 TUN 网卡时，在弹出的系统密码验证窗口输入当前 macOS 管理员开机密码授权即可。详见 [macOS 客户端中心](/clients/platform/macos/)。

### 3. Android 与 iOS：商店隔离与后台保活
- **Android 授权**：安装开源 APK 后首次启动代理，系统必然弹出“网络连接请求 / 建立 VPN 连接”授权提示（底层调用 Android `VpnService` 接口），点击确定允许。接着在手机“设置 → 应用管理 → 省电策略”中把客户端设为**“无限制 / 允许后台高耗电”**并在最近任务卡片加锁，防止锁屏五分钟后被系统杀掉后台进程。详见 [Android 客户端中心](/clients/platform/android/)。
- **iOS 外区 App Store 买断**：中国大陆区商店已下架主流规则代理应用。必须使用自己独立注册且安全可控的非大陆区 Apple ID 购买正版 [Shadowrocket](/clients/shadowrocket/)、[Stash](/clients/stash/) 或 [Karing](/clients/karing/)，**严禁在手机的“iCloud 系统设置”里登录他人提供的共享账号**，仅可在 App Store 商店应用内临时切换购买，以免设备被远程锁死。详见 [iOS 客户端中心](/clients/platform/ios/)。

### 4. Linux 与 OpenWrt：执行权限与防火墙检查
- **Linux 桌面与无头服务器**：`.AppImage` 须赋予执行权（`chmod +x *.AppImage`），并按需通过 `setcap` 授予 TUN 权限；如果是无图形界面的纯命令行 VPS 或 NAS 主机，评估采用 Web 管理的 `v2rayA` 或纯命令行 `sing-box` / `mihomo` systemd 服务。详见 [Linux 客户端中心](/clients/platform/linux/)。
- **OpenWrt 软路由**：安装 `.ipk` 或 `.apk` 软件包前，先用 SSH 确认闪存剩余空间（`df -h`）及缺失依赖（如 `dnsmasq-full`、`kmod-tun`），避免安装到一半空间耗尽导致路由 Web 界面崩溃。详见 [OpenWrt 软路由中心](/clients/platform/openwrt/)。

---

## 第五步：安装完成后必须做完的五项安全与可用性收尾检查

不要以为软件窗口弹出来就代表安装已经全部结束。首次装机后花两分钟核对以下五件事，能提前排查掉绝大多数“过几天突然连不上”或者“卸载旧软件留隐患”的问题：

1. **彻底清理已停止维护的旧版软件与冲突服务**：
   - 如果你以前在这台电脑上装过已经归档停止维护的 Clash for Windows，或者安卓手机上装过旧版 Clash for Android，在确认新客户端（如 [Clash Verge Rev](/clients/clash-verge-rev/)、[FlClash](/clients/flclash/) 或 [Clash Meta for Android](/clients/clash-meta/)）已经可以正常拉取订阅后，务必把旧软件连同其残余的开机自启项、旧 Service Mode 服务一并卸载删除。两个同名或同核心的旧版本共存时，不仅极易抢占 7890 / 9090 端口，还可能因为老软件存在历史安全漏洞带来风险。
2. **确认杀毒软件或系统防火墙没有截断出站核心进程**：
   - 在 Windows 安装完并首次点击开启代理时，Windows 防火墙可能会弹出“是否允许 mihomo 或 xray 访问公用/专用网络”的提示框。如果当时不小心点成了“取消”或“拒绝”，之后即使客户端显示已连接，浏览器和终端流量依然会被防火墙本地丢弃。此时进入“Windows Defender 防火墙 → 允许应用通过防火墙”，核对对应核心可执行文件已经同时勾选专用和公用网络放行。
3. **核对内置 GeoIP / GeoSite 规则数据库是否已首次下载就绪**：
   - 不少新安装的客户端（如 v2rayN、Hiddify 或 Clash Verge Rev）在首次开启分流模式时，需要从 GitHub 下载基础的 `Country.mmdb`、`geoip.dat` 与 `geosite.dat` 数据库。如果第一次启动时处于完全直连环境且下载规则库超时失败，就会在日志里看到 `geodata not found` 进而导致内核启动报错退回。首次装机后建议在客户端设置里手动点击一次“更新 Geo 数据库”并确认文件体积非零。
4. **检查外部控制器端口与局域网允许连接开关（安全边界）**：
   - 桌面端如果不需要让局域网里其他手机或平板连过来共用代理（即不需要开启“允许局域网连接 Allow LAN”），请保持 Allow LAN 处于关闭状态，监听地址锁定在 `127.0.0.1` 环回网卡上。这样即使你带着笔记本连到咖啡厅、酒店或学校公共无线网络，同一局域网下的陌生设备也无法扫描并使用你的代理端口，更无法未经授权访问外部控制端口。
5. **在“客户端下载中心”记录本次安装的版本与仓库来源**：
   - 记下自己当前安装的正式版本号（例如从 GitHub Releases 获取的稳定版标签，而非来历不明的测试魔改版），日后需要升级时直接回到同一官方 Releases 页面下载覆盖安装，不要混用不同作者分支的覆盖安装包（例如把第三方分支安装包直接覆盖到官方原版目录上，容易导致配置目录结构损坏）。

---

## 第六步：常见版本升级、多机迁移与安全排雷场景实战

装好软件仅仅是开始，随着客户端和底层代理内核（如 Mihomo、sing-box、Xray-core）在过去一两年持续快速迭代（例如新增对 AnyTLS、VLESS-Reality 细分参数与新二进制规则集的支持），后续在日常升级、团队装机与更换新电脑时，以下五个高频实操规范同样关键：

1. **升级客户端前先备份 `profiles` 与自定义脚本，拒绝盲目覆盖**：
   - 大跨度版本升级（例如从早期 Clash Verge 旧分支迁移到现代 Clash Verge Rev，或从 sing-box 1.9 升级到 1.11+）偶尔伴随配置字段调整或默认策略组格式变化。在执行覆盖安装前，先按 [自动更新与配置备份](/guides/automatic-update/) 导出一份完整的本地配置压缩包，并把自定义扩展脚本单独另存，哪怕新版启动报错也能一分钟内回退恢复。
2. **区分“内核升级”与“图形界面外壳升级”**：
   - 像 v2rayN 这类多核心管理软件，图形界面程序本身更新频率和底层 `xray.exe`、`sing-box.exe`、`mihomo.exe` 的发布节奏并不完全同步。如果机场节点新增了某项新协议特性但你不想重装整个软件，可以在客户端内置的“检查内核更新”功能里单独升级核心，或者同样遵循“官方仓库下载 + SHA256 核对”的原则手动替换对应核心二进制文件。
3. **苹果生态（macOS 与 iOS）同账号同步与付费边界**：
   - 不少用户误以为在 iPhone 上购买了付费版小火箭后，在 macOS 电脑上也能免费通用全功能。虽然苹果 M 系列芯片 Mac 允许直接运行部分 iOS 端 App（如 Shadowrocket 在 Apple Silicon Mac 上可安装，但缺乏桌面端原生的强力服务模式与完整 TUN 控制能力），桌面生产环境仍推荐在 macOS 上安装开源原生的 Clash Verge Rev 或 FlClash，把 Shadowrocket、Stash、Quantumult X 留给移动 iOS 设备发挥省电与原生网络扩展优势。
4. **品牌专属客户端的安装安全边界**：
   - 如果你选用的是数据库里明确标注“仅支持专属客户端”的机场品牌（如飞猫云、Firefly、隐形人、SOGO 云、全球云、无忧链接、灵猫网络、闪跃），由于这类客户端多为闭源定制包，**绝不能通过搜索引擎或陌生群聊获取安装包**，只能登录该服务商官方账号面板后从仪表盘内下载对应平台客户端；如果在系统安全软件提示未知发布者风险时拿不准真假，先用小额测试机或虚拟机隔离环境验证其数字签名、安装目录行为及网络请求去向，切忌在存放重要商业代码与金融凭证的主力工作机上随意运行未经核验的闭源高权限安装器。
5. **安装失败报错时的日志提取与归因思路**：
   - 当客户端双击打不开、白屏闪退或安装过程中直接报错中断时，不要盲目反复重装十遍，而是按以下顺序提取真实报错信息：Windows 先看“事件查看器”应用程序错误日志或用 PowerShell 直接从命令行拉起主程序观察标准错误输出；macOS 在“控制台（Console.app）”或终端直接执行 `.app/Contents/MacOS/` 下的可执行文件查看崩溃栈；Linux 则通过命令行启动 `.AppImage` 读取缺少哪个动态链接库（常见为 `libfuse.so.2` 或 `libwebkit2gtk`）。把真实报错关键词对照 [客户端无法启动处理](/troubleshooting/startup/)，几乎都能在三分钟内精准解决。
6. **在受限校园网或企业内网初次安装时的核心前置核验**：
   - 如果是在校园网或受防火墙严格管控的办公环境下完成初次装机，部分应用商店或开源仓库附件可能遭遇直接连接超时。切忌因为原仓库下载慢就转去国内不明软件下载站找所谓“高速镜像包”；更稳妥的做法是先通过可信设备下载并计算 SHA256 哈希，或者利用合规的开源镜像机制核对原始签名文件。安装完成后第一次配置订阅前，务必同步校对系统当前日期时间误差不超过三十秒，避免后续排查节点超时时把时钟问题误当成软件安装故障。最后在客户端首次启动并拉通连接后，建议把当前安装包的正式发布页地址加入浏览器书签，并关闭“自动从非官方弹窗链接更新”一类的提示开关，日后每次跨版本升级都坚持回到同一开源仓库或苹果官方商店核对版本说明与校验值，形成从初次装机到长期维护的完整安全闭环。最后，如果你同时管理着家里或小团队的多台设备，建议把每次核对过官方签名并实测正常的客户端版本记录在本地安装台账里，统一团队成员下载同一经验证版本并禁用不明渠道自动升级弹窗，从而将软件供应链被投毒的风险控制在零。遇到系统升级大版本或更换新硬件平台时，务必重新对照上述第二步的处理器架构查询指令再次选包，绝不要把旧机器的硬盘镜像或旧安装包直接跨架构硬装到新设备上。完成装机后建议顺手在系统日历设置每季度一次的官方版本与校验复核提醒，既能及时修补上游内核已知漏洞，也能防止长期运行被遗忘的过期旧版本导致协议不兼容。

---

## 本专题三级内容集群与延伸阅读

### 集群 A：跨平台安全装机与架构识别集群
- 已发布核心指南：[Windows 平台中心](/clients/platform/windows/) · [macOS 平台中心](/clients/platform/macos/) · [Android 平台中心](/clients/platform/android/) · [iOS 平台中心](/clients/platform/ios/) · [Linux 平台中心](/clients/platform/linux/) · [OpenWrt 平台中心](/clients/platform/openwrt/)
- *待发布选题*：`Windows 11 ARM64 笔记本（骁龙 X 系列）原生运行代理客户端兼容实测清单`
- *待发布选题*：`Linux Wayland 桌面环境下 Electron/Tauri 代理客户端白屏与托盘图标消失修复`

### 集群 B：下载防钓鱼与依赖故障排查集群
- 已发布核心指南：[客户端下载安全防钓鱼](/safety/security/) · [客户端无法启动处理](/troubleshooting/startup/) · [Clash Verge Rev 从零安装指南](/guides/clash-verge-rev-setup/)
- *待发布选题*：`如何彻底清理曾误装的“假冒中文官网版 Clash for Windows”及其注册表与计划任务残留`

### 集群 C：装机后的订阅接入与 TUN 初始化集群
- 已发布核心指南：[订阅导入与更新管理](/guides/subscription/) · [TUN 模式深度配置](/guides/tun/)
- *待发布选题*：`v2rayN WithCore 完整包与无核心精简包各自升级替换操作规范`

---

## 常见问题（FAQ）

### 怎么判断我从网上下载的代理客户端是不是官方正版，有没有被加料？

唯一可靠的方法是“核对 GitHub 仓库所有者 + 比对 SHA256 校验值”。先从客户端真实开源地址的 Releases 页面下载安装包及其发布的 .sha256 / 校验文本，再用本机 PowerShell Get-FileHash 或 Linux/macOS sha256sum 命令计算，两个 64 位十六进制字符串必须一模一样。

### 为什么在百度或 Bing 搜索客户端名称排第一的中文网站不能下载？

绝大多数桌面代理开源项目在 GitHub 托管且没有所谓“中文官方下载站”。搜索广告或 SEO 伪造站（如高仿 clash 域名）经常把已停更软件或篡改过的客户端打包后提供高速下载，极易被植入木马或恶意篡改浏览器主页。

### Windows Defender 拦截或报毒开源核心（如 mihomo.exe、xray.exe）怎么办？

部分 Go 语言编译的代理程序因打包压缩或无商业代码签名而容易触发启发式误报。只要确认文件来自 GitHub 官方 Releases 且 SHA256 与官方页面一致，即可在 Windows 安全中心将客户端所在目录加入排除项后恢复使用。

### macOS 提示“无法打开，因为无法验证开发者”或“文件已损坏”时，怎么安全解除？

先核实安装包确系从官方 GitHub Releases 下载、且芯片架构（Apple Silicon 选 arm64/aarch64，Intel 选 x64）以及 SHA256 全部无误，再把 .app 拖入应用程序目录，使用终端命令 xattr -rd com.apple.quarantine 清除隔离标记，切勿直接对来路不明文件执行解除。

### Windows 下安装 Clash Verge Rev 选 setup.exe 安装版还是 portable 便携版更好？

对多数普通桌面用户，推荐使用标准 setup.exe 安装版，因为开机自启、系统服务模式（Service Mode）注册和卸载清理更稳定；只有需要在多台公共/办公电脑间随 U 盘携带时才使用便携版，且仍须注意工作机上的防火墙与运行目录权限。

### 安卓手机下载 APK 时看到 arm64-v8a、armeabi-v7a 和 universal 怎么挑？

近六年主流安卓手机与平板处理器几乎全部属于 64 位 ARM 架构，首选体积更精简的 arm64-v8a；极老旧的 32 位安卓设备才选 armeabi-v7a；若实在无法确认设备芯片型号，直接下载 universal 通用包即可兼容所有架构。

### 在 OpenWrt 软路由安装客户端插件和桌面端安装有什么本质区别？

OpenWrt 安装前必须同时核对三项环境：OpenWrt 发行版本（如 Nikki 明确要求 24.10 及以上）、路由器 CPU 架构（如 x86_64、aarch64_cortex-a53）以及底层防火墙架构（firewall3 iptables 还是 firewall4 nftables），且同一台路由严禁同时开启两款透明代理插件。
