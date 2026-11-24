---
title: Windows TUN 模式与 WSL2、Docker Desktop 网络冲突完全排查指南
description: 针对 Windows 开发环境的 TUN 虚拟网卡深度排障指南：解析 Wintun 与 Hyper-V vEthernet 路由表抢占、Mihomo tun.route-exclude-address 排除私有网段、WSL2 networkingMode=mirrored 与 NAT 10.255.255.254 DNS 劫持冲突，以及 Docker Desktop 代理与 curl 实测验证方案。
lastUpdated: 2026-11-24
author: 代理客户端编辑部
category: 故障排查
tags: [TUN模式, WSL2, Docker Desktop, Hyper-V, route-exclude-address, Mirrored网络]
pillar: troubleshooting
parentTopic: /troubleshooting/tun/
primaryKeyword: Clash TUN 模式与 WSL2 Docker 冲突
searchIntent: Troubleshooting
schemaType: TechArticle
relatedSlugs: ["/guides/tun/", "/troubleshooting/tun/", "/guides/clash-verge-rev-setup/", "/troubleshooting/connected-no-internet-fix/"]
relatedBrands: []
faq:
  - q: 为什么一打开代理客户端的 TUN 模式，宿主机上网正常，但 WSL2 里 apt update 或 curl 就彻底卡死？
    a: 传统 NAT 模式下的 WSL2 通过 Hyper-V 虚拟交换机经宿主机转发流量，其数据包源地址位于 172.16.0.0/12 私有网段。宿主机开启 TUN 的 auto-route 后，会在主路由表写入高优先级的半覆盖默认路由，导致宿主机返回给 WSL2 的响应包被 Wintun 虚拟网卡截走并丢弃，形成回程路由黑洞；同时 Fake-IP 返回的 198.18.0.0/16 地址在 NAT 边界也可能无法路由。
  - q: Windows 11 下解决 TUN 与 WSL2 冲突最彻底的方案是什么？
    a: Windows 11 22H2 及以上版本且 WSL 2.0 及以上用户，推荐在用户主目录的 .wslconfig 中启用 networkingMode=mirrored 镜像网络模式，并配合 dnsTunneling=true、firewall=true 与 autoProxy=true，让 WSL2 直接共享宿主机的物理与 TUN 虚拟网卡协议栈，彻底消除双层 NAT 断层。
  - q: 为什么我在 WSL2 里看到 DNS 指向 10.255.255.254，开启 TUN 后却还是解析失败或卡住？
    a: 10.255.255.254 是 WSL2 开启 DNS Tunneling 后在虚拟环境内监听的本地代理 DNS 地址。若客户端 TUN 规则中配置了激进的 dns-hijack（如无条件劫持所有网卡 53 端口且未对私有网段和 WSL2 虚拟网卡做隔离），或者宿主机 Hyper-V 防火墙拦截了来自虚拟子网的入站包，就会导致 DNS 隧道请求在跨栈转发时丢失或陷入回环。
  - q: 配置了 route-exclude-address 后，为什么 Docker 容器内访问 host.docker.internal 依然失败？
    a: route-exclude-address 只负责解决三层 IP 路由不被 TUN 网卡劫持，但域名解析层面如果仍被代理内核的 Fake-IP 接管，容器请求 host.docker.internal 时依然会拿到 198.18.x.x 的假地址。必须在客户端 dns.fake-ip-filter 中显式加入 host.docker.internal、*.docker.internal 与本地域名后缀，确保返回宿主机真实内网 IP。
  - q: Docker Desktop 到底是应该配 Proxies 显式代理，还是直接依赖宿主机 TUN 模式？
    a: 如果你的主要诉求是加快宿主机执行 docker pull 拉取镜像或 docker build 下载依赖，最稳妥的做法是在 Docker Desktop 的 Settings → Resources → Proxies 中填写宿主机混合代理地址（配合客户端允许局域网连接），而无需依赖宿主机 TUN 强行劫持容器桥接网段。只有当运行中的容器内部程序也需要透明代理且不方便改环境变量时，才需要让容器流量经过已做好网段排除的 TUN 模式。
  - q: 在 Windows 10 或无法升级 Mirrored 模式的环境下，route-exclude-address 写入整个 10.0.0.0/8 会不会有副作用？
    a: 排除 10.0.0.0/8、172.16.0.0/12 和 192.168.0.0/16 后，发往这些私有地址段的流量会绕过 TUN 直接走系统原路由表。对普通家庭与开发环境来说，这正好保护了 WSL2、Docker 网桥和路由器内网管理页；但如果你公司内部通过代理访问某台特定私有网段服务器，或者某些代理 DNS 恰好使用 10.x.x.x 网段，则应把排除网段缩小到实际的 WSL2 与 Docker 子网（如 172.16.0.0/12）。
