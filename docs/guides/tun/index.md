---
title: "TUN 模式深度配置：虚拟网卡原理、Fake-IP 与 Redir-Host 对比"
description: "代理客户端 TUN 模式权威指南：解析系统代理与 TUN 虚拟网卡底层差异、Service Mode 与权限授予、Fake-IP vs Redir-Host 选型、DNS 劫持与 WSL2/Docker 路由冲突处理。"
lastUpdated: 2026-11-23
schemaType: TechArticle
faq:
  - q: "开启 TUN 模式以后，还需要同时开“系统代理（System Proxy）”吗？"
    a: "绝大多数情况下不需要同时开启，只开 TUN 即可。因为 TUN 在操作系统三层网络栈接管几乎所有流量（含浏览器），如果同时开启系统代理，相当于让浏览器先走一次本地 HTTP 端口、其他软件走虚拟网卡，极易在排查代理链路时产生混淆。特殊情况下（如需要针对局部软件按端口分流）才单独配合使用。"
  - q: "TUN 模式下的 stack（system、gvisor、mixed）该选哪一个？"
    a: "在 Windows 与 macOS 上优先选 `system` 或 `mixed`（TCP 用 system 性能最高，UDP 用 gvisor 兼容性好，mixed 为官方近年默认推荐）；在部分内核受限的容器或特殊 Linux 发行版上如果 `system` 报错，可回退到纯用户态协议栈 `gvisor`。"
  - q: "为什么开了 TUN 后游戏加速器、企业 VPN 或 WSL2 突然无法联网？"
    a: "因为 TUN 开启 `auto-route: true` 会向系统注入最高优先级的默认路由表并劫持 53 端口 DNS，同时存在两个虚拟网卡（如加速器 TAP 网卡或企业 VPN）必然产生路由打架。游戏加速时请暂时关闭代理客户端 TUN，WSL2/Docker 冲突需在配置中添加 `route-exclude-address`。"
  - q: "Windows 下打开 Clash Verge Rev 的 TUN 模式提示权限不足或开关立刻弹回怎么办？"
    a: "这通常是因为未安装或未启动 Service Mode（系统服务模式），且客户端未以管理员权限运行。先在软件设置里安装并激活 Service Mode 服务，再重启核心即可建立 Wintun 虚拟网卡。"
  - q: "使用 Fake-IP 模式后，为什么公司内网 OA、NAS 或路由器后台突然打不开了？"
    a: "Fake-IP 会把所有未放进跳过列表的域名请求立刻返回 198.18.x.x 虚构地址。如果内网域名（如 .local、.lan 或公司内部域名）没有加入 fake-ip-filter，客户端无法把内网虚拟 IP 还原给本地路由。将其加入 fake-ip-filter 与直连规则即可恢复。"
  - q: "TUN 模式下是否需要把客户端的“严格路由（strict-route）”一直打开？"
    a: "在纯个人单机桌面环境下，开启 strict-route 可以有效封堵 Windows 系统多网卡下的旁路 DNS 与 IPv6 泄漏；但如果本机需要连接企业内网 VPN、局域网打印机或运行复杂桥接虚拟机，strict-route 可能导致局域网通信被阻断，此时可关闭它并改用精确的 route-exclude-address。"
  - q: "为什么手机端（Android / iOS）打开代理就是虚拟网卡模式，而电脑端还要手动去开 TUN？"
    a: "移动操作系统默认没有对普通应用开放全局系统代理变量接口，任何第三方代理客户端都必须调用系统提供的 VPN 接口（如 Android VpnService 或 iOS NEPacketTunnelProvider）生成虚拟网卡；而桌面操作系统历史上沿用浏览器系统代理端口，所以需要额外提权开启 TUN 才能接管非浏览器流量。"
---

