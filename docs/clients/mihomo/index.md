---
title: "Mihomo（原 Clash.Meta）开源内核架构、协议栈与配置详解"
description: "基于 2026-11-23 核验快照，深度解析 MetaCubeX/mihomo 核心架构与演进、VLESS-Reality/Hysteria 2/TUIC v5/AnyTLS/WireGuard/SSH 现代协议栈、Sniffer 域名嗅探原理、Fake-IP vs Redir-Host 内存映射机制、rule-providers（MRS 二进制规则集）与 Smart 策略组，以及桌面端、移动端与 OpenWrt 软路由生态全景。"
lastUpdated: 2026-11-23
schemaType: SoftwareApplication
appName: Mihomo
operatingSystem: Windows, macOS, Linux, Android, OpenWrt
isFree: true
faq:
  - q: "普通桌面和手机用户需要单独下载 Mihomo 内核二进制文件吗？"
    a: "不需要。Mihomo 本身是无图形界面的后台服务核心程序（CLI）。日常电脑用户只需安装 Clash Verge Rev 或 FlClash，安卓用户安装 ClashMetaForAndroid 或 FlClash，软路由用户部署 OpenClash 或 Nikki，这些客户端内部均已集成并自动调度 Mihomo 内核。"
  - q: "Mihomo 与原版 Clash、Clash.Meta 以及 Clash Premium 是什么关系？"
    a: "原版 Clash 与闭源分支 Clash Premium 均已于 2023 年底归档停止维护。Clash.Meta 作为当时最活跃的开源衍生分支承担了社区技术演进任务，随后统一更名为 Mihomo（官方仓库 MetaCubeX/mihomo），成为目前中文代理生态覆盖面最广的现役开源内核。"
  - q: "Mihomo 相比旧版 Clash 内核新增了哪些核心技术与抗封锁协议？"
    a: "Mihomo 突破了早期 Clash 仅支持 SS/VMess/Trojan 的局限，原生支持 VLESS-Reality、Hysteria 2、TUIC v5、AnyTLS、WireGuard 与 SSH 等现代传输协议，并新增了 Sniffer 域名嗅探、.mrs 二进制高效规则集、dialer-proxy 链式代理以及精细化的 Fake-IP/DNS 分流机制。"
  - q: "在 Mihomo 配置中，Fake-IP 和 Redir-Host 两种 DNS 增强模式应该如何选择？"
    a: "Fake-IP 通过向本机返回一个保留虚拟 IP（198.18.0.1/16）并在内存维护域名映射表，能彻底避免本地 DNS 泄漏且域名请求首包延迟极低，是桌面客户端（如 Clash Verge Rev）和日常推荐方案；Redir-Host 直接返回真实解析 IP，对局域网 NAS、PT 下载及部分对虚拟 IP 敏感的硬件环境兼容度更好，但依赖更严谨的远程防污染解析。"
  - q: "为什么建议将传统的文本规则集切换为 .mrs（MRS 二进制规则集）？"
    a: "传统文本格式（YAML/Text）在包含数十万条域名或 CIDR 规则时，需要占用大量内存解析构建匹配树，在低内存的 OpenWrt 路由器或手机后台极易引发内存溢出（OOM）或启动卡顿。MRS 二进制格式采用紧凑的预编译数据结构，可将规则内存占用降低 70% 以上并将冷启动加载时间缩短至毫秒级。"
  - q: "为什么开启 Mihomo 的 Sniffer 域名嗅探后有时会导致部分局域网设备或特殊应用异常？"
    a: "Sniffer 会拦截直连 IP 的 TLS/HTTP 握手包并提取真实域名来覆盖目标地址，从而修正诸如 Telegram 或游戏直接连 IP 绕过域名规则的问题。但如果在配置中未排除内网保留域名（skip-domain）或强制覆盖了某些需要严格校验证书 IP 的特殊系统服务，就可能造成连接异常，因此必须配合 skip-domain 与 parse-pure-ip 边界控制。"
  - q: "如何核查自己正在使用的客户端到底运行的是不是现役 Mihomo 内核？"
    a: "打开客户端的“设置”或“内核/关于”页面查看核心标识与版本号。现役内核通常明确标注为 Mihomo（或保留历史兼容标识 Clash.Meta），版本号多为 v1.18.x 及以上；若依然显示 Clash Premium 或日期停留在 2023 年，则表示内核已严重过时，应立即更换至 Clash Verge Rev 等现役客户端。"
---

