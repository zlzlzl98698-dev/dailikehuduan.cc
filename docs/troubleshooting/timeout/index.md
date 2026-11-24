---
title: "节点全部超时排查：时间偏差、真连接 -1ms、UDP 阻断与全节点失效定位"
description: "深度拆解代理客户端节点连接超时、机场节点全部超时与真连接测试 -1ms 的 6 层排查矩阵。涵盖系统时钟偏差 >90s 修复、套餐到期与流量核验、ICMP/TCPing/URLTest 机制差异、校园网 UDP 拦截及上游入口故障定位。"
lastUpdated: 2026-11-23
schemaType: TechArticle
faq:
  - q: "为什么 TCPing 显示 50ms，但真连接测试（URLTest）全是 -1ms 或 timeout？"
    a: "TCPing 仅测量本机到国内中转入口服务器的 TCP 三次握手（SYN/SYN-ACK）耗时，不验证协议密钥、系统时钟、TLS 证书与海外落地出口；而 URLTest 真连接必须走完代理协议加密握手并通过远端节点请求 generate_204 测试地址。只要本机时间偏差超标、套餐流量耗尽、订阅密钥失效或中转到海外落地断联，就会出现 TCPing 正常但真连接全报 -1ms 的现象。"
  - q: "为什么所有节点突然在一夜之间全部无法使用，更新订阅也没反应？"
    a: "所有节点瞬间同时失效，90% 以上源于四类全局性触发条件：一是本机系统时间漂移超过 90 秒导致 TLS 1.3、VMess 或 VLESS-Reality 鉴权集体拒绝；二是套餐当月流量耗尽或账单到期被后端统一阻断；三是所处网络（如校园网、酒店或企业 Wi-Fi）启用了 UDP 封锁或非标端口白名单；四是机场中转入口域名批量变更，而客户端开着失效旧代理去更新订阅陷入死循环。"
  - q: "切换到 Hysteria 2 或 TUIC 节点后全部显示超时，但 VLESS 或 Trojan 节点还能连是什么原因？"
    a: "Hysteria 2 与 TUIC 底层基于 QUIC（UDP）传输协议，而校园网、政企办公网以及部分移动宽带在晚高峰会对高频 UDP 流量执行严厉的 QoS 丢包甚至直接封禁非 53/123 端口的 UDP 数据包。遇到此类情况应优先切换至基于 TCP 443 端口的 VLESS-Reality、Trojan 或 AnyTLS 节点。"
  - q: "系统时间只差了不到 2 分钟，真的会导致所有节点全部超时吗？"
    a: "会。VMess 协议规范硬性要求客户端与服务端 UTC 时间戳误差不得超过 90 秒；VLESS-Reality 的握手防重放校验与 TLS 证书有效期核验同样高度依赖精确时钟。双系统切换（Windows 与 Linux 硬件时钟 UTC/Local 冲突）、主板 CMOS 电池亏电或虚拟机休眠恢复后，哪怕偏移 100 秒也会引发全节点 timeout。"
  - q: "为什么软件界面里测速全是红色超时，但浏览器其实还能正常打开海外网页？"
    a: "这是因为客户端内置的测速 URL（如 gstatic.com/generate_204 或 cp.cloudflare.com）在特定节点或本地 DNS 规则下被拦截、限流或超时时间（Timeout）设得过短，导致测速探测包失败，但实际网页走的分流隧道并未中断。建议将客户端测速 URL 更换为高可用端点并用 curl 命令验证真实 HTTP 状态码。"
  - q: "开启 IPv6 后部分节点偶尔超时、偶尔能连是怎么回事？"
    a: "当本地路由器分配了残缺的 IPv6 地址（如仅有内网前缀或运营商 IPv6 国际出口断流），而节点入口域名同时配置了 AAAA（IPv6）和 A（IPv4）解析记录时，客户端若优先发起 IPv6 连接就会经历数秒的握手等待直至超时失败。在客户端设置中关闭 IPv6 支持或将出站解析策略设为 ipv4_only 即可根治。"
  - q: "如何快速区分是自己电脑/网络环境的问题，还是机场服务商上游崩了？"
    a: "最直接的交叉验证法是『手机断开 Wi-Fi 切 5G 移动数据 + 关闭时间自动同步后再重开 + 关闭代理直连刷新一次订阅』。如果手机 5G 蜂窝网络下最新订阅依然全节点 -1ms，且官网面板无法登录或公告区提示中转维护，才属于服务端上游故障；若手机 5G 秒连而电脑 Wi-Fi 全超时，则 100% 是本地网卡、时钟、防火墙或路由器环境问题。"
---

# 节点全部超时排查：节点连接超时、真连接 `-1ms` 与全节点突然失效定位

<div class="answer-first-box">
<div class="answer-first-label">核心结论 · Answer First</div>
<p>当代理客户端出现<strong>“节点连接超时”</strong>、<strong>“机场节点全部超时”</strong>或真连接测试统一返回 <code>-1ms</code> / <code>timeout</code> 时，绝大多数情况并非远端服务器同时物理宕机，而是触发了本地或链路层的全局阻断条件。遵循<strong>「现象 → 可能原因 → 检查步骤 → 处理方法 → 验证结果 → 下一步」</strong>的排障逻辑，85% 以上的全节点失效集中于六大根因：<strong>本地系统时钟偏差超过 90 秒</strong>导致 TLS/Reality/VMess 拒绝握手、<strong>套餐到期或流量耗尽</strong>、<strong>ICMP/TCPing 假通但海外隧道断流</strong>、<strong>校园网或企业网封禁 UDP 与非标端口</strong>、<strong>旧版内核不兼容新协议字段</strong>，以及<strong>上游中转入口域名变更后未直连刷新订阅</strong>。排查时应先校准 UTC 系统时间并关闭代理直连更新订阅，再通过终端 <code>curl -x</code> 检验真实 HTTP 204 响应，切勿仅凭 GUI 界面上的红色测速数字盲目重装软件。</p>
</div>

---

## 一、全局诊断矩阵：节点全部超时的 6 层根因速查表

