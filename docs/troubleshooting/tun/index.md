---
title: "TUN 模式无法启动、系统代理冲突与关闭代理后无法上网排查指南"
description: "深度解决代理客户端 TUN 模式无法启动、开关自动弹回、双虚拟网卡抢路由、系统代理冲突以及关闭代理后浏览器报 ERR_PROXY_CONNECTION_FAILED 无法上网的问题。覆盖 Windows Service Mode 服务重装、游戏加速器/企业 VPN 共存、注册表 ProxyEnable 复位、Wintun 防火墙放行与 WSL2/Docker 冲突导引。"
lastUpdated: 2026-11-23
schemaType: TechArticle
faq:
  - q: "为什么开启系统代理后浏览器能出国，但终端里的 git、curl、pip 和游戏还是直连或超时？"
    a: "系统代理仅在应用层通过注册表或系统设置下发 HTTP/SOCKS 端口，只对浏览器和主动读取系统代理变量的程序生效。终端 CLI 工具、UWP 应用、Docker 与绝大多数游戏默认绕过系统代理，需要通过 TUN 虚拟网卡在三层网络栈接管全局数据包，或者手动配置 HTTP_PROXY 环境变量。"
  - q: "Clash Verge Rev 点击打开 TUN 模式开关就自动弹回，或者提示 Service Mode 未安装怎么办？"
    a: "创建 Wintun 虚拟网卡并改写系统路由表属于高权限系统操作。Windows 必须先在客户端设置中安装 Clash Verge Service 服务模式（不要每次靠右键管理员运行）；如果旧版服务残留导致安装失败，需在管理员 PowerShell 中执行 sc.exe stop 与 sc.exe delete 清理旧服务后重新安装。"
  - q: "为什么关闭代理客户端之后，电脑国内网页也完全打不开，浏览器提示 ERR_PROXY_CONNECTION_FAILED？"
    a: "这是系统代理未正常复位导致的典型“断网遗留症”。客户端崩溃或被强制退出时，Windows 注册表中的 ProxyEnable 仍然保持为 1，浏览器继续把所有请求发往已经关闭的 127.0.0.1:7897 端口。进入 Windows“设置 → 网络和 Internet → 代理”关闭“使用代理服务器”，或用脚本将 ProxyEnable 设为 0 即可秒级恢复。"
  - q: "可以同时打开代理客户端的 TUN 模式和 UU/雷神游戏加速器或公司 EasyConnect VPN 吗？"
    a: "不能直接同时开启全局接管。两款软件都会向操作系统注册虚拟网卡并往路由表写入高优先级默认路由（0.0.0.0/0 或双半路由 0.0.0.0/1 + 128.0.0.0/1），数据包会在两张虚拟网卡之间陷入路由环路而彻底断网。玩游戏开加速器时应先关闭代理 TUN，与企业 VPN 或 Tailscale 共存时则需配置 route-exclude-address 排除内网网段。"
  - q: "开启 TUN 模式后，虚拟网卡已经生成但网页依然打不开，如何判断是防火墙还是 DNS 劫持失效？"
    a: "在客户端日志中观察是否出现大量 UDP 53 流量未被接管，或物理网卡防火墙拦截了 verge-mihomo.exe 的出站请求。确保配置文件 tun 块中启用了 auto-route: true、auto-detect-interface: true 与 dns-hijack: [\"any:53\"]，并在 Windows 防火墙中放行客户端主程序与核心在专用/公用网络下的通信权限。"
  - q: "开启 TUN 模式后只有 WSL2 或 Docker Desktop 容器连不上网，宿主机正常怎么解决？"
    a: "这是 Hyper-V 虚拟交换机私有网段（172.16.0.0/12）与 TUN 全局路由及 Fake-IP 发生跨子网边界冲突所致。Windows 11 22H2+ 用户建议在 .wslconfig 开启 Mirrored 镜像网络模式，Windows 10/NAT 用户需在 route-exclude-address 排除容器网段，详细步骤请参阅本站专门的 WSL2/Docker 冲突修复文档。"
  - q: "TUN 模式下的 network stack 选 system、gvisor 还是 mixed 最好？"
    a: "对于日常桌面使用，推荐优先采用 mixed（混合栈：TCP 走系统协议栈以降低 CPU 占用并跑满高速下载，UDP 走 gVisor 用户态栈以规避部分系统兼容问题）；若在某些老旧 Windows 或开启严格安全软件的环境下发现 system/mixed 导致蓝屏或丢包，可切换为纯 gvisor 栈以提升稳定性。"
