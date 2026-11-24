---
title: "Clash YAML 配置详解：Mihomo 六大核心模块、DNS 防泄漏架构与语法校验"
description: "深度拆解现代 Mihomo（Clash.Meta）与 Clash 标准 YAML 配置文件的六大核心模块（基础入站、DNS 解析、Sniffer 域名嗅探、proxies 节点池、proxy-groups 策略组、rules 分流规则），提供生产级可校验模板与语法排错手册。"
lastUpdated: 2026-11-23
schemaType: TechArticle
faq:
  - q: "编辑 Clash YAML 配置文件时最容易触发哪些语法报错？"
    a: "YAML 语言对缩进与标点极其严苛。最高频的四大低级错误是：第一，使用了 Tab 制表符而非半角空格缩进（YAML 强制要求纯空格，通常为 2 空格层级）；第二，冒号 `:` 与后面的值之间漏写了半角空格；第三，节点名称或密码包含特殊字符（如方括号、冒号、井号或 Emoji）却未用英文双引号包裹；第四，在 proxy-groups 策略组中引用了 proxies 列表里根本不存在的节点名。"
  - q: "为什么导入含 VLESS、Hysteria 2 或 AnyTLS 节点的 YAML 时提示 unsupported proxy type？"
    a: "这是因为你正在使用的客户端底层仍是 2023 年底已停更的原版 Clash 或 Clash Premium 旧内核，旧内核仅认识 SS、VMess 和 Trojan。根据本站 2026-11-23 品牌资料库快照，微风网络、大佬云、星岛梦、隐形人等主流服务商均已广泛采用 VLESS、AnyTLS 或 Hysteria 2 协议。只需将客户端升级为搭载 Mihomo（原 Clash.Meta）内核的 Clash Verge Rev、FlClash、CMFA 或 OpenClash Meta 内核即可原生解析。"
  - q: "配置文件里的 dns 模块为什么这么复杂？直接把 dns: enable 改成 false 行不行？"
    a: "在仅开启系统代理（HTTP/SOCKS 端口）且只用浏览器上网时，关闭内置 dns 尚能勉强工作；但只要开启了 TUN 虚拟网卡模式或依赖 GEOSITE/GEOIP 精细分流，关闭 dns 模块会导致虚拟网卡无法响应 53 端口劫持请求，直接造成全机断网或严重的本地运营商 DNS 污染与隐私泄漏。完善的 dns 配置是现代代理防污染与零延迟匹配的核心基石。"
  - q: "DNS 配置中的 default-nameserver、nameserver 和 proxy-server-nameserver 各自负责解析什么？"
    a: "这三个字段构成了防死锁的三层解析链：default-nameserver 必须填写纯 IP 格式的 DNS（如 223.5.5.5），专门用来解析后面加密 DoH/DoT 域名本身；proxy-server-nameserver 专门用来解析你机场代理节点服务器的入口域名（避免节点域名走代理产生鸡生蛋死锁）；而 nameserver 则是日常解析普通国内与未知域名的主力加密 DoH 服务器。"
  - q: "什么是 sniffer（域名嗅探）？为什么开启它能解决部分软件分流失效的问题？"
    a: "许多桌面软件、手游或内嵌硬编码 DNS 的程序在发起连接时，不经过系统 DNS 查询，而是直接向目标的纯公网 IP 发起 TCP/TLS 握手。如果未开启 sniffer，代理内核只能看到一串冷冰冰的 IP 地址，导致所有基于域名的规则（如 DOMAIN-SUFFIX,openai.com 或 GEOSITE,netflix）全部失效。开启 sniffer 后，内核会从 TLS 握手的 ClientHello (SNI) 或 HTTP Host 头中逆向提取出真实目标域名，重新交回域名规则表精准匹配。"
  - q: "proxy-groups 里的 url-test（自动测速）和 fallback（故障转移）有什么实质区别？"
    a: "两者虽然都会定期访问 generate_204 测速地址，但选点逻辑截然不同：url-test 会把组内所有节点测一遍延迟，自动切换到延迟最低（加上 tolerance 容差）的那个节点；而 fallback 则是严格按照你在列表里书写的先后顺序排队，只要排在第一位的节点没断网，哪怕它延迟高一点也一直用它，只有当第一顺位节点彻底超时挂掉时，才自动顺延切换到第二顺位节点。"
  - q: "修改完本地 YAML 配置文件后，如何在启动客户端前快速验证语法是否正确？"
    a: "最权威的方法是在终端调用 Mihomo 核心自带的静态测试命令：`mihomo -t -f ./config.yaml`。如果屏幕输出 `test is successful`，代表 YAML 缩进、字段类型、节点协议参数以及策略组与规则的引用关系 100% 合法；如果写错，终端会直接打印出错的具体行号（line X）与原因。"
---