为什么昨天还流畅使用的代理客户端，今天开机后会出现**机场节点全部超时**？在网络工程中，分布式代理节点分布在不同机房（香港、日本、新加坡、美国等），所有落地服务器在同一秒物理损毁的概率近乎为零。一旦出现“全军覆没”式的**节点超时**或**真连接测试 -1ms**，必然是所有节点共用的**前置公共环节**出了故障。

下表汇总了基于站点 [客户端兼容性数据库](/clients/) 与 [品牌实测档案](/brands/)（`2026-11-23` 核验快照）提炼的 6 层故障定位矩阵：

| 故障层级 | 典型现象特征 | 高频触发原因 | 首要检查命令 / 位置 | 预计修复耗时 |
| :--- | :--- | :--- | :--- | :--- |
| **L1：本地时钟层** | 所有节点瞬间全部 `-1ms`，日志报 `bad timestamp`、`invalid user` 或 `certificate has expired` | Windows/Linux 双系统时区冲突、主板电池没电、虚拟机挂起恢复、NTP 服务被禁用 | `w32tm /query /status` 或 `date -u` 比对手机标准时间 | **1 分钟** |
| **L2：账户与订阅层** | 节点列表还在，但测速全红；或长时间未更新订阅，旧入口域名已停用 | 套餐流量用尽（含高倍率节点消耗）、账单逾期、Token 重置、开着死代理更新订阅 | 查看客户端订阅卡片剩余流量/到期日，关闭代理后直连更新 | **2 分钟** |
| **L3：测速机制误判** | TCPing 显示 `35ms` 绿色，但 URLTest 真连接显示 `-1ms`；或测速全红却能打开网页 | 入口机器存活但落地断联、客户端默认测速 URL 被阻断、并发测速线程过高触发本地限流 | `curl -x http://127.0.0.1:7897 -I https://cp.cloudflare.com/generate_204` | **2 分钟** |
| **L4：本地网络环境** | 家里 Wi-Fi 正常，到学校/公司/酒店后全超时；或 Hysteria 2 全挂而 VLESS 正常 | 校园网/企业网封锁 UDP 高端口、802.1X 网页认证未登录、杀毒软件 HTTPS 流量扫描拦截 | 切换手机 5G 热点交叉测试；筛选 TCP `443` 端口节点 | **3 分钟** |
| **L5：内核与 IPv6 层** | 导入新机场订阅后节点全报 `timeout` 或协议不支持；双栈宽带间歇性卡死 | 仍在用已停更的 Clash for Windows 跑 VLESS-Reality / Hysteria 2；本地残缺 IPv6 抢先握手 | 核对客户端内核版本（需 Mihomo / sing-box / Xray 新版）；设 `ipv6: false` | **5 分钟** |
| **L6：上游中转与服务端** | 校准时间 + 手机 5G + 更新订阅后依然全超时，且官网面板打不开或群组置顶维护 | 国内中转入口遭受 DDoS 攻击切换 IP、运营商跨省专线割接、或机场本身失联停服 | 查阅品牌状态页或对照 [机场停服与跑路核验指南](/safety/closures/) | **视上游恢复** |

---

## 二、排查一：系统时钟偏差 >90s 导致 TLS / Reality 握手失败

### 1. 现象与可能原因
- **问题现象**：客户端内无论是香港、日本还是美国节点，点击测速后在 1 秒内全部变成 `timeout` 或 `-1ms`，且没有任何一个节点能建立连接。
- **直接答案与底层机理**：现代加密代理协议为了防御中间人重放攻击（Replay Attack），对客户端与服务端的 UTC 时间戳一致性有严苛要求：
  1. **VMess 协议（AEAD 认证）**：协议规范硬性规定客户端发出的认证头部时间戳与服务端系统时间误差不得超过 **±90 秒**（部分服务端放宽至 120 秒），一旦超时，服务端直接静默丢弃数据包或重置连接。
  2. **VLESS-Reality 与 TLS 1.3**：Reality 握手阶段在 `ClientHello` 的 Session ID 中嵌入了加密时间戳与 ShortID；当本地时钟偏移过大，或者本地年份/日期回退到服务端 TLS 证书签发日期之前，握手会立即以 `tls: bad record MAC` 或 `x509: certificate has expired or is not yet valid` 终止。
  3. **Hysteria 2 / TUIC（QUIC 0-RTT/1-RTT）**：基于 TLS 1.3 的 QUIC 传输层同样在证书有效性与会话票据（Session Ticket）中校验时间戳。

### 2. 检查步骤与跨平台处理方法
最容易发生时钟偏移的三大场景是：**Windows 与 Ubuntu/macOS 双系统切换**（Windows 默认将主板 BIOS 硬件时钟视为本地时间 LocalTime，而 Linux/macOS 将其视为 UTC，切换系统后时间会刚好相差 8 小时）、**笔记本深度休眠或虚拟机快照恢复**，以及**企业内网屏蔽了外部 UDP 123（NTP）端口**。

请按操作系统打开终端执行以下检查与强制同步指令（Windows 环境下更完整的注册表与服务修复可参考 [Windows 系统时间与 TLS 报错修正教程](/guides/system-time-tls-fix/)）：

```powershell
# Windows 10 / 11（右键开始菜单 → 以管理员身份运行 PowerShell 或终端）
# 1. 查看当前时间同步状态与上次同步源
w32tm /query /status

# 2. 启动 Windows 时间服务并设为自动启动
sc.exe config w32time start= auto
net start w32time

# 3. 配置国内高可用 NTP 授时服务器（阿里云与国家授时中心）并强制立即同步
w32tm /config /manualpeerlist:"ntp.aliyun.com,cn.ntp.org.cn,time.windows.com" /syncfromflags:manual /reliable:YES /update
w32tm /resync /force
```

