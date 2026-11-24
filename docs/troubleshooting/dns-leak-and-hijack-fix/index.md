---
title: DNS 错误与代理环境下的 DNS 泄漏怎么排查？Fake-IP 残留一键恢复方案
description: 系统排查代理客户端 DNS 解析错误、退出代理后因 198.18.0.0/16 Fake-IP 残留或网卡锁定 127.0.0.1 导致的断网、运营商 DNS 劫持与 Google/YouTube 送中现象。深度讲解 dnsleaktest 泄漏原理、Mihomo nameserver/fallback/respect-rules 配置逻辑及浏览器安全 DNS 冲突清理方案，附一键恢复与验证命令。
lastUpdated: 2026-11-24
author: 代理客户端编辑部
category: 故障排查
tags: [DNS泄漏排查, Fake-IP残留, 198.18.0.0/16, YouTube送中, Mihomo DNS, respect-rules, ipconfig /flushdns]
pillar: troubleshooting
parentTopic: /troubleshooting/dns/
primaryKeyword: 代理 DNS 错误与泄漏怎么排查
searchIntent: Troubleshooting
schemaType: TechArticle
relatedSlugs: ["/troubleshooting/dns/", "/guides/tun/", "/ai-streaming/youtube/", "/guides/clash-config/"]
relatedBrands: []
faq:
  - q: 为什么一退出代理客户端就彻底断网，ping 百度返回 198.18.0.x？
    a: 198.18.0.0/16 是 Mihomo、sing-box 等代理内核在 Fake-IP 模式下用于临时映射域名的保留测试网段。客户端正常退出时会还原网卡设置并交还解析权；一旦遇到系统蓝屏、强杀进程或软件崩溃，Windows 系统 DNS 缓存、浏览器异步主机缓存里仍保留着刚才生成的 198.18.x.x 假地址，或者物理网卡 DNS 被锁死在 127.0.0.1。内核消失后没有程序再能把假地址还原为真实 IP，就会引发全盘断网。执行 ipconfig /flushdns、将网卡 DNS 恢复 DHCP 并清理浏览器缓存即可恢复。
  - q: 代理节点明明是日本或美国，为什么 YouTube 提示“地区不可用”或 Google 定位到了中国大陆（送中）？
    a: 这通常并非节点 IP 本身失效，而是典型的 DNS 泄漏或 EDNS Client Subnet（ECS）暴露导致定位送中。当客户端没有开启 respect-rules，或者把海外域名交给了本地宽带 DNS、国内 DoH 解析，甚至海外 DoH 服务器收到了携带你国内真实公网 IP 网段的 ECS 字段，Google 与 YouTube 的 CDN 调度系统就会依据 DNS 解析来源判定你身处中国大陆，从而返回大陆区域定位或触发服务限制。
  - q: dnsleaktest 显示出了中国电信、联通或移动的 DNS 服务器，代表什么意思？
    a: 正常完整的代理环境下，dnsleaktest 执行扩展测试（Extended Test）所列出的 DNS 解析服务器归属地和运营商 ASN，应当与你当前选中的海外节点地区或主流公共加密 DNS 出口一致。如果结果列表中出现了 China Telecom、China Unicom 或 China Mobile 等国内运营商名称，说明客户端或浏览器在解析海外域名时发生了 DNS 泄漏，查询请求绕开了加密隧道直接从本地宽带 UDP 53 端口明文发出，既存在隐私暴露风险，也极易触发运营商 DNS 劫持和流媒体送中。
  - q: Mihomo 配置中的 nameserver、fallback 和 respect-rules 各自起什么作用？
    a: 在 Mihomo 内核的 DNS 体系里，nameserver 是主查询上游，通常建议填国内加密 DoH 以确保国内站点命中最近的国内 CDN；fallback 是当主 DNS 返回非国内 IP（疑似被污染或属海外地址）时触发的备用海外加密上游组；而 respect-rules 开关决定内核向这些 DNS 服务器发起请求本身是否遵循分流规则。开启 respect-rules 为 true（同时配置好 proxy-server-nameserver 防止自举死循环）后，发往海外 DoH 的查询才会真正经过代理节点出站，从根本上杜绝海外 DNS 泄漏与超时。
  - q: 浏览器开启了“使用安全 DNS（DoH）”功能，为什么会导致代理分流失效甚至产生 DNS 泄漏？
    a: Chrome、Edge 等现代浏览器内置的“安全 DNS”会在浏览器内部直接向指定 DoH 服务商（如阿里云或 Cloudflare）发起 HTTPS 加密的 DNS 查询，完全绕过操作系统的常规 UDP 53 端口监听。在代理客户端的 TUN 模式下，内核原本依靠劫持 53 端口来完成 Fake-IP 分配与域名嗅探；浏览器绕过 53 端口后，代理内核拿不到域名，只能看到目标 IP，不仅导致基于域名的海外分流规则大面积失效，还可能把解析流量暴露给非预期上游。使用桌面代理客户端时应关闭浏览器内置安全 DNS。
  - q: 怎么用本地命令行快速验证 Fake-IP 残留是否彻底清干净，以及当前有没有被运营商劫持？
    a: 在关闭代理的情况下打开 PowerShell，先运行 ipconfig /flushdns，再分别执行 nslookup www.baidu.com 与 nslookup www.baidu.com 223.5.5.5。如果默认 DNS 返回了 198.18.x.x 说明系统缓存或网卡 DNS 仍指向代理内核；如果默认 DNS 与 223.5.5.5 解析出的地址截然不同甚至返回 127.0.0.1 或陌生跳转 IP，则说明当地宽带存在明文 UDP 53 劫持或污染。