---

# Windows TUN 模式与 WSL2、Docker Desktop 网络冲突完全排查指南

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer First）</div>
  <p>在 Windows 开发环境下开启代理客户端 TUN 模式后，宿主机浏览器正常、唯独 <strong>WSL2 终端断网</strong> 或 <strong>Docker Desktop 拉取镜像与容器通信超时</strong>，本质是 <strong>Wintun 虚拟网卡的 L3 路由表抢占</strong>、<strong>Hyper-V <code>vEthernet</code> 私有网段回程拦截</strong> 以及 <strong><code>10.255.255.254</code> / Fake-IP 跨边界解析失效</strong> 的叠加冲突。Windows 11（22H2+）用户优先在 <code>.wslconfig</code> 启用 <code>networkingMode=mirrored</code> 消除双层 NAT；Windows 10 或保留 NAT 模式的用户必须在客户端 <code>tun.route-exclude-address</code> 排除 <code>172.16.0.0/12</code>、<code>192.168.0.0/16</code> 与 <code>10.0.0.0/8</code>，并把 <code>host.docker.internal</code> 加入 <code>fake-ip-filter</code>，或直接为 Docker Desktop 配置显式代理端口。</p>
</div>

## 一、症状判断：确认你遇到的是 WSL2/Docker 跨栈冲突而非宿主机断网

开发环境下把系统代理切到 TUN 模式后，如果宿主机 Chrome、Edge 访问海外网站完全正常，说明代理节点本身和本地出网是通的，故障范围可以精准锁定在**宿主机与虚拟化子系统之间的网络边界**。对照下表识别你的具体症状分支：

| 典型表现 | 常见报错或输出特征 | 对应核心冲突点 |
|---|---|---|
| WSL2 内 `apt update`、`git pull`、`curl` 全程卡死无输出 | 终端卡在 `Connecting...` 或 `0% [Connecting to archive.ubuntu.com]` | **Wintun 劫持回程路由**：宿主机回给 `vEthernet (WSL)` 的响应包被 TUN 截走 |
| WSL2 内域名似乎解析成功，但立即卡在奇怪的 IP 段 | `Trying 198.18.0.23...` 然后超时 | **Fake-IP 跨子网孤岛**：宿主机返回了 Fake-IP，NAT 子网无法将 `198.18.0.0/16` 正确路由回代理栈 |
| WSL2 根本解析不了任何域名，提示临时解析失败 | `Temporary failure in name resolution` 或 `Could not resolve host` | **DNS 隧道 / `dns-hijack` 冲突**：`/etc/resolv.conf`（`172.x.x.1` 或 `10.255.255.254`）被防火墙或 53 劫持阻断 |
| `docker pull` / `docker build` 超时，容器内也无法出网 | `Error response from daemon: Get ... context deadline exceeded` | **Docker Desktop VM 代理隔离**：Docker 独立运行在 `docker-desktop` 虚拟机且使用 `172.17.0.0/16` 等网桥 |
| 宿主机或容器无法连接 `host.docker.internal` 或本地端口 | 容器内提示 `Connection refused` 或连到 `198.18.x.x` | **`fake-ip-filter` 缺失 + 入站防火墙未放行** |

如果你的问题是**连 Windows 宿主机本身都打不开 TUN 开关、开关自动弹回，或者退出代理后宿主机全部断网**，那属于服务权限或注册表问题，应先跳转阅读 [TUN 模式无法启动与系统代理冲突排查](/troubleshooting/tun/)。

## 二、原因分类：Wintun、Hyper-V 虚拟交换机与 Fake-IP 的三层打架机制