---

# TUN 模式无法启动、系统代理冲突与关闭代理后无法上网排查

<div class="answer-first-box">
<div class="answer-first-label">核心结论 · Answer First</div>
<p>代理使用中最令人头疼的三类底层冲突——<strong>“TUN 模式无法启动或开关自动弹回”</strong>、<strong>“开启多款 VPN/加速器后全机断网”</strong>以及<strong>“关闭代理客户端后无法上网（浏览器报 <code>ERR_PROXY_CONNECTION_FAILED</code>）”</strong>——根源全部在于操作系统<strong>应用层代理注册表</strong>与<strong>网络层虚拟网卡/路由表</strong>的权限及状态错位。修复思路应分三路推进：TUN 起不来优先重装修复 Windows <code>Service Mode</code> 或赋予 Linux <code>CAP_NET_ADMIN</code> 权限，并放行防火墙对 Wintun 驱动与核心的拦截；双虚拟网卡抢路由需用 <code>route print</code> 诊断并关闭其中一方或配置 <code>route-exclude-address</code> 隔离；退出软件后断网则需第一时间复位 Windows <code>ProxyEnable</code> 注册表（或检查是否残留 Fake-IP）。</p>
</div>

> **开发者专项导引**：如果你遇到的是**开启 TUN 模式后宿主机一切正常，唯独 WSL2（Ubuntu）无法 `apt update` 或 Docker Desktop 拉取镜像失败/无法访问宿主机**，属于 Hyper-V 虚拟交换机与 TUN 的跨边界 NAT 冲突，请直接跳转阅读专题深修指南：[Clash/Mihomo/sing-box TUN 网卡与 WSL2、Docker Desktop 冲突深度修复](/troubleshooting/tun-wsl-docker-conflict/)。

---

## 一、底层边界厘清：系统代理 vs TUN 虚拟网卡工作机制对比

在开始敲命令行之前，必须先搞清楚客户端顶部的两个开关——**「系统代理（System Proxy）」**和**「TUN 模式（TUN Mode / 虚拟网卡模式）」**——到底各自接管了什么流量，以及为什么两者经常引发不同方向的故障（进阶 TUN 参数调优可延伸阅读 [TUN 模式深度配置与参数解析](/guides/tun/)）：

| 对比维度 | 系统代理（System Proxy） | TUN 虚拟网卡模式（TUN Mode） |
| :--- | :--- | :--- |
| **网络工作层级** | 应用层（Application Layer）：修改操作系统 HTTP/SOCKS 代理指针指向 `127.0.0.1:7897` | 网络层 / 传输层（L3/L4）：在系统注入一张名为 `Meta` / `singbox_tun` / `utun` 的虚拟网卡驱动 |
| **是否需要管理员权限** | **不需要**（普通用户权限即可写入当前用户注册表或 macOS 代理设置） | **必须具备高权限**（Windows 需 **Service Mode 服务**；macOS 需 Helper 授权；Linux 需 `CAP_NET_ADMIN`） |
| **接管软件覆盖面** | 仅限浏览器（Chrome/Edge/Safari）及显式支持系统代理 API 的桌面客户端 | **全局接管**：终端 CLI（`git`/`curl`/`pip`/`npm`）、游戏、Docker、UWP 应用、桌面端软件 |
| **DNS 解析行为** | 代理软件把域名直接发给本地端口，由远端/分流规则决定；未走代理的程序仍直连本地 DNS | 通过 `dns-hijack` 劫持发往所有网卡 53 端口的 UDP DNS 请求，通常配合 Fake-IP 或 Redir-Host 处理 |
| **高发冲突与后遗症** | 1. 退出未复位 `ProxyEnable` 导致**关闭代理后全机无法上网**；<br>2. SwitchyOmega 插件覆盖；<br>3. 命令行工具不认系统代理 | 1. **Service Mode 服务损坏**导致开关弹回；<br>2. **与游戏加速器、企业 VPN、Tailscale 抢默认路由**；<br>3. 防火墙拦截或 WSL2 网桥断联 |

