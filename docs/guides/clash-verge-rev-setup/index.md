---
title: Clash Verge Rev 从零安装到 TUN 接管全流程实操手册
description: 一站式 L3 深度实操教程：涵盖 Windows/macOS/Linux 架构与 WebView2/Quarantine 前置准备、GitHub 官方包 SHA256 校验、订阅导入测速、Service Mode 与 Merge TUN 防泄漏配置，以及 curl/Get-NetAdapter 终端全链路验证与多配置备份。
lastUpdated: 2026-11-24
author: 代理客户端编辑部
category: 客户端配置
tags:
  - Clash Verge Rev
  - Mihomo
  - TUN 模式
  - Service Mode
  - 安装配置
pillar: guides
parentTopic: /guides/installation/
primaryKeyword: Clash Verge Rev 安装配置教程
searchIntent: How-to
relatedSlugs:
  - /clients/clash-verge-rev/
  - /guides/tun/
  - /troubleshooting/tun-wsl-docker-conflict/
  - /guides/system-time-tls-fix/
relatedBrands:
  - guangsuyun
  - yifan
  - weitu
schemaType: TechArticle
faq:
  - q: 按照教程开启 Clash Verge Rev 后，浏览器能打开网页但终端 git clone 或 curl 还是超时怎么办？
    a: 这是因为你只开启了“系统代理（System Proxy）”，绝大多数命令行工具默认不读取系统 HTTP 代理。解决方法有两种：要么安装服务模式并开启“TUN 模式”接管全局网络层流量，要么在当前终端手动设置 http_proxy 与 https_proxy 环境变量指向 7897 端口。
  - q: Service Mode（服务模式）点击安装没反应或失败怎么处理？
    a: Windows 普通权限用户安装系统服务可能会被 UAC 或杀毒软件拦截。请先彻底退出 Clash Verge Rev，右键客户端快捷方式选择“以管理员身份运行”，再次进入“设置 → Clash 设置 → 服务模式”点击安装，看到图标变绿并显示 Active 后即可。
  - q: 怎么确认我电脑上跑的是不是最新版 Mihomo 核心？
    a: 打开 Clash Verge Rev 左侧“设置 → Clash 设置 → Clash 内核”，查看当前选中的内核标识。确认显示为 Mihomo（Alpha 或 Release）即可；如果遇到某些最新协议节点连不上，可在此页面点击“检查更新”或切换至最新 Release/Alpha 核心。
  - q: Windows 双击打开 Clash Verge Rev 后出现白屏或提示缺少 WebView2 怎么办？
    a: Clash Verge Rev 基于 Tauri 2 框架渲染界面，依赖系统内置的 Microsoft Edge WebView2 运行时。Windows 10 LTSC 或精简版系统若缺失该组件，需从微软官方下载 Evergreen Standalone Installer 独立包补齐，或改用 GitHub Releases 中标注带固定版本 WebView2 的安装包。
  - q: macOS 安装后提示“已损坏，无法打开”或开启 TUN 后无任何流量通过如何解决？
    a: macOS 从浏览器下载的未公证 DMG 应用会被写入隔离属性，确认安装包来自官方仓库且 SHA256 一致后，将其拖入应用程序文件夹并在终端执行 xattr -rd com.apple.quarantine "/Applications/Clash Verge.app" 即可解除限制。开启 TUN 同样需要完成系统服务授权并确保系统代理未与其它 VPN 冲突。
  - q: 为什么开启 TUN 模式并配置 Global Merge 后，本地 WSL2 或 Docker 容器突然无法访问网络？
    a: 因为开启 auto-route 与 strict-route 后，TUN 虚拟网卡接管了高优先级路由并拦截 DNS，导致 WSL2 虚拟交换机或 Docker 网桥的私有网段回包被阻断。你需要在 Global Merge 的 route-exclude-address 中保留 172.16.0.0/12 等私有网段，或在 Windows 11 中切换 WSL2 为 Mirrored 镜像网络模式。
---

