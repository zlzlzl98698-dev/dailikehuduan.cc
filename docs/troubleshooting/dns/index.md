---
title: "DNS 错误与代理 DNS 解析失败排查：Fake-IP 残留一键修复、分流防送中与泄漏检测"
description: "全面解决代理客户端 DNS 错误、代理 DNS 解析失败、退出代理后残留 198.18.0.0/16 Fake-IP 或 127.0.0.1 导致断网、企业内网 OA/NAS 域名被劫持、nameserver/fallback/nameserver-policy 分流防污染与防 ECS 送中，以及 IPv6 与 WebRTC 泄漏检测关闭方法。"
lastUpdated: 2026-11-23
schemaType: TechArticle
faq:
  - q: "为什么关闭代理客户端后电脑彻底断网，ping 百度等国内网站返回 198.18.0.x？"
    a: "这是 Fake-IP 模式异常退出留下的本地 DNS 缓存或网卡 DNS 未还原所致。198.18.0.0/16 是代理内核在内存中为域名分配的虚假映射网段，一旦客户端崩溃、蓝屏或被强杀，系统 DNS 缓存和浏览器异步 DNS 缓存仍保留 198.18.x.x 记录，或物理网卡 DNS 仍停留在 127.0.0.1，刷新 DNS 缓存并恢复自动获取 DNS 即可秒级恢复。"
  - q: "开启 TUN 和 Fake-IP 后，公司内网 OA、群晖 NAS 或路由器后台（.local / 192.168.*）打不开怎么办？"
    a: "这是因为这些私有域名未进入排除列表，被内核拦截并下发了 198.18.x.x 假地址，导致请求错发进代理隧道而非局域网。需要在 Mihomo 配置的 dns.fake-ip-filter 中添加 *.lan、*.local、*.internal 及公司内网域名后缀，并在 sing-box 中通过 dns.rules 将私有域名分流至 local 本地解析。"
  - q: "nameserver、fallback 和 nameserver-policy 有什么区别，为什么全填 8.8.8.8 会导致代理 DNS 解析失败？"
    a: "在 Mihomo 架构中，default-nameserver 用于解析 DoH/DoT 域名本身的 IP（必须填国内纯 IP DNS）；proxy-server-nameserver 专门解析机场节点域名（须填国内 DoH）；nameserver 通常配置国内加密 DNS 以确保国内 CDN 命中；nameserver-policy 则按 geosite 精确指定国外域名由代理通道发往海外 DoH，避免把 8.8.8.8 直接当国内默认 DNS 引发国内超时或污染。"
  - q: "明明节点是美国或日本原生 IP，为什么 YouTube 和 Google 还是经常提示地区在中国大陆（送中）？"
    a: "除了落地 IP 被标记外，最常见的原因是 DNS 泄漏或携带了本地 EDNS Client Subnet（ECS）信息。如果海外域名被本地宽带 DNS 解析，或向 DoH 服务器发起了携带你真实国内公网 IP 网段的 ECS 查询，Google CDN 会直接根据 DNS 解析来源把你定位到中国大陆。开启 proxy-server-nameserver 分离、开启 respect-rules 让海外域名走代理通道解析，即可阻断 DNS 送中。"
  - q: "什么是 Fake-IP 与 Redir-Host，什么时候应该关闭 Fake-IP 改用 Redir-Host？"
    a: "Fake-IP 在 DNS 查询瞬间直接返回 198.18.0.0/16 假地址，零等待且避免本地 DNS 污染，是日常性能最高的选择；Redir-Host 则向真实 DNS 查询真实 IP 后再根据规则转发。如果你频繁使用需要获取真实目标 IP 的专业内网软件、复杂 P2P 工具、特定银行网银插件或游戏防作弊驱动，且排除了内网域名依然报错，可临时切换至 redir-host 模式。"
  - q: "怎么检测自己是否发生了 DNS 泄漏、IPv6 泄漏和 WebRTC 泄漏？"
    a: "在浏览器无痕模式下同时访问 ipleak.net 与 dnsleaktest.com（运行 Extended Test）。正常状态下，显示的出口 IP、DNS 服务器 ASN 归属以及 WebRTC 检测出的公网地址都应与当前选中的海外节点地区一致；如果 DNS 列表出现 China Telecom/Unicom/Mobile，或 IPv6/WebRTC 暴露了你本地宽带的真实 IP，即存在泄漏。"
  - q: "浏览器开启了内置“使用安全 DNS（DoH）”功能，和代理客户端 DNS 会冲突吗？"
    a: "会冲突。在 TUN 或系统代理模式下，如果 Chrome/Edge 强制启用内置的阿里云/腾讯云 DoH，浏览器发起的 HTTPS DNS 请求会绕过代理客户端的常规 UDP 53 劫持或分流策略，导致 Fake-IP 失效、海外规则命中率下降以及潜在的 DNS 泄漏。建议在使用桌面代理客户端时关闭浏览器内置安全 DNS，统一交由客户端内核接管。"