想要一次改透配置而不再反复踩坑，必须看清数据包在 Windows 宿主机、Wintun 网卡、Hyper-V 虚拟交换机和 Docker 网桥之间是如何“打架”的。

### 1. L3 路由表抢占（Wintun vs `vEthernet (WSL)`）

在默认 NAT 模式下，WSL2 本质上是一台运行在 Hyper-V 轻量级虚拟机里的 Linux，通过宿主机上的 `vEthernet (WSL)` 虚拟交换机（通常从 `172.16.0.0/12` 私有地址池随机切分一个 `/20` 子网，例如 `172.24.160.1/20`）与 Windows 交换数据。Docker Desktop 同样会在 `docker0` 网桥和自定义网络中大量分配 `172.17.0.0/16`、`172.18.0.0/16` 等私有子网。

当你开启 [Clash Verge Rev](/clients/clash-verge-rev/)（Mihomo 核心）或 [sing-box](/clients/sing-box/) 的 TUN 模式并启用 `auto-route: true` 时，客户端会利用 Wintun 驱动创建一张虚拟网卡（常见名称为 `Meta` 或 `singbox_tun`），并向 Windows IPv4 路由表强行插入两条权重极高的半覆盖路由：`0.0.0.0/1` 和 `128.0.0.0/1`（同时把虚拟网卡跃点数 Metric 压得很低）。

这两条路由组合起来覆盖了全部 IPv4 地址空间，且因为前缀长度 `/1` 大于普通默认路由 `/0`，在最长前缀匹配规则下拥有压倒性优先级。如果配置中没有通过 `route-exclude-address` 把虚拟交换机私有网段排除在外，部分跨子网通信或回包就可能被误导进 TUN 网卡，直接掉进黑洞。

### 2. NAT 架构 DNS 冲突与 `10.255.255.254` 代理陷阱

在没有开启 Mirrored 模式时，WSL2 内部的 `/etc/resolv.conf` 通常有两种指向：
- 传统自动生成模式：指向 `vEthernet (WSL)` 在宿主机侧的虚拟网关 IP（如 `172.24.160.1`）。
- 启用了新版本 WSL 的 `dnsTunneling=true` 后：指向 WSL 内部虚拟通道监听器 `10.255.255.254`。

当宿主机客户端同时启用了 `dns-hijack`（例如 `any:53`）和 `enhanced-mode: fake-ip` 时，冲突就会以两种方式爆发：
1. **Fake-IP 不可达**：宿主机代理 DNS 给 WSL2 返回了一个 `198.18.0.15` 假 IP。WSL2 拿着这个 IP 发包给宿主机网关，但宿主机收到来自外部虚拟交换机（非本机进程）发往 `198.18.0.0/16` 的包后，如果没有配置路由与转发放行（或者 Windows Defender / Hyper-V 防火墙丢弃了跨接口转发包），请求就会卡死在 `Trying 198.18.0.15...`。
2. **`10.255.255.254` 隧道被二次劫持或绕行**：在部分混合配置下，如果客户端把 `10.0.0.0/8` 整体排除，或反之错误劫持了 WSL2 虚拟通道里的 53 端口，就会造成 DNS 查询包既进不去宿主机真实 DNS 服务，也收不到代理内核响应，最终 `curl` 卡在域名解析阶段直接超时。

### 3. Hyper-V 防火墙与 Docker Desktop 代理边界

从 Windows 11 22H2 演进版本开始，微软引入了专门管控虚拟机的 **Hyper-V 防火墙**。即使你把客户端配置改对了，如果 Hyper-V 防火墙默认阻止了虚拟网卡向宿主机发送入站连接，WSL2 或 Docker 容器就无法访问宿主机上监听的代理端口（如 `7897`），也无法把数据包正常送进宿主机协议栈。

此外，Docker Desktop 并不是直接跑在你的 Ubuntu WSL 发行版里，它拥有自己独立的底层 WSL2 发行版（`docker-desktop` 和 `docker-desktop-data`）。你在个人 Ubuntu 终端里 `export http_proxy=...` 时，只影响该终端内的命令，**完全不会影响 Docker 守护进程（Docker Daemon）执行 `docker pull` 时的拉取通道**，这是很多开发者改了环境变量却依然拉不动镜像的原因。