# Mihomo（原 Clash.Meta）开源内核架构、协议栈与配置详解

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p><strong>Mihomo</strong>（前身为社区熟知的 <strong>Clash.Meta</strong>，官方源码仓库归属 <code>MetaCubeX/mihomo</code>）是目前中文代理客户端生态中覆盖终端最全、功能演进最活跃的开源规则代理内核（核验日期：<code>2026-11-23</code>）。它向上完整承接并扩展了 Clash YAML 配置与策略组体系，向下原生集成 <strong>VLESS-Reality、Hysteria 2、TUIC v5、AnyTLS、WireGuard 与 SSH</strong> 等现代协议栈，并通过 <strong>Sniffer 域名嗅探</strong>、<strong>Fake-IP / Redir-Host 双模式 DNS</strong>、<strong>MRS 二进制规则集</strong>与链式代理奠定了现代透明代理的技术基石。普通终端用户无需直接操作命令行核心，只需搭配 <a href="/clients/clash-verge-rev/">Clash Verge Rev</a>、<a href="/clients/flclash/">FlClash</a>、<a href="/clients/openclash/">OpenClash</a> 或 <a href="/clients/nikki/">Nikki</a> 等图形前端即可调用其全部能力。</p>
</div>

## 一、 MetaCubeX/mihomo 核心架构、历史演进与基础核验

在 2023 年底原版 Clash 核心及其闭源分支 Clash Premium 宣布停止维护并归档后，开源社区迅速完成了技术代际切换。原本作为 Clash 功能增强开源分支的 **Clash.Meta** 团队正式将项目更名为 **Mihomo**（仓库迁移至 `MetaCubeX/mihomo`），继续以 GPL-3.0 协议推进内核演进。

从系统架构来看，Mihomo 采用纯 Go 语言编写，天然具备优秀的跨平台编译能力与高并发 goroutine 网络调度性能。它本身是一个完全无图形界面（Headless）的网络路由守护进程，所有外部控制均通过标准的 **RESTful External Controller API**（默认监听本地如 `127.0.0.1:9090` 或 `9097`，以及 Unix Socket / Windows Named Pipe）对外暴露。正因为这种“内核引擎与 UI 界面完全解耦”的设计，无论是桌面端的 Tauri/Flutter 前端、Android 的原生客户端，还是 OpenWrt 软路由的 LuCI 网页管理插件与浏览器端面板（如 Metacubexd、Zashboard），都能使用完全一致的接口控制节点切换、实时查看连接日志、测速并热重载配置。