---

# DNS 错误与代理 DNS 解析失败排查：Fake-IP 残留修复、分流防送中与泄漏检测

<div class="answer-first-box">
<div class="answer-first-label">核心结论 · Answer First</div>
<p>代理使用过程中出现<strong>“DNS 错误”</strong>、<strong>“代理 DNS 解析失败”</strong>、<strong>“退出客户端后彻底断网”</strong>、<strong>“公司内网 OA/NAS 失灵”</strong>以及<strong>“节点在海外但 Google/YouTube 定位送中”</strong>，几乎全部源于 DNS 解析链路与代理隧道的接管边界错位。应急排障应遵循四步法则：首先清理异常退出后残留的 <code>198.18.0.0/16</code> Fake-IP 缓存与网卡 <code>127.0.0.1</code> 锁定；其次通过 <code>fake-ip-filter</code> 放行 <code>.local</code>、<code>.lan</code> 与企业内网域名；再次利用 <code>default-nameserver</code>、<code>proxy-server-nameserver</code> 与 <code>nameserver-policy</code> 实现国内外解析硬隔离并切断 ECS 送中；最后通过关闭残缺 IPv6 与浏览器 WebRTC 策略封堵真实地址泄漏。</p>
</div>

---

## 一、DNS 故障全景矩阵：5 类典型异常速查定位

许多用户误以为只要节点延迟低、端口连通就万事大吉，实际上在现代规则分流客户端（[Clash Verge Rev](/clients/clash-verge-rev/)、[FlClash](/clients/flclash/)、[Hiddify](/clients/hiddify/)、[Karing](/clients/karing/) 等）中，**DNS 是分流引擎的第一道决策关卡**。DNS 只要出错，哪怕节点带宽再高也会表现为网页打不开或流媒体封锁。

| 异常现象 | 触发场景与典型报错 | 核心根因 | 对应解决章节 |
| :--- | :--- | :--- | :--- |
| **关闭客户端后电脑彻底断网** | 浏览器提示 `DNS_PROBE_FINISHED_NXDOMAIN`，`ping` 域名返回 `198.18.0.x` 或无法解析 | 强杀进程/蓝屏导致 Fake-IP 缓存残留，或物理网卡 DNS 仍被锁在 `127.0.0.1` | 第二节：Fake-IP 与 `127.0.0.1` 一键修复 |
| **开启代理后内网设备/OA 打不开** | `nas.local`、路由器后台、企业内网 `*.corp` 网页报错或超时 | 内网私有域名未加入 `fake-ip-filter`，被内核劫持成 `198.18.x.x` 送入代理 | 第三节：内网域名绕过配置 |
| **国内站点变慢或海外域名解析超时** | 日志报 `dns resolve failed: context deadline exceeded` 或国内打开走海外绕路 | `nameserver` 混填海外 IP 导致国内直连解析超时，或缺乏 `proxy-server-nameserver` 引发自举死锁 | 第四节：国内外分流 DNS 架构 |
| **海外节点正常，Google/AI 提示送中** | YouTube 地区显示 CN，[ChatGPT](/ai-streaming/chatgpt/) / [Claude](/ai-streaming/claude/) / [Netflix](/ai-streaming/netflix/) 拒绝服务 | 海外域名由本地宽带 DNS 明文解析泄漏，或发送了真实本地公网网段的 ECS 请求 | 第四节 + 第五节：防送中与泄漏检测 |
| **P2P/特殊网银/本地服务偶尔报错** | 依赖读取真实目标 IP 的客户端在 Fake-IP 下连接异常或端口映射错乱 | Fake-IP 机制屏蔽了真实目标 IP，部分底层驱动无法识别 `198.18.0.0/16` | 第三节末尾：Fake-IP vs Redir-Host 切换 |

---

## 二、故障一：异常退出后残留 Fake-IP（198.18.0.0/16）或 127.0.0.1 DNS 的一键修复

### 1. 问题现象与底层原理
在 [Clash Verge Rev](/clients/clash-verge-rev/)、OpenClash 或 [sing-box](/clients/sing-box/) 的 TUN 虚拟网卡模式下，内核默认启用 **Fake-IP** 增强模式。当你访问 `www.baidu.com` 时，内核不会把真实 IP 给浏览器，而是直接从保留测试网段 `198.18.0.0/16` 中动态分配一个假 IP（例如 `198.18.0.15`）并记录在内存映射表中。

一旦发生以下三种非正常退出场景：
1. 电脑蓝屏死机、直接长按电源键关机，或在任务管理器强杀了 `verge-mihomo.exe` / `sing-box.exe`；
2. 启用了开机自启或系统代理修改但客户端意外崩溃，未来得及还原物理网卡设置；
3. 浏览器自身缓存了刚才访问过的假 IP 地址（TTL 未过期）。