---

# DNS 错误与代理环境下的 DNS 泄漏怎么排查？Fake-IP 残留一键恢复方案

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>在代理环境下遇到<strong>“退出客户端后电脑完全断网”</strong>、<strong>“网页提示 DNS 错误无法解析”</strong>，或是<strong>“连着海外节点但 Google/YouTube 定位送中”</strong>，核心根因几乎全部集中在四个链路节点：异常退出留下的 <code>198.18.0.0/16</code> Fake-IP 缓存与网卡 <code>127.0.0.1</code> 锁死、本地运营商对明文 UDP 53 的 DNS 劫持与污染、客户端缺失 <code>respect-rules</code> 或 <code>nameserver</code>/<code>fallback</code> 配置错位引发的 DNS 泄漏，以及 Chrome/Edge 内置“安全 DNS（DoH）”绕过客户端嗅探。先用 <code>ipconfig /flushdns</code> 结合网卡恢复一键抢救断网，再按本文规范对齐 Mihomo DNS 分流策略并关闭浏览器内置 DoH，即可同时根除断网残留与泄漏送中。</p>
</div>

## 一、症状判断：5 类代理 DNS 异常与泄漏现象速查表

DNS 承担着代理客户端“把域名翻译成路由动作”的第一步决策。一旦 DNS 层发生错位，往往会表现为与“断网”或“节点封锁”极为相似的症状。先对照下表快速定界：