### 场景决策指南：什么时候用系统代理，什么时候才需要开 TUN？
许多用户一装上客户端就把「系统代理」和「TUN 模式」同时打开，或者在完全不需要全局接管的场景强开 TUN，反而增加了驱动和路由冲突概率。实际使用建议遵循**最小接管原则**：
- **仅刷网页、看 YouTube、用客户端版社交/AI 工具**：只开启**系统代理（System Proxy）**即可，零权限要求、CPU 零额外协议栈开销，且天然不会干扰游戏加速器、WSL2 容器与企业内网路由。
- **需要在终端跑 `git clone` / `npm` / `pip` / `brew`、需要让 UWP/商店应用或游戏客户端走节点、或遇到不遵守系统代理的桌面端软件**：此时再打开 **TUN 模式**。注意开启 TUN 后，通常**不需要再同时开着系统代理**（可关闭系统代理开关，避免浏览器先走本地 HTTP 端口再折返或触发双重缓存混乱，仅保留 TUN 一层即可接管全机）。

---

## 二、排查一：TUN 模式无法启动（Windows Service Mode 损坏与各平台权限修复）

### 1. 问题现象与直接答案
在 [Clash Verge Rev](/clients/clash-verge-rev/)、[FlClash](/clients/flclash/) 或 [v2rayN](/clients/v2rayn/) 中点击开启 **TUN 模式**，出现以下任一现象：
- 开关刚拨到开启位置，1 秒后自动弹回关闭状态；
- 客户端弹窗报错：`start tun failed: access is denied`、`create tun interface failed` 或提示 `Service Mode is not installed / unavailable`；
- 图标显示已开启，但查看网络连接适配器里根本没有出现 `Meta` 或 `singbox_tun` 虚拟网卡。

核心原因在于：**普通权限进程没有资格在操作系统内核创建虚拟网络接口并改写全局路由表**。

### 2. Windows 平台：Service Mode 服务重装与 Wintun 驱动修复

在 [Clash Verge Rev](/clients/clash-verge-rev/) 中，官方强烈建议通过**安装系统服务模式（Service Mode）**来托管高权限内核，而不是每次手动右键“以管理员身份运行”（因为以管理员启动会导致拖拽文件导入配置失败、以及 WebView2 缓存目录读写权限污染）。

#### 第 1 步：检查服务状态与安装失败常见阻力
按 `Win + R` 输入 `services.msc` 回车打开 Windows 服务管理器，查找是否存在 `Clash Verge Service`（服务内部名通常为 `clash_verge_service`）。常见导致服务安装失败或已安装却无法启动的原因有三点：
1. 360 安全卫士、腾讯电脑管家或企业终端安全软件拦截了 `install-service.exe` 注册系统服务；
2. 之前强行覆盖安装过新版本，导致服务可执行文件路径与新安装目录不一致或旧服务处于残缺挂起状态；
3. 系统中缺少或损坏了 `wintun.dll` 虚拟网卡驱动组件（通常随客户端内置，但可能被杀软误隔离）。

#### 第 2 步：管理员 PowerShell 清理重装标准命令
当图形界面点击“安装/重装服务模式”报错时，右键开始菜单以**管理员身份运行 PowerShell**，彻底卸载残留服务后再重装：

```powershell
# 1. 查询所有包含 clash 或 verge 的系统服务及其状态
Get-Service | Where-Object { $_.Name -match "clash|verge" -or $_.DisplayName -match "Clash|Verge" }

# 2. 查看具体服务指向的二进制路径（排查是否指向了已删除的旧目录）
sc.exe qc "clash_verge_service"

# 3. 彻底停止并删除损坏或残留的服务（执行前请确认服务名匹配）
sc.exe stop "clash_verge_service"
sc.exe delete "clash_verge_service"

# 4. 检查核心程序与 wintun.dll 是否被杀毒软件误删（以默认安装路径为例）
Get-ChildItem "C:\Program Files\Clash Verge\" -Filter "*wintun*" -Recurse
```

清理完毕后，**重启一次 Clash Verge Rev 客户端**（普通用户权限打开即可），进入「设置 → 服务模式 / Service Mode」，重新点击「安装（Install）」，待状态指示灯变为绿色运行中后，再开启 TUN 模式开关。

> **v2rayN / Hiddify / Karing 用户注意**：部分版本（如 [v2rayN](/clients/v2rayn/) 开启“启用 Tun 模式”或 [Hiddify](/clients/hiddify/) 切换 VPN 模式）如果不附带独立系统服务，**首次开启 TUN 时必须选择以管理员身份重启客户端**（可在软件设置中勾选“以管理员身份运行”或右键快捷方式设置），且需保证程序目录下的 `wintun.dll` 完整未被杀软拦截。