| 项目属性 | 核验结果（核实日期：2026-11-23） |
| --- | --- |
| **内核正式名称** | Mihomo（原名 Clash.Meta） |
| **官方源码仓库** | [GitHub: MetaCubeX/mihomo](https://github.com/MetaCubeX/mihomo) |
| **开发语言与授权** | Go 语言构建，免费开源（GPL-3.0 协议） |
| **支持编译架构** | 全架构覆盖（`amd64` / `arm64` / `armv7` / `mips` / `riscv64` 等，涵盖服务器与嵌入式路由） |
| **版本分支划分** | `Release`（稳定发行版，推荐日常与生产路由使用）、`Alpha`（每日预览版，用于尝鲜新协议与试验性参数） |
| **核心配置文件格式** | Mihomo 扩展 YAML / 向下兼容传统标准 Clash YAML |
| **当前维护状态** | 活跃维护（桌面、安卓与软路由生态的共同底层基石） |

对于使用桌面或手机客户端且不想直接手写命令行脚本的用户，建议先阅读[客户端选型总览](/clients/)或[Clash Verge Rev 使用教程](/clients/clash-verge-rev/)；如果你正在编写或排查 YAML 模板字段，可同时参考[Clash YAML 配置文件结构详解](/guides/clash-config/)。

## 二、 现代抗封锁协议栈与链式代理（`dialer-proxy`）能力

早期旧版 Clash 内核之所以被彻底淘汰，最致命的短板就是协议栈停滞不前，无法应对现代网络环境对传统加密流量的深度特征识别。Mihomo 内核彻底补齐了这一代差，当前已原生内置全套主流抗封锁与高速传输协议：

| 协议类型 | 关键技术特征与支持细节 | 典型适用网络场景 |
| --- | --- | --- |
| **VLESS（XTLS-Vision + Reality）** | 支持无服务器真实证书的 **Reality** 伪装与 `uTLS` 浏览器指纹模拟（`chrome`/`firefox`/`safari`），配合 `xtls-rprx-vision` 流控消除 TLS-in-TLS 特征 | 现代自建 VPS 与高安全性机场主力协议，抗探测能力极强 |
| **Hysteria 2** | 基于 QUIC（UDP）协议栈，原生实现 **Brutal 拥塞控制**与端口跳跃（`ports` 多端口轮换），支持自定义上下行速率限制 | 晚高峰跨境丢包率高、物理链路质量波动大的家用宽带加速 |
| **TUIC v5** | 同样基于 QUIC 的低延迟 0-RTT 握手协议，支持原生 UDP 流量透传与多流复用 | 对首包响应要求极高的即时互动、游戏与移动弱网环境 |
| **AnyTLS** | 面向规避传统 TLS 指纹特征的新一代轻量传输协议，灵活控制握手填充与连接复用策略 | 部分新兴高端服务商用于规避特定端口特征封锁的替代传输方案 |
| **WireGuard** | 原生内核层/用户态集成的现代三层 VPN 隧道，支持直接作为 Clash 节点或通过前置代理串联 | 需要将企业内网、Warp 免费落地节点或静态 VPN 直接纳入分流策略组 |
| **SSH** | 支持直接以远程服务器的 SSH 协议作为代理出站隧道（配置私钥或密码即可转发） | 开发者临时调试远程服务器内网、应急无代理服务端接入 |

### 链式代理（`dialer-proxy`）实战价值

在访问对 IP 纯净度要求极其严苛的 AI 平台（如 [ChatGPT](/ai-streaming/chatgpt/)、[Claude](/ai-streaming/claude/)）或海外银行金融系统时，普通万人共享机场节点的落地 IP 往往因为请求高频而触发人机验证甚至封号；而自己直连购买的一台干净静态住宅 IP 或冷门 VPS，从国内直接直连又往往因为绕路导致晚高峰丢包严重、延迟突破 300ms。

Mihomo 原生提供了极其优雅的 **`dialer-proxy`（前置拨号代理）** 字段，允许直接将“高速中转机场策略组”作为第一跳拨号通道，再在隧道内部嵌套第二跳“干净落地 VPS/住宅节点”：

```yaml
proxies:
  # 第二跳：干净但直连速度慢的静态落地节点（指定 dialer-proxy 走中转组）
  - name: "Clean-US-Landing"
    type: socks5
    server: 203.0.113.10
    port: 1080
    username: "user"
    password: "password"
    dialer-proxy: "HK-Transit-Group" # 指定该节点必须通过前置机场中转组建立连接
```

这种配置无需在服务端额外搭建复杂的转发中转，在本地 Mihomo 核心层即可一键打通“国内 → 高速专线中转 → 干净住宅落地”的双重链路，既兼顾速度又保住账号纯净度。

## 三、 Sniffer 域名嗅探原理与配置边界

在现代网络调试中，常会遇到一个让人困惑的现象：规则里明明写好了 `DOMAIN-SUFFIX,telegram.org,PROXY`，或者配置了某款海外软件域名走代理，但在日志里却发现它直接尝试连接某个境外 IP 而跳过了域名规则，甚至因为直接连向 IP 导致分流失效。

### 1. 为什么会发生“绕过域名规则直接连 IP”？

触发这种现象的常见原因有三类：
1. **应用硬编码 IP 或内置 DNS**：如 Telegram 客户端、部分桌面游戏、BT 下载器以及开启了内置 DoH（DNS-over-HTTPS）的浏览器，它们根本不会向操作系统的本地 DNS 发送域名查询请求，而是直接向目标 IP 发起 TCP/UDP 握手。
2. **连接复用与 HTTP/3（QUIC）**：部分客户端拿到一次解析结果后长期缓存 IP，或者在切换规则后依然对纯 IP 发起 TLS 握手。
3. **DNS 响应被上游前置缓存**：在软路由或复杂双层代理环境下，到达 Mihomo 核心的数据包已经只剩下一个目标 IP 地址，核心的域名匹配引擎面对纯 IP 无从下手。

### 2. Sniffer 如何实现“从数据包中还原域名”？

开启 Mihomo 的 **`sniffer`（域名嗅探）** 模块后，内核在收到发往 `80`（HTTP）、`443`（HTTPS TLS 或 QUIC）等端口的纯 IP 连接请求时，不会立刻放行或套用 IP 规则，而是会先读取连接建立最初的几个握手字节：
- 对于明文 HTTP 请求，直接提取请求头中的 **`Host`** 字段。
- 对于加密 HTTPS/TLS 连接，虽然应用数据是加密的，但握手第一阶段的 **ClientHello 明文扩展字段中包含 `SNI（Server Name Indication）`**，Mihomo 从中提取出真实的域名。
- 对于基于 UDP `443` 的 QUIC 流量，解析其 Initial 数据包提取加密握手前的域名信息。

一旦成功嗅探出域名，若开启了 `override-destination: true`，Mihomo 就会用这个真实域名重新覆盖该连接的目标地址，让后续的 `DOMAIN-SUFFIX`、`GEOSITE` 规则重新精准命中并送入正确的代理节点。

### 3. Sniffer 实用安全配置与边界防踩坑

盲目开启全端口强行嗅探也可能带来副作用（例如破坏某些要求客户端必须以纯 IP 校验的局域网服务或自签名内网设备）。以下是经过验证的生产级安全 Sniffer 片段：

```yaml
sniffer:
  enable: true
  parse-pure-ip: true # 对所有未知纯 IP 请求启用嗅探
  override-destination: true # 用嗅探到的域名覆盖原始目标地址以命中域名规则
  sniff:
    HTTP:
      ports: [80, 8080-8880]
      override-destination: true
    TLS:
      ports: [443, 8443]
    QUIC:
      ports: [443]
  # 关键边界：强制跳过容易因域名覆盖导致认证失败的内网或特定服务域名
  skip-domain:
    - "Mijia Cloud" # 小米米家智能家居部分内网控制协议
    - "+.push.apple.com" # 苹果 APNs 推送服务对长连接与 IP 校验敏感
```

## 四、 Fake-IP vs Redir-Host 内存映射机制深度对比

DNS 解析策略是代理内核架构中最核心、也是最容易导致“DNS 泄漏”或“本地软件断网”的环节。在 Mihomo 的 `dns:` 配置块中，`enhanced-mode` 提供了 **`fake-ip`** 与 **`redir-host`** 两种核心模式，理解它们在内存中的工作机制差异，是排查 80% 网络疑难杂症的基础。

### 1. Fake-IP（虚拟地址池映射）工作流

当启用 `enhanced-mode: fake-ip` 时，Mihomo 根本不会在客户端查询海外域名的真实外网 IP。
1. 当浏览器访问 `www.google.com` 并向本地 Mihomo DNS（如 `1053` 端口）发出查询时，核心**不向上游等待真实 DNS 返回**，而是直接从预设保留网段（默认 `198.18.0.1/16`，这是一个 RFC 2544 基准测试专用保留段，公网不会使用）中分配一个空闲的虚假 IP（例如 `198.18.0.42`）在 1 毫秒内立刻返回给浏览器，同时在内核内存中写入一条映射表记录：`198.18.0.42 <-> www.google.com`。
2. 浏览器拿到 `198.18.0.42` 后立刻发起 TCP 连接，数据包进入 Mihomo TUN 网卡或透明代理端口。
3. Mihomo 查一下内存映射表，瞬间知道 `198.18.0.42` 原本对应的是 `www.google.com`，于是直接按照**域名规则**匹配，并将 `www.google.com` 这个域名（而非 IP）发给远程代理节点，由远端海外服务器去完成最终 DNS 解析与连接。

### 2. Redir-Host（真实地址逆向映射）工作流

当启用 `enhanced-mode: redir-host` 时，Mihomo 必须老老实实地先通过配置的 `nameserver` 或 `fallback`（通常需走 DoH/DoT 加密 DNS 防止污染）把 `www.google.com` 的**真实公网 IP**（如 `142.250.xxx.xxx`）查回来，同时也在内存中记录一张“真实 IP 与域名的临时对照表”再返还给系统，接着再由核心匹配规则决定直连或转发。

### 3. 两种模式的底层指标对比与选型结论

| 对比维度 | Fake-IP 模式（桌面与日常首选） | Redir-Host 模式（特定局域网与兼容需求） |
| --- | --- | --- |
| **DNS 首包响应延迟** | **极快（<1ms 内存即刻返回）**，无需等待远程加密 DNS 往返 | 较慢（必须等待真实 DoH/DNS 查询完成才能返回 IP） |
| **防 DNS 泄漏能力** | **极强**：海外域名完全不经过本地真实 IP 查询，零污染与零泄漏 | 依赖复杂的 `nameserver-policy` 与 `fallback` 过滤配置，配置不当易泄漏 |
| **规则匹配命中率** | 极高，内存天然保留完整的原始域名映射 | 若应用绕过本地缓存或使用同 IP 多域名（CDN），逆向查找域名容易失真 |
| **本地内存与状态依赖** | 重启内核后内存映射表清空，部分常驻程序旧连接若仍拿着老 Fake-IP 会断开重连 | 返回真实公网 IP，内核重启或临时关闭代理后，已建立的连接及缓存依然有效 |
| **特殊环境兼容痛点** | 必须维护完善的 **`fake-ip-filter`**，否则导致 QQ 快速登录、微软联网感叹号或 Docker 异常 | 对 PT 挂机下载、局域网 NAS 多端口校验与游戏主机（Switch/PS5）极其友好 |

> [!TIP] Fake-IP 模式下不可缺少的 `fake-ip-filter` 必加列表
> 在开启 `fake-ip` 时，千万不要遗漏 `fake-ip-filter`（即不返回虚假 IP、必须返回真实 IP 的域名白名单）。典型必须加入白名单的项目包括：
> - 局域网与系统探测：`*.lan`、`*.local`、`+.msftconnecttest.com`、`+.msftncsi.com`（否则 Windows 任务栏右下角会显示“无 Internet 访问”小地球图标）
> - 本机回环与快捷登录：`localhost.ptlogin2.qq.com`（否则电脑端浏览器无法一键快捷登录 QQ 空间/腾讯文档）
> - NTP 时间同步域名：`time.*.com`、`ntp.*.com`（确保系统校时不经由 Fake-IP 导致死锁）
> - 开发者容器网桥：参见[TUN 与 WSL2/Docker 冲突修复指南](/troubleshooting/tun-wsl-docker-conflict/)。

## 五、 `rule-providers`（MRS 二进制规则集）与 Smart 策略组实战

随着互联网生态扩展，一套完整的分流规则（如包含全量中国大陆域名、广告屏蔽库、主流流媒体与 AI 服务集合）动辄包含十万至三十万条记录。如果按照早期的做法直接把所有规则写死在 `rules:` 文本列表中，不仅配置文件体积突破十几兆，在软路由上每次重启更是要消耗数十秒构建字典树与几百兆内存。

### 1. MRS 二进制规则集的技术优势与标准配置

Mihomo 推出的 **`.mrs`（Mihomo Rule Set）** 二进制预编译规则集彻底解决了性能瓶颈。由服务端提前将纯文本域名库与 IP-CIDR 段编译为紧凑的二进制数据结构，内核启动时直接做内存映射加载，加载耗时由秒级压缩至十毫秒级别，内存占用降幅可达 70% 至 85%，尤其利好内存仅有 256MB–512MB 的家用硬路由和嵌入式 OpenWrt 设备。

在配置文件的 `rule-providers:` 模块中，标准配置范式如下（可配合 `rules:` 中的 `RULE-SET` 语法调用）：

```yaml
rule-providers:
  # 域名类二进制规则集示例（behavior 必须与规则集编译类型一致：domain 或 ipcidr）
  openai_mrs:
    type: http
    behavior: domain
    format: mrs
    path: ./ruleset/openai.mrs
    url: "https://example.com/ruleset/openai.mrs" # 替换为可信开源规则仓库地址
    interval: 86400 # 每 24 小时自动检查增量更新

  cn_ip_mrs:
    type: http
    behavior: ipcidr
    format: mrs
    path: ./ruleset/cn_ip.mrs
    url: "https://example.com/ruleset/cn_ip.mrs"
    interval: 86400

rules:
  - RULE-SET,openai_mrs,AI-Group
  - RULE-SET,cn_ip_mrs,DIRECT,no-resolve
  - MATCH,Proxy
```

*(提示：`format: mrs` 目前严格限定 `behavior` 为 `domain` 或 `ipcidr` 两种单一维度类型；若规则集混杂了 `PROCESS-NAME` 或多维度关键字，仍需使用 `behavior: classical` 搭配 `format: yaml` 或 `text`。更多规则语法细节请查阅[分流规则原理与策略组指南](/guides/routing/)。)*

### 2. 策略组机制与 Smart 智能调度实践

在 `proxy-groups:` 策略组编排中，Mihomo 除了保留经典的 `select`（手动切换）、`url-test`（按延迟测速自动选优）、`fallback`（按顺序故障转移）与 `load-balance`（负载均衡）之外，近年来还演进出了引入历史质量加权评估的智能调度思路：

- **常规测速组（`url-test`）的隐藏陷阱**：传统 `url-test` 仅仅每间隔 5 分钟对测试 URL 发一次请求，哪个节点延迟低就切谁。但在实际晚高峰期间，某些节点虽然 ICMP/HTTP 探针延迟只有 40ms，实际大流量下载却严重丢包甚至频繁断流，导致策略组在两个节点之间反复横跳、切断长连接（如 SSH、游戏与视频通话）。
- **合理的滞后容差（`tolerance`）与智能加权调优**：在日常配置 `url-test` 时，务必配置合理的 `tolerance: 50` 或 `100`（只有当备选节点比当前节点快超过 50–100 毫秒时才执行切换，避免无意义抖动）；对于下载与大文件传输，可将多个同地区优质专线配置在带有一致性哈希（`strategy: consistent-hashing`）的 `load-balance` 组中，保证同一目标网站始终命中同一出口 IP 而不触发登录态失效；在实验性或支持权重调度的分支场景中，也可结合 `smart` 策略参数让核心依据历史丢包率与连接成功率平滑择优。

## 六、 搭载 Mihomo 的全平台 GUI 与软路由生态全景表

如开篇所述，绝大多数终端用户不需要直接与 Mihomo 的命令行打交道。目前几乎所有主流操作系统上都有体验极其成熟的开源图形前端帮你管理内核升级、配置文件热重载与托盘控制：

| 所属平台 | 推荐图形客户端 / 套件 | 核心优势与生态定位 | 适用边界与注意事项 | 详细教程入口 |
| --- | --- | --- | --- | --- |
| **Windows / macOS / Linux** | **Clash Verge Rev** | 基于 Tauri 2 框架，内存仅 50–120MB；原生内置 Service Mode TUN 提权与 Merge/Script 覆写引擎 | Windows 精简版系统需确认已装 WebView2；切勿与已归档的 CFW 混淆 | [Clash Verge Rev 教程](/clients/clash-verge-rev/) |
| **Win / Mac / Linux / Android** | **FlClash** | 基于 Flutter 开发，跨桌面与手机端操作界面完全一致，内置 WebDAV 配置同步 | 规则覆写自定义深度略逊于 Clash Verge Rev，但新手上手成本极低 | [FlClash 客户端教程](/clients/flclash/) |
| **Windows / macOS / Linux** | **v2rayN** | 支持多核并发调度，可在 Xray、sing-box 与 Mihomo 之间按配置自由切换 | 适合以 Base64 节点管理为主、偶尔运行 Clash YAML 自定义配置的用户 | [v2rayN 多核心教程](/clients/v2rayn/) |
| **Android** | **ClashMetaForAndroid (CMFA)** | 官方 MetaCubeX 团队维护，分应用代理（白名单/黑名单）与覆写设置最为完善 | 需注意从 GitHub 官方库下载 APK，并在国产手机系统开启电池优化白名单 | [CMFA 安卓教程](/clients/clash-meta/) |
| **OpenWrt 软路由（全版本）** | **OpenClash** | LuCI 网页图形功能最全，兼容旧版 `fw3 (iptables)` 与新版 `fw4 (nftables)` | 插件脚本逻辑较庞大，安装前需先检查 `dnsmasq-full` 等底层依赖 | [OpenClash 软路由教程](/clients/openclash/) |
| **OpenWrt 软路由（24.10+）** | **Nikki（原 MihomoTProxy）** | 专为现代 OpenWrt 打造的极简原生 `nftables` TProxy/TUN 透明代理套件 | **硬性要求 OpenWrt 24.10 及以上版本**，旧版固件切勿强行安装 | [Nikki 软路由教程](/clients/nikki/) |

### Linux 无桌面服务器 / Docker 命令行校验与部署流程（高阶）

如果你正在一台无图形界面的 Ubuntu/Debian 服务器或旁路由容器上直接运行 Mihomo 二进制文件，每次修改 `config.yaml` 后务必先执行内置的语法校验命令，确认无误再重启 `systemd` 服务：

```bash
# 1. 下载对应 CPU 架构的官方 release 二进制文件并解压赋权（以 amd64 为例）
gzip -d mihomo-linux-amd64-*.gz
chmod +x mihomo-linux-amd64-*
sudo mv mihomo-linux-amd64-* /usr/local/bin/mihomo

# 2. 赋予普通用户运行 TUN 模式所需的网络管理能力（可选，免 root 启动）
sudo setcap cap_net_admin,cap_net_bind_service=+ep /usr/local/bin/mihomo

# 3. 验证配置文件语法与字段兼容性（-t 表示仅测试不真正接管端口）
mihomo -t -d /etc/mihomo -f /etc/mihomo/config.yaml
# 预期正常输出：configuration file /etc/mihomo/config.yaml test is successful
```

### 常见内核报错诊断对照表

| 内核报错日志特征 | 常见触发根因 | 快速排查与修复方法 | 延伸指南 |
| --- | --- | --- | --- |
| `Parse config error: proxy type [xxx] is not supported` | 客户端错误地加载了旧版 Clash Premium 内核，而非现役 Mihomo | 检查客户端设置里的内核切换项，切回 `Mihomo (Clash.Meta)` 最新稳定版 | [Clash Verge Rev 核心指南](/clients/clash-verge-rev/) |
| `start TUN failed: operation not permitted` | 在 Linux/macOS/Windows 下未获得创建虚拟网卡的系统管理员或 `CAP_NET_ADMIN` 权限 | Windows 启用 Service Mode；Linux 执行 `setcap` 赋权或使用 `sudo` 启动 | [TUN 模式不生效排查](/troubleshooting/tun/) |
| `GeoIP/GeoSite file not found` 或拉取规则集超时 | 首次启动缺少内置数据库，且直连 GitHub CDN 拉取规则集被当地网络阻断 | 检查工作目录是否存在 `Country.mmdb` / `geoip.dat`，或配置 `geox-url` 使用可信镜像源 | [启动失败与依赖处理](/troubleshooting/startup/) |
| 开启 Fake-IP 后局域网主机、Docker 容器或部分国内 App 失联 | 未将局域网私有域名、容器网段及探测域名加入 `fake-ip-filter` 与 `route-exclude-address` | 补齐 `fake-ip-filter` 排除 `*.lan`、`*.local`、微软/腾讯探测域名并排除 Docker 网段 | [TUN 与 WSL2/Docker 冲突](/troubleshooting/tun-wsl-docker-conflict/) |

## 本专题三级内容集群与延伸阅读

为了帮助你在“理解内核机理 → 编写与优化配置 → 落地全平台与软路由部署”的路径上建立完整知识网络，以下梳理三个核心三级延伸专题集群：

### 集群一：Mihomo 内核架构与现代协议栈科普
- **已发布关联指南**：
  - [Clash YAML 配置文件结构与核心字段详解](/guides/clash-config/)：全面拆解 `proxies`、`proxy-groups`、`dns`、`sniffer` 与 `tun` 字段层级关系。
  - [2026 订阅格式识别与转换原则](/guides/subscription-formats-explained/)：理解 Clash/Mihomo YAML 与 Base64、sing-box JSON 之间的转换安全规范。
  - [路由线路技术科普（IEPL / IPLC / 延迟与倍率）](/routes/)：将内核协议选择与后端跨国物理线路特征结合评估。
- **规划中待发布选题**（纯文本预告，后续上线）：
  - 《Mihomo `dialer-proxy` 链式代理完全实战：用低价中转机场稳定拉取静态住宅落地 IP》（待发布选题）
  - 《Hysteria 2 与 TUIC v5 参数在 Mihomo 中的精细化调优：`up/down` 带宽标定与端口跳跃防 QOS 指南》（待发布选题）

### 集群二：DNS、Sniffer 嗅探与 MRS 二进制规则集深度调优
- **已发布关联指南**：
  - [分流规则原理与自定义策略组配置](/guides/routing/)：掌握 `RULE-SET`、`DOMAIN-SUFFIX`、`GEOIP` 与 `no-resolve` 的优先级逻辑。
  - [TUN 模式深度配置与虚拟网卡工作原理](/guides/tun/)：对比 `system`、`gvisor` 与 `mixed` 三种网络栈在内核层的包处理差异。
  - [DNS 污染排查与防泄漏验证指南](/troubleshooting/dns/)：排查 Fake-IP 与 Redir-Host 切换后依然出现海外网站打不开或直连泄漏的成因。
  - [TUN 与 WSL2 / Docker 虚拟网桥冲突修复方案](/troubleshooting/tun-wsl-docker-conflict/)：开发者高频痛点的一站式排除配置模板。
- **规划中待发布选题**（纯文本预告，后续上线）：
  - 《将旧版数万行文本规则无损迁移至 `.mrs` 二进制规则集：内存对比测试与自动编译工作流》（待发布选题）
  - 《Mihomo `sniffer` 嗅探与 `fake-ip-filter` 生产环境防踩坑清单（含国内银行、网游、IoT 设备排除）》（待发布选题）

### 集群三：搭载 Mihomo 的全平台 GUI 与 OpenWrt 软路由生态
- **已发布关联指南**：
  - [Clash Verge Rev（Win/Mac/Linux 主力桌面端）](/clients/clash-verge-rev/)与[FlClash（全平台极简端）](/clients/flclash/)：桌面与跨平台开箱方案。
  - [ClashMetaForAndroid / CMFA（安卓官方系）](/clients/clash-meta/)：Android 手机端完整规则兼容实现。
  - [OpenClash（全版本软路由插件）](/clients/openclash/)与[Nikki（OpenWrt 24.10+ 新一代插件）](/clients/nikki/)：家庭旁路由与主路由透明代理部署指南。
  - [sing-box 核心与生态对比](/clients/sing-box/)：横向对比当前另一大主流开源内核的设计哲学与资源取舍。
- **规划中待发布选题**（纯文本预告，后续上线）：
  - 《OpenWrt 软路由内核之争：OpenClash（Mihomo）vs Nikki（MihomoTProxy）vs HomeProxy（sing-box）内存与吞吐实测》（待发布选题）

## 常见问题（FAQ）

### 普通桌面和手机用户需要单独下载 Mihomo 内核二进制文件吗？

不需要。Mihomo 本身是无图形界面的后台服务核心程序（CLI）。日常电脑用户只需安装 [Clash Verge Rev](/clients/clash-verge-rev/) 或 [FlClash](/clients/flclash/)，安卓用户安装 [ClashMetaForAndroid](/clients/clash-meta/) 或 FlClash，软路由用户部署 [OpenClash](/clients/openclash/) 或 [Nikki](/clients/nikki/)，这些客户端内部均已集成并自动调度 Mihomo 内核。

### Mihomo 与原版 Clash、Clash.Meta 以及 Clash Premium 是什么关系？

原版 Clash 与闭源分支 Clash Premium 均已于 2023 年底归档停止维护。Clash.Meta 作为当时最活跃的开源衍生分支承担了社区技术演进任务，随后统一更名为 Mihomo（官方仓库 `MetaCubeX/mihomo`），成为目前中文代理生态覆盖面最广的现役开源内核。

### Mihomo 相比旧版 Clash 内核新增了哪些核心技术与抗封锁协议？

Mihomo 突破了早期 Clash 仅支持 SS/VMess/Trojan 的局限，原生支持 `VLESS-Reality`、`Hysteria 2`、`TUIC v5`、`AnyTLS`、`WireGuard` 与 `SSH` 等现代传输协议，并新增了 Sniffer 域名嗅探、`.mrs` 二进制高效规则集、`dialer-proxy` 链式代理以及精细化的 Fake-IP/Redir-Host 分流机制。

### 在 Mihomo 配置中，Fake-IP 和 Redir-Host 两种 DNS 增强模式应该如何选择？

Fake-IP 通过向本机返回一个保留虚拟 IP（`198.18.0.1/16`）并在内存维护域名映射表，能彻底避免本地 DNS 泄漏且域名请求首包延迟极低，是桌面客户端（如 Clash Verge Rev）和日常推荐方案；Redir-Host 直接返回真实解析 IP，对局域网 NAS、PT 下载及部分对虚拟 IP 敏感的硬件环境兼容度更好，但依赖更严谨的远程防污染解析。

### 为什么建议将传统的文本规则集切换为 .mrs（MRS 二进制规则集）？

传统文本格式（YAML/Text）在包含数十万条域名或 CIDR 规则时，需要占用大量内存解析构建匹配树，在低内存的 OpenWrt 路由器或手机后台极易引发内存溢出（OOM）或启动卡顿。MRS 二进制格式采用紧凑的预编译数据结构，可将规则内存占用降低 70% 以上并将冷启动加载时间缩短至毫秒级。

### 为什么开启 Mihomo 的 Sniffer 域名嗅探后有时会导致部分局域网设备或特殊应用异常？

Sniffer 会拦截直连 IP 的 TLS/HTTP 握手包并提取真实域名来覆盖目标地址，从而修正诸如 Telegram 或游戏直接连 IP 绕过域名规则的问题。但如果在配置中未排除内网保留域名（`skip-domain`）或强制覆盖了某些需要严格校验证书 IP 的特殊系统服务，就可能造成连接异常，因此必须配合 `skip-domain` 与 `parse-pure-ip` 边界控制。

### 如何核查自己正在使用的客户端到底运行的是不是现役 Mihomo 内核？

打开客户端的“设置”或“内核/关于”页面查看核心标识与版本号。现役内核通常明确标注为 `Mihomo`（或保留历史兼容标识 `Clash.Meta`），版本号多为 `v1.18.x` 及以上；若依然显示 `Clash Premium` 或日期停留在 2023 年，则表示内核已严重过时，应立即更换至 [Clash Verge Rev](/clients/clash-verge-rev/) 等现役客户端。