| 典型临床症状 | 本地命令行 / 页面特征 | 核心病灶分类 | 首选修复方向 |
|---|---|---|---|
| **关闭代理客户端后全电脑断网** | 浏览器报 `DNS_PROBE_FINISHED_NXDOMAIN`，`ping` 域名显示 `198.18.0.x` | **Fake-IP 缓存残留或网卡 DNS 锁死 `127.0.0.1`** | 执行 `ipconfig /flushdns` + 恢复网卡 DHCP + 清浏览器缓存 |
| **开着代理时国内网站变慢或打不开，海外也报错** | 内核日志频繁报 `dns resolve failed`、`i/o timeout` | **`nameserver` 误填纯海外 IP 或缺少 `proxy-server-nameserver`** | 用国内加密 DoH 做主解析，分离节点域名解析通道 |
| **海外节点延迟极低，YouTube/Google 却定位在中国大陆** | YouTube 右上角或地区检测显示 CN，部分 AI 服务拒载 | **DNS 泄漏或携带真实网段 ECS 引发“送中”** | 开启 `respect-rules: true` 配合海外 DoH 走代理隧道 |
| **本地直连访问某些站点跳转到广告、反诈或空白页** | `nslookup` 默认解析 IP 与 `223.5.5.5` 返回结果完全不一致 | **运营商本地 UDP 53 劫持与 DNS 污染** | 弃用明文 UDP 53，统一升级为 DoH / DoT 加密上游 |
| **TUN 模式分流规则频繁失灵，外网流量直连漏出** | `dnsleaktest` 跑出国内三大运营商服务器 | **浏览器开启内置安全 DNS（DoH）或 IPv6 泄漏** | 关闭浏览器内置 DoH、停用残缺 IPv6 与清理 WebRTC 暴露 |

如果需要先整体梳理客户端 TUN 模式配置原理或排查基础配置语法，可配合阅读 [DNS 错误与泄漏总览指南](/troubleshooting/dns/)、[TUN 虚拟网卡机制解析](/guides/tun/) 与 [Clash / Mihomo 核心配置结构教程](/guides/clash-config/)。

## 二、原因分类：深度理解 Fake-IP 残留、DNS 劫持与泄漏原理

只有看清数据包在浏览器、网卡驱动和代理内核之间的流转方式，才能彻底明白为什么“修了一个问题却带出另一个问题”。

### 1. `198.18.0.0/16` Fake-IP 缓存残留与 `127.0.0.1` 网卡锁死

在 [Clash Verge Rev](/clients/clash-verge-rev/)、[FlClash](/clients/flclash/) 或 [sing-box](/clients/sing-box/) 开启 TUN 虚拟网卡模式时，绝大多数配置默认启用 **Fake-IP** 模式。`198.18.0.0/16` 是互联网工程任务组保留给网络设备基准测试的专用地址段，不会出现在真实公网中。

当你访问一个网站时，代理内核 intercept（拦截）了本地的 DNS 请求，不等远端真实返回，直接从 `198.18.0.0/16` 池子里顺手挑一个假地址（比如 `198.18.0.42`）回给系统，同时在内核内存里记一笔“`198.18.0.42` = `www.google.com`”。之后浏览器向 `198.18.0.42` 发包时，包落入 TUN 虚拟网卡，内核查表还原出真实域名再做规则分流与代理转发。

**断网是怎么发生的？** 正常退出客户端时，软件会清理虚拟网卡并把物理网卡恢复原状；但如果遭遇强制关机、蓝屏、任务管理器强杀内核进程或软件闪退：
1. Windows DNS 客户端缓存和 Chromium 浏览器的异步主机缓存里，仍然在 TTL 有效期内死死记着 `www.baidu.com -> 198.18.0.42`；
2. 部分客户端在接管系统 DNS 时把物理网卡（如 `WLAN` 或 `以太网`）的首选 DNS 改写成了 `127.0.0.1` 或 `198.18.0.2`，崩掉后没来得及改回自动获取（DHCP）。

此时代理内核已经不在了，没有任何程序认得 `198.18.0.42`，也没有程序在本地 53 端口应答，最终导致“不开代理就全网瘫痪”。

### 2. 运营商 DNS 劫持与明文 UDP 53 污染