# TUN 模式深度配置：虚拟网卡原理、Fake-IP 与 Redir-Host 对比

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p><strong>TUN 模式</strong>通过在操作系统底层创建一个虚拟网络适配器，在网络层（OSI 第三层）直接接管所有不遵循“系统代理”环境变量的应用程序流量（如终端命令行 <code>git/curl/npm</code>、Docker、Python、桌面端与 UDP 游戏）。要稳定运行 TUN，必须同时满足三个条件：<strong>授予管理员或系统服务模式权限、启用内核 DNS 劫持（<code>dns-hijack</code>）、并对局域网及 WSL2 网段做好路由排除</strong>。</p>
</div>

许多用户第一次在电脑上安装 [Clash Verge Rev](/clients/clash-verge-rev/)、[v2rayN](/clients/v2rayn/) 或 [FlClash](/clients/flclash/) 后，会遇到一个极其典型的疑惑：“明明浏览器已经能打开 Google 和 YouTube 了，为什么我在终端里运行 `git clone`、`pip install` 或 `docker pull` 时依然报超时？或者某款桌面客户端一直连不上服务器？”答案几乎百分之九十指向同一个原因——你只开启了“系统代理（System Proxy）”，而没有启用 **TUN 虚拟网卡模式**。本专题从操作系统网络栈底层机理讲起，系统拆解 TUN 模式与系统代理的区别、Fake-IP 与 Redir-Host 的取舍、各系统提权流程，以及与 WSL2、Docker 和游戏加速器冲突的规范化解方案。

---

## 一、系统代理 vs TUN 模式：为什么只开系统代理不够用？

要理解为什么需要 TUN 模式，必须先看清桌面操作系统的两种流量引导机制处于完全不同的网络层级：

| 对比维度 | 系统代理（System Proxy） | TUN 虚拟网卡模式（TUN Interface） |
| :--- | :--- | :--- |
| **工作网络层级** | 应用层（L7）：在操作系统注册表或网络设置里写入 `127.0.0.1:7897` HTTP/SOCKS 端口 | 网络层（L3）：向系统网卡驱动注册一张名为 `Meta`、`utun` 或 `singbox_tun` 的虚拟网卡 |
| **实际接管范围** | 仅限**主动读取系统代理环境变量**的程序（如 Chrome、Edge、Safari 等主流浏览器） | **全机几乎全部 IP 数据包**（含命令行工具、游戏客户端、IDE、后台更新器及不守代理规则的桌面端） |
| **UDP 协议转发能力** | 极弱（标准 HTTP 代理协议不支持原生 UDP 数据报转发） | **完整支持原生 UDP**（前提是节点与核心配置均开启 `udp: true`） |
| **DNS 解析行为** | 浏览器通常直接把域名交给代理端口远程解析，本地命令行仍走系统默认 DNS | 必须配合 `dns-hijack` 强制截获所有发往 53 端口的 UDP/TCP DNS 查询并交由核心分流 |
| **所需系统权限** | 普通用户权限即可开关，不修改系统路由表 | **需要系统提权**（Windows 服务模式或管理员权限、macOS 授权、Linux `CAP_NET_ADMIN`） |
| **与 VPN/WSL2 冲突概率** | 极低，主要只需防本地端口被其他程序占用 | 较高，修改默认路由表后易与企业内网 VPN、游戏加速器及虚拟交换机网段冲突 |

**实用选型边界**：如果你日常在电脑上仅仅是用浏览器查资料、看视频，而且对本地终端命令行没有任何跨境拉取依赖，那么只开“系统代理”是最轻巧且故障率最低的做法；一旦你涉及软件开发命令行、跨区桌面客户端登录、或者希望彻底杜绝部分软件绕过系统代理产生真实 IP/DNS 泄漏，就应当关闭系统代理、改由 **TUN 模式** 单一接管全机流量。

---

## 二、三大底层协议栈（`stack: system / gvisor / mixed`）怎么选？

当虚拟网卡收到操作系统发过来的原始 IP 数据包后，代理核心（如 [Mihomo 核心](/clients/mihomo/) 或 [sing-box 核心](/clients/sing-box/)）必须把这些三层 IP 数据包重新组装还原成 TCP 连接与 UDP 会话，再按规则送入代理隧道。这个“还原组装引擎”在配置文件中对应 `tun.stack` 字段，目前主要有三种实现方式：