```bash
# macOS 终端检查 UTC 时间并向 Apple 授时服务器强制同步
date -u
sudo sntp -sS time.apple.com

# Linux (Systemd 发行版如 Ubuntu / Debian / Arch)
timedatectl status
sudo timedatectl set-ntp true
sudo systemctl restart systemd-timesyncd

# 若为 Windows + Linux 双系统用户，建议在 Linux 下将硬件时钟统一改为本地时间以防差 8 小时：
sudo timedatectl set-local-rtc 1 --adjust-system-clock
```

### 3. 验证结果与下一步
- **验证标准**：拿出开启了“自动设置时间”的智能手机，打开精确到秒的时钟网页或秒表，与电脑右下角时间对比。**两者误差必须小于 30 秒**，且时区需明确为 `(UTC+08:00) 北京，重庆，香港特别行政区，乌鲁木齐`（或你实际所在地的正确时区，注意不要出现“时区是东八区但小时数按 UTC 填写”的隐蔽错误）。
- **下一步**：时间校准在 30 秒误差内后，切勿直接测速，请先在客户端点击一次「重启内核（Restart Core）」，再点击真连接测速。若依旧全部超时，进入下一层排查。

---

## 三、排查二：套餐到期、流量耗尽与倍率结算盲区

### 1. 现象与可能原因
- **问题现象**：本地时间完全准确，昨天下午看 4K 视频还很顺畅，昨晚或今早突然**所有节点突然无法使用**，客户端日志中频繁出现 `connection reset by peer`、`EOF` 或 `invalid user / authentication failed`。
- **直接答案与条件说明**：机场后端面板（如 V2Board、SSPanel-Uim、Xboard）通过定时任务每 1–3 分钟扫描一次用户数据库。一旦你的账户触发以下任一条件，后端会将你的 UUID / Password / Trojan 密钥从所有节点的服务端鉴权白名单中临时摘除：
  1. **周期账单到期**：月付或季付套餐到达截止时间戳，即使你还剩 80GB 流量未用完，鉴权也会立即失效（仅 [不限时流量套餐](/plans/non-expiring/) 除外，如 `brands.ts` `2026-11-23` 档案中收录的 [飞猫云](/brands/feimao/) ¥70/200GB 不限时套餐、[魔戒](/brands/directory/) 或 [优信云](/brands/kexin/) 按量付费方案）。
  2. **高倍率节点瞬间吃光剩余流量**：许多用户在不知情下选中了标注为 `2x`、`3x` 甚至 `10x` 的 IEPL 专线或流媒体原生节点（倍率扣费算法详见 [机场流量倍率计算机制](/routes/multipliers/)），后台自动下载 Windows 更新、Steam 游戏或网盘同步，短短一小时就将当月配额耗尽。
  3. **触发审计规则或并发设备超限临时封禁**：短时间内连接数暴增（如 BT 迅雷下载未走直连分流）或超出套餐允许的同时在线 IP 数，被面板自动封禁 10–30 分钟。

### 2. 检查步骤与处理方法
1. **在客户端内直接核查订阅元数据**：
   现代客户端（如 [Clash Verge Rev](/clients/clash-verge-rev/)、[FlClash](/clients/flclash/)、[Hiddify](/clients/hiddify/)、[Shadowrocket](/clients/shadowrocket/)）在导入符合规范的订阅后，会读取 HTTP 响应头中的 `subscription-userinfo` 字段（格式如 `upload=1073741824; download=106300440576; total=107374182400; expire=1795449600`），并在「订阅（Profiles）」卡片上直接展示**已用流量 / 总流量**以及**到期时间**。
2. **关闭代理后刷新订阅看最新配额**：
   注意卡片上的流量数字不会实时跳动，只有在点击「更新订阅」时才会刷新。请先**关闭系统代理与 TUN 模式**，右键订阅卡片点击「更新（Update）」，观察更新后的流量进度条是否已达 100% 或显示已过期。
3. **登录机场官网控制台核实**：
   若客户端未显示流量条，直接用浏览器（在关闭本地代理的状态下）访问机场官网面板，检查仪表盘的「剩余流量」、「套餐到期时间」以及是否有未支付的续费账单。若旧官网域名无法打开，可前往本站 [品牌目录检索页](/brands/directory/) 查阅对应品牌的详情页与历史档案说明。

### 3. 验证结果与下一步
- **验证标准**：确认账户处于有效期内且剩余可用流量大于 500MB。
- **下一步**：若流量耗尽或到期，在官网重置当月流量包或续费后，**必须等待 2–5 分钟**让机场后端节点同步下发新鉴权名单，随后在客户端刷新一次订阅即可恢复。若账户配额充足却依然全节点 `-1ms`，继续排查第三层。

---

## 四、排查三：ICMP Ping 通但 TCP/UDP 端口被封与三类测速机制差异

### 1. 现象与可能原因
- **问题现象**：用户在 [v2rayN](/clients/v2rayn/) 或路由器插件中使用 Ping / TCPing 测试时，节点列表一片翠绿（显示 `28ms`、`45ms`），但一旦切换到 **真连接测试（URLTest）** 或实际打开浏览器，延迟立刻变成 **`-1ms`**、**`timeout`** 或 **`Error`**。
- **直接答案与证据分析**：这种“假活（False Positive）”现象源于不同测速工具探测的网络协议栈层级截然不同。现代主力机场（例如 `2026-11-23` 站点数据库收录的 [光速云](/brands/guangsuyun/)、[牧光云](/brands/muguang/)、[微风云](/brands/weifeng/)、[大佬云](/brands/dalaoyun/) 等中转与专线架构）普遍采用**「国内 BGP 中转入口 → 跨境内网/专线 → 海外落地出口」**的三段式架构。

我们可以用一张架构对比表看清三类测速的本质差异（延迟抖动的深入网络测量方法见 [延迟、丢包与抖动实测指南](/routes/latency/)）：