传统 DNS 查询通过明文 UDP 53 端口传输，既没有加密也没有身份签名。宽带运营商或中间网关极易在两个层面动手脚：
- **DNS 劫持（Hijacking）**：即使用户在网卡里手动填了 `8.8.8.8` 或 `114.114.114.114`，某些地方宽带网关也会在出口处把所有发往 53 端口的 UDP 数据包强行拦截并转给运营商自己的递归服务器，用于注入纠错广告、统计分析或直接阻断特定站点。
- **DNS 污染（Poisoning）**：针对未走加密通道的海外敏感域名查询，中间链路会抢在真实服务器之前伪造一个错误的公网 IP 或 `127.0.0.1` 返回给你，导致客户端拿到假地址后彻底连不上。

### 3. 代理环境下的 DNS 泄漏与 Google / YouTube “送中”

什么叫 **DNS 泄漏（DNS Leak）**？简单说，就是你的**网页访问流量确实走了海外代理节点**，但你在访问这个网页之前的**域名解析请求（你是谁、你要去哪里）却偷偷从你家宽带的本地网络明文发了出去**。

DNS 泄漏往往会直接引发“**送中**”现象（即虽然挂着日本、新加坡或美国节点，但打开 [YouTube](/ai-streaming/youtube/) 却提示“所在国家/地区不支持此功能”、跳过广告变成中国区定位，或 Google 搜索底部位置显示在中国大陆）：
1. **本地明文泄露**：规则没写对或未开启 `respect-rules`，海外域名由本机本地宽带 DNS 抢先解析，海外权威 DNS 或 CDN 看到查询来自中国大陆宽带出口 IP，直接给你分配了偏大陆或被标记的路由结果。
2. **EDNS Client Subnet（ECS）暴露**：部分加密 DoH/DoT 上游如果默认开启了 ECS 且查询从国内直连发出，DNS 服务器会把你本地宽带的公网 IP 网段前缀附带发送给 Google 权威服务器，Google CDN 据此精准把你的位置锁定在中国大陆，哪怕后续 TCP 连接是从海外落地机发出的，也照样被判定送中。

### 4. Mihomo `nameserver` / `fallback` / `respect-rules` 配置原理错位

在 [Mihomo](/clients/mihomo/) 内核体系中，很多用户把别人共享的配置片段乱拼一气，反而导致解析死锁或泄漏：
- **`default-nameserver`（引导 DNS）**：专门用于解析后面配置的加密 DoH/DoT 服务器**域名本身**（例如把 `dns.alidns.com` 解析出 IP）。这里**只能填纯 IP 地址**（如 `223.5.5.5`、`119.29.29.29`），如果填了域名会直接死循环无法启动。
- **`proxy-server-nameserver`（节点域名专用 DNS）**：专门用于解析机场订阅里节点服务器的域名地址。如果缺少它且主 `nameserver` 又走了代理，就会陷入“为了连上代理节点必须先解析节点域名，为了解析节点域名又必须先连上代理节点”的鸡生蛋死锁。
- **`nameserver` 与 `fallback` 分工**：在经典兼容配置中，`nameserver` 通常放置国内加密 DNS（如阿里 DoH、腾讯 DoH），负责快速拿到国内站点离你最近的 CDN IP；`fallback` 放置海外加密 DNS（如 Cloudflare `1.1.1.1`、Google `8.8.8.8` 的 DoH），配合 `fallback-filter` 在检测到主查询返回非中国大陆 IP 或疑似污染 IP 时采纳海外结果。而在现代精准分流中，更推荐使用 **`nameserver-policy`** 按 `geosite:cn` 与 `geosite:geolocation-!cn` 直接硬分流。
- **`respect-rules: true` 的决定性作用**：这是绝大多数人漏掉的关键开关。如果 `respect-rules` 为 `false`（默认或旧配置常见状态），Mihomo 内核向 `fallback` 或海外 DoH 服务器发起请求时**不会走代理规则**，而是直接从本机宽带直连海外 DNS——结果要么在国内被墙超时，要么在能通的时候把你的解析意图直接暴露在本地出口上。只有开启 `respect-rules: true` 并搭配 `proxy-server-nameserver`，海外 DoH 查询才会安全地穿过你的海外代理节点。