## 三、逐项检查：用 `route print`、`ipconfig` 与 WSL2 内部命令锁定故障点

不要盲目复制网上的配置整段覆盖。先花 1 分钟分别在 Windows PowerShell 和 WSL2 终端运行以下诊断命令，摸清你当前系统的真实网段和路由抢占状态。

### 1. Windows 宿主机诊断（PowerShell）

打开 PowerShell，依次查看 WSL 版本、虚拟网卡 IP 分配以及 IPv4 路由表：

```powershell
# 1. 查看 WSL 内核与版本（确认是否满足 Windows 11 22H2+ 与 WSL 2.0+）
wsl --version
wsl -l -v

# 2. 列出物理网卡、WSL 虚拟交换机与 TUN 网卡的 IP 与子网掩码
ipconfig /all

# 3. 精准筛选 WSL、Docker 与代理 TUN 接口地址
Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.InterfaceAlias -match "WSL|Meta|Clash|singbox|Docker|vEthernet" } |
  Format-Table InterfaceIndex, InterfaceAlias, IPAddress, PrefixLength -AutoSize

# 4. 打印 IPv4 路由表，重点观察 0.0.0.0/1、128.0.0.0/1 与 172.16/192.168 路由去向
route print -4
```

**`route print -4` 重点看什么？**
- 查看活动路由顶部的 `0.0.0.0`（掩码 `0.0.0.0`、`128.0.0.0`、`192.0.0.0` 等）：确认是否有 `0.0.0.0 128.0.0.0` 和 `128.0.0.0 128.0.0.0` 两条半覆盖路由指向了 TUN 虚拟网卡接口（如 `198.18.0.1`），并且它的跃点数极小。
- 检查 `172.16.0.0` 到 `172.31.255.255` 区间以及你的 `vEthernet (WSL)` 所在子网，其接口应当明确指向本地虚拟交换机在链路（`在链路上` / `On-link`），而绝不能被其它静态路由或更高优先级的虚拟网关劫持。
- 检查 `198.18.0.0`（掩码 `255.254.0.0`）是否明确指向 TUN 虚拟网卡。

### 2. WSL2 内部终端诊断

打开你的 Ubuntu / Debian 等 WSL2 终端，执行三项检查确认工作模式和 DNS 指向：

```bash
# 1. 查看网卡名称与 IP（NAT 模式通常为 172.x.x.x；Mirrored 模式会直接出现宿主机的局域网 IP）
ip addr show

# 2. 查看默认路由出口网关
ip route show

# 3. 查看当前生效的 DNS 服务器地址（注意观察是 172.x.x.1 还是 10.255.255.254）
cat /etc/resolv.conf
```

## 四、修复操作：Mirrored 镜像方案、NAT 路由排除与 Docker Desktop 分层设置

根据你的 Windows 系统版本与开发需求，按以下三个对应方案实施修复。

### 方案 A：Windows 11（22H2+）启用 WSL2 `networkingMode=mirrored`（根治首选）

微软在 Windows 11 22H2（需 WSL 2.0.0 及以上版本，如果 `wsl --version` 过旧可先运行 `wsl --update`）推出了 **Mirrored 镜像网络模式**。开启后，WSL2 不再创建独立的 `172.x` Hyper-V NAT 孤岛，而是直接与 Windows 宿主机共享同一个网络接口和本地回环 `127.0.0.1`，从根源上消除了 L3 路由表撕裂。

#### 第 1 步：创建或修改 `%UserProfile%\.wslconfig`

在 Windows 文件管理器地址栏输入 `%UserProfile%` 回车进入当前用户目录（例如 `C:\Users\你的用户名`），新建或编辑名为 `.wslconfig` 的纯文本文件（注意确认文件扩展名不要变成 `.wslconfig.txt`），写入以下配置：

```ini
[wsl2]
networkingMode=mirrored
dnsTunneling=true
firewall=true
autoProxy=true

[experimental]
hostAddressLoopback=true
```