| 协议栈模式 (`stack`) | 技术实现机制 | 吞吐性能与 CPU 开销 | 兼容与排障建议 |
| :--- | :--- | :--- | :--- |
| **`system`** | 直接借助操作系统原生内核网络栈完成 TCP/UDP 报文重装 | **极高吞吐、CPU 占用最低**，适合千兆宽带与大文件传输 | 在极少数精简版 Linux 容器或老旧 Windows 驱动上可能出现兼容性异常或权限失败 |
| **`gvisor`** | 完全在用户态运行 Google 开源的 `gvisor` 轻量级 TCP/IP 协议栈，不依赖宿主内核转发 | 吞吐上限略低于 `system`，高并发下载时 CPU 占用稍高 | **兼容性最强**：当系统防火墙、杀软驱动拦截或受限容器导致 `system` 断流时，切回 `gvisor` 往往立竿见影 |
| **`mixed`（默认首选）** | TCP 流量走高性能 `system` 内核栈，UDP 流量走高兼容性的 `gvisor` 用户态栈 | **兼顾高带宽吞吐与复杂 UDP 游戏/语音兼容性** | 当前 Mihomo 与 Clash Verge Rev 官方推荐的现代桌面默认选项 |

---

## 三、Fake-IP vs Redir-Host：DNS 增强模式深度对比

开启 TUN 模式时，应用程序在发包前都会先发起一次 DNS 查询（比如查询 `www.google.com` 对应的 IP）。如果让国内运营商 DNS 直接响应，结果往往已经被污染；因此代理核心必须接管 DNS，在 **Fake-IP** 与 **Redir-Host** 两种模式之间做出选择：

### 1. Fake-IP 模式（现代桌面与软路由日常首选）
- **核心原理**：当客户端拦截到一条域名查询请求时，核心并不急着向远端等待真实 IP，而是先在本地内存建立一张“假 IP ↔ 真实域名”对照表，瞬间从保留地址段（默认 `198.18.0.1/16`）抽一个虚构 IP 返还给浏览器或应用程序。紧接着应用程序往这个 `198.18.x.x` 地址发包时，TUN 网卡收到包后反查出原始域名，再根据域名分流规则决定是本地直连还是通过海外节点远程解析。
- **显著优势**：彻底省去一次海外加密 DNS 往返等待，打开陌生海外网页的首包体感速度明显更快；由于核心全程掌控原始域名，域名类分流规则命中率几乎百分之百，彻底免疫本地 DNS 污染。
- **使用注意点与避坑**：某些特殊软件（例如部分银行网银控件、局域网设备 `.local` 域名、以及 Windows 系统自带的联网状态检测域名 `msftconnecttest.com`）如果拿到了 `198.18.x.x` 假 IP 会报异常或显示“无 Internet 连接小地球图标”。因此**必须维护好 `fake-ip-filter` 跳过列表**，且异常强制断电后若系统还残留假 IP 缓存，需要按 [DNS 错误与泄漏检测](/troubleshooting/dns/) 中的命令刷新本地 DNS 缓存。

### 2. Redir-Host 模式（适合内网开发、特定 P2P 与抓包调试）
- **核心原理**：当核心截获 DNS 请求后，真正向配置好的国内/海外加密 DNS（DoH / DoT）发起查询，等待拿到真实的公网 IP 后再返还给应用，同时在内存中记录“真实 IP ↔ 域名”映射以便分流规则匹配。
- **显著优势**：本机使用 `ping`、`nslookup` 或抓包工具查看时，看到的全部是真实可达的远程 IP；不会在系统缓存里遗留虚构网段，对强依赖真实 IP 校验的企业内网 VPN 客户端或特定游戏反作弊程序兼容性更好。
- **主要局限**：初次访问未经缓存的新域名时，多出一次加密 DNS 解析耗时；若多个不同域名恰好共享同一个 CDN IP（如 Cloudflare 大量站点共用同一组 IP），在纯 IP 匹配时偶尔会依赖 `sniffer` 域名嗅探才能精确区分分流目标。

