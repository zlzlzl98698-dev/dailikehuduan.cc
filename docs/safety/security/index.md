---
title: "客户端下载安全与防钓鱼指南：18 款主流工具官方仓库核对、SHA256 校验与停更软件清理"
description: "全网代理客户端下载安全、防山寨钓鱼网站与 GitHub SHA256 校验教程：深度剖析假冒 Clash for Windows 中文网、假 v2rayN 官网与假小火箭安装包植入剪贴板木马的完整攻击链，核对 18 款主流客户端唯一下载源，提供 PowerShell Get-FileHash 与 macOS/Linux shasum 逐步校验指令，以及 NekoBox Google Play 非官方版警告与已归档 CFW/CFA 安全清理手册。"
lastUpdated: "2026-11-23"
schemaType: "TechArticle"
faq:
  - q: "在搜索引擎搜索“Clash for Windows 官网”或“v2rayN 中文网”，排在前面的网站能下载吗？"
    a: "绝对不能下载！原版 Clash for Windows (CFW) 与 Clash 开源内核早已于 2023 年底停止维护并删库归档，作者从未设立过任何中文下载官网。搜索引擎竞价广告和自然排名靠前的所谓中文官网、绿色汉化版，绝大多数是高仿钓鱼站，专门用于在安装包里二次捆绑剪贴板监听木马、数字货币地址替换器或盗取机场订阅 Token。"
  - q: "如何确认某款开源代理客户端在 GitHub 上的仓库是不是李鬼高仿库？"
    a: "必须逐字核对完整的“所有者/仓库名（owner/repo）”路径，而不能只看项目标题或 Star 数量。攻击者常刷高假仓库的 Star 并把名字改成 clash-verge-pro、v2rayn-win 或 clash-meta-cn 等相似拼写。本文整理的 18 款主流客户端核对清单均已依据站点档案核实精确仓库地址，下载前请一字不差地比对浏览器地址栏路径。"
  - q: "为什么下载完官方安装包后，还要专门跑一遍 SHA256 哈希校验？"
    a: "由于网络环境限制，很多用户会通过加速镜像、网盘转发或群友搬运获取客户端安装包。只要文件在传输或存储环节被第三方注入哪怕 1 个字节的恶意代码，计算出的 64 位 SHA256 哈希指纹就会发生雪崩式巨变。将本地算出的哈希值与 GitHub Release 页面官方公布的校验码比对，是 100% 验证安装包未被二次打包篡改的最高效手段。"
  - q: "Windows PowerShell 的 Get-FileHash 和 macOS 的 shasum 校验结果大小写不一样怎么办？"
    a: "十六进制哈希值（0-9 与 A-F）在语义上不区分大小写。Windows PowerShell 的 Get-FileHash 默认输出全大写字母，而 macOS 的 shasum -a 256 与 Linux 的 sha256sum 通常输出全小写字母。只要 64 位字符的字母与数字排列逐位完全一致，就代表文件完整性校验通过；如果有任意 1 位不同，必须立刻删除。"
  - q: "为什么 NekoBox 官方仓库明确警告不要去 Google Play 下载同名软件？"
    a: "根据 NekoBoxForAndroid 原作者团队在 GitHub 仓库发布的警示说明，目前上架于 Google Play 商店的同名 NekoBox 并非原开源作者团队维护控制，存在严重的安全与来源控制风险，且该项目本身维护资源有限。安卓用户如需使用 NekoBox，仅限前往 GitHub 官方 Release 核对签名，更推荐新装机直接选用活跃维护的 FlClash、v2rayNG、Hiddify 或 Karing。"
  - q: "以前装在电脑或手机上的旧版 Clash for Windows (CFW) 或 Clash for Android (CFA) 还能继续用吗？"
    a: "强烈建议立刻停止使用并彻底卸载清理。已归档停更的软件不仅无法获得高危安全漏洞（如远程代码执行、配置解析漏洞）的修复补丁，也不兼容 VLESS-Reality、Hysteria 2 与 AnyTLS 等现代主流协议。卸载前请先导出备份你的节点订阅链接和自定义规则，清理残余后台服务后再迁移至 Clash Verge Rev、FlClash 或 Clash Meta for Android。"
  - q: "为了下载 iOS 的 Shadowrocket（小火箭），直接在淘宝买共享 Apple ID 或用别人的账号登录安全吗？"
    a: "存在极高安全风险。购买或使用来路不明的共享 Apple ID 时，千万不要将其登录进手机系统的「设置 → iCloud」，否则对方随时可以在远程开启丢失模式锁定你的整部 iPhone 并敲诈勒索。同时不要下载安装任何网页提示的企业签名版小火箭安装包。正确做法是自行注册独立非大陆区 Apple ID 并在官方 App Store 商店内正规买断购买。"