| 测速类型 | 客户端常见名称 | 探测协议与数据包路径 | 能否检测出密码错误 / 流量耗尽 | 能否检测出海外落地断联 | 典型误导场景 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ICMP Ping** | Ping 延迟（部分老旧脚本/软路由面板） | 本地 → 国内中转入口 IP 发送 ICMP Echo Request | **不能** | **不能** | 1. 阿里云/腾讯云/BGP 入口禁 Ping 时显示超时，但节点实际能用；<br>2. 入口能 Ping 通仅代表国内机房网卡在线，哪怕代理进程已崩溃也显示 30ms。 |
| **TCPing** | TCP 延迟 / Tcping（v2rayN 快捷键 `Ctrl+P`） | 本地 → 国内中转入口 `IP:Port` 仅完成 TCP 三次握手（SYN → SYN-ACK → RST） | **不能** | **不能** | 只要国内中转服务器的端口监听没关，哪怕你的订阅已过期、系统时间差了 5 小时、或者深港专线已经中断，TCPing 依然会返回漂亮的 `35ms`。 |
| **URLTest（真连接）** | 延迟测试 / 真连接延迟（Clash Verge Rev / FlClash / v2rayN `Ctrl+R` / Shadowrocket） | 本地 → 加密协议握手 → 国内中转 → 海外落地 → 请求 `generate_204` 并返回 HTTP 204 | **能（核心检验标准）** | **能（全链路闭环）** | 最权威的可用性指标；但若客户端配置的 `test-url` 被目标 CDN 阻断，或瞬间对 100 个节点并发测速耗尽本地路由器 NAT 表，会造成假性 `-1ms`。 |

### 2. 检查步骤与命令行验证方法
不要被软件 GUI 界面上的数字迷惑，分两步用终端命令行做剥离测试：

#### 第一步：检测入口服务器 TCP 端口是否被运营商或防火墙阻断
从客户端节点详情中查看某个节点的服务器地址（Server）和端口（Port），在未开启 TUN 的状态下测试端口连通性：

```powershell
# Windows PowerShell 测试节点入口 IP/域名与端口是否可达（将示例地址替换为实际节点入口与端口）
Test-NetConnection -ComputerName entry.example.com -Port 443
```

```bash
# macOS / Linux 使用 nc (netcat) 或 curl 测试 TCP 端口握手
nc -zv -w 5 entry.example.com 443
```

- **判断准则**：
  - 如果 `TcpTestSucceeded : False` 或 `Connection timed out`，但用 `nslookup entry.example.com` 能解析出 IP（甚至能 Ping 通该 IP），说明**该节点的 TCP 端口在当前宽带下被封锁或中转机房端口已关闭**。
  - 如果所有节点的入口域名连 IP 都解析不出来（返回 `NXDOMAIN` 或 `127.0.0.1` / `0.0.0.0`），说明入口域名遭遇了本地运营商 DNS 污染，需按 [DNS 污染与解析失败排障](/troubleshooting/dns/) 配置加密 DoH 并刷新订阅。

#### 第二步：通过本地代理端口执行 `curl` 真连接验证
很多时候，客户端并发测速（一次性同时测试 80 个节点）会因为瞬间并发连接过高被中转入口防火墙丢包，从而显示满屏 `-1ms`，但单独选中某一个节点其实是可以连通的。

请在客户端中**手动点选一个香港或日本主力节点**，确认本地混合端口（Clash Verge Rev 默认为 `7897`，旧版 Clash 与部分客户端为 `7890`，v2rayN 默认 SOCKS5 为 `10808` / HTTP 为 `10809`），在终端执行单节点真连接测试：

```bash
# 1. 通过本地 HTTP 代理端口（以 Clash Verge Rev 默认 7897 为例）请求 Cloudflare 204 探测端点
curl -x http://127.0.0.1:7897 -I -s -w "\nHTTP_CODE: %{http_code} | TIME_TOTAL: %{time_total}s\n" --connect-timeout 8 https://cp.cloudflare.com/generate_204

# 2. 对照请求 Google 204 探测端点
curl -x http://127.0.0.1:7897 -I -s -w "\nHTTP_CODE: %{http_code} | TIME_TOTAL: %{time_total}s\n" --connect-timeout 8 https://www.gstatic.com/generate_204

# 3. 若使用 v2rayN 默认 SOCKS5 端口（10808），使用 --socks5-hostname 让域名也在远端解析
curl --socks5-hostname 127.0.0.1:10808 -I -s -w "\nHTTP_CODE: %{http_code} | TIME_TOTAL: %{time_total}s\n" --connect-timeout 8 https://cp.cloudflare.com/generate_204
```

### 3. 处理方法、验证结果与下一步
- **情况 A：`curl` 返回 `HTTP/1.1 204 No Content`（或 `HTTP/2 204`），耗时 `0.25s`，但客户端 UI 测速仍显示 `-1ms`**
  - **原因**：客户端内置的测速地址不可达，或测速超时阈值过严。
  - **处理方法**：进入客户端「设置 → 基础设置 → 延迟测试 URL（Latency Test URL）」，将其修改为 `https://cp.cloudflare.com/generate_204` 或 `http://www.gstatic.com/generate_204`，并将测试超时时间（Timeout）从默认的 `2000ms` 调宽至 `5000ms`，同时避免频繁狂点全量测速。
- **情况 B：`curl` 报错 `Failed to connect to 127.0.0.1 port 7897: Connection refused`**
  - **原因**：本地代理核心根本没有启动，或者你看错了客户端实际监听的端口号。
  - **处理方法**：核对客户端主界面显示的 `Mixed Port` 数字；若核心启动失败，请跳转阅读 [客户端无法启动与核心报错排查](/troubleshooting/startup/)。
- **情况 C：`curl` 卡住 8 秒后报错 `Operation timed out` 或 `Recv failure: Connection was reset`**
  - **原因**：代理隧道确实未建立成功。继续进入第四层与第五层排查网络环境拦截与协议兼容性。

---

## 五、排查四：校园网 / 企业网拦截、UDP 封锁与残缺 IPv6 回落超时

### 1. 现象与可能原因
- **问题现象**：
  1. 笔记本电脑在家里用电信/联通宽带一切正常，带到大学宿舍（校园网 eduroam / 锐捷 / 深信服认证）、公司办公网或酒店 Wi-Fi 后，**所有节点突然全部超时**。
  2. 机场下发的 **Hysteria 2** 或 **TUIC** 节点全部 `-1ms`，但偶尔有一两个 **VLESS-Reality** 或 **Trojan** 节点能勉强连通。