---

## 四、各平台启用 TUN 模式的提权与授权规范

不同操作系统对“创建虚拟网卡并修改全局默认路由”的权限管控截然不同，权限没给到位是 TUN 开关自动弹回或无网络的最常见原因：

1. **Windows 10 / 11（推荐使用 Service Mode 服务模式）**：
   - 在 [Clash Verge Rev](/clients/clash-verge-rev/) 中，切勿长期靠每次右键“以管理员身份运行”来凑合，那样在开机自启时会因 UAC 弹窗被系统拦截。正确流程是在软件 **设置 → Clash 设置 → 服务模式（Service Mode）** 右侧点击安装并激活系统服务；安装成功后，哪怕以普通用户权限启动 GUI，后台高权限服务也能顺利拉起 Wintun 虚拟网卡。
2. **macOS（授权辅助工具与系统网络扩展）**：
   - 桌面端开启 TUN 后，系统会弹出一次管理员密码授权框，用于授予内核修改 `utun` 接口路由与监听权限。如果使用从 App Store 安装的沙盒化客户端（如 Shadowrocket 或 Stash for Mac），则走系统原生 Network Extension 框架，在“系统设置 → 网络 → 代理与 VPN”中允许配置加入即可。
3. **Linux 桌面与无头服务器（`CAP_NET_ADMIN` 能力赋权）**：
   - 在 Linux 下避免直接用 `root` 跑整个图形界面，正确做法是安装服务模式或对核心二进制文件授予最小网络管理能力：
     ```bash
     sudo setcap cap_net_admin,cap_net_bind_service=+ep /usr/bin/mihomo
     ```
   - 若启动仍提示 `/dev/net/tun` 不存在，检查内核模块 `lsmod | grep tun` 并确保已开启 `modprobe tun`。

---

## 五、生产级 Mihomo TUN 配置模板（含常见排雷参数）

以下配置可直接放入 Clash Verge Rev 的“全局扩展配置（Merge）”或原生 Mihomo `config.yaml` 中，已预置 `dns-hijack` 与内网、WSL2、Docker 常用私有网段排除：

```yaml
tun:
  enable: true
  stack: mixed                # 兼顾 TCP 吞吐与 UDP 兼容性；异常时改 gvisor
  dns-hijack:
    - "any:53"                # 强制接管发往任何地址的 53 端口 DNS 查询
    - "tcp://any:53"
  auto-route: true            # 自动添加系统默认路由接管全局流量
  auto-detect-interface: true # 自动绑定物理出口网卡防止流量回环
  strict-route: true          # 严格路由隔离，封堵 Windows 多网卡旁路泄漏
  # 关键避坑：排除常见局域网、Docker 默认网桥与 WSL2 虚拟网段
  route-exclude-address:
    - 192.168.0.0/16
    - 10.0.0.0/8
    - 172.16.0.0/12
    - 100.64.0.0/10
```

> **多虚拟网卡排雷提醒**：即使配置了 `route-exclude-address`，如果你在同一台电脑上同时开启了**游戏加速器、公司 SSL VPN 或第二个代理客户端的 TUN**，两套程序仍会互相争夺 `0.0.0.0/1` 与 `128.0.0.0/1` 默认路由表导致全机断网。任何时候只能保留一个 TUN 适配器处于活动状态。

---

## 六、四步命令行验证 TUN 是否真正生效且无泄漏

完成配置并打开 TUN 开关后，切忌凭感觉判断，按以下四条命令依次验证虚拟网卡、路由表与出口 IP：

```powershell
# 1. Windows PowerShell：确认虚拟网卡已建立且处于 Up 状态
Get-NetAdapter | Where-Object {$_.InterfaceDescription -match "Meta|sing-box|Wintun"}

# 2. Windows PowerShell：确认无残留终端代理环境变量（输出应为空）
echo $env:HTTP_PROXY $env:HTTPS_PROXY
```