# Clash YAML 配置详解：Mihomo 六大核心模块、DNS 防泄漏架构与语法校验

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>想要真正掌握 <strong>Clash 配置</strong>与现代 <strong>Mihomo 配置文件详解</strong>，核心在于看懂一个网络数据包进入客户端后的六步处理流水线：一份标准的 YAML 配置文件由<strong>① 基础入站与全局参数（<code>mixed-port</code> / <code>tun</code>）、② <code>dns</code> 防污染解析引擎、③ <code>sniffer</code> 流量域名嗅探器、④ <code>proxies</code> 出站节点池、⑤ <code>proxy-groups</code> 策略组调度器，以及 ⑥ 自上而下顺序匹配的 <code>rules</code> 分流规则表</strong>六大模块组成。理清这六大模块的字段规范与数据流向，不仅能让你一眼看穿任何机场下发的订阅配置是否规范，更能在遇到 DNS 泄漏、节点协议报错或分流失灵时精准定位病灶。</p>
</div>

## 一、为什么现代 Clash 配置已全面转向 Mihomo（Clash.Meta）规范？

在深入阅读 YAML 代码之前，必须先厘清一个关键的背景演进：2023 年 11 月原版 Clash（含闭源 Clash Premium 内核）仓库归档停更后，整个开源社区的规则生态与图形客户端（包括桌面端的 [Clash Verge Rev](/clients/clash-verge-rev/)、[FlClash](/clients/flclash/)，安卓端的 [Clash Meta for Android](/clients/clash-meta/)，以及软路由端的 [OpenClash](/clients/openclash/) 与 [Nikki](/clients/nikki/)）已全面统一到开源的 **[Mihomo 内核（原名 Clash.Meta）](/clients/mihomo/)** 之上。

如果你对照本站 **2026-11-23 品牌实测资料库快照**就会发现，当前主流机场服务商下发的节点协议早已超越了传统 Clash 仅支持的 Shadowsocks、VMess 与 Trojan：
- 例如 [微风网络](/brands/weifeng/)、[大佬云](/brands/dalaoyun/)、[光速云](/brands/guangsuyun/)、[萤火虫](/brands/firefly/)、[龙猫云](/brands/lingmao/) 等品牌广泛下发 **`VLESS`（含 `XTLS-RPRX-Vision` 流控与 `Reality` 伪装）**；
- [星岛梦](/brands/xingdaomeng/)、[隐形人](/brands/yinxingren/)、[尔湾云](/brands/ermao/)、[Sora云](/brands/sogo/)、[山月](/brands/shanyue/) 等品牌在多档套餐中采用 **`AnyTLS`** 或新式 **`Trojan` / `Shadowsocks 2022`**；
- 大量针对跨境高丢包宽带优化的线路则采用基于 QUIC 的 **`Hysteria 2`** 或 **`TUIC v5`**。

同时，现代 Mihomo YAML 在配置架构上引入了三大革命性升级：**原生 `sniffer` 域名嗅探模块**、**多层级防死锁 `dns` 策略（`nameserver-policy` 与 `proxy-server-nameserver`）**，以及**内存占用降低 80% 以上的 `.mrs` 二进制规则集（`rule-providers`）**。下面我们将按照数据包在内核中的真实流转顺序，逐一拆解这六大核心模块。

---

## 二、数据包在 YAML 六大模块中的流转全景

当你的浏览器、终端命令或手机 App 发出一个网络请求时，Mihomo 内核严格按照以下 6 个阶段读取 YAML 配置文件并做出转发决策：

| 流转阶段 | 对应 YAML 顶级字段 | 核心职责说明 | 配置不当引发的典型故障 |
| --- | --- | --- | --- |
| **第 1 站：入站接管** | `mixed-port` / `tun` / `mode` | 监听本地 HTTP+SOCKS5 混合端口（如 `7897`）或创建 L3 虚拟网卡截获全机 IP 数据包 | 端口与本地其他软件冲突导致启动失败；`allow-lan: true` 在公网环境未设认证导致被扫端口 |
| **第 2 站：DNS 拦截与分配** | `dns` (`fake-ip` / `redir-host`) | 拦截端口 53 的域名查询请求，立即返回 `198.18.0.1/16` 虚拟 Fake-IP 或向上游 DoH 请求真实 IP | 缺少 `fake-ip-filter` 导致局域网 NAS、Windows 联网图标感叹号或微信/游戏语音连接异常 |
| **第 3 站：TLS/HTTP 域名嗅探** | `sniffer` | 对绕过本地 DNS、直接向纯 IP 发起的连接嗅探 TLS SNI 或 HTTP Host，还原出真实访问域名 | 客户端 Connections 面板全是纯 IP，导致基于域名的 AI 与流媒体分流规则全部漏匹配 |
| **第 4 站：规则顺序匹配** | `rules` / `rule-providers` | 将还原出的域名、目标 IP 与进程名，从 `rules` 第 1 行往下逐条比对，首条命中即移交对应策略组 | 自定义规则写在了兜底 `MATCH` 下方永远不生效；`GEOIP` 未合理使用 `no-resolve` 触发额外解析耗时 |
| **第 5 站：策略组选点调度** | `proxy-groups` | 接收规则指派的流量，根据手动选择（`select`）、自动延迟测速（`url-test`）或故障转移（`fallback`）选定唯一出站节点 | 引用了不存在的节点名导致配置加载失败；`url-test` 测速周期过短耗费额外连接数 |
| **第 6 站：协议加密出站** | `proxies` / `proxy-providers` | 调用选定节点的服务器地址、端口、UUID/密码、TLS 指纹与传输层参数，建立加密隧道发出流量 | 节点参数缺少引号报错；本地系统时间偏差超过 60 秒导致 VLESS/Trojan TLS 握手失败 |