此时代理内核已经消失，没人再认识 `198.18.0.15`，或者系统网卡的首选 DNS 服务器仍然写着 `127.0.0.1` / `198.18.0.2`（本地已停止监听的 DNS 端口），从而造成**“一关代理就彻底没网，重开代理反而又能上网”**的典型故障。

### 2. 跨平台一键诊断与修复命令

#### 第 1 步：先诊断到底残留了 Fake-IP 还是锁死了网卡 DNS
在关闭代理客户端的状态下，打开终端执行检测：

```powershell
# Windows PowerShell：查询测试域名解析结果与网卡当前 DNS 配置
nslookup www.baidu.com
Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object { $_.ServerAddresses -ne $null } | Format-Table InterfaceAlias, ServerAddresses
```

```bash
# macOS：查询当前解析与活动网络接口的 DNS
nslookup www.baidu.com
scutil --dns | grep "nameserver\[" | head -n 10
```

- **判定 A（Fake-IP 缓存残留）**：`nslookup` 或 `ping` 正常域名返回的 IP 是 `198.18.x.x` 或 `198.19.x.x`。
- **判定 B（网卡 DNS 被锁定）**：`Get-DnsClientServerAddress` 或 `scutil --dns` 显示物理网卡（如 `WLAN`、`以太网`、`Wi-Fi`）的 DNS 地址被改成了 `127.0.0.1` 或 `198.18.0.2`，而此时并没有代理程序在监听 53 端口。

#### 第 2 步：执行一键恢复脚本与浏览器缓存清理

```powershell
# Windows 一键修复（以管理员身份运行 PowerShell）
# 1. 刷新系统 DNS 解析缓存
ipconfig /flushdns

# 2. 将常见物理网卡（以太网 / WLAN）的 IPv4 DNS 恢复为 DHCP 自动获取
# 请根据上一步查到的实际 InterfaceAlias 名称调整引号内的网卡名
netsh interface ip set dns name="WLAN" source=dhcp
netsh interface ip set dns name="以太网" source=dhcp

# 3. 验证是否已恢复正常公网解析
nslookup www.baidu.com
```

```bash
# macOS 一键修复（在终端运行）
# 1. 清除 macOS 系统 DNS 缓存并重启 mDNSResponder
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# 2. 将 Wi-Fi 的 DNS 服务器重置为由路由器自动分配（empty）
sudo networksetup -setdnsservers "Wi-Fi" empty

# Linux (systemd-resolved 环境) 一键刷新缓存
sudo resolvectl flush-caches
```

**极其关键的补刀动作（清理浏览器异步 DNS 缓存）**：
很多用户做完上述系统修复后，`ping` 百度已经正常，但 Chrome 或 Edge 里依然打不开。这是因为 Chromium 内核维护了一套独立的异步 DNS 客户端与 Host Cache，**不完全受 `ipconfig /flushdns` 控制**：
1. 在 Chrome 地址栏输入 `chrome://net-internals/#dns`（Edge 输入 `edge://net-internals/#dns`），点击 **「Clear host cache」**。
2. 顺手访问 `chrome://net-internals/#sockets` 点击 **「Flush socket pools」**，断开指向 `198.18.x.x` 的残留 Socket 连接。
3. 进入浏览器「设置 → 隐私与安全 → 安全」，**关闭「使用安全 DNS（Use secure DNS）」**，避免浏览器内置 DoH 绕过代理客户端的 DNS 接管逻辑。

---

## 三、故障二：企业内网 OA / NAS / 路由器被 Fake-IP 劫持的 `fake-ip-filter` 配置

### 1. 问题现象与条件说明
开启 [TUN 模式](/guides/tun/) 后，外网视频秒开，但一访问家里群晖 NAS（`nas.local`）、路由器管理页（`router.asus.com` / `miwifi.com`）、校园网认证页或公司内部 OA/GitLab（`oa.company.internal`），网页直接报连接失败。同时在客户端「连接」日志里看到这些内网域名的目标 IP 变成了 `198.18.x.x`。

这是因为 Fake-IP 默认会拦截**所有**经过本地网卡的 DNS 查询。为了保证局域网服务、操作系统联网状态探测（如 Windows NCSI 小地球图标变“无 Internet”）和企业内网域名能够拿到真实的局域网私有 IP（`192.168.*`、`10.*`、`172.16.*`），必须配置精细的 `fake-ip-filter` 白名单。

### 2. Mihomo（Clash Verge Rev / FlClash / OpenClash）标准绕过模板
在 [Clash Verge Rev](/clients/clash-verge-rev/) 中，建议通过全局扩展配置（Global Extend Config / Merge）写入以下 `fake-ip-filter` 规则，这样每次更新机场订阅也不会被覆盖（更多覆写技巧参考 [Clash 配置文件覆写指南](/guides/clash-config/)）：