---

# 客户端下载安全与防钓鱼指南：官方源头核对、SHA256 校验与停更软件清理

<div class="answer-first-box">
  <div class="answer-first-label">核心结论 · Answer First</div>
  <p>代理客户端运行在操作系统网络栈的最高权限层（系统代理、服务后台与虚拟 TUN 网卡），一旦下载并运行了被二次打包的高仿安装包，攻击者无需破解任何加密即可直接窃取你的剪贴板、浏览器 Cookie、加密货币助记词与机场订阅 Token。守住<strong>客户端下载安全</strong>的唯一铁律是：<strong>远离搜索引擎竞价广告与一切“中文官网/网盘整合版”，对照 18 款主流工具唯一官方源头下载，并用 PowerShell <code>Get-FileHash</code> 或 <code>shasum -a 256</code> 完成 64 位 SHA256 指纹核对后再安装</strong>。</p>
</div>

## 一、防山寨钓鱼网站：高仿客户端植入木马的完整攻击链剖析

在中文互联网搜索代理工具时，“搜错一个网址”往往比“选错一家机场”的代价惨重百倍。机场选错最多损失二十元月费，而电脑装进一个带木马的假客户端，可能导致主力社交账号被盗、浏览器自动填充密码被窃取甚至数字钱包资产瞬间归零。

### 1. 攻击者是如何通过高仿站一步步控制用户设备的？

通过对近年高发的仿冒 Clash、v2rayN 与小火箭钓鱼案件复盘，我们可以清晰还原出一条高度工业化的 **五步攻击链**：

1. **第一步：抢占搜索引擎竞价广告与 SEO 高仿域名**：
   攻击者批量注册诸如 `clash-cn.com`、`clashforwindows-download.com`、`v2rayn-official.cc`、`shadowrocket-ios.vip` 等极具迷惑性的域名，利用已删库软件留下的品牌真空期，在中文搜索引擎购买广告位或通过采集文章把网站推到搜索结果首页第一条，页面伪装得甚至比真正的 GitHub 仓库还“像官网”。
2. **第二步：提供“免翻墙高速下载”的二次打包程序**：
   用户因为当时还没有可用代理、打不开 GitHub，很容易病急乱投医点击这些国内直连快下载站。下载到的 `.exe`、`.dmg` 或 `.zip` 压缩包表面上确实内置了一个能打开界面的客户端（通常是基于旧版开源代码编译的正常壳程序），但在安装包或配套的 `mihomo.exe`/`xray.exe` 核心文件里被悄悄捆绑了木马模块。
3. **第三步：用“开源工具易误报”话术诱导关闭系统杀毒软件**：
   用户双击安装包时，Windows Defender 或第三方杀软弹出高危木马拦截。钓鱼网站下载页早就提前写好了一段极具欺骗性的提示：“*因代理工具特性，下载前请务必先彻底关闭 Windows 安全中心实时保护与防火墙，否则无法运行！*”一旦用户照做，安全防线彻底敞开。
4. **第四步：权限驻留与剪贴板/浏览器敏感信息收割**：
   假客户端运行后，不仅能正常导入你的机场订阅用来麻痹你的警惕心，同时会在后台静默安装计划任务或系统服务，持续监控剪贴板（实时将你复制的比特币/USDT 收款地址替换成攻击者地址）、读取 Chrome/Edge 本地加密凭据与 Session Cookie，并把你导入的机场订阅链接回传给后台服务器。
5. **第五步：iOS 端“企业签名弹窗 / 共享锁机账号”钓鱼**：
   由于 iPhone 无法直接安装普通 IPA 包，钓鱼站点常把目标对准搜索“小火箭免费下载”的新手：要么诱导通过 Safari 安装来路不明的企业描述文件与重签名修改版 IPA（内嵌隐私窃取模块或 MitM 证书），要么诱骗用户在系统设置登录其提供的共享 Apple ID 到 iCloud，随后远程触发设备锁死进行勒索。

### 2. 四类绝对不能碰的高危下载渠道红线