- **直接答案与条件说明**：政企办公网、高校校园网以及部分商业公共 Wi-Fi 通常部署了企业级下一代防火墙（NGFW）、上网行为管理系统（如深信服 AC、奇安信、Palo Alto）或严格的端口/协议白名单策略，主要通过四种手段造成代理节点全部超时：
  1. **UDP 流量一刀切封禁或极端 QoS 丢包**：Hysteria 2 与 TUIC 协议完全建立在 QUIC（UDP）之上。许多校园网和企业防火墙为了遏制 P2P 下载与内网广播风暴，除了 UDP `53`（DNS）和 `123`（NTP）外，**直接丢弃所有发往公网高端口的 UDP 数据包**，导致 QUIC 握手 100% 超时。
  2. **非标准端口白名单限制**：部分严格的企业内网仅放行 TCP `80` 和 `443` 端口出站，而许多机场的中转入口为了规避扫描，通常监听在 `10000`–`60000` 的高位随机端口（如 `24580`、`41233`），这类端口在受限网络下会被本地网关直接 Drop。
  3. **企业 SSL/TLS 解密审计（MITM 中间人证书替换）**：部分金融机构或大厂办公电脑预装了企业根证书与 EDR 客户端，网关会对所有出站 TLS 流量进行拆包重签名。当 VLESS-Reality、Trojan 或 TLS 节点检测到服务端返回的证书指纹与预期不符时，会主动中断连接以防泄密，日志报错 `tls: first record does not look like a TLS handshake` 或 `x509: certificate signed by unknown authority`。
  4. **本地残缺 IPv6 引发的 Happy Eyeballs 握手超时**：高校教育网（CERNET2）与部分家庭光猫常分配 IPv6 地址，但有时校园网 IPv6 仅限校内免流访问而无国际出网路由，或光猫重拨后遗留了失效的 IPv6 前缀。当客户端解析节点域名同时拿到 `AAAA`（IPv6）和 `A`（IPv4）记录时，内核优先向 IPv6 地址发包直至超时，导致测速大面积变红。

### 2. 检查步骤与处理方法
请按照以下 4 步隔离法逐一击破本地网络限制：

1. **手机 5G 热点 A/B 对照测试（黄金分水岭）**：
   断开电脑上的校园网/公司 Wi-Fi，打开手机的 5G/4G 个人热点让电脑连接，然后再次在客户端点击真连接测速。
   - 若连上手机热点后**节点立刻恢复绿色延迟**，则 100% 证实是刚才的 Wi-Fi 路由器或上级内网防火墙实施了协议/端口拦截，无需折腾订阅和账号。
2. **协议与端口降维切换（针对 UDP 封锁与高端口拦截）**：
   - 在受限 Wi-Fi 下，放弃使用基于 UDP 的 `Hysteria 2`、`TUIC` 或 `WireGuard` 节点。
   - 优先挑选基于 **TCP 传输层** 的协议，例如 **VLESS-Reality (TCP)**、**Trojan-TLS**、**AnyTLS** 或开启了 `WebSocket (WS) + TLS` / `gRPC + TLS` 的节点。
   - 如果非标高端口（如 `35678`）也被封锁，查看机场订阅中是否提供复用标准 Web 端口（`443`、`8443`、`2053`）的节点；若现有主力机场全部采用高端口中转，可按 [专线与中转线路技术架构指南](/routes/) 选择提供 `443` 端口多协议接入的备用方案。
3. **关闭客户端 IPv6 解析与出站（根治残缺双栈超时）**：
   - 在 [Clash Verge Rev](/clients/clash-verge-rev/)、[FlClash](/clients/flclash/) 或 [OpenClash](/clients/openclash/)（底层均为 [Mihomo](/clients/mihomo/) 核心）中，进入「设置」或全局覆写配置，确保关闭 IPv6：
   ```yaml
   # Mihomo (Clash.Meta) 全局覆写配置：强制禁用 IPv6 解析与出站，防止残缺双栈超时
   ipv6: false
   dns:
     enable: true
     ipv6: false
   ```
   - 在基于 [sing-box](/clients/sing-box/) 的客户端（如 [Hiddify](/clients/hiddify/)、[Karing](/clients/karing/)）中，将 DNS 解析策略（Domain Strategy）从 `prefer_ipv6` 或留空改为 **`ipv4_only`**。
4. **排查 Captive Portal 网页认证与安全软件 HTTPS 扫描**：
   - 关闭代理后，随便打开一个纯 HTTP 网站（如 `http://www.baidu.com` 或 `http://neverssl.com`），确认是否会弹出校园网/酒店的账号登录认证页。
   - 若电脑装有卡巴斯基、ESET、Bitdefender 或企业版杀毒软件，检查其「网络防护 → 加密连接扫描（HTTPS/SSL Scanning）」功能，将代理核心程序（`verge-mihomo.exe`、`mihomo.exe`、`xray.exe`、`sing-box.exe`）加入不扫描加密流量的排除白名单。

### 3. 验证结果与下一步
- **验证标准**：在禁用 IPv6 并切换至 TCP 类协议节点后，通过前文的 `curl -x` 命令能稳定获取 `HTTP 204` 状态码。
- **下一步**：若即使切换到手机 5G 热点也同样全部超时，说明问题不在本地 Wi-Fi，请立即核查客户端内核版本与上游服务状态。

---

## 六、排查五：客户端内核版本过旧与协议字段不兼容