---

## 三、逐段拆解：现代 Mihomo / Clash YAML 六大核心模块详解

以下我们将一份完整的生产级 YAML 拆解为六个标准段落，逐一说明每个参数的工程含义与配置边界。

### 模块 1：基础入站、运行模式与外部控制（General & Inbound）

配置文件的最顶部定义了内核监听的端口、日志级别、IPv6 开关以及供图形界面（如 Clash Verge Rev 面板或 Yacd/Metacubexd 网页控制面板）调用的 RESTful API 接口：

```yaml
# 1. 基础入站端口与全局运行参数
mixed-port: 7897               # HTTP 与 SOCKS5 混合监听端口（现代客户端常设为 7897 或 7890）
allow-lan: false               # 是否允许局域网其他设备连接本机代理（笔记本在公共 Wi-Fi 下务必设为 false）
bind-address: "*"              # 当 allow-lan 为 true 时绑定的网卡地址
mode: rule                     # 运行模式：rule（规则分流，默认推荐）/ global（全局代理）/ direct（全局直连）
log-level: info                # 日志等级：silent / error / warning / info / debug（日常推荐 info）
ipv6: true                     # 是否开启内核 IPv6 解析与转发支持
unified-delay: true            # 统一延迟计算方法（剔除握手差异，更真实反映 HTTP 往返延迟）
tcp-concurrent: true           # 开启 TCP 并发连接（当域名解析出多个 IP 时并发尝试，显著提升网页首屏速度）
find-process-mode: strict      # 进程匹配模式（开启后才能支持 PROCESS-NAME 按本地软件名分流）
global-client-fingerprint: chrome # 全局 TLS 客户端指纹伪装（模拟 Chrome 浏览器 JA3 指纹，降低协议特征）

# 外部控制器与本地缓存设置
external-controller: 127.0.0.1:9097 # 供 GUI 客户端或 Web 面板通信的 API 地址
secret: ""                     # 若 external-controller 监听 0.0.0.0，必须设置强密码！监听 127.0.0.1 可留空
profile:
  store-selected: true         # 记住上次在策略组中手动选择的节点
  store-fake-ip: true          # 持久化 Fake-IP 映射缓存，避免重启客户端后已打开的网页短暂断连
```

**核心避坑点**：如果你在家庭桌面电脑上开启了 `allow-lan: true` 以便让同一个 Wi-Fi 下的手机或游戏机走电脑代理，请确保路由器防火墙未将端口暴露至公网；若在云服务器或公网环境中运行，必须配置 `authentication: ["用户名:密码"]` 并为 `external-controller` 设置高强度 `secret`，严防成为公开肉鸡代理。

---

### 模块 2：DNS 解析与防污染防泄漏架构（`dns` 核心段落）

`dns` 模块是整份 Clash YAML 配置中技术含量最高、也最容易因配置粗糙导致“国内网站变慢”或“境外 DNS 泄漏”的核心区域。

#### 为什么需要三组不同的 Nameserver？
在现代 Mihomo 架构中，为了彻底解决“节点服务器域名本身怎么解析”“国内网站怎么拿到最近的国内 CDN IP”“国外被污染域名怎么安全解析”这三个矛盾，标准配置会将上游 DNS 划分为四个各司其职的池子：

1. **`default-nameserver`（前置引导 DNS）**：**只能填纯数字 IP**（如阿里 `223.5.5.5`、腾讯 `119.29.29.29`）。它的唯一任务是用来解析你在下方填写的 `https://dns.alidns.com/dns-query` 等加密 DoH 服务器的域名。如果这里填了域名，就会陷入“要解析 DoH 域名却得先连上 DoH”的死锁。
2. **`proxy-server-nameserver`（代理节点入口专属 DNS）**：专门用于解析 `proxies` 列表里各个机场节点服务器自身的入口域名（例如 `hk01.entry.example.com`）。因为绝大多数中转与 IEPL 专线机场（详见[IEPL 专线机场传输原理](/routes/iepl/)）的入口都在中国大陆境内，用国内 DoH 解析节点入口域名既快又不会产生“节点还没连上就想走代理去解析节点域名”的环路。
3. **`nameserver`（主力直连/默认加密 DNS）**：配置国内高可用 DoH/DoT（如阿里 DoH 与 DNSPod DoH），负责日常域名解析。
4. **`nameserver-policy`（按域名分流解析策略）**：指定 `geosite:cn,private` 强制走国内 DoH，从而保证淘宝、B站、网银 100% 拿到本地省内最快的 CDN 节点。而在 `enhanced-mode: fake-ip` 模式下，所有命中境外代理规则的域名根本不需要在本地发起真实公网 DNS 查询，而是由远端落地节点直接解析，从根源上消灭了本地 DNS 污染与 DNS 泄漏（如遇 DNS 故障可参阅[DNS 解析污染与泄漏修复指南](/troubleshooting/dns/)）。