| 高危渠道类型 | 典型话术与伪装形态 | 真实危害机制 | 识别与阻断动作 |
| :--- | :--- | :--- | :--- |
| **中文“官网/下载站”** | 域名包含 `clash-cn`、`cfw-win`、`v2rayn-vip`、`shadowrocket-down` 等，自称官方中文站 | 100% 为非官方商业引流站或木马分发站，原版 CFW 已于 2023 年底删库 | 立即关闭网页，开源软件只认 GitHub 官方 `owner/repo` 路径 |
| **GitHub 拼写高仿仓库** | 仓库名微调成 `clash-verge-pro`、`2dust-v2rayN`、`mihomo-gui-cn`，甚至刷出上千个虚假 Star | 假仓库 Releases 中的二进制可执行文件被植入后门，源码目录常为空壳 | 核对下表精确 `owner/repo` 字符，查看最近提交历史（Commits）与 Issue 活跃度 |
| **网盘“免配置绿色整合版”** | 各种论坛帖子里打包好的 `.7z`/`.zip`，号称“内置免费节点、解压即用” | 压缩包内的底层内核文件常被替换为旧版或带远控后门的恶意程序 | 绝不运行他人转发的未验哈希压缩包；只使用官方原生干净客户端 |
| **第三方安卓杂牌应用市场** | 国内部分应用商店或下载站提供的同名 APK（以及 **Google Play 上的同名 NekoBox**） | 极易遭遇恶意重打包；NekoBox 官方已特别声明 Google Play 同名应用非官方维护 | 安卓安装包坚持从官方 GitHub Releases 获取，或核对作者明确指定的商店发布链接 |

---

## 二、18 款主流客户端唯一下载源核对清单（`2026-11-23` 全量核实）

为了彻底消除检索误差，本站依据 [客户端数据档案（clients.ts）](/clients/) 逐一核实了全部 **18 款主流代理客户端与底层核心** 的唯一官方来源、支持平台、开源属性、当前维护状态及安全警示。下载任何软件前，请将浏览器地址栏的网址与下表逐字核对：