### 1. 现象与可能原因
- **问题现象**：新买了一家采用现代协议的机场，或者老机场刚发布了“全面升级 VLESS-Reality / Hysteria 2 / AnyTLS 节点”的公告，更新订阅后雖然能看到节点名称，但点击测速**瞬间全部显示 `-1ms` 或 `Error`**，耗时甚至为 `0ms`（即根本未发出网络请求就在本地报错返回）。
- **直接答案与证据（基于 `clients.ts` `2026-11-23` 数据库快照）**：
  近年来代理协议完成了大规模迭代。早期统治桌面端的 **Clash for Windows (CFW)**、**原版 Clash Premium** 以及安卓端的 **原版 Clash for Android (CFA)** 均已在 2023 年底归档停更。这些老旧客户端内置的原版 Clash 内核**仅支持 SS、VMess、Trojan 等传统协议**，完全不认识 `vless`、`reality-opts`、`hysteria2`、`tuic`、`anytls`、`ech-opts` 等现代配置字段。
  当你把包含新协议的订阅导入旧客户端，或者在使用了过时 Xray/sing-box 核心的旧版软件中运行新节点时，内核在解析节点握手参数阶段就会直接抛出异常并判定为超时。

### 2. 主流客户端内核与现代协议支持核查表

根据本站 [客户端数据库](/clients/)（`verifiedAt: 2026-11-23`）核验记录，请对照检查你当前使用的软件是否处于活跃维护（`active`）并具备对应内核能力：

| 客户端名称 | 底层内核类型 | 维护状态（2026-11-23） | VLESS-Reality / Hysteria 2 / TUIC 支持度 | 常见因版本过旧引发的超时现象与升级建议 |
| :--- | :--- | :--- | :--- | :--- |
| **[Clash Verge Rev](/clients/clash-verge-rev/)** | Mihomo (Clash.Meta) | **活跃维护 (`active`)** | **原生完整支持**（含 AnyTLS、Sniffer 嗅探） | 需保持在较新 Release 版本；切勿与已停更的旧版 Clash Verge 混淆。 |
| **[FlClash](/clients/flclash/)** | Mihomo (Clash.Meta) | **活跃维护 (`active`)** | **原生完整支持**（跨 Windows/macOS/Android/Linux） | 若导入最新 Hysteria 2 端口跳跃节点超时，请升级至最新 GitHub Release。 |
| **[v2rayN](/clients/v2rayn/)** | 多核心 (Xray / sing-box / Mihomo) | **活跃维护 (`active`)** | **支持**（需注意子核心分派：Xray 跑 VLESS，sing-box/Mihomo 跑 Hysteria 2） | 若下载了不含核心的旧包或 Xray-core 版本低于服务端要求，Reality 节点会全超时；请在菜单「检查更新」同步升级 Xray 与 sing-box 核心。 |
| **[Hiddify](/clients/hiddify/)** / **[Karing](/clients/karing/)** | sing-box | **活跃维护 (`active`)** | **原生完整支持**（自动识别 Clash YAML 与 sing-box JSON） | 适合全平台新手；注意 sing-box 不同大版本间配置语法演进，建议保持客户端更新。 |
| **[Clash Meta for Android](/clients/clash-meta/)** | Mihomo (Clash.Meta) | **活跃维护 (`active`)** | **原生完整支持** | 必须使用 `MetaCubeX/ClashMetaForAndroid` 官方包；若误装原版已停更的 Clash for Android，Reality 与 Hysteria 2 节点会 100% 超时。 |
| **[v2rayNG](/clients/v2rayng/)** | Xray-core | **活跃维护 (`active`)** | **原生支持 Xray 体系（VLESS-Reality / VMess / Trojan）** | 注意 Xray-core 原生不主推 Hysteria 2/TUIC；若机场全线采用 Hysteria 2，安卓端应改用 [FlClash](/clients/flclash/)、[Karing](/clients/karing/) 或 [Hiddify](/clients/hiddify/)。 |
| **[Shadowrocket](/clients/shadowrocket/)** | 私有/独立核心 | **活跃维护 (`active`)** | **原生支持**（持续跟进 Reality、Hysteria 2、AnyTLS） | 若 iOS 端小火箭两三年未在 App Store 更新，新协议节点会全部连接超时；请登录购买时的外区 Apple ID 更新至最新版。 |
| **Clash for Windows / 原版 CFA** | 原版旧 Clash 内核 | **已归档停更 (`archived`)** | **不支持 Reality / Hysteria 2 / AnyTLS** | **高危超时重灾区**：导入现代订阅后要么直接报错，要么节点全部 `-1ms`。请立即卸载并按 [Clash Verge Rev 安装配置指南](/guides/clash-verge-rev-setup/) 迁移。 |

### 3. 主流客户端超时日志关键词对照与精准处置
当节点超时发生时，打开客户端左侧的 **「日志（Logs）」** 面板，并将日志级别临时调整为 `info` 或 `debug`，点击一次测速后观察滚动的报错文本：

| 日志核心报错文本 | 所属内核 | 真实故障根因翻译 | 精准处置动作 |
| :--- | :--- | :--- | :--- |
| `dial tcp x.x.x.x:port: i/o timeout` | Mihomo / sing-box / Xray | 本地发出的 TCP/UDP 握手包在规定时间内未收到入口服务器任何回包 | 1. 关闭代理直连更新一次订阅（可能入口 IP 已换）；<br>2. 检查当前网络是否封禁了该端口或 UDP；<br>3. 用手机 5G 热点确认是否该中转入口宕机。 |
| `dial tcp x.x.x.x:port: connectex: No connection could be made because the target machine actively refused it` (`connection refused`) | 全内核通用 | 数据包已到达入口服务器 IP，但目标端口没有代理程序在监听（收到 TCP RST） | 服务端中转程序重启中或端口已废弃，等待数分钟或刷新订阅获取新端口。 |
| `tls: first record does not look like a TLS handshake` | Mihomo / sing-box | 本机向 TLS 端口发起握手，但对方返回的不是 TLS 协议数据（通常是明文 HTTP 拦截页） | 1. 校园网/酒店 Wi-Fi 未完成网页登录认证；<br>2. 入口域名被本地 DNS 劫持到了反诈/运营商拦截页；<br>3. 杀毒软件强行注入了非标拦截流。 |
| `REALITY: invalid auth` / `failed to read response header: EOF` | Xray / Mihomo | VLESS-Reality 握手鉴权失败，服务端判定你不是合法客户端并转入了伪装目标网站回落 | 1. **第一嫌疑：本地系统时间偏差超过 90 秒**；<br>2. 订阅长期未更新，服务端更换了 Reality `PublicKey` 或 `ShortID`。 |
| `VMessAEAD: invalid user` / `failed to process outbound traffic` | Xray / Mihomo | VMess 认证头部校验失败 | 校准系统 UTC 时间至 30 秒误差内，并核实套餐是否已到期或重置过 UUID。 |
| `dns resolve failed: ... context deadline exceeded` | Mihomo / sing-box | 节点入口域名本身都无法通过当前配置的 DNS 服务器解析出 IP | 检查客户端 `dns.nameserver` 或 `proxy-server-nameserver` 是否填入了在国内无法直连的海外 DNS（如 `8.8.8.8`），需将其改为 `223.5.5.5` 或 `119.29.29.29`。 |