**关键字段说明**：
- `networkingMode=mirrored`：让 WSL2 直接共享宿主机的物理网卡与 TUN 虚拟网卡。
- `dnsTunneling=true`：把 WSL2 的域名解析通过微软虚拟通道透传给 Windows 宿主机 DNS 客户端，即使内部 `/etc/resolv.conf` 显示 `10.255.255.254`，查询请求也会在宿主机侧由代理内核统一分流处理，避免与本地 `dns-hijack` 硬碰硬。
- `autoProxy=true`：如果你临时关闭了 TUN 而切回系统代理模式，WSL2 会自动同步宿主机的 HTTP 代理环境变量。
- `hostAddressLoopback=true`：允许容器或 WSL2 通过宿主机真实局域网 IP 访问宿主机服务，避免回环被隔离。

#### 第 2 步：重启 WSL 并放行 Hyper-V 防火墙

以**管理员身份**打开 PowerShell，彻底关闭 WSL 实例使 `.wslconfig` 生效，并确保 Hyper-V 虚拟防火墙策略不拦截入站通信：

```powershell
# 彻底关闭所有 WSL2 发行版（包含 docker-desktop）
wsl --shutdown

# 检查并放行 Hyper-V 虚拟机创建者默认入站规则（防止宿主机本地端口或回包被拦）
Set-NetFirewallHyperVVMSetting -Name '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' -DefaultInboundAction Allow
```

*(提示：如果你在开启 `networkingMode=mirrored` 和 `dnsTunneling=true` 后，发现宿主机客户端的 `dns-hijack` 与 `10.255.255.254` 依然偶尔产生解析卡顿，可以检查客户端配置中是否启用了 `dns.enhanced-mode: fake-ip`，并按下方第 3 步补全 `fake-ip-filter` 与 `route-exclude-address`。)*

### 方案 B：Windows 10 或必须保留 NAT 模式的路由排除方案（Mihomo / sing-box）

Windows 10 系统不支持 `mirrored` 模式，或者部分开发者因特定多容器网卡绑定需求必须继续使用 `networkingMode=nat`。此时必须在代理客户端的配置文件中显式声明**网段排除**与 **Fake-IP 白名单**，确保私有虚拟网络流量不进 TUN。

#### 1. Clash Verge Rev / FlClash（Mihomo 内核）全局覆写配置

在 [Clash Verge Rev](/clients/clash-verge-rev/) 左侧进入「订阅（Profiles）」，右键或点击「全局扩展配置（Global Merge）」编辑以下 YAML（也可参考 [TUN 模式深度配置指南](/guides/tun/) 与 [Clash Verge Rev 从零配置教程](/guides/clash-verge-rev-setup/)）：

```yaml
dns:
  enable: true
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  fake-ip-filter:
    - "*.lan"
    - "*.local"
    - "localhost.ptlogin2.qq.com"
    - "host.docker.internal"
    - "*.docker.internal"
    - "+.wsl.local"

tun:
  enable: true
  stack: mixed
  auto-route: true
  auto-detect-interface: true
  dns-hijack:
    - "any:53"
    - "tcp://any:53"
  route-exclude-address:
    - 172.16.0.0/12   # 排除 WSL2 NAT 虚拟交换机与 Docker 默认桥接网段
    - 192.168.0.0/16  # 排除家庭/办公局域网与部分自定义网桥
    - 10.0.0.0/8      # 排除 10.x 企业内网及 10.255.255.254 WSL DNS 通道地址
```

**关于排除 `10.0.0.0/8` 的边界提醒**：加入 `10.0.0.0/8` 可以防止宿主机与 `10.255.255.254` 或部分 Docker 自定义 `10.x` 网桥冲突；但如果你的公司内网服务需要经过代理访问 `10.x` 地址，或者某条特殊内网 DNS 刚好落在 `10.x`，可以把该条目精准缩小为 `10.255.255.254/32` 甚至仅保留 `172.16.0.0/12` 和 `192.168.0.0/16`。

**关于 `stack` 协议栈选择**：如果遇到 WSL2 下高速下载（如拉取大型镜像）导致 CPU 飙升或偶发断流，将 `tun.stack` 设为 `mixed`（TCP 走系统栈、UDP 走 gVisor）通常比纯 `gvisor` 兼容性和吞吐更好；少数极老旧网卡驱动环境下可切换 `system` 或 `gvisor` 交叉对比。