| 序号 | 客户端 / 核心名称 | 适用平台 | 底层核心与开源性 | 唯一官方 GitHub 仓库 / 正版商店 | 维护状态与安全注意事项（`2026-11-23` 核实） |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | **[Clash Verge Rev](/clients/clash-verge-rev/)** | Win / macOS / Linux | Mihomo · 免费开源 | `https://github.com/clash-verge-rev/clash-verge-rev` | **活跃维护**：现代桌面主力；Windows 注意 WebView2 运行时，勿与已停更的 CFW 及原版 Clash Verge 混淆 |
| 2 | **[v2rayN](/clients/v2rayn/)** | Win / macOS / Linux | 多核心（Xray/sing-box/Mihomo）· 免费开源 | `https://github.com/2dust/v2rayN` | **活跃维护**：下载压缩包时注意区分是否含核心（`WithCore`）或需单独拉取内核 |
| 3 | **[FlClash](/clients/flclash/)** | Win / Android / macOS / Linux | Mihomo · 免费开源 | `https://github.com/chen08209/FlClash` | **活跃维护**：基于 Flutter 的全平台工具；macOS 注意核对 `arm64` 与 `x64` 芯片安装包 |
| 4 | **[Hiddify](/clients/hiddify/)** | Win / Android / iOS / macOS / Linux | sing-box · 免费开源 | `https://github.com/hiddify/hiddify-app` | **活跃维护**：iOS 认准 App Store 开发者官方上架页面；支持多订阅自动识别 |
| 5 | **[Karing](/clients/karing/)** | Win / Android / iOS / macOS / Linux | sing-box · 免费开源 | `https://github.com/KaringX/karing` | **活跃维护**：支持 Clash 规则向 sing-box 迁移；iOS 上架状态随区域商店策略动态变化 |
| 6 | **[Clash Meta for Android](/clients/clash-meta/)** | Android（生态延展至桌面） | Mihomo · 免费开源 | `https://github.com/MetaCubeX/ClashMetaForAndroid` | **活跃维护**：承接已停更原版 Clash for Android 的安卓官方现代替代品 |
| 7 | **[v2rayNG](/clients/v2rayng/)** | Android | Xray-core · 免费开源 | `https://github.com/2dust/v2rayNG` | **活跃维护**：轻量 Xray 系安卓端；切勿从杂牌安卓市场下载同名假包，注意不支持复杂 Clash YAML |
| 8 | **[Shadowrocket（小火箭）](/clients/shadowrocket/)** | iOS / iPadOS | 私有核心 · 付费闭源 | `https://apps.apple.com/app/shadowrocket/id932747118` | **活跃维护**：大陆区未上架，须用非大陆区独立 Apple ID 在商店买断，**严禁登录共享账号到 iCloud** |
| 9 | **[Stash](/clients/stash/)** | iOS / macOS | 私有核心 · 付费闭源 | `https://stash.ws/`（官网入口，商店区域链接需实时核实） | **活跃维护（链接待实时核实）**：档案标记 `officialSourceVerified: false`，购买时需通过官网跳转核对正版 App Store 开发者 |
| 10 | **[Quantumult X（圈 X）](/clients/quantumult-x/)** | iOS / iPadOS | 私有核心 · 付费闭源 | `https://apps.apple.com/app/quantumult-x/id1443988620` | **活跃维护**：主打重写与脚本的 iOS 进阶付费应用，认准 App Store 官方唯一应用 ID |
| 11 | **[Surge](/clients/surge/)** | iOS / macOS | 私有核心 · 免费含高阶内购 | `https://nssurge.com/` | **活跃维护**：专业调试与网关级代理套件，仅通过官网及官方指引渠道获取授权 |
| 12 | **[NekoBox for Android](/clients/nekobox/)** | Android / Win / Linux | sing-box · 免费开源 | `https://github.com/MatsuriDayo/NekoBoxForAndroid` | **谨慎注意（`caution`）**：维护资源有限，且**严禁下载 Google Play 上的同名非官方版本** |
| 13 | **[Mihomo 核心](/clients/mihomo/)** | 全平台底层二进制 | Mihomo · 免费开源 | `https://github.com/MetaCubeX/mihomo` | **活跃维护**：原 Clash.Meta 开源内核；普通桌面用户建议搭配 Clash Verge Rev 或 FlClash 使用 |
| 14 | **[sing-box 核心与官方端](/clients/sing-box/)** | 全平台（SFA/SFI/SFM） | sing-box · 免费开源 | `https://sing-box.sagernet.org/` | **活跃维护**：官方提供 SFA (Android) / SFI (iOS) / SFM (macOS)，文档内含官方商店及 GitHub 入口 |
| 15 | **[OpenClash](/clients/openclash/)** | OpenWrt 软路由 | Mihomo · 免费开源 | `https://github.com/vernesong/OpenClash` | **活跃维护**：部署前需确认架构及 `dnsmasq-full`/`kmod-tun` 依赖，勿与 PassWall2 并行开启 |
| 16 | **[PassWall2](/clients/passwall2/)** | OpenWrt 软路由 | 多核心（Xray/sing-box）· 免费开源 | `https://github.com/xiaorouji/openwrt-passwall2` | **活跃维护**：安装前需核查路由器剩余闪存空间能否容纳多核心 |
| 17 | **[Nikki（原 MihomoTProxy）](/clients/nikki/)** | OpenWrt 24.10+ | Mihomo · 免费开源 | `https://github.com/nikkinikki-org/OpenWrt-nikki` | **活跃维护**：项目明确要求 **OpenWrt 24.10 及以上版本**（nftables/firewall4），旧版勿强装 |
| 18 | **[HomeProxy](/clients/homeproxy/)** | OpenWrt / ImmortalWrt | sing-box · 免费开源 | `https://github.com/immortalwrt/homeproxy` | **活跃维护**：原生基于 sing-box 与 firewall4，适合新架构路由固件 |

> **如何按设备快速锁定？** 如果你不清楚自己的系统该从哪一款入手，可直接浏览对应平台专题：[Windows 客户端选型](/clients/platform/windows/)、[Android 客户端选型](/clients/platform/android/)、[iOS 客户端选型](/clients/platform/ios/)、[macOS 客户端选型](/clients/platform/macos/)、[Linux 客户端选型](/clients/platform/linux/) 以及 [OpenWrt 软路由选型](/clients/platform/openwrt/)。

---

## 三、GitHub SHA256 校验教程：下载后 20 秒验证文件未被篡改

就算你确信自己打开了正确的 GitHub 仓库页面，如果因为直连访问困难而借用了他人中转下载、镜像站加速，或者从本地网盘迁移安装包到另一台电脑，依然存在传输过程被污染篡改的理论风险。养成“下载后先算一遍 `SHA256` 再双击安装”的习惯，只需不到 20 秒，就能从密码学层面彻底杜绝木马替换。

### 第一步：在 GitHub Releases 找到正确架构文件与官方哈希值

打开官方仓库页面（以 `github.com/clash-verge-rev/clash-verge-rev` 为例），点击右侧栏的 **`Releases`** 进入最新正式版发布页（避开标有 `Pre-release` 的测试版，除非你有特定修复需求）：