### 5. 浏览器内置安全 DNS（DoH）绕过客户端接管

Chrome 和 Edge 浏览器在隐私设置中默认或诱导开启 **“使用安全 DNS（Use secure DNS）”**。当浏览器选用了内置的 DoH 服务商（如“使用当前服务提供商”或强制阿里云/Cloudflare DoH）时，浏览器会把域名查询打包进自己的 HTTPS 443 连接，**完全跳过操作系统的 DNS 栈和 UDP 53 端口**。

后果立竿见影：在 TUN 模式下，代理客户端原本靠劫持 53 端口才能拦截域名、下发 Fake-IP 并匹配 `DOMAIN-SUFFIX` 规则；浏览器自己走内部 DoH 解析出真实 IP 后，直接拿着 IP 去请求建立连接，导致客户端只看得到目标 IP 看不到域名（若未命中精准 IP 规则或域名嗅探失败，就会把海外站当成直连或彻底超时），甚至在浏览器直接发出未走代理的加密解析请求形成旁路泄漏。

## 三、逐项检查：用命令行与 `dnsleaktest` 定位真实泄漏点

不要凭感觉改配置，按以下三个步骤用客观数据测出到底哪里出问题。

### 第 1 步：检测本地是否残留 Fake-IP 或网卡 DNS 锁死

在**关闭代理客户端**的前提下，打开 PowerShell 运行：

```powershell
# 1. 测试国内常用域名当前在系统层的解析结果（看是否返回 198.18.x.x）
nslookup www.baidu.com

# 2. 查看当前所有已连接网卡的 IPv4 DNS 服务器设置（看是否被锁死为 127.0.0.1 或 198.18.0.2）
Get-DnsClientServerAddress -AddressFamily IPv4 |
  Where-Object { $_.ServerAddresses.Count -gt 0 } |
  Format-Table InterfaceAlias, ServerAddresses -AutoSize
```

**判读要点**：
- 只要 `nslookup` 输出的地址落在 `198.18.0.0/16`（如 `198.18.0.15`）且此时客户端已退出，100% 存在 **Fake-IP 缓存残留**。
- 如果 `ServerAddresses` 列中你的 `WLAN` 或 `以太网` 赫然写着 `{127.0.0.1}` 或 `{198.18.0.2}`，实锤**异常退出导致网卡 DNS 未还原**。

### 第 2 步：交叉对照排查运营商 DNS 劫持

保持本地裸网直连状态，对比默认 UDP 53 解析与指定外部端口/已知干净公共 DNS 的结果（也可用 PowerShell `Resolve-DnsName` 观察详细记录）：

```powershell
# 对比本机默认 DNS 与阿里云公共 DNS（223.5.5.5）解析同一测试域名的返回记录
Resolve-DnsName -Name www.taobao.com -Type A
Resolve-DnsName -Name www.taobao.com -Type A -Server 223.5.5.5

# 额外测试一个常受污染的海外域名，观察本地默认 DNS 返回的假 IP 特征
nslookup www.google.com
```

如果日常域名本地解析返回奇怪的广告 IP、私网地址或明显与 `223.5.5.5` 不一致的服务器，且多次查询 `www.google.com` 每次瞬时返回固定的非 Google 归属 IP（例如 Facebook/Twitter 边缘旧 IP 池或 `127.0.0.1`），即证实本地直连链路存在 **运营商 DNS 劫持或污染**。

### 第 3 步：理解并执行 `dnsleaktest` 泄漏检测原理