```yaml
# 2. 生产级 DNS 防污染与 Fake-IP 架构
dns:
  enable: true
  ipv6: true
  listen: 0.0.0.0:1053         # 本地 DNS 监听端口
  enhanced-mode: fake-ip       # 推荐 fake-ip（零解析延迟、防污染）；特殊内网开发可改 redir-host
  fake-ip-range: 198.18.0.1/16 # IANA 基准测试保留网段，专门用于分配虚拟 Fake-IP
  use-hosts: true              # 是否读取本机 hosts 文件与下方自定义 hosts
  respect-rules: true          # 让 DNS 查询本身也严格遵循下方 rules 路由规则（需配合 proxy-server-nameserver）

  # Fake-IP 排除名单：名单内的域名不返回 198.18.x.x 假 IP，而是返回真实解析结果
  fake-ip-filter:
    - "*.lan"
    - "*.local"
    - "*.arpa"
    - "localhost.ptlogin2.qq.com"
    - "+.msftconnecttest.com"  # Windows 联网状态探测域名，若返回假 IP 会导致右下角提示“无 Internet”
    - "+.msftncsi.com"
    - "ntp.*.com"              # NTP 时间同步服务器必须返回真实 IP
    - "+.stun.*.*"             # STUN 打洞服务

  # 第一层：纯 IP 引导 DNS（专门用来解析下方 DoH 域名）
  default-nameserver:
    - 223.5.5.5
    - 119.29.29.29

  # 第二层：专门解析机场节点服务器入口域名的 DNS（防死锁）
  proxy-server-nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query

  # 第三层：按域名后缀定向指定 DNS（确保国内站点 100% 走国内纯净 DoH 拿最近 CDN）
  nameserver-policy:
    "geosite:cn,private":
      - https://dns.alidns.com/dns-query
      - https://doh.pub/dns-query

  # 第四层：默认主力加密 DNS
  nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
```

---

### 模块 3：域名嗅探器（`sniffer`）与 TUN 虚拟网卡（`tun`）

为什么开启了 `fake-ip` 之后还需要配置 `sniffer`？因为在真实网络环境中，有两类流量会绕过系统的 DNS 查询：
1. 客户端软件内置了硬编码的 IP 地址或自带加密 DoH（例如 Telegram 客户端、部分移动端 App 或开启了内置安全 DNS 但未走系统栈的浏览器）；
2. 局域网透明网关（如 OpenWrt 软路由）接管来自手机、电视盒子的转发流量时，如果局域网设备的 DNS 缓存尚未过期，设备会直接向缓存的真实公网 IP 发包。

开启 `sniffer` 后，Mihomo 内核会在连接建立的瞬间，从 HTTP 请求的 `Host` 字段或 HTTPS/QUIC 握手的 TLS `ClientHello`（即 SNI 扩展）中提取出目标域名，并用提取到的域名去匹配下方的 `rules` 规则表。

```yaml
# 3. 流量域名嗅探（Sniffer）与 TUN 虚拟网卡
sniffer:
  enable: true
  force-dns-mapping: true      # 对 Redir-Host 流量强制进行嗅探映射
  parse-pure-ip: true          # 对所有未命中域名映射的纯 IP 连接执行主动嗅探
  override-destination: false  # 全局默认不覆写目标地址（仅针对下方 HTTP 或特定场景覆写）
  sniff:
    HTTP:
      ports: [80, 8080-8880]
      override-destination: true
    TLS:
      ports: [443, 8443]
    QUIC:
      ports: [443, 8443]
  skip-domain:                 # 跳过嗅探的白名单（如苹果推送与米家智能家居本地通信）
    - "Mijia Cloud"
    - "+.push.apple.com"

tun:
  enable: false                # 日常按需在 GUI 界面一键开启，或在此设为 true
  stack: mixed                 # TCP 走 system 高性能栈，UDP 走 gvisor 高兼容栈
  dns-hijack:
    - "any:53"
    - "tcp://any:53"
  auto-route: true
  auto-detect-interface: true
  route-exclude-address:       # 排除局域网与容器网段，防 WSL2/Docker 断网
    - 192.168.0.0/16
    - 10.0.0.0/8
    - 172.16.0.0/12
```

*(关于 `tun` 各参数、权限授予与路由表验证的完整细节，请查阅本栏目的兄弟专题[TUN 模式深度配置：虚拟网卡原理、Fake-IP 与 Redir-Host 对比](/guides/tun/)。)*

---

### 模块 4：出站节点池（`proxies`）与远程节点集（`proxy-providers`）

`proxies` 数组存放着所有真实代理服务器的技术凭据。不同协议在 YAML 中拥有各自必填的专属字段。以下列出当前 `2026-11-23` 机场生态中最常见的四大主力协议（`VLESS-Reality`、`Hysteria 2`、`Trojan`、`Shadowsocks`）标准 YAML 结构示例（注：下方服务器地址与密钥均为文档教学占位符，实际使用时由机场订阅自动下发）：