# Clash Verge Rev 从零安装到 TUN 接管全流程实操手册

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>本篇深度实操文档带你完整走通桌面端主力客户端 <strong>Clash Verge Rev</strong> 的生产级配置闭环：从 <strong>跨平台架构确认与前置依赖排查 → GitHub 官方包下载与 SHA256 哈希核验 → 订阅导入与核心校验 → Service Mode 授权与 Merge 防泄漏覆写 → 终端命令实测 TUN 接管效果与多配置备份</strong>。每一步均附带可复制命令与明确预期结果，避免因旧版 Clash for Windows 残留、权限缺失或 DNS 泄漏导致配置失败。</p>
</div>

对于正在从已归档的 Clash for Windows 迁移、或首次搭建桌面代理环境的开发者与日常用户而言，把 [Clash Verge Rev](/clients/clash-verge-rev/) 装上电脑只是第一步，真正决定日常体验的是“浏览器与命令行全链路分流是否稳定、系统升级或订阅刷新后规则会不会被洗掉、以及虚拟网卡会不会和本地开发容器打架”。本手册按照标准工程化装机顺序拆解为七个阶段，全程依托基于 `2026-11-23` 核验过的官方开源仓库 `clash-verge-rev/clash-verge-rev` 与 [Mihomo 核心](/clients/mihomo/) 规范编写。

---

## 一、适用系统与版本边界

在动用任何安装指令之前，先明确当前设备是否处于 Clash Verge Rev 的原生支持矩阵内，以及不同平台对应的安装文件后缀：

| 操作系统 | 最低版本与架构要求 | 官方安装包命名特征 | 底层界面与网络权限机制 |
| --- | --- | --- | --- |
| **Windows** | Windows 10/11（`x64` / `ARM64`） | `*_x64-setup.exe` 或 `*_arm64-setup.exe` | 依赖 Edge WebView2 运行时；TUN 需 Service Mode 系统服务与 Wintun 驱动 |
| **macOS** | macOS 11+（`Apple Silicon` / `Intel`） | `*_aarch64.dmg`（M 系列）或 `*_x64.dmg` | 依赖系统 WKWebView；首次运行需清理 Quarantine 隔离属性，TUN 使用 `utun` 接口 |
| **Linux** | Ubuntu 22.04+ / Debian 12+ / Fedora / Arch（`x64` / `ARM64`） | `*.deb`、`*.rpm` 或 `*.AppImage` | 依赖 `libwebkit2gtk-4.1`；TUN 需内核 `/dev/net/tun` 与核心文件 `CAP_NET_ADMIN` 权限 |

**关键代差提示**：原版 Clash for Windows（CFW）与初代 Clash Verge 均已于 2023 年底停止维护，不仅缺乏对 VLESS-Reality、Hysteria 2、AnyTLS 等现代抗封锁协议的原生解析，还存在历史安全漏洞风险。如果你当前电脑里仍运行着 CFW，请先导出备份你的原始订阅 URL，彻底关闭 CFW 的 `System Proxy` 和 `TUN Mode`，再执行卸载并清理安装目录，确保默认端口 `7890` 已完全释放，避免与 Clash Verge Rev 的默认混合端口 `7897` 形成串扰或本地回环死循环。

---

## 二、准备事项：系统架构核对与前置环境修复

跳过环境体检直接双击安装包，是导致“启动白屏”“双击无反应”或“芯片架构不兼容闪退”的最大诱因。请根据自己的操作系统执行对应检查。

### 1. Windows 10/11：架构识别与 WebView2 状态检测

打开 **Windows PowerShell**（无需管理员权限即可先查），依次核对 CPU 架构与 Edge WebView2 运行时注册表项：

```powershell
# 1. 确认系统处理器架构（输出 AMD64 下载 x64 安装包；输出 ARM64 下载 arm64 安装包）
$env:PROCESSOR_ARCHITECTURE

# 2. 检查 Edge WebView2 运行时版本号（若返回空值，说明系统缺少 WebView2）
Get-ItemProperty -Path "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" -ErrorAction SilentlyContinue | Select-Object pv

# 3. 检查本地端口 7890 与 7897 是否被旧版客户端或其它进程提前占用
Get-NetTCPConnection -LocalPort 7890, 7897 -ErrorAction SilentlyContinue | Select-Object LocalPort, State, OwningProcess
```