1. **展开 `Assets` 资源列表**：核对与你操作系统和 CPU 架构完全匹配的文件名（例如：Windows 常规电脑选 `x64-setup.exe`，骁龙 ARM 笔记本选 `arm64-setup.exe`；苹果 M1/M2/M3/M4 芯片 Mac 选 `aarch64.dmg` 或 `arm64.dmg`，旧款 Intel Mac 选 `x64.dmg`；现代安卓手机选 `arm64-v8a.apk`）。
2. **定位官方公布的 SHA256 指纹**：主流开源项目通常通过两种方式公布哈希值：
   - **方式 A**：直接在 `Assets` 列表里附带一个同名的 `.sha256` 校验文件（例如 `Clash.Verge_2.x.x_x64-setup.exe.sha256`）或全局 `checksums.txt`。
   - **方式 B**：直接写在 Release 正文说明底部折叠栏（`Checksums` / `SHA256`）或文件列表右侧展示的 `sha256:...` 摘要。

### 第二步：Windows PowerShell `Get-FileHash -Algorithm SHA256` 逐步实操

Windows 10 与 Windows 11 系统原生内置了 `Get-FileHash` 命令，**无需下载任何第三方哈希计算工具**（避免用第三方小工具本身又中招）：

1. 按下快捷键 `Win + X`，选择 **“终端（Terminal）”** 或 **“Windows PowerShell”**。
2. 输入以下命令（技巧：打出 `Get-FileHash "` 后，可以直接把下载好的安装包从文件夹拖进黑框里，系统会自动补全完整文件路径）：

```powershell
# 1. 计算下载目录中安装包的 SHA256 哈希值
Get-FileHash -Path "$HOME\Downloads\Clash.Verge_x64-setup.exe" -Algorithm SHA256

# 2. 进阶防眼花技巧：直接让 PowerShell 替你比对官方公布的 64 位哈希（返回 True 代表 100% 一致）
(Get-FileHash "$HOME\Downloads\Clash.Verge_x64-setup.exe" -Algorithm SHA256).Hash -eq "此处粘贴GitHub官方公布的64位SHA256字符串"
```

- **结果判读**：如果你使用第 2 条比对命令，PowerShell 会忽略字母大小写自动逐位核对，输出 **`True`** 即表示文件原封不动、安全可装；若输出 **`False`**，哪怕只有一位字符不一致，**立刻按下 `Shift + Delete` 永久删除该安装包，绝对不要运行！**

### 第三步：macOS 与 Linux `shasum -a 256` / `sha256sum` 逐步实操

macOS（Terminal 终端）与主流 Linux 发行版同样自带原生校验命令：

```bash
# macOS：使用内置的 shasum 计算 SHA256 指纹
shasum -a 256 ~/Downloads/Clash.Verge_aarch64.dmg

# macOS 防眼花自动比对（将官方值替换为实际字符串，末尾加两个空格和文件路径，输出 OK 即通过）
echo "官方64位SHA256字符串  $HOME/Downloads/Clash.Verge_aarch64.dmg" | shasum -a 256 -c -
```

```bash
# Linux (Ubuntu / Debian / Arch)：使用 sha256sum 计算
sha256sum ~/Downloads/Clash.Verge_amd64.deb

# 如果同时从 GitHub Release 下载了对应的 .sha256 文件到同一目录，可直接一行自动校验
sha256sum -c Clash.Verge_amd64.deb.sha256
```

### 第四步：区分“正常的开源软件系统弹窗”与“危险的杀毒豁免要求”

校验通过后首次安装或运行客户端时，Windows 与 macOS 往往仍会弹出安全提示。很多新手分不清这两种弹窗的本质差异：

1. **正常无害拦截（仅限 SHA256 已校验通过的官方开源安装包）**：
   - **Windows SmartScreen 蓝色弹窗**（“Windows 已保护你的电脑”）：这是因为大多数免费开源软件作者没有花费数千元人民币去购买商业 EV 代码签名证书。只要你确信安装包源自上表官方 GitHub 仓库且 `SHA256` 完全一致，点击「更多信息 → 仍要运行」即可，**千万不要为了安装它去关闭 Windows Defender 实时防护**。
   - **macOS Gatekeeper 提示**（“无法验证开发者”或提示“已损坏，无法打开”）：由于应用未经过 Apple 官方公证（Notarization），macOS 会给从浏览器下载的文件打上 `com.apple.quarantine` 隔离标签。确认 SHA256 无误后，按照 [客户端安装标准流程](/guides/installation/) 与 [无法启动排查](/troubleshooting/startup/) 移除隔离属性即可安全启动。