### 3. macOS 与 Linux 平台 TUN 权限修复
- **macOS**：[Clash Verge Rev](/clients/clash-verge-rev/)、[Stash](/clients/stash/) 或 [FlClash](/clients/flclash/) 在 macOS 上开启 TUN/增强模式时，会弹出系统密码框要求安装特权 Helper 工具（或授予 System Extension 网络扩展权限）。如果系统大版本升级后突然打不开 TUN，先前往「系统设置 → 通用 → 登录项与扩展 → 网络扩展」核对是否允许了对应客户端；或者在客户端设置中先点击「卸载服务」再重新授权安装。
- **Linux**：非 root 用户直接启动的桌面客户端（AppImage / DEB）默认无权创建 `tun0` 网卡。需要为实际调用的内核二进制授予网络管理能力（注意每次更新内核后需重新赋予）：

```bash
# 查看实际使用的内核路径（如 /usr/bin/verge-mihomo 或安装目录下的 mihomo/sing-box）
which verge-mihomo || find /opt /usr -name "*mihomo*" 2>/dev/null

# 授予 CAP_NET_ADMIN 与低端口绑定权限
sudo setcap cap_net_admin,cap_net_bind_service=+ep /usr/bin/verge-mihomo
```

---

## 三、排查二：双虚拟网卡抢路由冲突（游戏加速器 / 企业 VPN / WireGuard 共存）

### 1. 为什么一开游戏加速器或公司 VPN 就彻底断网？
很多用户习惯开机常挂代理客户端的 TUN 模式，晚上打游戏时直接点开 **UU 加速器、雷神加速器、奇游加速器**，或者在家办公时打开了公司内网 VPN（**EasyConnect、Sangfor aTrust、GlobalProtect、Cisco AnyConnect**）以及个人组网工具（**Tailscale、ZeroTier、WireGuard、OpenVPN**）。

结果往往是**两款软件一同时开启，整台电脑瞬间断网，甚至连本地网页和公司内网全都不通**。底层原因非常直观：绝大多数 VPN、代理 TUN 和网游加速器，默认都会向操作系统路由表插入一条覆盖全网的默认路由（`0.0.0.0/0` 或分拆为 `0.0.0.0/1` 与 `128.0.0.0/1` 半覆盖路由）。当两个虚拟网卡同时抢占最高优先级（最小 Metric 跃点数）时，操作系统把数据包交给 A 虚拟网卡，A 把封装后的外层包再交给系统准备发出，却被 B 虚拟网卡的默认路由截胡吞掉，**形成无限路由环路（Routing Loop）与死锁丢包**。

### 2. 用路由表命令 10 秒看穿虚拟网卡冲突
打开终端，执行系统原生的路由打印命令，检查当前究竟有几张虚拟网卡在争夺流量出口：

```powershell
# Windows 查看当前 IPv4 活动接口与跃点数（Metric 越小优先级越高）
Get-NetIPInterface -AddressFamily IPv4 | Sort-Object InterfaceMetric | Format-Table InterfaceAlias, InterfaceMetric, ConnectionState

# 打印 IPv4 核心路由表，重点观察 0.0.0.0 与 128.0.0.0 目标网段的去向
route print -4
```

```bash
# macOS 查看默认路由与 utun 接口
netstat -rn -f inet | head -n 30

# Linux 查看主路由与策略路由
ip route show
```

**正常单 TUN 状态 vs 冲突死锁状态判别**：
- **正常单 TUN 状态**：只有一张虚拟网卡（如 `Meta` / `singbox_tun` / `utun4`）拥有极低的跃点数并接管默认流量；而物理网卡（`WLAN` / `以太网`）通过客户端内置的 `auto-detect-interface: true` 与 Socket 绑定机制，直接从底层网关发送封装后的加密隧道流量。
- **双网卡冲突状态**：`route print -4` 中同时出现了两个不同虚拟网卡接口的 `0.0.0.0` 或 `128.0.0.0/1` 规则，且跃点数极其接近（例如 `Meta` Metric=5 与 `Sangfor` / `Tailscale` / 加速器虚拟网卡 Metric=5 或 10），此时数据包必然迷失方向。

### 3. 四类常见软件的安全共存方案