```yaml
dns:
  enable: true
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  # filter-mode 默认为 blacklist（命中以下列表的域名不返回 Fake-IP，直接走真实解析）
  fake-ip-filter-mode: blacklist
  fake-ip-filter:
    # 1. 局域网与本地保留后缀（NAS、打印机、路由器常用）
    - "*.lan"
    - "*.local"
    - "*.localdomain"
    - "*.home.arpa"
    - "*.internal"
    - "router.asus.com"
    - "miwifi.com"
    - "tplogin.cn"
    # 2. Windows / Apple / Android 系统联网状态探测（防图标变感叹号）
    - "+.msftconnecttest.com"
    - "+.msftncsi.com"
    - "captive.apple.com"
    - "connectivitycheck.gstatic.com"
    - "*.connectivitycheck.platform.hicloud.com"
    # 3. 时间同步服务 NTP（防止时钟校验走假 IP 失败）
    - "time.*.com"
    - "time.*.gov"
    - "time.*.edu.cn"
    - "ntp.*.com"
    - "+.pool.ntp.org"
    # 4. 即时通讯与游戏语音 STUN / 局域网发现
    - "localhost.ptlogin2.qq.com"
    - "+.stun.*.*"
    - "+.stun.*.*.*"
    - "WORKGROUP"
    # 5. Docker / WSL2 宿主机通信与企业内网专有域名（按实际修改）
    - "host.docker.internal"
    - "*.docker.internal"
    - "*.corp.example.com"
    - "*.oa.internal"
```

### 3. sing-box（Hiddify / Karing）对应排除逻辑
在 [sing-box](/clients/sing-box/) 内核体系中，没有单一的 `fake-ip-filter` 数组，而是通过 **`dns.rules` 的自上而下顺序匹配** 决定哪些域名进 `fakeip`、哪些进 `local`（真实本地解析）。正确原则是：**将私有域名规则放在 `fakeip` 规则之前**。如果你发现公司内网域名被劫持，应在自定义路由/DNS 规则顶部加入 `domain_suffix: [".local", ".lan", ".corp.example.com"]` 并指定其 `server` 为直连本地 DNS（例如 `dns_direct`），再让其余未知域名落入底部的 `fakeip` 服务器。

### 4. Fake-IP 与 Redir-Host 的边界取舍
如果你已经配置了 `fake-ip-filter` 并用 `route-exclude-address` 排除了 `192.168.0.0/16` 和 `10.0.0.0/8`，但部分特殊软件（如老旧 ERP 客户端、严格校验证书与目标 IP 绑定关系的 VPN 网关、或某些反作弊游戏）仍异常报错，可以在客户端的覆写配置中将 `enhanced-mode: fake-ip` 临时切换为 `enhanced-mode: redir-host`。需要理解的代价是：**Redir-Host 会产生额外的真实 DNS 查询耗时，且对部分只通过 IP 直连却缺乏域名的应用分流精准度略逊于 Fake-IP**，常规日常使用仍优先推荐维护好白名单的 Fake-IP。

---

## 四、故障三：国内外分流 DNS 架构与防污染、防 ECS 定位送中

### 1. 为什么把 `nameserver` 全填成 `8.8.8.8` 是灾难性错误？
很多早期网传教程教用户在 Mihomo 的 `dns.nameserver` 里直接填入 `8.8.8.8` 和 `1.1.1.1`，结果导致两个严重故障：
1. **国内请求直接超时或 DNS 劫持**：国内宽带运营商会对发往境外 `8.8.8.8:53` 的明文 UDP 53 查询进行丢包或抢答污染，一旦阻塞就会在日志里看到 `dns resolve failed: context deadline exceeded`（代理 DNS 解析失败）。
2. **国内网站被解析到海外 CDN 节点**：即便 `8.8.8.8` 勉强返回了结果，淘宝、B站、阿里云等国内服务也会给你分配位于新加坡或美西的海外节点 IP，导致国内视频卡顿、网盘降速甚至消耗代理流量。

### 2. 彻底理清 Mihomo 四大 DNS 字段的分工边界
现代分流架构的核心思想是：**“节点入口域名由国内解析、国内域名本地 DoH 直连解析、国外域名强制走代理隧道向海外 DoH 解析”**。请对照下表理解各字段的精确职责：