2. **必须立刻拉黑的高危信号**：
   - 如果软件还没运行、或者从非 GitHub 未知网站下载后，Windows Defender **直接报出具体的木马/勒索病毒名称**（如 `Trojan:Win32/...`、`Stealer`），且网站客服强硬要求“把整个 C 盘加入杀软白名单”，必须立即删除文件并全盘查杀。

---

## 四、NekoBox 非官方版风险与已归档停更软件（CFW / CFA）彻底清理指南

除了下载阶段的防钓鱼，代理安全还有一个常被忽视的盲区：**继续留在设备上的“历史停更软件”和“非官方商店同名分支”**。

### 1. NekoBox for Android：为什么必须警惕 Google Play 同名版本？

在 [客户端数据库档案](/clients/nekobox/) 中，[NekoBox for Android](/clients/nekobox/) 虽然曾是早期推动 sing-box 在安卓端普及的重要开源项目，但当前维护状态被明确标定为 **`caution`（谨慎使用）**，核心风险点有两条：
1. **Google Play 商店同名应用控制权风险**：`MatsuriDayo/NekoBoxForAndroid` 原作者团队曾在项目说明中特别发出警示——**Google Play 上架的同名 NekoBox 并非官方作者控制维护的版本**！普通用户如果习惯性直接在 Play 商店搜名字下载，极可能装入来源不明或存在潜在控制权隐患的第三方构建版本。
2. **维护资源有限与现代新装机替代路线**：由于 NekoBox 原项目明确提示维护资源有限，如果你是 2026 年新装机的安卓用户，**建议直接从官方 GitHub Releases 优先选择活跃维护的替代品**：
   - 习惯 Clash YAML 策略组订阅：首选 [FlClash](/clients/flclash/) 或 [Clash Meta for Android](/clients/clash-meta/)；
   - 需要同时兼容 Clash/sing-box/Base64 多格式订阅：首选 [Hiddify](/clients/hiddify/) 或 [Karing](/clients/karing/)；
   - 只需要轻量级 Xray 单节点与分应用代理：首选 [v2rayNG](/clients/v2rayng/)；
   - 需要使用原汁原味官方实现：前往 [sing-box 官方文档](/clients/sing-box/) 获取官方 **SFA** 客户端。

### 2. 已归档停更软件（Clash for Windows / Clash for Android）安全清理指南

原版 `Clash for Windows (CFW)` 与 `Clash for Android (CFA)` 均已于 2023 年底永久停止维护并删除原代码仓库。部分老用户抱着“还能用就不换”的心态一直沿用旧版安装包，实际上隐藏着三重严重隐患：
- **已公开的高危安全漏洞无人修补**：停更软件曾曝出过配置文件解析引发的远程代码执行（RCE）或本地提权漏洞，一旦不小心导入恶意构造的远程订阅 YAML，攻击者就能直接控制你的电脑。
- **无法支持现代抗干扰新协议**：旧版 Clash 原生内核停留在老版本时代，面对目前主流机场广泛部署的 `VLESS-Reality`、`Hysteria 2`、`TUIC` 与 `AnyTLS`（例如 [一翻云](/brands/yifan/)、[光速云](/brands/guangsuyun/) 等品牌涉及的新协议）会直接报错无法解析节点。
- **未来重装系统时极易被迫掉进钓鱼站坑里**：习惯了搜旧名字的人，换新电脑时去搜索“Clash for Windows 下载”，几乎 100% 踩中第一章节剖析的假官网木马站。

**请按以下 5 步安全且干净地完成旧版 CFW / CFA 清理与无损迁移：**

1. **第一步（先备份配置与订阅链接）**：打开旧版 CFW 的 `Profiles` 页面，右键当前正在使用的配置点击 `Copy URL` 或记录你的机场官网地址，同时把你手写过的自定义分流规则文本另存为纯文本备份（不要直接把旧版软件目录打包迁移）。
2. **第二步（彻底关闭系统代理与服务模式）**：在 CFW 的 `General` 页面，**务必先取消勾选 `System Proxy`（系统代理）和 `TUN Mode`（虚拟网卡）**；如果此前开启过 `Service Mode`（服务模式），点开 `Manage → Uninstall` 卸载掉旧的后台系统服务，避免卸载软件后电脑全部网页断网（详见 [断开连接与代理残留排查](/troubleshooting/disconnected/)）。
3. **第三步（卸载旧程序并清理残留目录）**：
   - **Windows (CFW)**：完全退出托盘图标 → 通过系统「应用和功能」卸载 Clash for Windows → 手动检查并删除用户配置残留文件夹 `%USERPROFILE%\.config\clash`（确认已备份好规则后再删）。
   - **Android (CFA)**：先在软件内点击停止代理连接 → 长按图标卸载原版 Clash for Android。