```yaml
# 4. 出站节点列表（四大主流现代协议标准字段示范）
proxies:
  # 示例 A：VLESS + XTLS-RPRX-Vision + Reality（微风网络、大佬云、光速云等常见协议架构）
  - name: "HK-香港IEPL-01"
    type: vless
    server: hk01.example.invalid
    port: 443
    uuid: 00000000-0000-0000-0000-000000000000
    network: tcp
    tls: true
    udp: true
    flow: xtls-rprx-vision
    servername: www.apple.com
    reality-opts:
      public-key: "EXAMPLE_REALITY_PUBLIC_KEY_STRING"
      short-id: "1a2b3c4d"
    client-fingerprint: chrome

  # 示例 B：Hysteria 2（基于 QUIC 协议，需声明上下行带宽以激活拥塞控制）
  - name: "JP-日本原生-01"
    type: hysteria2
    server: jp01.example.invalid
    port: 8443
    password: "EXAMPLE_HY2_PASSWORD"
    up: "50 Mbps"
    down: "300 Mbps"
    sni: jp01.example.invalid
    skip-cert-verify: false
    udp: true

  # 示例 C：Trojan（星岛梦、隐形人、尔湾云等广泛采用的 TLS 伪装协议）
  - name: "US-美国流媒体-01"
    type: trojan
    server: us01.example.invalid
    port: 443
    password: "EXAMPLE_TROJAN_PASSWORD"
    udp: true
    sni: us01.example.invalid
    alpn:
      - h2
      - http/1.1
    skip-cert-verify: false

  # 示例 D：Shadowsocks（AEAD / SS2022 轻量加密协议，常用于内网专线落地）
  - name: "SG-狮城高速-01"
    type: ss
    server: sg01.example.invalid
    port: 8388
    cipher: aes-128-gcm
    password: "EXAMPLE_SS_PASSWORD"
    udp: true
```

#### 进阶技巧：使用 `proxy-providers` 聚合多家机场订阅
如果你手里同时买了一家主力包月机场（如[光速云](/brands/guangsuyun/)或[星岛梦](/brands/xingdaomeng/)）和一家不限时按量备用包（如[暮光加速](/brands/muguang/)不限时包或[二猫云](/brands/ermao/)不限时包），想把两家机场的节点合并到同一个配置文件里自动故障切换，可以使用 `proxy-providers` 动态挂载远程节点池：

值得注意的是，挂载外部 `proxy-providers` 时务必合理设置 `interval`（订阅拉取间隔）与 `health-check.interval`（健康检查间隔）。对于不限时备用流量包，建议把健康检查间隔放宽到六百秒甚至一千八百秒，并开启 `lazy: true` 惰性探测开关，这样只有在当前策略组实际产生流量或触发备用切换时，客户端才会向远端探测节点发起请求，平时在后台待机几乎不会消耗你的按量包额度。同时避免将高倍率节点与常规一倍节点混放进同一个自动测速组，可以通过 `exclude-filter` 正则将其隔离，确保配置在长期运行中既高可用又不浪费付费流量。对于刚起步的新手用户，建议先保持单一订阅配置稳定运行一周后再逐步叠加双机场聚合逻辑，以免同时调试多个变量时增加排障难度。

```yaml
proxy-providers:
  main-airport:
    type: http
    url: "https://主力机场订阅链接"
    interval: 86400
    path: ./providers/main.yaml
    health-check:
      enable: true
      url: "https://www.gstatic.com/generate_204"
      interval: 300
  backup-airport:
    type: http
    url: "https://备用流量包订阅链接"
    interval: 86400
    path: ./providers/backup.yaml
    health-check:
      enable: true
      url: "https://www.gstatic.com/generate_204"
      interval: 600
```

---

### 模块 5：策略组调度器（`proxy-groups` 四大类型与正则筛选）

`proxy-groups` 是连接“下层节点（`proxies`）”与“上层规则（`rules`）”的桥梁。每一条分流规则（除直连 `DIRECT` 与拦截 `REJECT` 外）都必须指向一个策略组名称。Mihomo 支持四种核心策略组类型：

| 策略组类型 (`type`) | 调度逻辑与适用场景 | 核心配置参数 (`url` / `interval` / `tolerance`) | 使用建议与避坑指南 |
| --- | --- | --- | --- |
| **`select`（手动选择）** | 由用户在客户端 GUI 界面手动点击切换具体节点或子策略组 | 无需测速参数；常作为顶层总开关（如 `Proxy`、`AI 专线组`、`Netflix 解锁组`） | 组内既可以放具体节点，也可以嵌套其他 `url-test` 自动测速子组及 `DIRECT` |
| **`url-test`（自动测速）** | 定期并发请求 `generate_204`，自动选中当前 HTTP 往返延迟最低的节点 | `url`（测速地址）、`interval`（间隔秒数，建议 `300`）、`tolerance`（容差毫秒数，建议 `50`） | **务必设置 `tolerance: 50`**：只有新节点比当前节点快 50ms 以上才切换，防止两个节点延迟接近时频繁横跳导致连接中断 |
| **`fallback`（故障转移）** | 严格按列表书写顺序从第 1 个节点开始用，仅当第 1 个节点超时断连时才自动切到第 2 个 | `url`、`interval: 300`、`lazy: true` | 最适合把“主力机场组”放第 1 位、“不限时备用机场组”放第 2 位，实现主力故障时无感热备切换 |
| **`load-balance`（负载均衡）** | 将不同请求按哈希或轮询分散到组内多个节点并发传输 | `strategy: consistent-hashing`（同域名固定走同节点）或 `round-robin`（完全轮询） | 仅适合多线程大文件下载；**切勿将 AI（ChatGPT/Claude）或银行/社交账号分流到负载均衡组**，否则因出口 IP 频繁跳变极易触发封号风控 |