| 配置字段 | 作用对象 | 应该填写的 DNS 类型 | 核心避坑点 |
| :--- | :--- | :--- | :--- |
| **`default-nameserver`** | 仅用于引导解析下方 DoH/DoT 服务器域名（如解析 `dns.alidns.com` 的 IP） | **纯 IP 地址的国内公共 DNS**（如 `223.5.5.5`、`119.29.29.29`） | **绝不能填域名形式的 DoH**，否则会陷入“为了解析 DNS 域名而去查 DNS”的死循环。 |
| **`proxy-server-nameserver`** | **专门解析机场订阅里的节点服务器入口域名**（如 `hk01.example.com`） | 国内加密 DoH（如 `https://doh.pub/dns-query`、`https://dns.alidns.com/dns-query`） | 若不配置此项，当主 `nameserver` 出故障或走代理时，内核连节点入口 IP 都解析不出来，引发全节点超时。 |
| **`nameserver`** | 默认常规域名（配合 `respect-rules` 时主要承载国内及未指定规则域名） | 国内加密 DoH（`223.5.5.5` / `119.29.29.29` DoH） | 避免在直连环境下暴露明文 UDP 53 查询，防止运营商篡改或注入广告。 |
| **`nameserver-policy`**（推荐替代传统 `fallback`） | 按 GeoSite 或域名集合**精确指定解析出口**（`geosite:cn` 走国内，`geosite:geolocation-!cn` 走海外代理 DNS） | 海外部分填写带 `#PROXY`（或策略组名）后缀的海外 DoH，如 `https://1.1.1.1/dns-query#Proxy` | 开启 **`respect-rules: true`** 后，海外域名的 DoH 请求会真正通过你的机场节点发出去，**彻底消灭本地 DNS 污染与泄漏**。 |

### 3. 完整防污染 + 防 ECS 定位送中配置范例（Mihomo 1.18+）
以下配置同时解决了**“代理 DNS 解析失败”**与**“Google/YouTube/AI 服务提示位于中国大陆（送中）”**两大顽疾：

```yaml
dns:
  enable: true
  listen: 0.0.0.0:1053
  ipv6: false                  # 若本地宽带与节点未完整支持双栈，关闭 IPv6 解析防超时与泄漏
  respect-rules: true          # 关键：允许 DNS 查询本身遵循路由规则（让海外 DoH 走代理隧道）
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  default-nameserver:
    - 223.5.5.5
    - 119.29.29.29
  proxy-server-nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
  nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
  nameserver-policy:
    "geosite:cn,private":
      - https://dns.alidns.com/dns-query
      - https://doh.pub/dns-query
    "geosite:geolocation-!cn":
      # 注意：#Proxy 必须与你配置文件中主代理策略组的名称完全一致（区分大小写，如 Proxy 或 节点选择）
      - "https://dns.cloudflare.com/dns-query#Proxy"
      - "https://dns.google/dns-query#Proxy"
```

**为什么这样配置能防 ECS 送中？**
EDNS Client Subnet（ECS）机制会向权威 DNS 附带请求者的 IP 网段以就近返回 CDN IP。如果你直接从国内本地网络向 `8.8.8.8` 或某些开启了 ECS 的 DoH 发起查询，哪怕最终流量走代理，权威服务器也可能把带有你国内归属信息的记录缓存给终端，或者暴露真实地区。当 `respect-rules: true` 且 `#Proxy` 生效时，DNS 查询数据包本身是通过海外机场节点发往 Cloudflare/Google DoH 的，对方看到的请求源完全是海外节点 IP，从而彻底断绝 DNS 层面的送中隐患。

> 注：关于传统 `fallback` 机制——老版 Clash 通过并发请求国内 DNS 再用 `fallback-filter`（GeoIP 判断）决定是否改采海外结果，不仅容易触发慢速超时，还会在本地发出一份明文或本地直连的海外域名查询造成“先泄漏后丢弃”。在现代 Mihomo 内核中，**使用 `respect-rules: true` + `nameserver-policy` 是比旧式 `fallback` 更干净、无泄漏的工程标准**。

### 4. 主流加密 DNS 协议（UDP 53 / DoH / DoT / DoQ）选型与移动端私人 DNS 冲突
在排查“代理 DNS 解析失败”时，选错 DNS 传输协议或与手机系统设置打架同样常见。下表梳理了四类常见解析协议在代理环境下的适用边界：

| DNS 协议类型 | 默认端口与传输层 | 抗运营商劫持/污染能力 | 代理客户端推荐使用建议 |
| :--- | :--- | :--- | :--- |
| **传统明文 DNS**（如 `223.5.5.5`） | UDP / TCP `53` | **无加密**，国内极易被海外方向抢答污染或运营商注入 | 仅可作为 `default-nameserver` 的引导 IP，以及在内网直连解析固定设备时使用，**绝不用于直连解析海外域名**。 |
| **DoH（DNS over HTTPS）**（如 `https://dns.alidns.com/dns-query`） | TCP `443`（HTTPS） | **强加密**，伪装在标准 HTTPS 流量中，极难被精准识别阻断 | **桌面与移动端首选**。国内部分配置阿里云/腾讯 DoH，海外部分通过 `#Proxy` 走代理发往 Cloudflare/Google DoH。 |
| **DoT（DNS over TLS）**（如 `tls://1.1.1.1:853`） | TCP `853` | **强加密**，但 `853` 端口特征明显 | 部分校园网、酒店 Wi-Fi 或企业防火墙会封禁非 `443` 的 `853` 端口，导致全部解析报 `i/o timeout`，不如 DoH 稳定。 |
| **DoQ（DNS over QUIC）** | UDP `853` | **强加密且握手更快** | 仅建议在 UDP 通畅的家庭宽带配合支持 QUIC 的新版 Mihomo/sing-box 尝试，移动/校园网极易被 UDP QoS 丢包卡死。 |