```bash
# 3. macOS / Linux：检查 utun 或 tun 接口是否存在
ip addr show 2>/dev/null || ifconfig | grep -A 3 "utun"

# 4. 全平台通用：不加 --proxy 参数直接请求海外 IP 接口，验证终端流量已进 TUN 隧道
curl -s https://api.ip.sb/geoip
```

**预期结果**：第 1/3 步可看到活跃的虚拟网卡设备，第 4 步直接返回你当前所选海外节点的 IP 与地区归属，且测试国内网站 `curl -I https://www.baidu.com` 依然保持极低延迟直连响应。若发现 **WSL2 或 Docker 容器在开启 TUN 后断网**，请立即转向专项实战指南 [Clash TUN 网卡与 WSL2/Docker 冲突](/troubleshooting/tun-wsl-docker-conflict/) 或 [TUN 与系统代理冲突总排查](/troubleshooting/tun/)。

---

## 七、分场景最佳实践：个人开发机、游戏主机与公司办公网的 TUN 策略

在实际工作中，并不是所有设备、所有时段都应该无脑全天开启 `strict-route` 与全局 TUN 接管。根据你的真实使用环境，按以下四种场景调整 TUN 开关与排除列表，能把断网和软件打架的概率降到最低：

1. **个人编程开发机（运行终端命令行、Docker Desktop、WSL2 或虚拟机）**：
   - 在 Windows 上务必启用 **Service Mode** 并开启 `tun.enable: true` 与 `stack: mixed`，确保 `git`、`npm`、`pip`、`cargo`、`go get` 与各类 AI 代码助手扩展不再受“环境变量忘记设置”折磨。
   - 同时必须在 `route-exclude-address` 中排除 `192.168.0.0/16`、`10.0.0.0/8` 与 `172.16.0.0/12`，并在 WSL2 宿主机 `.wslconfig` 中优先配置 `networkingMode=mirrored`；如果运行 VMware / VirtualBox 桥接虚拟机，注意观察虚拟交换机网段是否落入被劫持区间。
2. **PC 竞技游戏与语音联机环境（Steam / Valorant / Apex / 主机联机）**：
   - 如果你本机安装了专职商业游戏加速器，在启动游戏前**务必先关闭代理客户端的 TUN 开关**，否则双虚拟网卡互相改写默认路由表会直接导致游戏掉线或语音连接中断。
   - 若打算直接用代理客户端节点玩轻量外服联机，则除了确保节点本身支持完整 UDP 转发之外，还需要把本地反作弊驱动与国内平台登录服务器加入进程或域名直连规则，并将 `tun.stack` 保持在 `mixed` 或 `gvisor` 以提升长连接 UDP 会话稳定性，详见 [游戏加速器原理分析](/vpn/gaming/)。
3. **企业办公内网与零信任客户端共存环境（SSL VPN / 飞书内网 / OA）**：
   - 许多公司笔记本预装了企业级零信任 VPN 或内网安全接入软件，它们本身也会在系统里创建一套虚拟网卡并下发公司私有 DNS（例如 `*.corp.internal`）。
   - 如果公司环境要求必须保持企业 VPN 在线，此时**强烈建议关闭代理客户端的 TUN 模式，退回只开“系统代理（System Proxy）”配合浏览器分流**；只有在企业 VPN 完全断开时才按需拉起 TUN，同时在 `fake-ip-filter` 中把所有公司内部域后缀全部加入排除列表。
4. **千兆及以上高带宽纯浏览器与流媒体观影环境**：
   - 当本机仅用来刷网页、看 4K YouTube 或 Netflix 时，其实并不一定需要牺牲一点点协议栈开销去跑全局 TUN；但如果你担心某些桌面端浏览器扩展或后台播放器偷偷走直连引发 Google “送中”，在单机环境下开启 `stack: system`（如果稳定不报错）或 `mixed` 的 TUN 模式配合关闭 IPv6 泄漏，能确保整个设备出口保持彻底统一。同时别忘了每隔一段时间用连接面板核查一下本地高流量下载软件（如国内网盘、Steam 游戏下载更新）是否已经通过 `PROCESS-NAME` 准确命中 `DIRECT`，防止昂贵的国际节点或限额流量包被国内大型下载任务瞬间掏空。