在现代 Mihomo 配置中，借助 `include-all: true` 与 `filter` 正则表达式，你可以不用手写几十个节点名字，就能自动把订阅里的香港、日本、美国节点归类到对应分组：

```yaml
# 5. 策略组配置（演示嵌套调度与正则自动筛选）
proxy-groups:
  - name: "Proxy"
    type: select
    proxies:
      - "Auto-最低延迟"
      - "HK-香港自动"
      - "JP-日本自动"
      - "SG-狮城自动"
      - "US-美国自动"
      - DIRECT

  - name: "AI-Service"
    type: select
    proxies:
      - "JP-日本自动"
      - "US-美国自动"
      - "SG-狮城自动"

  - name: "Auto-最低延迟"
    type: url-test
    include-all: true
    exclude-filter: "(?i)剩余流量|到期|官网|重置|5x|10x" # 自动剔除账单提示假节点与高倍率节点
    url: "https://www.gstatic.com/generate_204"
    interval: 300
    tolerance: 50

  - name: "HK-香港自动"
    type: url-test
    include-all: true
    filter: "(?i)港|HK|Hong Kong"
    url: "https://www.gstatic.com/generate_204"
    interval: 300
    tolerance: 50

  - name: "JP-日本自动"
    type: url-test
    include-all: true
    filter: "(?i)日|JP|Japan|Tokyo|Osaka"
    url: "https://www.gstatic.com/generate_204"
    interval: 300
    tolerance: 50

  - name: "SG-狮城自动"
    type: url-test
    include-all: true
    filter: "(?i)新|坡|狮城|SG|Singapore"
    url: "https://www.gstatic.com/generate_204"
    interval: 300
    tolerance: 50

  - name: "US-美国自动"
    type: url-test
    include-all: true
    filter: "(?i)美|US|United States|America|Los Angeles|San Jose"
    url: "https://www.gstatic.com/generate_204"
    interval: 300
    tolerance: 50
```

*(提示：看到 `exclude-filter` 中的 `5x|10x` 了吗？将高倍率节点从自动测速组中剔除，是防止后台自动跑光套餐流量的关键技巧，详见[节点流量倍率核算与防爆表指南](/routes/multipliers/)。)*

---

### 模块 6：规则集（`rule-providers`）与分流规则表（`rules`）

配置文件的最后一部分是 `rule-providers` 与 `rules`。内核对每一个请求都会从 `rules` 的第一行开始向下逐行比对，**一旦某一行命中，立即停止匹配并将流量交给该行指定的策略组**；如果直到倒数第二行都没命中，则由最后一行 `MATCH` 兜底接管。

```yaml
# 6. 远程二进制规则集（MRS 格式）与自上而下分流规则
rule-providers:
  ai-non-cn:
    type: http
    behavior: domain
    format: mrs
    url: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/category-ai-!cn.mrs"
    path: ./ruleset/ai-non-cn.mrs
    interval: 86400

rules:
  # 第一优先级：本地回环与局域网私有网段强制直连（附带 no-resolve 跳过多余 DNS 查询）
  - DOMAIN-SUFFIX,local,DIRECT
  - DOMAIN-SUFFIX,lan,DIRECT
  - IP-CIDR,127.0.0.0/8,DIRECT,no-resolve
  - IP-CIDR,192.168.0.0/16,DIRECT,no-resolve
  - IP-CIDR,10.0.0.0/8,DIRECT,no-resolve
  - IP-CIDR,172.16.0.0/12,DIRECT,no-resolve
  - IP-CIDR,100.64.0.0/10,DIRECT,no-resolve

  # 第二优先级：海外 AI 平台（ChatGPT / Claude / Gemini）定向分流至非香港原生策略组
  - RULE-SET,ai-non-cn,AI-Service
  - DOMAIN-SUFFIX,openai.com,AI-Service
  - DOMAIN-SUFFIX,chatgpt.com,AI-Service
  - DOMAIN-SUFFIX,anthropic.com,AI-Service
  - DOMAIN-SUFFIX,claude.ai,AI-Service

  # 第三优先级：国内域名与国内 IP 白名单直连
  - GEOSITE,cn,DIRECT
  - GEOIP,CN,DIRECT

  # 第四优先级：唯一兜底规则（必须放在最后一行！）
  - MATCH,Proxy
```

*(关于各类规则关键字的深度优先级排序、流媒体独立策略组设计以及 `no-resolve` 的底层触发机制，请参阅[分流规则与策略组实战：GEOSITE、AI 定向分流与内网绕过](/guides/routing/)。)*

---

## 四、YAML 缩进规范与命令行静态校验（CLI 实操）

手写或修改完 YAML 配置文件后，千万不要直接盲目重启客户端。掌握命令行静态语法检查与高频报错对照，能让你在 10 秒内定位任何拼写失误。

### 1. 使用 Mihomo 核心执行静态语法测试

打开终端，定位到你的 `config.yaml` 所在目录，执行 `-t`（Test）测试指令：