| 冲突软件类型 | 推荐处理方案 | 具体配置与操作要领 |
| :--- | :--- | :--- |
| **网游加速器**（UU / 雷神 / 奇游等） | **严禁 TUN 模式双开，按需切换** | 玩游戏开启加速器前，**先关闭代理客户端的 TUN 开关**（可保留系统代理仅供浏览器查攻略，或暂时退出客户端）；游戏结束再开回 TUN。 |
| **Tailscale / ZeroTier 内网组网** | **TUN 网段排除 + Fake-IP 放行** | 在 Mihomo `tun.route-exclude-address` 加入 Tailscale 的 `100.64.0.0/10` 网段；在 `dns.fake-ip-filter` 加入 `*.ts.net`，使组网穿透流量直连物理网卡不进代理。 |
| **企业 SSL VPN**（EasyConnect / aTrust / AnyConnect / GlobalProtect） | **内网网段排除，或工作时切回系统代理** | 若企业 VPN 仅接管公司内网 IP，将公司网段（如 `10.0.0.0/8`、`172.16.0.0/12`）写入 `route-exclude-address` 并加内网域名到 `fake-ip-filter`；若企业 VPN 强行接管全局流量，办公时**务必关闭代理 TUN 仅用系统代理或退出代理**。 |
| **WSL2 / Docker Desktop** | **Win11 Mirrored 模式或排除容器网桥** | 详见专题文档：[WSL2 与 Docker 冲突深度修复指南](/troubleshooting/tun-wsl-docker-conflict/)。 |

**Mihomo（Clash Verge Rev / FlClash）标准共存排除模板**：
在全局覆写配置中补充以下字段，可一次性隔离绝大多数内网组网与虚拟网桥冲突：

```yaml
tun:
  enable: true
  stack: mixed                 # 兼顾 TCP 吞吐性能与 UDP 兼容性
  auto-route: true
  auto-detect-interface: true
  dns-hijack:
    - "any:53"
    - "tcp://any:53"
  route-exclude-address:
    - 100.64.0.0/10            # Tailscale / 运营商级 CGNAT 内网穿透网段
    - 10.0.0.0/8               # 企业办公网 / 部分校园内网 A 类私有网段
    - 172.16.0.0/12            # Docker 网桥 / 传统 NAT 模式 WSL2 私有网段
    - 192.168.0.0/16           # 家庭/办公局域网网段
```

---

## 四、排查三：退出客户端后系统代理未复位导致无法上网（`ERR_PROXY_CONNECTION_FAILED`）

### 1. 现象与直接原因
这是“系统代理冲突”里最高频的新手噩梦：**本来开着代理一切正常，关掉代理软件准备裸连国内网络，或者电脑重启后还没开客户端，结果 Chrome、Edge 打开百度、淘宝全都秒报 `ERR_PROXY_CONNECTION_FAILED`（无法连接到代理服务器）**。

原因非常简单：桌面客户端开启「系统代理」时，本质上是修改了操作系统里“本地连接代理开关”。如果你直接用任务管理器强杀客户端、遇到系统突然关机蓝屏，或者客户端自身崩溃退出，它来不及执行退出清理函数把代理开关关回 `0`。于是电脑重启或关掉软件后，Windows 注册表里的 **`ProxyEnable` 依然停留在 `1`**，浏览器老老实实把所有网页请求继续发往已经无人监听的 `127.0.0.1:7897` 端口，导致彻底断网。

> 注：如果出现这个现象时，你检查过系统代理其实已经关闭，但 `ping www.baidu.com` 返回的是 `198.18.0.x`，那么不属于 `ProxyEnable` 未复位，而是 Fake-IP 缓存残留，请跳转参照 [DNS 排查指南的 Fake-IP 一键清理章节](/troubleshooting/dns/) 处理。

### 2. 一键恢复上网的图形化与命令行方法

#### 方法 A：Windows 图形界面 10 秒关闭（适合普通用户）
1. 按下 `Win + I` 打开 Windows「设置」，点击左侧「网络和 Internet」→「代理（Proxy）」。
2. 在「手动设置代理」一栏中点击「编辑」，将 **「使用代理服务器」开关拨至「关」**，然后点击保存。
3. 顺手检查上方的「自动设置代理 → 自动检测设置」，通常保持开启或根据公司要求设置；若「使用设置脚本」里残留了不知名的 `http://127.0.0.1:xxx/proxy.pac`（PAC 脚本地址），也一并关闭并清空。

#### 方法 B：PowerShell 一键强力复位（适合注册表被锁或需要批量修复）

```powershell
# 1. 查询当前系统代理注册表状态与残留 PAC 脚本
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" | findstr /i "ProxyEnable ProxyServer AutoConfigURL"

# 2. 一键关闭系统代理开关（ProxyEnable 置 0）并清空残留端口与 PAC 地址
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -Name ProxyEnable -Value 0
Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -Name AutoConfigURL -ErrorAction SilentlyContinue

# 3. 重置 WinHTTP 底层系统服务代理（部分系统更新或 UWP/Store 应用读取 WinHTTP）
netsh winhttp reset proxy
```