---

## 七、排查六：上游中转入口故障 vs 全站失联的边界判定

### 1. 现象与可能原因
- **问题现象**：你已经严格执行了前五步——系统时间误差在 1 秒以内、套餐还有 150GB 流量且未到期、使用了最新版 [Clash Verge Rev](/clients/clash-verge-rev/)、切换到了手机 5G 流量热点、关闭了代理直连尝试刷新订阅，但**依然所有节点 `-1ms`**，甚至连订阅更新都提示超时。
- **直接答案与行业架构背景**：此时故障已确定位于**机场服务端或上游链路层**。但服务端故障同样分为两个截然不同的等级，切忌一看到超时就立刻断定“跑路”，也不应在真正失联的品牌上盲目等待：
  1. **等级一：国内中转入口单点/批量遭受攻击或域名被墙（最常见，通常 15 分钟–6 小时内恢复）**
     无论是采用 BGP 公网中转还是 IEPL/IPLC 内网专线（参见 [IEPL 专线原理](/routes/iepl/) 与 [IPLC 专线解析](/routes/iplc/)），国内用户的数据包第一步必须先连上位于广东、江苏、浙江或上海的**国内中转入口服务器（Entry Node）**。当同行恶意 DDoS 攻击入口 IP，或入口解析域名被防火墙阻断时，未更新订阅的客户端就会表现为全节点超时。具备多入口冗余的品牌（如 `2026-11-23` 品牌库中标注多线路架构的 [光速云](/brands/guangsuyun/)、[牧光云](/brands/muguang/)、[飞猫云](/brands/feimao/)、[微风云](/brands/weifeng/)、[星岛梦](/brands/xingdaomeng/)）通常会在后端快速切换解析 IP 或通过备用订阅域名下发新入口。
  2. **等级二：上游专线供应商割接、欠费断线或机场主站彻底失联（高风险）**
     部分超低价年付或缺乏技术运维能力的白牌小机场，一旦上游专线机房清退、宿主欠费或负责人失联，会同时出现**节点全挂 + 订阅域名无法解析 + 官网控制台 502/超时 + Telegram 群禁言或解散**。

### 2. 检查步骤与应急恢复方案
1. **检查订阅中是否包含「直连节点」或「官网状态通知节点」**：
   许多正规机场会在节点列表顶部放置名为 `剩余流量：xx GB`、`到期时间：2026-xx-xx` 或 `官网最新地址：xxx.com` 的信息提示节点，或者保留 1–2 个不经过国内中转的海外直连备用节点。观察这些节点名称是否随订阅刷新而变化，或尝试连接备用直连节点。
2. **使用备用订阅域名或应急通知渠道**：
   登录品牌官网（或查阅你在注册时保存的防失联导航页/邮件通知），检查「公告栏（Announcements）」是否有“入口机器维护，请重新更新订阅”的通知。如果主订阅域名被污染，部分面板在「一键导入」下拉菜单中会提供“备用订阅链接 2 / Cloudflare CDN 订阅链接”。
3. **执行标准停服核验并启用双机场热备策略**：
   - 若某品牌连续超过 24–48 小时全节点超时、官网无法访问且无任何维护公告，请立即对照 [机场失联、停服与跑路核验清单](/safety/closures/) 以及 [品牌服务状态追踪中心](/brands/status/) 进行风险定级。
   - **工程师级防断联建议**：对于依赖海外网络进行日常开发、跨境电商或高频使用 [ChatGPT](/ai-streaming/chatgpt/)、[Claude](/ai-streaming/claude/) 的重度用户，切勿将所有网络可用性押注在单一机场的单一中转入口上。建议 adopting **「1 个主力月付专线/中转套餐 + 1 个不同上游的低门槛按量/轻量备用套餐」**（可在 [不限时按量套餐专题](/plans/non-expiring/) 或 [高性价比平价套餐专题](/plans/budget/) 中挑选架构互补的备选），并在 Clash Verge Rev 中事先导入两份订阅，一旦主订阅因上游割接全超时，3 秒内即可切至备用订阅更新主配置。

---

## 八、本专题三级内容集群与延伸阅读

为了帮助你从单一的“节点超时”故障延伸到特定操作系统、特定协议及复杂网络环境的深度调优，我们将本专题划分为三个三级（L3）纵深内容集群。点击已发布指南可直接查阅操作命令，标注为`待发布选题`的深度文档正按站点内容路线图持续上线：

### 集群 1：系统时钟、TLS 握手与协议鉴权排障
聚焦因本地环境引发的加密握手中断与证书报错，解决“网络明明通畅但协议层拒绝连接”的核心痛点：
- **已发布关联指南**：
  - [Windows 系统时间偏移与 TLS 握手报错深度修复指南](/guides/system-time-tls-fix/)（涵盖 Windows 时间服务注册表修复、双系统 UTC 冲突与 NTP 授时源替换）
  - [客户端无法启动、核心被杀软隔离与端口冲突处理](/troubleshooting/startup/)
  - [Mihomo (Clash.Meta) 核心架构与新协议支持详解](/clients/mihomo/)