开启代理客户端并切换到目标海外节点后，在浏览器无痕模式下访问 `dnsleaktest.com` 或 `ipleak.net`，重点看两项结果：
1. **Standard Test vs Extended Test（扩展测试）**：`dnsleaktest` 的原理是动态生成一串随机子域名（如 `random123.test.dnsleaktest.com`）让你的浏览器去请求解析，然后统计**究竟是哪个上游递归 DNS 服务器的公网出口 IP 真正敲开了它的权威服务器大门**。运行至少 6 轮的 Extended Test，能暴露多上游并发竞速时偷偷溜出去的“备用国内 DNS”。
2. **合格标准**：页面显示的出口公网 IP 应是你代理节点的海外落地 IP；而下方列出的 DNS 服务器列表（ISP / Country 列），应当全部属于海外云厂商、公共加密 DNS（如 Cloudflare、Google、Quad9）或节点同区域机房。**一旦列表里夹杂了 China Telecom、China Unicom、China Mobile 或国内城市名称，即判定发生 DNS 泄漏**。同时可顺带观察页面中的 IPv6 与 WebRTC 检测框，确认没有露出本地宽带分配的真实公网 IPv6 地址或局域网内网地址。

## 四、修复操作：Fake-IP 一键恢复与 Mihomo DNS 防泄漏配置

### 1. Fake-IP 残留与断网一键恢复方案（Windows / 浏览器全清理）

当关闭代理后电脑彻底上不了网时，右键**以管理员身份运行** PowerShell，一次性执行以下命令组恢复系统层解析：

```powershell
# 1. 清空 Windows 系统本地 DNS 解析器缓存（彻底抹除残留的 198.18.0.0/16 记录）
ipconfig /flushdns

# 2. 将常见物理网卡（WLAN 无线网卡 / 以太网有线网卡）恢复为自动获取 DNS（DHCP）
# 注意：如果第 1 步查到的网卡名称叫 "Wi-Fi" 或 "WLAN 2"，请对应替换引号内名称
netsh interface ip set dns name="WLAN" source=dhcp
netsh interface ip set dns name="以太网" source=dhcp

# 3. 保险起见，同时重置可能被修改过的 IPv6 DNS 为自动获取
netsh interface ipv6 set dns name="WLAN" source=dhcp
netsh interface ipv6 set dns name="以太网" source=dhcp

# 4. 立刻验证国内域名是否恢复真实公网 IP 解析
nslookup www.baidu.com
```

**极其容易漏掉的浏览器级清理（解决终端通了但 Chrome 依然打不开）**：
1. 在 Chrome 地址栏输入 `chrome://net-internals/#dns`（Edge 输入 `edge://net-internals/#dns`），点击 **「Clear host cache」**，彻底洗掉浏览器内部异步 DNS 客户端缓存的 `198.18.x.x` 假地址。
2. 紧接着访问 `chrome://net-internals/#sockets`（Edge 对应 `edge://net-internals/#sockets`），点击 **「Flush socket pools」**，断开所有指向废弃假地址的复用连接池。

### 2. 关闭浏览器内置安全 DNS（DoH）与封堵 WebRTC 旁路

为了防止浏览器绕过代理客户端的 DNS 劫持与规则引擎：
1. 打开 Chrome 或 Edge「设置 → 隐私与安全 → 安全」，向下找到 **「使用安全 DNS（Use secure DNS）」**，将其开关**关闭**，让浏览器老老实实把 DNS 查询交给操作系统和代理内核统一调度。
2. 如对隐私匿名度要求极高（如跨境业务或避免局域网/公网 IP 暴露），可在浏览器扩展或高阶设置中控制 WebRTC 仅使用代理接口（Disable non-proxied UDP），并在不需要原生 IPv6 业务时于客户端配置中开启禁用或正确路由 IPv6，避免本地残缺 IPv6 泄漏。

### 3. Mihomo DNS 防污染、防泄漏、防送中配置核心原则

在 [Clash Verge Rev](/clients/clash-verge-rev/) 的订阅覆写（Merge / Script）或核心配置文件中，一套严谨健康的 `dns:` 模块应遵循**“引导纯 IP、节点独立解析、国内外分流、海外开启 `respect-rules`”**四项原则。以下是结构清晰的参考模板原则（可直接对照排查你当前配置缺失了哪一项）：