#### 方法 C：macOS 终端一键复位残留系统代理

```bash
# 查询当前 Wi-Fi 的 HTTP / HTTPS / SOCKS 代理与自动代理状态
networksetup -getwebproxy "Wi-Fi"
networksetup -getsecurewebproxy "Wi-Fi"
networksetup -getsocksfirewallproxy "Wi-Fi"

# 一键关闭 Wi-Fi 接口上所有残留的系统代理开关（若使用有线网请将 "Wi-Fi" 替换为实际服务名）
sudo networksetup -setwebproxystate "Wi-Fi" off
sudo networksetup -setsecurewebproxystate "Wi-Fi" off
sudo networksetup -setsocksfirewallproxystate "Wi-Fi" off
sudo networksetup -setautoproxystate "Wi-Fi" off
```

执行后，重新刷新浏览器网页即可立即恢复直连访问；若浏览器仍报错，按 `Ctrl + Shift + N` 检查是否还有 SwitchyOmega 等浏览器插件锁定了浏览器独立代理。

---

## 五、排查四：虚拟网卡 DNS 劫持失效、防火墙拦截与底层协议栈重置

### 1. 防火墙拦截虚拟网卡与内核通信
部分用户在安装或首次打开 TUN 模式时，Windows Defender 防火墙弹窗询问“是否允许 `verge-mihomo.exe` 在公用/专用网络上通信”，如果当时随手点了「取消」或「阻止」，防火墙就会丢弃来自 `Meta` / `singbox_tun` 虚拟网卡的转发流量，表现为 TUN 开启后所有软件集体超时。

**检查与放行操作**：
1. 打开「控制面板 → 系统和安全 → Windows Defender 防火墙 → 允许应用或功能通过 Windows Defender 防火墙」。
2. 点击右上角「更改设置」，在列表中找到 `Clash Verge`、`verge-mihomo`、`v2rayN`、`xray` 或 `sing-box`，同时勾选右侧的 **「专用」和「公用」** 两个复选框后确定（注意如果存在多条同名旧路径记录，先检查详细信息核对是否为当前安装路径）。
3. 如果你安装了第三方安全套装（如火绒、360、卡巴斯基、迈克菲），部分杀毒软件自带“网络防黑客 / ARP 防火墙 / 虚拟网卡保护”模块，会直接拦截未签名的 TUN 驱动接管 DNS 53 端口，测试排障时可先短暂关闭其“网络防护”模块验证是否恢复，确认后再加入软件白名单。

### 2. TUN 协议栈（`stack`）选择与 `strict-route` 导致的特定断网
在 Mihomo 与 sing-box 的 TUN 配置中，有两个高级参数极易引起隐蔽断网：
- **`stack`（协议栈引擎）**：
  - `system`：完全依托操作系统内核网络栈处理 TCP/UDP，吞吐极限最高，但在部分精简 Windows 或第三方杀软钩子环境下兼容性较差，甚至可能引发局部卡死。
  - `gvisor`：完全在用户态用 Go 模拟 TCP/IP 协议栈，稳定性极佳、几乎不挑操作系统驱动环境，但极端千兆高并发下载时 CPU 占用略高。
  - **`mixed`（最推荐默认选项）**：TCP 走 `system` 保证网页与下载高速低耗，UDP 走 `gvisor` 规避底层 UDP 驱动异常。如果你的电脑开启 TUN 后频繁出现无故断流或蓝屏，将 `stack` 从 `system` 改为 **`mixed`** 或 **`gvisor`** 往往能立竿见影。
- **`strict-route`（严格路由）**：开启后会禁止绕过虚拟网卡的局部直连泄漏，但在未配置完整排除项的双网卡、虚拟机或复杂局域网环境下会导致局域网设备互访失败。普通桌面端遇到开启 TUN 后局域网打印机/投屏断连时，可检查配置中是否开启了 `strict-route: true`，先将其设为 `false` 观察。

### 3. Windows UWP / Microsoft Store 应用无法走系统代理的回环隔离（Loopback Exemption）
很多 Windows 用户会发现一个怪现象：开启系统代理后 Chrome 正常，但系统自带的 **Microsoft Store、微软账号登录弹窗、Xbox 应用或网易云/商店版 UWP 软件**依然彻底无网。这是因为微软对所有 UWP 应用默认开启了**“禁止访问本地回环地址（`127.0.0.1`）”**的沙盒隔离策略，系统代理指向 `127.0.0.1:7897` 时流量会被系统内核直接拦截丢弃。