4. **第四步（安装现代活跃开源客户端）**：对照前文官方源头表，从 GitHub Releases 下载并通过 SHA256 校验安装现代替代品——Windows/macOS 推荐 **[Clash Verge Rev](/clients/clash-verge-rev/)**（完整新手配置见 [Clash Verge Rev 安装配置实战](/guides/clash-verge-rev-setup/)）或 **[FlClash](/clients/flclash/)**；Android 推荐 **[FlClash](/clients/flclash/)**、**[Clash Meta for Android](/clients/clash-meta/)** 或 **[Hiddify](/clients/hiddify/)**。
5. **第五步（重新拉取订阅并检查安全状态）**：在新客户端导入你的订阅链接。如果你曾经不幸运行过来源可疑的第三方“魔改版/汉化版 CFW”，强烈建议同步前往机场官网面板**重置一次订阅链接 Token**，并排查系统是否残留陌生启动项或未知根证书（参见 [隐私与日志风险排查](/safety/privacy/)）。

---

## 本专题三级内容集群与延伸阅读

为了帮助你在全平台设备上建立“源头可验证、安装无篡改、权限受控制”的客户端使用环境，本专题（`/safety/security/`）串联起以下三个三级（L3）延展内容集群：

### 集群 A：18 款客户端官方安装、签名校验与停更迁移（已发布关联 + 规划中）
覆盖全操作系统端到端安全下载、初次运行排障以及旧版软件安全退役：
- **已发布关联页面**：
  - [客户端选型总览中心（按内核、开源性与订阅格式对比）](/clients/)
  - [Windows 平台安全选型](/clients/platform/windows/) · [Android 平台安全选型](/clients/platform/android/) · [iOS 平台安全选型](/clients/platform/ios/) · [macOS 平台安全选型](/clients/platform/macos/)
  - [代理客户端安装标准流程（含 SmartScreen 与 Gatekeeper 规范处理）](/guides/installation/)
  - [Clash Verge Rev 从零安装与规则配置完整指南](/guides/clash-verge-rev-setup/)
  - [客户端无法启动、闪退与系统拦截排查](/troubleshooting/startup/)
- **本集群规划三级选题（待发布选题）**：
  - 《macOS Gatekeeper“应用已损坏”真相与 xattr 隔离属性安全移除操作边界》（状态：`待发布选题`）
  - 《从已归档 Clash for Windows / CFA 无损迁移至 Clash Verge Rev 与 FlClash 完整清单》（状态：`待发布选题`）

### 集群 B：iOS / Android 商店风险与底层内核生态辨析（已发布关联 + 规划中）
厘清 App Store 外区购买防锁机规范、Google Play 假包警示与主流开源核心区别：
- **已发布关联页面**：
  - [Shadowrocket（小火箭）正版获取与基础配置](/clients/shadowrocket/) · [Stash 兼容说明](/clients/stash/) · [Quantumult X](/clients/quantumult-x/) · [Surge](/clients/surge/)
  - [NekoBox for Android 状态警示](/clients/nekobox/) · [FlClash](/clients/flclash/) · [v2rayNG](/clients/v2rayng/) · [Hiddify](/clients/hiddify/) · [Karing](/clients/karing/)
  - [Mihomo 核心生态详解](/clients/mihomo/) · [sing-box 核心与 SFA/SFI/SFM 官方端](/clients/sing-box/)
  - [OpenWrt 软路由安全插件：OpenClash / PassWall2 / Nikki / HomeProxy](/clients/platform/openwrt/)
- **本集群规划三级选题（待发布选题）**：
  - 《iOS 外区 Apple ID 注册与正版软件买断防坑：远离淘宝共享账号与企业签名 IPA 锁机风险》（状态：`待发布选题`）
  - 《为什么不同客户端的 SHA256 哈希能 100% 识别网盘二次打包木马？（密码学原理浅析）》（状态：`待发布选题`）