```yaml
dns:
  enable: true
  ipv6: false                  # 若本地宽带无稳定海外 IPv6 隧道，建议关闭防止泄漏或超时
  listen: 0.0.0.0:1053
  enhanced-mode: fake-ip       # 日常推荐 fake-ip；特殊内网软件不兼容时可切 redir-host
  fake-ip-range: 198.18.0.1/16
  respect-rules: true          # 关键开关：让 DNS 上游连接也遵守分流规则，海外 DoH 走代理隧道

  # 1. 引导 DNS：仅填国内纯 IP，用于解析下方 DoH 域名本身
  default-nameserver:
    - 223.5.5.5
    - 119.29.29.29

  # 2. 节点域名专用 DNS：填国内加密 DoH，防止代理节点域名解析死锁或被运营商污染
  proxy-server-nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query

  # 3. 兜底/直连主 DNS：填国内加密 DoH，保障国内 CDN 就近高速调度
  nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query

  # 4. 精准策略分流（推荐）：明确将海外域名固定指派给海外 DoH，经由 respect-rules 走代理出站
  nameserver-policy:
    "geosite:cn,private":
      - https://dns.alidns.com/dns-query
      - https://doh.pub/dns-query
    "geosite:geolocation-!cn":
      - "https://dns.cloudflare.com/dns-query#PROXY"
      - "https://dns.google/dns-query#PROXY"

  # 5. Fake-IP 排除列表：保护局域网、企业内网与系统联网状态探测（NCSI）
  fake-ip-filter:
    - "*.lan"
    - "*.local"
    - "localhost.ptlogin2.qq.com"
    - "+.msftconnecttest.com"
    - "+.msftncsi.com"
```

*注：若你的配置文件使用旧版 `fallback` 机制而非 `nameserver-policy`，务必确保 `respect-rules: true` 已启用，且在 `fallback` 中填入海外加密 DoH（如 `https://1.1.1.1/dns-query`、`https://8.8.8.8/dns-query`），同时利用 `fallback-filter` 开启 `geoip: true`（`geoip-code: CN`），让非国内结果自动采信经代理出去的海外 DoH，绝不让海外域名裸奔直连。*

## 五、验证结果：四项实测标准确认 DNS 彻底健康

完成修复并重载代理客户端配置后，按顺序运行以下四项验收检查：

1. **断网恢复防复发验证**：退出代理客户端，确认 `nslookup www.baidu.com` 立即返回正常国内运营商/CDN 公网 IP（不再出现 `198.18.x.x`），`Get-DnsClientServerAddress` 显示物理网卡 DNS 已恢复正常路由器网关或设定地址，普通网页直连秒开。
2. **开启代理分流与防送中验证**：重新开启代理及 TUN 模式，访问 `www.youtube.com` 与 `www.google.com`，确认页面地区显示与当前所选节点国家/地区一致，不再出现大陆地区提示或“送中”定位。
3. **`dnsleaktest` 无泄漏验证**：在无痕窗口访问 `dnsleaktest.com` 并运行 Extended Test，确认最终列出的所有 DNS 服务器 ASN 全部归属于海外节点所在地或海外加密 DNS 提供商，列表中彻底消失 `China Telecom` / `China Unicom` / `China Mobile`。
4. **国内站点与内网兼顾验证**：访问国内视频或网盘站点确认依然高速命中本地 CDN，且家里路由器管理页或 `.local` 局域网设备访问不受 Fake-IP 拦截影响。

## 六、常见问题（FAQ）

### 为什么一退出代理客户端就彻底断网，ping 百度返回 198.18.0.x？