- **若第 2 步返回为空**：多见于 Windows 10 LTSC 或第三方精简版系统。请先从微软官方渠道安装 `MicrosoftEdgeWebView2RuntimeInstallerX64.exe`（Evergreen 独立安装器），或者在 Clash Verge Rev 官方 Releases 中挑选文件名包含 `fixed-webview2` 的完整离线包。
- **安装版（`setup.exe`）还是便携版（`portable.zip`）**：普通固定主力电脑强烈推荐使用 `setup.exe` 标准安装版，因为开机自启注册表与后续安装 Service Mode 系统服务时路径更稳定；仅需在公共主机或移动硬盘临时运行的用户才考虑便携版，且便携版切勿解压到 `C:\Program Files` 等需要提权写入的受保护目录中，以免保存配置时权限报错。

### 2. macOS：芯片区分与隔离属性准备

打开 macOS **终端（Terminal）**，执行以下指令确认硬件架构：

```bash
# 输出 arm64 为 Apple Silicon（M1/M2/M3/M4 芯片），应下载 aarch64.dmg
# 输出 x86_64 为 Intel 芯片，应下载 x64.dmg
uname -m
```

由于开源个人或社区项目通常不会购买昂贵的苹果商业企业公证证书，通过浏览器下载的 `.dmg` 安装包会被 macOS Gatekeeper 标记 `com.apple.quarantine` 隔离属性。**务必先完成下一步的 SHA256 哈希核验，确认文件未被第三方篡改后**，再把应用拖入 `/Applications`（应用程序）目录并解除隔离。

### 3. Linux 桌面环境：WebKitGTK 与 TUN 设备检查

在 Ubuntu / Debian 系发行版中，提前确认桌面 WebView 依赖与虚拟网卡内核模块是否就绪：

```bash
# 查看架构（x86_64 对应 amd64，aarch64 对应 arm64）
uname -m

# 检查内核是否启用了 /dev/net/tun 设备节点
ls -l /dev/net/tun

# Ubuntu 22.04+ / Debian 12+ 若使用 .deb 安装遇到依赖提示，先确认 libwebkit2gtk 与 libayatana-appindicator3
dpkg -l | grep -E "webkit2gtk|appindicator"
```

---

## 三、实际操作（Phase 1）：GitHub 官方包下载与 SHA256 校验

网络代理客户端掌握着本机所有 DNS 查询与明文出口控制权，**绝对禁止通过百度、Bing 搜索排名前列的第三方中文“高速下载站”或论坛转存网盘获取安装包**。关于高仿钓鱼站点的真实案例与识别方法，可延伸阅读[客户端下载安全防钓鱼](/safety/security/)与[客户端安装标准流程](/guides/installation/)。