#### 2. sing-box / Hiddify / Karing 对应参数写法

如果你使用的是基于 [sing-box](/clients/sing-box/) 内核的客户端，在原生 JSON 配置的 `inbounds` → `tun` 节点中，对应字段名称为 `route_exclude_address`（注意是下划线而非短横线）：

```json
{
  "type": "tun",
  "tag": "tun-in",
  "address": ["172.19.0.1/30"],
  "auto_route": true,
  "strict_route": false,
  "route_exclude_address": [
    "172.16.0.0/12",
    "192.168.0.0/16",
    "10.0.0.0/8"
  ]
}
```

注意：**请检查 `strict_route` 不要随意设为 `true`**，否则 `sing-box` 注入的严格防火墙阻断规则更容易拦截来自 Hyper-V 虚拟交换机的跨界流量。

### 方案 C：Docker Desktop 显式代理 vs TUN 模式抉择

在 Windows 上运行 Docker Desktop 时，建议把「Docker 引擎拉取镜像」与「容器内部应用出网」分开看待：

1. **Docker Desktop 官方内置 Proxies 设置（推荐给 `docker pull` / `docker build`）**：
   - 先在代理客户端（如 Clash Verge Rev）设置中打开 **「允许局域网连接（Allow LAN）」**，记录混合端口（如 `7897`）。
   - 打开 Docker Desktop，进入右上角 **Settings（设置） → Resources → Proxies**，打开「Manual proxy configuration」。
   - 在 `Web Server (HTTP)` 和 `Secure Web Server (HTTPS)` 中均填入 `http://host.docker.internal:7897`（或宿主机局域网 IP 端口）。在 `Bypass proxy settings for these hosts & domains` 中填入 `localhost,127.0.0.1,*.internal,172.16.0.0/12,192.168.0.0/16`。点击 **Apply & restart**。
   - **安全警告**：打开「允许局域网连接」时，务必确认当前处于受信任的家庭或个人开发环境，且 Windows 防火墙仅在「专用网络」放行该端口；切勿在咖啡厅、酒店等公共 Wi-Fi 下向外部开放无鉴权代理端口。
2. **避免双重代理打架**：
   - 当你在 Docker Desktop 中填好了 `http://host.docker.internal:7897` 显式代理后，**必须确保已经按方案 B 把 `host.docker.internal` 加入了客户端的 `fake-ip-filter`**。否则 Docker VM 去请求 `host.docker.internal` 时拿到 `198.18.x.x`，代理请求自己就先死锁了。
   - 如果你开启了宿主机 TUN 且使用了方案 A 的 `mirrored` 模式，通常直接走 TUN 即可；若采用 Docker Proxies 方案，反而无需在 Docker 引擎层强开全网 TUN 劫持。

## 五、验证结果：Windows 宿主机、WSL2 与 Docker 容器三端实测命令

完成配置修改后，务必先执行 `wsl --shutdown` 重启 WSL2 与 Docker Desktop，再重启一次代理客户端的 TUN 开关，然后按顺序在三个环境运行实测命令。

### 1. Windows 宿主机路由与监听复核

```powershell
# 确认 172.16.0.0/12 与 192.168.0.0/16 排除路由已生效，且 198.18.0.0 正常指向 TUN
route print -4 | Select-String "172\.16|192\.168|198\.18|0\.0\.0\.0"
```

### 2. WSL2 内部连通性与 DNS 真伪验证

打开 WSL2 终端，依次测试真实域名解析和 HTTPS 请求：

```bash
# 1. 验证 host.docker.internal 未被 Fake-IP 劫持（绝不能返回 198.18.x.x）
getent hosts host.docker.internal || getent hosts $(hostname).local

# 2. 验证普通国内地址与海外目标 HTTPS 连通性
curl -I --connect-timeout 8 https://github.com
curl -I --connect-timeout 8 https://cp.cloudflare.com/generate_204
```

**预期成功结果**：`github.com` 迅速返回 `HTTP/2 200`（或 `301/302`），`generate_204` 返回 `HTTP/2 204`；若解析域名返回了真实海外 IP（或通过宿主机 TUN 透明接管且无超时卡死），说明 WSL2 出网已完全恢复。