198.18.0.0/16 是 Mihomo、sing-box 等代理内核在 Fake-IP 模式下用于临时映射域名的保留测试网段。客户端正常退出时会还原网卡设置并交还解析权；一旦遇到系统蓝屏、强杀进程或软件崩溃，Windows 系统 DNS 缓存、浏览器异步主机缓存里仍保留着刚才生成的 198.18.x.x 假地址，或者物理网卡 DNS 被锁死在 127.0.0.1。内核消失后没有程序再能把假地址还原为真实 IP，就会引发全盘断网。执行 ipconfig /flushdns、将网卡 DNS 恢复 DHCP 并清理浏览器缓存即可恢复。

### 代理节点明明是日本或美国，为什么 YouTube 提示“地区不可用”或 Google 定位到了中国大陆（送中）？

这通常并非节点 IP 本身失效，而是典型的 DNS 泄漏或 EDNS Client Subnet（ECS）暴露导致定位送中。当客户端没有开启 respect-rules，或者把海外域名交给了本地宽带 DNS、国内 DoH 解析，甚至海外 DoH 服务器收到了携带你国内真实公网 IP 网段的 ECS 字段，Google 与 YouTube 的 CDN 调度系统就会依据 DNS 解析来源判定你身处中国大陆，从而返回大陆区域定位或触发服务限制。

### dnsleaktest 显示出了中国电信、联通或移动的 DNS 服务器，代表什么意思？

正常完整的代理环境下，dnsleaktest 执行扩展测试（Extended Test）所列出的 DNS 解析服务器归属地和运营商 ASN，应当与你当前选中的海外节点地区或主流公共加密 DNS 出口一致。如果结果列表中出现了 China Telecom、China Unicom 或 China Mobile 等国内运营商名称，说明客户端或浏览器在解析海外域名时发生了 DNS 泄漏，查询请求绕开了加密隧道直接从本地宽带 UDP 53 端口明文发出，既存在隐私暴露风险，也极易触发运营商 DNS 劫持和流媒体送中。

### Mihomo 配置中的 nameserver、fallback 和 respect-rules 各自起什么作用？

在 Mihomo 内核的 DNS 体系里，nameserver 是主查询上游，通常建议填国内加密 DoH 以确保国内站点命中最近的国内 CDN；fallback 是当主 DNS 返回非国内 IP（疑似被污染或属海外地址）时触发的备用海外加密上游组；而 respect-rules 开关决定内核向这些 DNS 服务器发起请求本身是否遵循分流规则。开启 respect-rules 为 true（同时配置好 proxy-server-nameserver 防止自举死循环）后，发往海外 DoH 的查询才会真正经过代理节点出站，从根本上杜绝海外 DNS 泄漏与超时。

### 浏览器开启了“使用安全 DNS（DoH）”功能，为什么会导致代理分流失效甚至产生 DNS 泄漏？

Chrome、Edge 等现代浏览器内置的“安全 DNS”会在浏览器内部直接向指定 DoH 服务商（如阿里云或 Cloudflare）发起 HTTPS 加密的 DNS 查询，完全绕过操作系统的常规 UDP 53 端口监听。在代理客户端的 TUN 模式下，内核原本依靠劫持 53 端口来完成 Fake-IP 分配与域名嗅探；浏览器绕过 53 端口后，代理内核拿不到域名，只能看到目标 IP，不仅导致基于域名的海外分流规则大面积失效，还可能把解析流量暴露给非预期上游。使用桌面代理客户端时应关闭浏览器内置安全 DNS。

### 怎么用本地命令行快速验证 Fake-IP 残留是否彻底清干净，以及当前有没有被运营商劫持？

在关闭代理的情况下打开 PowerShell，先运行 ipconfig /flushdns，再分别执行 nslookup www.baidu.com 与 nslookup www.baidu.com 223.5.5.5。如果默认 DNS 返回了 198.18.x.x 说明系统缓存或网卡 DNS 仍指向代理内核；如果默认 DNS 与 223.5.5.5 解析出的地址截然不同甚至返回 127.0.0.1 或陌生跳转 IP，则说明当地宽带存在明文 UDP 53 劫持或污染。