### 集群 C：运行期本地权限隔离、订阅保护与全局风控闭环（已发布关联 + 规划中）
将安装安全延伸到日常订阅拉取、规则隔离与购买避坑闭环：
- **已发布关联页面**：
  - [代理隐私与日志风险认知：严禁安装未知 MitM CA 根证书与订阅 Token 防泄露](/safety/privacy/)
  - [机场选择与避坑核查清单：闭源专属端评估与八大高危营销信号](/safety/avoid-scams/)
  - [机场停服与状态核验](/safety/closures/) · [退款政策与购买留证](/safety/refunds/) · [异常替代迁移](/safety/alternatives/)
- **本集群规划三级选题（待发布选题）**：
  - 《怀疑电脑运行过假冒 Clash 安装包后的应急止损清单：密码重置、订阅作废与进程排查》（状态：`待发布选题`）

---

## 常见问题（FAQ）

### 在搜索引擎搜索“Clash for Windows 官网”或“v2rayN 中文网”，排在前面的网站能下载吗？

绝对不能下载！原版 Clash for Windows (CFW) 与 Clash 开源内核早已于 2023 年底停止维护并删库归档，作者从未设立过任何中文下载官网。搜索引擎竞价广告和自然排名靠前的所谓中文官网、绿色汉化版，绝大多数是高仿钓鱼站，专门用于在安装包里二次捆绑剪贴板监听木马、数字货币地址替换器或盗取机场订阅 Token。

### 如何确认某款开源代理客户端在 GitHub 上的仓库是不是李鬼高仿库？

必须逐字核对完整的“所有者/仓库名（owner/repo）”路径，而不能只看项目标题或 Star 数量。攻击者常刷高假仓库的 Star 并把名字改成 clash-verge-pro、v2rayn-win 或 clash-meta-cn 等相似拼写。本文整理的 18 款主流客户端核对清单均已依据站点档案核实精确仓库地址，下载前请一字不差地比对浏览器地址栏路径。

### 为什么下载完官方安装包后，还要专门跑一遍 SHA256 哈希校验？

由于网络环境限制，很多用户会通过加速镜像、网盘转发或群友搬运获取客户端安装包。只要文件在传输或存储环节被第三方注入哪怕 1 个字节的恶意代码，计算出的 64 位 SHA256 哈希指纹就会发生雪崩式巨变。将本地算出的哈希值与 GitHub Release 页面官方公布的校验码比对，是 100% 验证安装包未被二次打包篡改的最高效手段。

### Windows PowerShell 的 Get-FileHash 和 macOS 的 shasum 校验结果大小写不一样怎么办？

十六进制哈希值（0-9 与 A-F）在语义上不区分大小写。Windows PowerShell 的 Get-FileHash 默认输出全大写字母，而 macOS 的 shasum -a 256 与 Linux 的 sha256sum 通常输出全小写字母。只要 64 位字符的字母与数字排列逐位完全一致，就代表文件完整性校验通过；如果有任意 1 位不同，必须立刻删除。

### 为什么 NekoBox 官方仓库明确警告不要去 Google Play 下载同名软件？

根据 NekoBoxForAndroid 原作者团队在 GitHub 仓库发布的警示说明，目前上架于 Google Play 商店的同名 NekoBox 并非原开源作者团队维护控制，存在严重的安全与来源控制风险，且该项目本身维护资源有限。安卓用户如需使用 NekoBox，仅限前往 GitHub 官方 Release 核对签名，更推荐新装机直接选用活跃维护的 FlClash、v2rayNG、Hiddify 或 Karing。

### 以前装在电脑或手机上的旧版 Clash for Windows (CFW) 或 Clash for Android (CFA) 还能继续用吗？

强烈建议立刻停止使用并彻底卸载清理。已归档停更的软件不仅无法获得高危安全漏洞（如远程代码执行、配置解析漏洞）的修复补丁，也不兼容 VLESS-Reality、Hysteria 2 与 AnyTLS 等现代主流协议。卸载前请先导出备份你的节点订阅链接和自定义规则，清理残余后台服务后再迁移至 Clash Verge Rev、FlClash 或 Clash Meta for Android。

### 为了下载 iOS 的 Shadowrocket（小火箭），直接在淘宝买共享 Apple ID 或用别人的账号登录安全吗？

存在极高安全风险。购买或使用来路不明的共享 Apple ID 时，千万不要将其登录进手机系统的「设置 → iCloud」，否则对方随时可以在远程开启丢失模式锁定你的整部 iPhone 并敲诈勒索。同时不要下载安装任何网页提示的企业签名版小火箭安装包。正确做法是自行注册独立非大陆区 Apple ID 并在官方 App Store 商店内正规买断购买。