### 3. Docker 容器拉取与容器内出网验证

在 Windows PowerShell 或已集成 Docker CLI 的 WSL2 终端执行临时容器测试（测试完毕容器会自动销毁）：

```bash
# 拉取轻量 curl 镜像并测试容器内部对外部 HTTPS 站点的访问能力
docker run --rm curlimages/curl:latest -I --connect-timeout 8 https://cp.cloudflare.com/generate_204
```

看到镜像顺利拉取并输出 `HTTP/2 204`，即证明 Docker Desktop 引擎拉取通道与容器运行时网络均与宿主机 TUN 模式实现和平共存。

## 六、常见问题（FAQ）

### 为什么一打开代理客户端的 TUN 模式，宿主机上网正常，但 WSL2 里 apt update 或 curl 就彻底卡死？

传统 NAT 模式下的 WSL2 通过 Hyper-V 虚拟交换机经宿主机转发流量，其数据包源地址位于 172.16.0.0/12 私有网段。宿主机开启 TUN 的 auto-route 后，会在主路由表写入高优先级的半覆盖默认路由，导致宿主机返回给 WSL2 的响应包被 Wintun 虚拟网卡截走并丢弃，形成回程路由黑洞；同时 Fake-IP 返回的 198.18.0.0/16 地址在 NAT 边界也可能无法路由。

### Windows 11 下解决 TUN 与 WSL2 冲突最彻底的方案是什么？

Windows 11 22H2 及以上版本且 WSL 2.0 及以上用户，推荐在用户主目录的 .wslconfig 中启用 networkingMode=mirrored 镜像网络模式，并配合 dnsTunneling=true、firewall=true 与 autoProxy=true，让 WSL2 直接共享宿主机的物理与 TUN 虚拟网卡协议栈，彻底消除双层 NAT 断层。

### 为什么我在 WSL2 里看到 DNS 指向 10.255.255.254，开启 TUN 后却还是解析失败或卡住？

10.255.255.254 是 WSL2 开启 DNS Tunneling 后在虚拟环境内监听的本地代理 DNS 地址。若客户端 TUN 规则中配置了激进的 dns-hijack（如无条件劫持所有网卡 53 端口且未对私有网段和 WSL2 虚拟网卡做隔离），或者宿主机 Hyper-V 防火墙拦截了来自虚拟子网的入站包，就会导致 DNS 隧道请求在跨栈转发时丢失或陷入回环。

### 配置了 route-exclude-address 后，为什么 Docker 容器内访问 host.docker.internal 依然失败？

route-exclude-address 只负责解决三层 IP 路由不被 TUN 网卡劫持，但域名解析层面如果仍被代理内核的 Fake-IP 接管，容器请求 host.docker.internal 时依然会拿到 198.18.x.x 的假地址。必须在客户端 dns.fake-ip-filter 中显式加入 host.docker.internal、*.docker.internal 与本地域名后缀，确保返回宿主机真实内网 IP。

### Docker Desktop 到底是应该配 Proxies 显式代理，还是直接依赖宿主机 TUN 模式？

如果你的主要诉求是加快宿主机执行 docker pull 拉取镜像或 docker build 下载依赖，最稳妥的做法是在 Docker Desktop 的 Settings → Resources → Proxies 中填写宿主机混合代理地址（配合客户端允许局域网连接），而无需依赖宿主机 TUN 强行劫持容器桥接网段。只有当运行中的容器内部程序也需要透明代理且不方便改环境变量时，才需要让容器流量经过已做好网段排除的 TUN 模式。

### 在 Windows 10 或无法升级 Mirrored 模式的环境下，route-exclude-address 写入整个 10.0.0.0/8 会不会有副作用？

排除 10.0.0.0/8、172.16.0.0/12 和 192.168.0.0/16 后，发往这些私有地址段的流量会绕过 TUN 直接走系统原路由表。对普通家庭与开发环境来说，这正好保护了 WSL2、Docker 网桥和路由器内网管理页；但如果你公司内部通过代理访问某台特定私有网段服务器，或者某些代理 DNS 恰好使用 10.x.x.x 网段，则应把排除网段缩小到实际的 WSL2 与 Docker 子网（如 172.16.0.0/12）。