**Android / iOS 移动端特殊 DNS 冲突提醒**：
如果你在 Android 手机（9.0+）的「系统设置 → 网络和互联网 → 私人 DNS（Private DNS）」中手动填写过第三方 DoT 主机名（如 `dns.alidns.com` 或 `dns.google`），开启 [v2rayNG](/clients/v2rayng/)、[FlClash](/clients/flclash/) 或 [Clash Meta for Android](/clients/clash-meta/) 后，部分系统会让“私人 DNS”抢先接管全局解析甚至在海外域名直连失败时直接报“无法访问互联网（私人 DNS 服务器无法连接）”。建议在使用手机代理客户端时，将系统**私人 DNS 设为「关闭」或「自动」**，把完整分流解析权统一交给代理内核。同理，iOS 用户如果在系统里安装过第三方加密 DNS 描述文件（Profile），与 [Shadowrocket](/clients/shadowrocket/) 或 [Stash](/clients/stash/) 共存时也应先在「设置 → 通用 → VPN 与设备管理」中停用外部 DNS 配置。

---

## 五、故障四：IPv6 泄漏与 WebRTC 泄漏的检测与封堵

即便你的 IPv4 DNS 分流做得滴水不漏，还有两个隐蔽通道经常把用户的真实国内 IP 暴露给海外平台（尤其是检测极为严苛的 [Claude](/ai-streaming/claude/)、[ChatGPT](/ai-streaming/chatgpt/) 与 [Netflix](/ai-streaming/netflix/)）：**残缺双栈 IPv6 泄漏**与 **浏览器 WebRTC 泄漏**。

### 1. 客观检测方法（交叉验证 3 项指标）
请开启代理并打开浏览器**无痕模式**，分别执行终端命令行检测与网页检测，不要只依赖单一网站的结果：

```bash
# 1. 终端验证当前命令行下的 IPv4 与 IPv6 出口地址（若使用系统代理请加上 -x http://127.0.0.1:7897）
curl -4 -s https://api64.ipify.org && echo ""
curl -6 -s --connect-timeout 5 https://api64.ipify.org && echo ""
```

1. **检查 `ipleak.net`**：进入后观察页面顶部的 IPv4 与 IPv6 栏位、中部的 **WebRTC detection** 栏位以及底部的 **DNS Address** 栏位。
2. **检查 `dnsleaktest.com`**：点击 **Extended Test**（执行 6 轮深度探测，比 Standard Test 更易暴露偶发分流泄漏）。

**合格与泄漏判定标准**：
- **安全合格状态**：IPv4 显示为目标海外节点 IP；IPv6 显示未检测到（或同样显示为同地区海外节点 IP）；WebRTC 检测列表里**没有任何本地公网 IP**；DNS Address 列表中全部为 Cloudflare、Google 或节点所在机房的海外解析服务器。
- **存在 IPv6 泄漏**：IPv4 是美国/香港节点 IP，但下方 IPv6 赫然显示为 `240e:`（中国电信）、`2408:`（中国联通）或 `2409:`（中国移动）开头的本地宽带地址！这意味着浏览器访问支持双栈的 Google/YouTube 时，直接走了你家宽带的 IPv6 通道绕过了代理。
- **存在 DNS 泄漏**：DNS 列表里出现了 `China Telecom`、`China Unicom`、`China Mobile` 或国内云厂商 ASN。
- **存在 WebRTC 泄漏**：WebRTC 栏目探测出了你的本地宽带公网 IP 或局域网真实拓扑信息。

### 2. IPv6 泄漏与超时的一键关闭方案
目前市面上绝大多数中转机场节点仅提供单栈 IPv4 出口，或者跨省 IPv6 路由绕行极严重（经常导致 AAAA 记录优先连接卡死 5 秒）。在确认节点并未明确提供原生双栈前，建议统一关闭客户端 IPv6 接管与解析：
- **Mihomo 客户端（Clash Verge Rev / FlClash / OpenClash）**：
  1. 在软件「设置 → Clash 设置」中关闭 **IPv6** 开关，并在覆写 YAML 顶层确保写入 `ipv6: false` 与 `dns.ipv6: false`。
  2. 如果开启了 TUN 模式，同时在 `tun` 配置块中确保不包含 `inet6-address`（或仅保留 IPv4 栈），防止系统向虚拟网卡下发默认 IPv6 路由。