解决该问题有两种官方途径：
- **方法 A（推荐）**：直接切换为 **TUN 模式**。因为 TUN 在网络层分配虚拟网卡地址并接管路由，UWP 应用无需直接连接 `127.0.0.1`，可天然绕开回环隔离。
- **方法 B（仅系统代理下放行）**：在 [Clash Verge Rev](/clients/clash-verge-rev/)「设置 → UWP 工具」中打开回环豁免管理器，勾选需要联网的 UWP 应用保存；或者以管理员身份执行 PowerShell 指令针对特定应用包解除回环隔离（例如 `CheckNetIsolation.exe LoopbackExempt -a -n="Microsoft.WindowsStore_8wekyb3d8bbwe"`）。

### 3. 终极兜底：清理残留幽灵适配器与重置 Winsock 协议栈
如果以上所有软件层配置都已关闭或卸载，电脑在完全无代理软件运行的状态下依然显示“无 Internet 访问”、无法获取 DHCP 或网卡感叹号怎么都消不掉，通常是因为某些劣质卸载程序或老旧 VPN 驱动破坏了 Windows LSP（分层服务提供程序）或残留了幽灵虚拟适配器：

```powershell
# 1. 查看当前所有网络适配器（含已断开或隐藏的虚拟网卡）
Get-NetAdapter -IncludeHidden | Format-Table Name, InterfaceDescription, Status

# 2. 以管理员身份重置 Winsock 目录与 TCP/IP 协议栈（注意：执行后必须重启电脑才会生效！）
netsh winsock reset
netsh int ip reset
```

> **操作警示**：`netsh winsock reset` 会重置系统底层的网络 LSP 钩子链，虽然能根治绝大多数因异常代理/加速器卸载残骸引发的断网顽疾，但如果你电脑上同时依赖特定的校园网客户端（如锐捷、Dr.COM 底层插件）或企业专网加密客户端，重置后可能需要重新修复或安装那些客户端，执行前请留意评估。

---

## 六、本专题三级内容集群与延伸阅读

为了覆盖 Windows、macOS、Linux 桌面权限配置、企业 VPN/开发环境共存以及系统代理异常恢复，本专题构建了以下三个三级（L3）纵深子集群：

### 集群 1：TUN 模式权限授权与内核栈调优
聚焦 Windows Service Mode、macOS Helper 授权、Linux `CAP_NET_ADMIN` 以及 `system`/`gvisor`/`mixed` 协议栈性能与兼容性调优：
- **已发布关联指南**：
  - [TUN 模式深度配置与全参数指南](/guides/tun/)
  - [Clash Verge Rev 安装、服务模式与日常维护教程](/guides/clash-verge-rev-setup/)
  - [客户端无法启动、核心被隔离与 9090/7897 端口清理](/troubleshooting/startup/)
- **规划中三级选题（待发布选题）**：
  - 《Windows Clash Verge Service 服务安装失败、卸载残留与 Wintun 驱动报错修复全集》（`待发布选题`）
  - 《Mihomo TUN 三大协议栈（`system` / `gvisor` / `mixed`）千兆吞吐实测与防蓝屏选型指南》（`待发布选题`）

### 集群 2：多虚拟网卡、开发容器与游戏加速器共存
聚焦双 VPN 路由环路诊断、WSL2/Docker 虚拟交换机隔离以及企业办公网与个人组网工具并行架构：
- **已发布关联指南**：
  - [Clash TUN 网卡与 WSL2、Docker Desktop 冲突深度修复（Win11 Mirrored 与 NAT 方案）](/troubleshooting/tun-wsl-docker-conflict/)
  - [DNS 错误、Fake-IP 残留与企业内网 OA/NAS 绕过配置](/troubleshooting/dns/)
  - [Windows / macOS / Linux 全平台客户端适配总览](/clients/)
- **规划中三级选题（待发布选题）**：
  - 《代理 TUN 与 Tailscale / ZeroTier / WireGuard 完美共存路由配置模板》（`待发布选题`）
  - 《办公电脑同时安装 EasyConnect / aTrust 与代理客户端的路由隔离与分时切换方案》（`待发布选题`）

### 集群 3：系统代理冲突与退出断网急救体系
聚焦 `ProxyEnable` 注册表未复位、PAC 脚本残留、浏览器插件接管冲突与底层 Winsock 恢复：
- **已发布关联指南**：
  - [代理连接成功没网络、端口冲突与 SwitchyOmega 覆盖排查](/troubleshooting/disconnected/)
  - [订阅更新失败、200+0 字节与代理死循环排查](/troubleshooting/subscription/)
  - [节点全部超时与本地时钟偏差修复](/troubleshooting/timeout/)