```bash
# 调用 mihomo 核心对指定配置文件执行静态语法与引用完整性校验
mihomo -t -f ./config.yaml
```

- **校验完全通过的标准输出**：
  ```text
  INFO[0000] Start initial configuration in progress
  INFO[0000] Geodata Loader mode: memconservative
  configuration file ./config.yaml test is successful
  ```
- **若你在 Windows 上使用 Clash Verge Rev**：也可以直接在软件的“订阅（Profiles）”页面，右键点击你的配置或扩展脚本，选择 **“测试/查看运行配置（Runtime Config）”**，客户端内置校验器会直接弹窗提示错误行号。

### 2. 高频 YAML 报错代码与修复速查表

| 终端或客户端报错原文特征 | 真实错误原因拆解 | 标准修复方法 |
| --- | --- | --- |
| `yaml: line 42: found character that cannot start any token` | 第 42 行附近混入了 **Tab 制表符**，或者使用了中文全角冒号 `：` | 打开编辑器显示空白字符功能，将所有 Tab 替换为 2 个半角空格，确保冒号为英文 `:` 且后面带 1 个空格 |
| `yaml: line 88: mapping values are not allowed in this context` | 节点名称或字段值中包含英文冒号 `:`、方括号 `[]` 或 `#`，被解析器误认为新的键值对 | 将该字段的值用英文双引号完整包裹，例如 `name: "[HK] 香港专线:01"` |
| `proxy group[Proxy]: proxy[JP-02] not found` | 名为 `Proxy` 的策略组里写了 `JP-02`，但 `proxies` 节点列表中根本没有叫这个名字的节点 | 检查节点名是否有多余空格，或改用 `include-all: true` 配合 `filter` 正则匹配（若正则未匹配到任何节点，可加一个兜底 `DIRECT`） |
| `proxy 0: unsupported proxy type: vless` | 当前运行的内核是旧版原版 Clash，不支持 `vless`、`hysteria2` 或 `anytls` | 在客户端设置中将内核切换为 `Mihomo`（Clash.Meta），或升级至最新版 [Clash Verge Rev](/clients/clash-verge-rev/) / [FlClash](/clients/flclash/) |
| `rules[15] [RULE-SET,ai-non-cn,AI-Service] error: rule set [ai-non-cn] not found` | `rules` 中调用了 `RULE-SET,ai-non-cn`，但上方 `rule-providers:` 段落漏定义了 `ai-non-cn` | 在 `rule-providers:` 下补齐对应名称的远程规则集定义，或改用内置 `GEOSITE,category-ai-!cn,AI-Service` |

**重要工程习惯提醒**：在日常使用机场订阅时，**永远不要直接打开机场下载下来的原始 YAML 文件去手工修改**，因为下次订阅自动更新时，你的所有修改都会被新拉取的文件无情覆盖！请务必将你自定义的 `dns`、`sniffer`、`tun` 与前置 `rules` 写进客户端的 **Merge（全局扩展配置）** 或 **Script（JavaScript 覆写脚本）** 中，具体操作详见[自动更新与配置备份：Merge/Script 覆写保护指南](/guides/automatic-update/)。

---

## 五、本专题三级内容集群与延伸阅读

围绕“Clash / Mihomo YAML 配置文件编写、DNS 架构调优与持久化覆写”，本站规划并上线了以下三级（L3）专题集群：

### 集群 1：YAML 核心段落深度拆解与模板库（已发布指南 + 规划选题）
- **已发布深度指南**：
  - [分流规则与策略组实战：GEOSITE、AI 定向分流与内网绕过](/guides/routing/)（深度讲解 `rules` 模块与 `.mrs` 规则集）
  - [TUN 模式深度配置：虚拟网卡原理、Fake-IP 与 Redir-Host 对比](/guides/tun/)（深度讲解 `tun` 模块与系统路由表接管）
  - [自动更新与配置备份：Merge/Script 覆写保护与多端同步方案](/guides/automatic-update/)（如何用 Merge 与 JS 脚本无损注入自定义 YAML 段落）
- **待发布三级选题（规划中）**：
  - 《Mihomo proxy-providers 多机场混合订阅与 fallback 自动容灾主备配置模板》（待发布选题）
  - 《url-test、fallback 与 load-balance 三大策略组测速参数（tolerance / lazy）调优指南》（待发布选题）

### 集群 2：DNS 防泄漏架构与域名嗅探专题（已发布指南 + 排障专题）
- **已发布深度指南**：
  - [DNS 解析污染与泄漏修复：Fake-IP 异常、DoH 配置与分流校验](/troubleshooting/dns/)
  - [Mihomo 核心与生态详解](/clients/mihomo/) 与 [OpenClash 软路由配置指南](/clients/openclash/)
  - [隐私风险与日志边界：WebRTC/DNS 泄漏自检与防范](/safety/privacy/)
- **待发布三级选题（规划中）**：
  - 《Fake-IP 模式下 fake-ip-filter 完整白名单维护：解决游戏联机 STUN、Windows 联网图标与内网域名冲突》（待发布选题）
  - 《Mihomo respect-rules、proxy-server-nameserver 与 nameserver-policy 三层防泄漏 DNS 架构解析》（待发布选题）