- **sing-box 客户端（Hiddify / Karing）**：在客户端设置中将 IPv6 路由模式设为 **`disable`（禁用）** 或出站解析策略设为 **`ipv4_only`**。
- **操作系统兜底（针对极顽固的双栈泄漏）**：在 Windows「控制面板 → 网络和共享中心 → 更改适配器设置 → 当前物理网卡属性」中，取消勾选 **「Internet 协议版本 6 (TCP/IPv6)」**（仅在不需要本地 IPv6 业务时执行）。

### 3. 浏览器 WebRTC 泄漏封堵策略
WebRTC（网页实时通信）用于浏览器视频会议与点对点连接，默认情况下网页脚本可以通过 STUN 服务器绕过 HTTP 系统代理探测设备的真实接口地址（注：开启 TUN 虚拟网卡并在配置中放行真实物理网卡的直连 STUN 时仍可能暴露）。
- **Chrome / Edge 浏览器**：官方原生设置隐藏较深，可安装开源纯净的 **WebRTC Control** 或使用 uBlock Origin 内置的隐私选项勾选 **「禁止 WebRTC 泄露本地 IP 地址」**；企业环境或开发测试也可通过组策略将 `WebRtcIPHandling` 设为 `disable_non_proxied_udp`。
- **Firefox 浏览器**：在地址栏输入 `about:config`，搜索 `media.peerconnection.enabled` 并将其双击改为 `false`（注意：完全禁用后会影响部分网页端腾讯会议、Zoom 网页版或 Discord 语音频道，平时仅需防泄漏建议改用 `media.peerconnection.ice.proxy_only_if_behind_proxy` 设为 `true`）。
- **代理客户端协同**：如果你依赖 TUN 模式访问高风控 AI 平台，确保不要随意把未知海外 STUN 服务器加入直连白名单，保持客户端 UDP 转发通道正常即可拦截绝大部分非代理 UDP 探测包。

---

## 六、本专题三级内容集群与延伸阅读

为了帮助你在不同操作系统和复杂网络架构下彻底解决 DNS 异常、防送中与隐私泄漏问题，本专题划分了以下三个三级（L3）纵深内容集群。点击已发布文档可直接查阅对应配置，标注`待发布选题`的文档正在按排期推进上线：

### 集群 1：Fake-IP 机制、异常断网修复与内网共存
聚焦 TUN/Fake-IP 底层工作原理、跨平台缓存清理以及企业内网/Docker/NAS 域名绕过实战：
- **已发布关联指南**：
  - [TUN 模式与系统代理冲突及关闭代理断网恢复指南](/troubleshooting/tun/)
  - [Clash TUN 网卡与 WSL2 / Docker Desktop 冲突深度修复](/troubleshooting/tun-wsl-docker-conflict/)
  - [TUN 模式深度配置与参数详解](/guides/tun/)
- **规划中三级选题（待发布选题）**：
  - 《Fake-IP vs Redir-Host 底层报文流转全图解：从内核内存表到真实 IP 映射的性能取舍》（`待发布选题`）
  - 《企业办公网、校园网与群晖 NAS 的 `fake-ip-filter` 万能白名单模板与验证脚本》（`待发布选题`）

### 集群 2：国内外分流 DNS 架构与防污染调优
聚焦 Mihomo / sing-box 的 `nameserver-policy`、DoH/DoQ 加密解析及防止国内 CDN 绕路与 DNS 自举死锁：
- **已发布关联指南**：
  - [Clash 配置文件覆写（Merge / Script）完整教程](/guides/clash-config/)
  - [分流规则与路由匹配逻辑深度指南](/guides/routing/)
  - [Mihomo (Clash.Meta) 核心特性与配置说明](/clients/mihomo/)
- **规划中三级选题（待发布选题）**：
  - 《Mihomo `respect-rules` + `nameserver-policy` 零泄漏分流模板实战（告别老旧 `fallback` 架构）》（`待发布选题`）
  - 《sing-box 新版 DNS Rules 语法迁移：如何优雅分离 `local`、`remote` 与 `fakeip` 服务器》（`待发布选题`）

### 集群 3：DNS/IPv6/WebRTC 泄漏检测与 AI/流媒体防送中
聚焦高风控 AI 工具与流媒体平台的地区判定机制，切断一切真实 IP 与归属地旁路泄漏：
- **已发布关联指南**：
  - [ChatGPT 访问报错、IP 风控与地区判定修复](/ai-streaming/chatgpt/)
  - [Claude 账号安全、地区限制与防封号排查](/ai-streaming/claude/)
  - [Netflix 与流媒体解锁原理及自检指南](/ai-streaming/netflix/)
  - [节点全部超时与 DNS `context deadline exceeded` 排障](/troubleshooting/timeout/)