- **规划中三级选题（待发布选题）**：
  - 《关闭代理后报 `ERR_PROXY_CONNECTION_FAILED` 一键批处理修复脚本（清理注册表 + PAC + DNS 缓存）》（`待发布选题`）
  - 《Windows 命令行终端（PowerShell / Git / Curl / Docker CLI）不走系统代理时的环境变量与 TUN 方案对比》（`待发布选题`）

---

## 常见问题（FAQ）

### 1. 为什么开启系统代理后浏览器能出国，但终端里的 git、curl、pip 和游戏还是直连或超时？
系统代理仅在应用层通过注册表或系统设置下发 HTTP/SOCKS 端口，只对浏览器和主动读取系统代理变量的程序生效。终端 CLI 工具、UWP 应用、Docker 与绝大多数游戏默认绕过系统代理，需要通过 TUN 虚拟网卡在三层网络栈接管全局数据包，或者手动配置 `HTTP_PROXY` 环境变量。

### 2. Clash Verge Rev 点击打开 TUN 模式开关就自动弹回，或者提示 Service Mode 未安装怎么办？
创建 Wintun 虚拟网卡并改写系统路由表属于高权限系统操作。Windows 必须先在客户端设置中安装 Clash Verge Service 服务模式（不要每次靠右键管理员运行）；如果旧版服务残留导致安装失败，需在管理员 PowerShell 中执行 `sc.exe stop` 与 `sc.exe delete` 清理旧服务后重新安装。

### 3. 为什么关闭代理客户端之后，电脑国内网页也完全打不开，浏览器提示 ERR_PROXY_CONNECTION_FAILED？
这是系统代理未正常复位导致的典型“断网遗留症”。客户端崩溃或被强制退出时，Windows 注册表中的 `ProxyEnable` 仍然保持为 `1`，浏览器继续把所有请求发往已经关闭的 `127.0.0.1:7897` 端口。进入 Windows“设置 → 网络和 Internet → 代理”关闭“使用代理服务器”，或用脚本将 `ProxyEnable` 设为 `0` 即可秒级恢复。

### 4. 可以同时打开代理客户端的 TUN 模式和 UU/雷神游戏加速器或公司 EasyConnect VPN 吗？
不能直接同时开启全局接管。两款软件都会向操作系统注册虚拟网卡并往路由表写入高优先级默认路由（`0.0.0.0/0` 或双半路由 `0.0.0.0/1` + `128.0.0.0/1`），数据包会在两张虚拟网卡之间陷入路由环路而彻底断网。玩游戏开加速器时应先关闭代理 TUN，与企业 VPN 或 Tailscale 共存时则需配置 `route-exclude-address` 排除内网网段。

### 5. 开启 TUN 模式后，虚拟网卡已经生成但网页依然打不开，如何判断是防火墙还是 DNS 劫持失效？
在客户端日志中观察是否出现大量 UDP 53 流量未被接管，或物理网卡防火墙拦截了 `verge-mihomo.exe` 的出站请求。确保配置文件 `tun` 块中启用了 `auto-route: true`、`auto-detect-interface: true` 与 `dns-hijack: ["any:53"]`，并在 Windows 防火墙中放行客户端主程序与核心在专用/公用网络下的通信权限。

### 6. 开启 TUN 模式后只有 WSL2 或 Docker Desktop 容器连不上网，宿主机正常怎么解决？
这是 Hyper-V 虚拟交换机私有网段（`172.16.0.0/12`）与 TUN 全局路由及 Fake-IP 发生跨子网边界冲突所致。Windows 11 22H2+ 用户建议在 `.wslconfig` 开启 Mirrored 镜像网络模式，Windows 10/NAT 用户需在 `route-exclude-address` 排除容器网段，详细步骤请参阅本站专门的 [WSL2/Docker 冲突修复文档](/troubleshooting/tun-wsl-docker-conflict/)。

### 7. TUN 模式下的 network stack 选 system、gvisor 还是 mixed 最好？
对于日常桌面使用，推荐优先采用 `mixed`（混合栈：TCP 走系统协议栈以降低 CPU 占用并跑满高速下载，UDP 走 gVisor 用户态栈以规避部分系统兼容问题）；若在某些老旧 Windows 或开启严格安全软件的环境下发现 `system`/`mixed` 导致蓝屏或丢包，可切换为纯 `gvisor` 栈以提升稳定性。