### 集群 3：现代代理协议 YAML 字段规范与跨内核对照（已发布 L3 + 规划选题）
- **已发布深度指南**：
  - [2026 订阅格式识别与转换原则：Clash YAML、Base64 与 sing-box JSON 详解](/guides/subscription-formats-explained/)
  - [系统时间偏差导致 TLS 握手与节点连接失败修复](/guides/system-time-tls-fix/)
  - [sing-box 核心与官方客户端 JSON 配置体系](/clients/sing-box/)
- **待发布三级选题（规划中）**：
  - 《VLESS-Reality、Hysteria 2 与 AnyTLS 在 Mihomo YAML 中的标准字段与客户端指纹（client-fingerprint）配置》（待发布选题）

---

## 常见问题（FAQ）

### 编辑 Clash YAML 配置文件时最容易触发哪些语法报错？

YAML 语言对缩进与标点极其严苛。最高频的四大低级错误是：第一，使用了 Tab 制表符而非半角空格缩进（YAML 强制要求纯空格，通常为 2 空格层级）；第二，冒号 `:` 与后面的值之间漏写了半角空格；第三，节点名称或密码包含特殊字符（如方括号、冒号、井号或 Emoji）却未用英文双引号包裹；第四，在 `proxy-groups` 策略组中引用了 `proxies` 列表里根本不存在的节点名。

### 为什么导入含 VLESS、Hysteria 2 或 AnyTLS 节点的 YAML 时提示 unsupported proxy type？

这是因为你正在使用的客户端底层仍是 2023 年底已停更的原版 Clash 或 Clash Premium 旧内核，旧内核仅认识 SS、VMess 和 Trojan。根据本站 2026-11-23 品牌资料库快照，[微风网络](/brands/weifeng/)、[大佬云](/brands/dalaoyun/)、[星岛梦](/brands/xingdaomeng/)、[隐形人](/brands/yinxingren/)等主流服务商均已广泛采用 `VLESS`、`AnyTLS` 或 `Hysteria 2` 协议。只需将客户端升级为搭载 [Mihomo](/clients/mihomo/)（原 Clash.Meta）内核的 [Clash Verge Rev](/clients/clash-verge-rev/)、[FlClash](/clients/flclash/)、[CMFA](/clients/clash-meta/) 或 [OpenClash](/clients/openclash/) Meta 内核即可原生解析。

### 配置文件里的 dns 模块为什么这么复杂？直接把 dns: enable 改成 false 行不行？

在仅开启系统代理（HTTP/SOCKS 端口）且只用浏览器上网时，关闭内置 `dns` 尚能勉强工作；但只要开启了 TUN 虚拟网卡模式或依赖 `GEOSITE`/`GEOIP` 精细分流，关闭 `dns` 模块会导致虚拟网卡无法响应 53 端口劫持请求，直接造成全机断网或严重的本地运营商 DNS 污染与隐私泄漏。完善的 `dns` 配置是现代代理防污染与零延迟匹配的核心基石。

### DNS 配置中的 default-nameserver、nameserver 和 proxy-server-nameserver 各自负责解析什么？

这三个字段构成了防死锁的三层解析链：`default-nameserver` 必须填写纯 IP 格式的 DNS（如 `223.5.5.5`），专门用来解析后面加密 DoH/DoT 域名本身；`proxy-server-nameserver` 专门用来解析你机场代理节点服务器的入口域名（避免节点域名走代理产生鸡生蛋死锁）；而 `nameserver` 则是日常解析普通国内与未知域名的主力加密 DoH 服务器。

### 什么是 sniffer（域名嗅探）？为什么开启它能解决部分软件分流失效的问题？

许多桌面软件、手游或内嵌硬编码 DNS 的程序在发起连接时，不经过系统 DNS 查询，而是直接向目标的纯公网 IP 发起 TCP/TLS 握手。如果未开启 `sniffer`，代理内核只能看到一串冷冰冰的 IP 地址，导致所有基于域名的规则（如 `DOMAIN-SUFFIX,openai.com` 或 `GEOSITE,netflix`）全部失效。开启 `sniffer` 后，内核会从 TLS 握手的 ClientHello (SNI) 或 HTTP Host 头中逆向提取出真实目标域名，重新交回域名规则表精准匹配。

### proxy-groups 里的 url-test（自动测速）和 fallback（故障转移）有什么实质区别？

两者虽然都会定期访问 `generate_204` 测速地址，但选点逻辑截然不同：`url-test` 会把组内所有节点测一遍延迟，自动切换到延迟最低（加上 `tolerance` 容差）的那个节点；而 `fallback` 则是严格按照你在列表里书写的先后顺序排队，只要排在第一位的节点没断网，哪怕它延迟高一点也一直用它，只有当第一顺位节点彻底超时挂掉时，才自动顺延切换到第二顺位节点。

### 修改完本地 YAML 配置文件后，如何在启动客户端前快速验证语法是否正确？

最权威的方法是在终端调用 Mihomo 核心自带的静态测试命令：`mihomo -t -f ./config.yaml`。如果屏幕输出 `test is successful`，代表 YAML 缩进、字段类型、节点协议参数以及策略组与规则的引用关系 100% 合法；如果写错，终端会直接打印出错的具体行号（`line X`）与原因。