- **规划中三级选题（待发布选题）**：
  - 《Google 与 YouTube 地区“送中”全因拆解：DNS ECS、IPv6 泄漏与 Chrome 定位缓存清理》（`待发布选题`）
  - 《双栈宽带环境下 IPv6 泄漏与 AAAA 超时实测：Windows/macOS/OpenWrt 三端安全关停策略》（`待发布选题`）

---

## 常见问题（FAQ）

### 1. 为什么关闭代理客户端后电脑彻底断网，ping 百度等国内网站返回 198.18.0.x？
这是 Fake-IP 模式异常退出留下的本地 DNS 缓存或网卡 DNS 未还原所致。`198.18.0.0/16` 是代理内核在内存中为域名分配的虚假映射网段，一旦客户端崩溃、蓝屏或被强杀，系统 DNS 缓存和浏览器异步 DNS 缓存仍保留 `198.18.x.x` 记录，或物理网卡 DNS 仍停留在 `127.0.0.1`，刷新 DNS 缓存并恢复自动获取 DNS 即可秒级恢复。

### 2. 开启 TUN 和 Fake-IP 后，公司内网 OA、群晖 NAS 或路由器后台（.local / 192.168.*）打不开怎么办？
这是因为这些私有域名未进入排除列表，被内核拦截并下发了 `198.18.x.x` 假地址，导致请求错发进代理隧道而非局域网。需要在 Mihomo 配置的 `dns.fake-ip-filter` 中添加 `*.lan`、`*.local`、`*.internal` 及公司内网域名后缀，并在 sing-box 中通过 `dns.rules` 将私有域名分流至 `local` 本地解析。

### 3. nameserver、fallback 和 nameserver-policy 有什么区别，为什么全填 8.8.8.8 会导致代理 DNS 解析失败？
在 Mihomo 架构中，`default-nameserver` 用于解析 DoH/DoT 域名本身的 IP（必须填国内纯 IP DNS）；`proxy-server-nameserver` 专门解析机场节点域名（须填国内 DoH）；`nameserver` 通常配置国内加密 DNS 以确保国内 CDN 命中；`nameserver-policy` 则按 `geosite` 精确指定国外域名由代理通道发往海外 DoH，避免把 `8.8.8.8` 直接当国内默认 DNS 引发国内超时或污染。

### 4. 明明节点是美国或日本原生 IP，为什么 YouTube 和 Google 还是经常提示地区在中国大陆（送中）？
除了落地 IP 被标记外，最常见的原因是 DNS 泄漏或携带了本地 EDNS Client Subnet（ECS）信息。如果海外域名被本地宽带 DNS 解析，或向 DoH 服务器发起了携带你真实国内公网 IP 网段的 ECS 查询，Google CDN 会直接根据 DNS 解析来源把你定位到中国大陆。开启 `proxy-server-nameserver` 分离、开启 `respect-rules` 让海外域名走代理通道解析，即可阻断 DNS 送中。

### 5. 什么是 Fake-IP 与 Redir-Host，什么时候应该关闭 Fake-IP 改用 Redir-Host？
Fake-IP 在 DNS 查询瞬间直接返回 `198.18.0.0/16` 假地址，零等待且避免本地 DNS 污染，是日常性能最高的选择；Redir-Host 则向真实 DNS 查询真实 IP 后再根据规则转发。如果你频繁使用需要获取真实目标 IP 的专业内网软件、复杂 P2P 工具、特定银行网银插件或游戏防作弊驱动，且排除了内网域名依然报错，可临时切换至 `redir-host` 模式。

### 6. 怎么检测自己是否发生了 DNS 泄漏、IPv6 泄漏和 WebRTC 泄漏？
在浏览器无痕模式下同时访问 `ipleak.net` 与 `dnsleaktest.com`（运行 Extended Test）。正常状态下的出口 IP、DNS 服务器 ASN 归属以及 WebRTC 检测出的公网地址都应与当前选中的海外节点地区一致；如果 DNS 列表出现 `China Telecom` / `China Unicom` / `China Mobile`，或 IPv6/WebRTC 暴露了你本地宽带的真实 IP，即存在泄漏。

### 7. 浏览器开启了内置“使用安全 DNS（DoH）”功能，和代理客户端 DNS 会冲突吗？
会冲突。在 TUN 或系统代理模式下，如果 Chrome/Edge 强制启用内置的阿里云/腾讯云 DoH，浏览器发起的 HTTPS DNS 请求会绕过代理客户端的常规 UDP 53 劫持或分流策略，导致 Fake-IP 失效、海外规则命中率下降以及潜在的 DNS 泄漏。建议在使用桌面代理客户端时关闭浏览器内置安全 DNS，统一交由客户端内核接管。