**总结判断原则**：开启 TUN 前先确认系统权限（Windows 服务模式、macOS 辅助工具密码授权、Linux 网络能力赋权），并把公司内网地址、本地网桥与常用高带宽国内下载进程排除出代理范围。如果需要在同一台电脑上同时使用 WSL2 开发或运行大型网游加速器，务必提前规划好排除网段或按时段手动切换开关，才能在日常高可用与零断网冲突之间保持平衡。

---

## 八、TUN 异常退出后导致断网的应急恢复速查

很多新手遇到过一种极其慌张的局面：晚上用完 TUN 模式直接把电脑强制关机或者客户端意外崩溃，第二天开机没开代理客户端时，突然发现全机浏览器打不开任何国内网站，甚至微信都显示无法连接。这绝大多数不是硬件损坏，而是因为客户端崩溃前没来得及清理残留的虚拟网卡路由或系统 Fake-IP DNS 缓存。恢复步骤非常简单：

- **步骤一**：先在操作系统网络适配器界面确认是否还有残余的 `Meta` 或 `singbox_tun` 网卡未销毁；如果有，重新正常打开一次代理客户端，开启 TUN 再手动点击关闭一次，最后从托盘右键点击“退出（Quit）”，让客户端走完正常的清理退出钩子函数。
- **步骤二**：在 Windows 管理员终端执行 `ipconfig /flushdns` 清空系统 DNS 缓存中残留的 `198.18.x.x` 假地址；在 macOS 执行 `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`。
- **步骤三**：检查系统网络设置中的 IPv4 DNS 是否被锁死成了 `127.0.0.1` 或异常地址；若是，将其改回“自动获取（DHCP）”或临时改为国内公共 DNS（如 `223.5.5.5`）即可瞬间恢复全网连通。
- **步骤四**：检查 Windows 防火墙或杀软记录，有时系统大版本升级后会重设第三方虚拟网卡的网络分类（把原本的专用网络变成了未识别的公用网络），导致宿主机阻止软件出站；遇到时在 Windows 网络状态里确认虚拟网卡被正常放行，或者在客户端中点击“重装 Service Mode 服务”即可让驱动重新注入标准路由。
- **步骤五**：在企业内网或高校校园网环境下解除异常时，如果发现重置了网卡依然打不开本地登录认证门户页面，先用浏览器直接访问网关默认数字地址（如 `10.x.x.x` 或 `172.16.x.x`），不要只输入门户域名，确认校园网认证放行后再决定是否继续调试或调整客户端 `fake-ip-filter` 跳过名单，做到基础连通恢复与后续代理调优互不干扰。最后务必核查一次本地系统时间同步误差是否在三十秒以内，防止因为系统时钟偏差引发节点握手失败而被误判成虚拟网卡工作异常。只有当物理网卡直连、虚拟网卡路由表、系统本地解析与节点握手四层全部恢复绿色状态时，才意味着这轮虚拟网卡异常已经彻底排除。此外，每次调整完排除网段与权限设置后，建议顺手在客户端里测试一次本地局域网共享打印机或路由器后台页面是否仍可直接秒开，防止因路由劫持范围过宽影响到家庭日常内网办公设备。

---

## 本专题三级内容集群与延伸阅读

### 集群 A：虚拟网卡配置与路由避坑集群
- 已发布核心文章：[Clash TUN 网卡与 WSL2/Docker 冲突](/troubleshooting/tun-wsl-docker-conflict/) · [TUN 与系统代理冲突总排查](/troubleshooting/tun/) · [Clash Verge Rev 从零安装到 TUN 接管](/guides/clash-verge-rev-setup/)
- *待发布选题*：`Windows 启用 TUN 后系统网络图标显示“无 Internet 访问”的 NCSI 恢复方案`
- *待发布选题*：`macOS 升级后 Clash Verge Rev 辅助服务权限失效与重装排查`