- **规划中三级选题（待发布选题）**：
  - 《VLESS-Reality 握手失败全解：ShortID 错配、PublicKey 失效与 SpiderX 回落诊断》（`待发布选题`）
  - 《企业内网深信服/EDR 根证书注入导致代理 TLS 握手中断的绕过与白名单方案》（`待发布选题`）

### 集群 2：受限网络环境（校园网 / 政企网 / 移动宽带）突围
聚焦特定局域网与运营商环境下端口封锁、UDP QoS 限流与 IPv6 双栈故障的针对性绕过策略：
- **已发布关联指南**：
  - [节点延迟、丢包率与抖动（Jitter）科学测量方法](/routes/latency/)
  - [DNS 解析失败、Fake-IP 残留与 IPv6 泄漏检测指南](/troubleshooting/dns/)
  - [Hysteria 2 / sing-box 跨平台客户端配置教程](/clients/sing-box/)
- **规划中三级选题（待发布选题）**：
  - 《高校校园网与企业 Wi-Fi 封禁 UDP 下 Hysteria 2 / TUIC 全部超时的 TCP 443 降级方案》（`待发布选题`）
  - 《家庭双栈宽带 IPv6 路由劣化导致代理节点间歇性 -1ms 的诊断与关闭步骤》（`待发布选题`）

### 集群 3：上游链路故障隔离与高可用冗余架构
聚焦如何区分本地故障与机场服务端故障，以及如何通过客户端策略组构建永不断联的多源备份体系：
- **已发布关联指南**：
  - [订阅更新失败、200+0 字节与代理死循环排障](/troubleshooting/subscription/)
  - [机场停服、域名被墙与跑路风险核验手册](/safety/closures/)
  - [备用机场与应急替代方案配置策略](/safety/alternatives/)
  - [31 家机场品牌实测档案与多入口架构检索中心](/brands/directory/)
- **规划中三级选题（待发布选题）**：
  - 《利用 Mihomo 策略组 `fallback` 与 `url-test` 打造跨机场双订阅自动故障转移》（`待发布选题`）
  - 《为什么 TCPing 30ms 但 URLTest -1ms：三段式中转架构下入口存活与落地断联的抓包实证》（`待发布选题`）

---

## 常见问题（FAQ）

### 1. 为什么 TCPing 显示 50ms，但真连接测试（URLTest）全是 -1ms 或 timeout？
TCPing 仅测量本机到国内中转入口服务器的 TCP 三次握手（SYN/SYN-ACK）耗时，不验证协议密钥、系统时钟、TLS 证书与海外落地出口；而 URLTest 真连接必须走完代理协议加密握手并通过远端节点请求 `generate_204` 测试地址。只要本机时间偏差超标、套餐流量耗尽、订阅密钥失效或中转到海外落地断联，就会出现 TCPing 正常但真连接全报 `-1ms` 的现象。

### 2. 为什么所有节点突然在一夜之间全部无法使用，更新订阅也没反应？
所有节点瞬间同时失效，90% 以上源于四类全局性触发条件：一是本机系统时间漂移超过 90 秒导致 TLS 1.3、VMess 或 VLESS-Reality 鉴权集体拒绝；二是套餐当月流量耗尽或账单到期被后端统一阻断；三是所处网络（如校园网、酒店或企业 Wi-Fi）启用了 UDP 封锁或非标端口白名单；四是机场中转入口域名批量变更，而客户端开着失效旧代理去更新订阅陷入死循环。

### 3. 切换到 Hysteria 2 或 TUIC 节点后全部显示超时，但 VLESS 或 Trojan 节点还能连是什么原因？
Hysteria 2 与 TUIC 底层基于 QUIC（UDP）传输协议，而校园网、政企办公网以及部分移动宽带在晚高峰会对高频 UDP 流量执行严厉的 QoS 丢包甚至直接封禁非 53/123 端口的 UDP 数据包。遇到此类情况应优先切换至基于 TCP 443 端口的 VLESS-Reality、Trojan 或 AnyTLS 节点。

### 4. 系统时间只差了不到 2 分钟，真的会导致所有节点全部超时吗？
会。VMess 协议规范硬性要求客户端与服务端 UTC 时间戳误差不得超过 90 秒；VLESS-Reality 的握手防重放校验与 TLS 证书有效期核验同样高度依赖精确时钟。双系统切换（Windows 与 Linux 硬件时钟 UTC/Local 冲突）、主板 CMOS 电池亏电或虚拟机休眠恢复后，哪怕偏移 100 秒也会引发全节点 `timeout`。

### 5. 为什么软件界面里测速全是红色超时，但浏览器其实还能正常打开海外网页？
这是因为客户端内置的测速 URL（如 `gstatic.com/generate_204` 或 `cp.cloudflare.com`）在特定节点或本地 DNS 规则下被拦截、限流或超时时间（Timeout）设得过短，导致测速探测包失败，但实际网页走的分流隧道并未中断。建议将客户端测速 URL 更换为高可用端点并用 `curl` 命令验证真实 HTTP 状态码。

### 6. 开启 IPv6 后部分节点偶尔超时、偶尔能连是怎么回事？
当本地路由器分配了残缺的 IPv6 地址（如仅有内网前缀或运营商 IPv6 国际出口断流），而节点入口域名同时配置了 AAAA（IPv6）和 A（IPv4）解析记录时，客户端若优先发起 IPv6 连接就会经历数秒的握手等待直至超时失败。在客户端设置中关闭 IPv6 支持或将出站解析策略设为 `ipv4_only` 即可根治。

### 7. 如何快速区分是自己电脑/网络环境的问题，还是机场服务商上游崩了？
最直接的交叉验证法是「手机断开 Wi-Fi 切 5G 移动数据 + 关闭时间自动同步后再重开 + 关闭代理直连刷新一次订阅」。如果手机 5G 蜂窝网络下最新订阅依然全节点 `-1ms`，且官网面板无法登录或公告区提示中转维护，才属于服务端上游故障；若手机 5G 秒连而电脑 Wi-Fi 全超时，则 100% 是本地网卡、时钟、防火墙或路由器环境问题。