唯一可信的桌面端源码与二进制发布仓库为：[GitHub: clash-verge-rev/clash-verge-rev](https://github.com/clash-verge-rev/clash-verge-rev)。进入仓库右侧 **Releases** 页面后，同时下载对应架构的安装包以及同批次发布的校验信息（如页面底部校验表或 `.sha256` 文本）。

### 各平台本地 SHA256 哈希核验命令

```powershell
# Windows PowerShell：计算下载目录中安装包的 64 位 SHA256 值
Get-FileHash "$HOME\Downloads\Clash.Verge_*_x64-setup.exe" -Algorithm SHA256 | Format-List
```

```bash
# macOS 终端：计算 .dmg 安装包的 SHA256 值
shasum -a 256 ~/Downloads/Clash.Verge_*_aarch64.dmg

# Linux 终端：计算 .deb 或 .AppImage 安装包的 SHA256 值
sha256sum ~/Downloads/Clash.Verge_*_amd64.deb
```

**预期校验标准**：终端输出的一串 64 位十六进制字符串，必须与 GitHub Releases 页面公布对应文件名的哈希值**逐字完全一致**。如不一致，请立即删除文件并重新下载，切勿强制运行。

校验无误后完成安装：
- **Windows**：双击 `setup.exe` 按向导完成安装；若安装时被 Windows Defender 启发式误报拦截核心文件（如 `verge-mihomo.exe`），在确认哈希与官方完全一致的前提下，进入 Windows 安全中心将安装目录添加为排除项即可。
- **macOS**：挂载 `.dmg` 并将 `Clash Verge.app` 拖入 `/Applications`，随后在终端运行：
  ```bash
  xattr -rd com.apple.quarantine "/Applications/Clash Verge.app"
  ```
- **Linux（Debian/Ubuntu）**：使用 `sudo apt install ./Clash.Verge_*_amd64.deb` 自动补齐动态库依赖后启动。

---

## 四、实际操作（Phase 2）：订阅导入、核心校准与基础代理测试

首次启动 Clash Verge Rev 后，先不要急着打开系统代理或 TUN 开关，按顺序完成订阅拉取与节点基础检查。如果你手头的机场订阅链接在导入时出现格式错误或空文件问题，可同步对照 [Clash Verge Rev 导入订阅与 UA 排雷指南](/guides/clash-verge-rev-import-subscription/)。

### 1. 检查系统时间与订阅模式兼容性

开始导入前，先确认你的机场服务商属于支持第三方订阅的类型（如支持 Clash/Mihomo 通用订阅的 [光速云](/brands/guangsuyun/)、[一翻云](/brands/yifan/) 等标准订阅模式品牌）。如果所购服务明确属于“仅专属客户端”模式，则面板不会下发 Clash YAML 订阅 URL，无法直接导入 Clash Verge Rev。同时确保电脑系统时间与标准北京时间误差在 60 秒以内，否则 VLESS-Reality、Trojan 与 TLS 订阅接口均会因证书时间戳校验失败报错，详细修复命令见 [系统时间偏差与 TLS 修复](/guides/system-time-tls-fix/)。

### 2. 手动导入订阅与核心版本确认

1. 点击左侧边栏 **订阅（Profiles）**。
2. 在顶部输入框粘贴服务商后台复制的 **Clash 订阅 URL**，点击右侧 **导入（Import）**。
   - **提示**：若在浏览器点击面板“一键导入 Clash”没有反应或拉起失败，多为系统曾安装旧版软件导致 `clash://` 协议注册表冲突，直接复制 URL 手动粘贴是最稳妥的方式。
3. **预期结果**：下方配置列表中出现新的配置卡片，并显示节点总数、已用/剩余流量及到期时间；**务必鼠标左键单击该卡片使其高亮框选中**（否则当前仍停留在空白默认配置上）。
4. 进入 **设置（Settings） → Clash 设置 → Clash 内核（Clash Core）**，确认当前已选中 **Mihomo**（原 Clash.Meta）核心。若机场节点包含较新的 `AnyTLS`、`Hysteria 2` 或新版 Reality 参数，可在此界面点击核心右侧的更新按钮同步到最新 Release/Alpha 版本。

### 3. 测试“系统代理”模式（浏览器层验证）

1. 进入左侧 **代理（Proxies）**，确认顶部路由模式选择为 **规则（Rule）**（切勿长期留在 Global 全局模式，否则国内网站也会绕道海外节点消耗流量）。
2. 展开主力策略组，点击右侧的 **测速（闪电图标）**。正常节点应当在 1 至 2 秒内返回真实毫秒数（如 `38 ms`、`115 ms`）。若所有节点均返回 `Timeout`，先暂停向下操作，按 [节点全部超时排查](/troubleshooting/timeout/) 检查系统时钟与本地网络。
3. 回到 **设置（Settings）**，开启 **系统代理（System Proxy）** 开关，并确认上方显示的混合端口（Mixed Port）为默认值 **`7897`**。
4. 打开本地 PowerShell 或终端，使用显式代理参数测试握手连通性：

```powershell
# Windows PowerShell（使用系统内置 curl.exe 测试本地 7897 混合端口）
curl.exe -I --proxy http://127.0.0.1:7897 https://www.google.com
```

```bash
# macOS / Linux 终端
curl -I -x http://127.0.0.1:7897 https://www.google.com
```

- **预期成功输出**：终端前几行出现 `HTTP/1.1 200 Connection established`（代表本地代理端口与境外节点已成功建立 CONNECT 隧道），紧接着返回 `HTTP/2 200` 或 `301/302`。此时 Chrome、Edge、Safari 等读取系统代理的浏览器已经可以正常分流访问。

---

## 五、实际操作（Phase 3）：Service Mode 提权与 Merge TUN 防泄漏配置

只开启“系统代理”的最大局限在于：**PowerShell、Git、npm、pip、Cargo、Docker CLI、游戏客户端以及部分原生桌面应用默认不读取系统 HTTP 代理变量**。为了让全机流量（包括 TCP 与原生 UDP）无缝遵循分流规则，必须安装权限服务并开启 **TUN 虚拟网卡模式**。底层原理可配合阅读 [TUN 模式深度配置与协议栈对比](/guides/tun/)。

### 1. 安装并激活 Service Mode（服务模式）

在 Windows 上，普通用户态进程无法直接向操作系统注册 Wintun 虚拟网卡与全局路由。请严格按以下顺序赋权：

1. 右键系统托盘的 Clash Verge Rev 图标，选择 **退出（Exit）**，确保主程序和底层核心完全结束运行。
2. 在桌面或开始菜单找到 Clash Verge Rev 快捷方式，右键选择 **以管理员身份运行**。
3. 进入 **设置（Settings） → Clash 设置 → 服务模式（Service Mode）**，点击右侧的 **安装（Install）** 按钮。
4. 等待数秒后，服务状态指示灯变为 **绿色（Active / Running）**，说明 `clash-verge-service` 系统后台服务已成功注册。
5. 此时可关闭以管理员身份运行的界面，重新以**普通用户权限**双击启动 Clash Verge Rev，后续无需再每次弹窗请求 UAC 提权即可随时开关 TUN。

*(macOS 与 Linux 说明：macOS 在首次点击 TUN 开关时系统会弹出密码授权提示框，输入开机密码授信辅助工具即可生成 `utun` 网卡；Linux 若使用 AppImage 或无特权启动且 TUN 无法创建，需对解压目录或安装路径下的核心二进制授予 `sudo setcap cap_net_admin,cap_net_bind_service=+ep /path/to/verge-mihomo`。)*

### 2. 配置全局扩展 Merge，解决覆盖丢失与 DNS/内网冲突

**切记：不要直接右键编辑导入进来的订阅原文件**。订阅每次定时更新都会把原始 YAML 覆盖还原。正确做法是使用 Clash Verge Rev 提供的 **全局扩展配置（Global Merge）** 将 TUN、防 DNS 泄漏与私有网段保护参数独立固化。

进入 **订阅（Profiles）** 页面，在右侧找到 **全局扩展配置（Global Merge）** 并右键编辑，填入以下生产级基础 Merge 模板（保存时请保留 YAML 严格 2 空格缩进）：

```yaml
# Clash Verge Rev 全局扩展配置（Global Merge）
# 说明：与上游订阅动态合并，订阅自动更新时不会被抹掉

tun:
  enable: true
  stack: mixed                 # TCP 走高性能 system 栈，UDP 走高兼容 gvisor 栈
  dns-hijack:
    - "any:53"                 # 强制劫持所有 53 端口 TCP/UDP DNS 查询，防止系统直连泄漏
    - "tcp://any:53"
  auto-route: true             # 自动注入高优先级路由接管全机流量
  auto-detect-interface: true  # 自动识别物理出口网卡，防止流量回环死锁
  strict-route: true           # 封堵 Windows 多网卡场景下的旁路 IPv6/DNS 泄漏
  route-exclude-address:       # 排除私有局域网与容器虚拟网桥，防止内网失联
    - 192.168.0.0/16
    - 10.0.0.0/8
    - 172.16.0.0/12
    - fc00::/7
    - fe80::/10

dns:
  enable: true
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  fake-ip-filter:
    - "*.lan"
    - "*.local"
    - "*.internal"
    - "host.docker.internal"
    - "*.docker.internal"
    - "localhost.ptlogin2.qq.com"
    - "time.*.com"
    - "ntp.*.com"
```

保存 Merge 配置后，返回 **设置（Settings）**：
- **建议关闭“系统代理（System Proxy）”**：避免浏览器走端口而命令行走网卡造成链路重叠，排障时更清晰。
- **开启“虚拟网卡模式（Tun Mode）”**：确认开关成功点亮且未自动弹回。

*(开发者特别提示：如果你在 Windows 10/11 上重度使用 WSL2 或 Docker Desktop，且遇到容器内 `apt update` 或 `docker pull` 仍被阻断，请务必对照 [TUN 与 WSL2/Docker 冲突深度修复](/troubleshooting/tun-wsl-docker-conflict/) 在 `%UserProfile%\.wslconfig` 中启用 `networkingMode=mirrored`。)*

---

## 六、成功验证：终端全链路实测与多配置备份

配置完成后，不要只用浏览器打开一个网页就认为大功告成。请关闭所有手动代理环境变量，在**全新的普通权限终端**执行三项验证，确认 L3 网络层接管、DNS 解析分流与国内直连同时生效。

### 1. Windows PowerShell 全链路验证

```powershell
# 1. 验证系统底层是否已生成 Meta / Wintun 虚拟网卡且状态为 Up
Get-NetAdapter | Where-Object { $_.InterfaceDescription -match "Meta|Wintun|Mihomo" } | Select-Object Name, Status, InterfaceDescription

# 2. 不加 --proxy 参数直接请求海外 IP 归属地接口，确认终端已走代理节点出口
curl.exe -s https://api.ip.sb/geoip

# 3. 确认国内高频站点依然直连（随后在客户端“连接”页面核对规则命中是否为 DIRECT）
curl.exe -I https://www.baidu.com
```

### 2. macOS / Linux 终端验证

```bash
# 1. 检查系统是否已出现 utun 或 Meta 虚拟网卡接口
ifconfig | grep -E "utun|Meta|mihomo" -A 3

# 2. 不设环境变量直接检测海外出口 IP（应返回所选节点所在国家/地区）
curl -s https://api.ip.sb/geoip

# 3. 检查本地是否存在未预期残留的代理环境变量干扰
env | grep -i proxy
```

### 3. 客户端内部观测与配置防灾备份

打开 Clash Verge Rev 左侧 **连接（Connections）** 标签页，在刚才执行终端测试的同时观察实时连接记录：
- `api.ip.sb` 应当命中你选择的境外节点或 `Proxy` 策略组，且传输类型显示通过 TUN 设备进入；
- `www.baidu.com` 应当明确命中 `GEOIP,CN` 或 `GEOSITE,cn` 并指向 `DIRECT`（本地宽带直连）。

当上述行为完全符合预期后，建议立即执行一次配置备份，防止重装系统或换机时丢失精心调试的规则：
- 进入 **设置 → Verge 设置 → WebDAV / 备份设置**，使用本地导出功能生成备份压缩包，或配置个人私有加密 WebDAV 同步工作区。
- **脱敏安全红线**：切勿将包含真实订阅 URL Token 的完整配置文件明文上传到公开 GitHub 仓库或公共网盘，以免凭据泄露导致套餐流量被盗刷。若需构建跨订阅自动清洗脚本与多设备同步方案，可参考 [自动更新与配置备份指南](/guides/automatic-update/)。

---

## 七、常见错误快速定位表

如果在实际操作过程中遇到卡点，请按下列症状对照定位，切忌盲目修改内核参数或重启系统反复碰撞：

| 常见异常现象 | 底层原因 | 标准化处理动作 |
| --- | --- | --- |
| **点击 TUN 开关立刻弹回关闭** | 未安装或未启动 Service Mode，或缺少 Wintun 驱动/提权 | 彻底退出软件后以管理员身份运行，重装 Service Mode 至绿灯 Active |
| **全部节点测速返回 `Timeout`** | 本机系统时间偏差大于 90 秒、节点过期或开着旧代理套娃 | 同步标准 NTP 时间，关闭所有代理后刷新订阅并检查 [超时排查](/troubleshooting/timeout/) |
| **打开 TUN 后所有网站都打不开** | 订阅内 `dns:` 关闭、缺失 `dns-hijack` 或与其它 VPN 网卡抢占路由 | 退出游戏加速器与企业 VPN，检查 Global Merge 中 `dns.enable: true` 与 `any:53` 劫持 |
| **浏览器正常但公司内网/NAS 失联** | Fake-IP 拦截了私有内网域名，或 `strict-route` 阻断局域网访问 | 将内网后缀加入 `fake-ip-filter`，并在 `route-exclude-address` 中保留私有网段 |
| **更新订阅后自定义规则全部消失** | 直接右键修改了订阅源文件，定时更新将其覆盖 | 迁移所有个性化配置至 **Global Merge** 或 **Global Script** 独立文件中 |

---

## 常见问题（FAQ）

### 按照教程开启 Clash Verge Rev 后，浏览器能打开网页但终端 git clone 或 curl 还是超时怎么办？

这是因为你只开启了“系统代理（System Proxy）”，绝大多数命令行工具默认不读取系统 HTTP 代理。解决方法有两种：要么安装服务模式并开启“TUN 模式”接管全局网络层流量，要么在当前终端手动设置 http_proxy 与 https_proxy 环境变量指向 7897 端口。

### Service Mode（服务模式）点击安装没反应或失败怎么处理？

Windows 普通权限用户安装系统服务可能会被 UAC 或杀毒软件拦截。请先彻底退出 Clash Verge Rev，右键客户端快捷方式选择“以管理员身份运行”，再次进入“设置 → Clash 设置 → 服务模式”点击安装，看到图标变绿并显示 Active 后即可。

### 怎么确认我电脑上跑的是不是最新版 Mihomo 核心？

打开 Clash Verge Rev 左侧“设置 → Clash 设置 → Clash 内核”，查看当前选中的内核标识。确认显示为 Mihomo（Alpha 或 Release）即可；如果遇到某些最新协议节点连不上，可在此页面点击“检查更新”或切换至最新 Release/Alpha 核心。

### Windows 双击打开 Clash Verge Rev 后出现白屏或提示缺少 WebView2 怎么办？

Clash Verge Rev 基于 Tauri 2 框架渲染界面，依赖系统内置的 Microsoft Edge WebView2 运行时。Windows 10 LTSC 或精简版系统若缺失该组件，需从微软官方下载 Evergreen Standalone Installer 独立包补齐，或改用 GitHub Releases 中标注带固定版本 WebView2 的安装包。

### macOS 安装后提示“已损坏，无法打开”或开启 TUN 后无任何流量通过如何解决？

macOS 从浏览器下载的未公证 DMG 应用会被写入隔离属性，确认安装包来自官方仓库且 SHA256 一致后，将其拖入应用程序文件夹并在终端执行 xattr -rd com.apple.quarantine "/Applications/Clash Verge.app" 即可解除限制。开启 TUN 同样需要完成系统服务授权并确保系统代理未与其它 VPN 冲突。

### 为什么开启 TUN 模式并配置 Global Merge 后，本地 WSL2 或 Docker 容器突然无法访问网络？

因为开启 auto-route 与 strict-route 后，TUN 虚拟网卡接管了高优先级路由并拦截 DNS，导致 WSL2 虚拟交换机或 Docker 网桥的私有网段回包被阻断。你需要在 Global Merge 的 route-exclude-address 中保留 172.16.0.0/12 等私有网段，或在 Windows 11 中切换 WSL2 为 Mirrored 镜像网络模式。