### 集群 B：Fake-IP / Redir-Host 与 DNS 协同集群
- 已发布相关专题：[DNS 错误与泄漏检测](/troubleshooting/dns/) · [Clash YAML 配置详解](/guides/clash-config/) · [分流规则与策略组](/guides/routing/)
- *待发布选题*：`企业内网 OA 与 NAS 在 Fake-IP 模式下被劫持的 fake-ip-filter 完整规则集`

### 集群 C：全端接管与多工具并发边界集群
- 已发布相关专题：[VPN、机场与加速器对比](/vpn/compare/) · [游戏加速器原理分析](/vpn/gaming/) · [v2rayN 多核心教程](/clients/v2rayn/)
- *待发布选题*：`如何在开启游戏加速器时用进程白名单安全停用代理客户端 TUN`

---

## 常见问题（FAQ）

### 开启 TUN 模式以后，还需要同时开“系统代理（System Proxy）”吗？

绝大多数情况下不需要同时开启，只开 TUN 即可。因为 TUN 在操作系统三层网络栈接管几乎所有流量（含浏览器），如果同时开启系统代理，相当于让浏览器先走一次本地 HTTP 端口、其他软件走虚拟网卡，极易在排查代理链路时产生混淆。特殊情况下（如需要针对局部软件按端口分流）才单独配合使用。

### TUN 模式下的 stack（system、gvisor、mixed）该选哪一个？

在 Windows 与 macOS 上优先选 `system` 或 `mixed`（TCP 用 system 性能最高，UDP 用 gvisor 兼容性好，mixed 为官方近年默认推荐）；在部分内核受限的容器或特殊 Linux 发行版上如果 `system` 报错，可回退到纯用户态协议栈 `gvisor`。

### 为什么开了 TUN 后游戏加速器、企业 VPN 或 WSL2 突然无法联网？

因为 TUN 开启 `auto-route: true` 会向系统注入最高优先级的默认路由表并劫持 53 端口 DNS，同时存在两个虚拟网卡（如加速器 TAP 网卡或企业 VPN）必然产生路由打架。游戏加速时请暂时关闭代理客户端 TUN，WSL2/Docker 冲突需在配置中添加 `route-exclude-address`。

### Windows 下打开 Clash Verge Rev 的 TUN 模式提示权限不足或开关立刻弹回怎么办？

这通常是因为未安装或未启动 Service Mode（系统服务模式），且客户端未以管理员权限运行。先在软件设置里安装并激活 Service Mode 服务，再重启核心即可建立 Wintun 虚拟网卡。

### 使用 Fake-IP 模式后，为什么公司内网 OA、NAS 或路由器后台突然打不开了？

Fake-IP 会把所有未放进跳过列表的域名请求立刻返回 198.18.x.x 虚构地址。如果内网域名（如 .local、.lan 或公司内部域名）没有加入 fake-ip-filter，客户端无法把内网虚拟 IP 还原给本地路由。将其加入 fake-ip-filter 与直连规则即可恢复。

### TUN 模式下是否需要把客户端的“严格路由（strict-route）”一直打开？

在纯个人单机桌面环境下，开启 strict-route 可以有效封堵 Windows 系统多网卡下的旁路 DNS 与 IPv6 泄漏；但如果本机需要连接企业内网 VPN、局域网打印机或运行复杂桥接虚拟机，strict-route 可能导致局域网通信被阻断，此时可关闭它并改用精确的 route-exclude-address。

### 为什么手机端（Android / iOS）打开代理就是虚拟网卡模式，而电脑端还要手动去开 TUN？

移动操作系统默认没有对普通应用开放全局系统代理变量接口，任何第三方代理客户端都必须调用系统提供的 VPN 接口（如 Android VpnService 或 iOS NEPacketTunnelProvider）生成虚拟网卡；而桌面操作系统历史上沿用浏览器系统代理端口，所以需要额外提权开启 TUN 才能接管非浏览器流量。
