---
title: 2026 主流机场订阅格式深度解析：Clash YAML、Base64 与 sing-box JSON
description: 全面拆解主流代理订阅格式与传输协议：深度对比 Clash/Mihomo YAML、Base64 分享链接、SIP002/SIP008 与 sing-box JSON 结构差异，剖析 User-Agent 服务端自动协商机制、subscription-userinfo 流量字节解析公式，以及公共订阅转换站与本地转换的安全边界。
lastUpdated: 2026-11-24
author: 代理客户端编辑部
category: 订阅技术
tags:
  - Clash YAML
  - Base64 订阅
  - sing-box JSON
  - SIP002
  - User-Agent
  - subscription-userinfo
pillar: guides
parentTopic: /guides/subscription/
primaryKeyword: Clash 订阅格式与 Base64 区别
searchIntent: Informational
relatedSlugs:
  - /guides/subscription/
  - /guides/clash-verge-rev-import-subscription/
  - /troubleshooting/subscription-200-empty-fix/
  - /clients/sing-box/
relatedBrands:
  - guangsuyun
  - yifan
  - ermao
schemaType: TechArticle
faq:
  - q: 为什么同一条不带参数的订阅 URL，在浏览器里打开、在 Clash 里导入和在 Shadowrocket 里导入的结果不一样？
    a: 许多现代机场后端面板（如 V2Board、XBoard、SSPanel）会根据请求发出的 HTTP Header 中的 User-Agent 字段自动识别客户端类型并动态返回对应格式。浏览器访问通常返回 Base64 或网页提示，Clash 客户端 UA 返回 YAML，sing-box UA 返回 JSON。
  - q: 如果机场只给了 Base64 节点订阅，但我用的是 Clash Verge Rev，能直接导入吗？
    a: Clash Verge Rev 原生内核 Mihomo 只直接读取 YAML 配置，不直接把裸 Base64 文本当作完整策略配置导入。解决顺序应当是：1）优先在机场面板找“复制 Clash 订阅”按钮或查看面板文档的 ?flag=clash 参数；2）改用本身支持直接吞进 Base64 节点的客户端（如 v2rayN、Karing 或 Hiddify）；3）最后才考虑本地/自建转换工具。
  - q: 网上搜到的免费“订阅转换网站（Subconverter）”到底安不安全？
    a: 存在明显的节点凭据泄露风险。把你的订阅链接填入公共陌生站点后，该转换服务器会代理你的账号去拉取包含服务器 IP、端口、UUID/密码在内的明文节点信息，理论上完全可以记录日志并盗用你的流量。如果必须做跨格式转换，请使用本地转换客户端（如 Karing/Hiddify 内置）或用 Docker 在自己本地/可信服务器部署 subconverter。
  - q: SIP002 和 SIP008 与普通 Base64 节点订阅有什么关系？
    a: SIP002 是 Shadowsocks 社区定义的单节点 URI 编码规范（以 ss:// 开头），常见于 Base64 订阅解码后的每一行；而 SIP008 则是基于 JSON 结构的 Shadowsocks 在线配置投递规范，可附带端口、插件参数及服务商元数据，Shadowrocket 等商业客户端也兼容此类结构。
  - q: 客户端订阅卡片上显示的“已用流量、总配额和到期日期”到底存在配置文件哪里？
    a: 这些账单元数据并不保存在 YAML 或 Base64 的节点正文中，而是由订阅服务器在返回 HTTP 200 响应时，随 HTTP Header 中的 subscription-userinfo 字段一并下发。客户端读取 upload、download、total 字节数与 expire 时间戳后，在本地完成单位换算与界面渲染。
  - q: 为什么用浏览器直接打开订阅链接时，看到的只是一堆乱码或根本看不出节点信息？
    a: 浏览器发送的默认 User-Agent 会被大多数机场后端识别为普通访客或通用拉取请求，从而下发经过 Base64 编码的节点文本块（看似无规律的字母数字串），或者直接跳转到面板首页与防爬拦截页。你需要使用标准 Base64 解码或在终端通过 curl 模拟对应客户端 UA 才能观察到明文结构。
---

# 2026 主流机场订阅格式深度解析：Clash YAML、Base64 与 sing-box JSON

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>导入订阅频频报错，80% 是因为“把 A 格式的文本塞给了只认 B 格式的内核”。当前代理生态主要有三大通用体系与两类标准规范：<strong>Clash/Mihomo YAML</strong>（节点与分流规则一体化，适配 Clash Verge Rev / FlClash / Stash / OpenClash）、<strong>Base64 节点列表</strong>（由 SIP002/VLESS/Trojan 等 URI 编码组成，适配 v2rayN / v2rayNG / Shadowrocket）以及 <strong>sing-box JSON</strong>（强类型模块化架构，适配官方 SFA/SFI/SFM / HomeProxy）。订阅能否正确下发取决于请求时的 <code>User-Agent</code> 协商与 URL 参数，而跨格式转换必须坚守<strong>“官方面板导出 > 客户端本地兼容 > 本地隔离 Subconverter > 绝不使用来历不明的公共转换站”</strong>的安全底线。</p>
</div>

在实际排查[机场订阅导入管理](/guides/subscription/)问题时，绝大多数用户的困惑都集中在两点：一是分不清手里的链接究竟会吐出哪种文本格式，二是看到客户端界面显示的“已用流量、到期时间”却不知道数据从何而来。本篇知识解析文档从数据结构、HTTP 协议协商头以及转换隐私风险三个维度，完整拆解当前主流代理订阅的底层逻辑。

---

## 一、概念定义：四大订阅载体与生态定位

代理订阅本质上是通过 HTTPS 协议向客户端交付“服务器接入凭据”与“路由决策指令”的文本载体。根据是否携带分流规则与客户端策略组，市面上的订阅格式可以划分为纯节点列表与规则一体化配置两大阵营：

1. **Base64 通用节点订阅（纯节点 URI 集合）**：将多行独立的节点分享链接（如遵循 **SIP002** 规范的 `ss://` 链接，以及 `vless://`、`vmess://`、`trojan://`、`hysteria2://` 链接）用换行符拼接后，整体执行一次 Base64 编码得到的字符串。它只描述“服务器在哪里、用什么协议加密连上去”，**完全不包含分流规则、DNS 或测速策略组**。
2. **SIP008 JSON（Shadowsocks 规范化在线交付格式）**：由 Shadowsocks 社区提出的标准 JSON 投递规范，专门解决早期 SIP002 单行链接难以扩展插件参数与服务端版本元数据的问题。虽然它结构规范，但在支持多协议（VLESS-Reality、Hysteria 2 等）的现代机场中已较少单独作为全量格式使用，主要见于兼容型客户端的局部导入。
3. **Clash / Mihomo YAML（规则+节点一体化配置）**：基于缩进敏感的 YAML 语法组织，一份完整文件内同时打包了本地监听端口、DNS 引擎参数、节点数组（`proxies:`）、策略选择组（`proxy-groups:`）以及自上而下匹配的分流规则集（`rules:`）。对于桌面端主力 [Clash Verge Rev](/clients/clash-verge-rev/)、移动端 [FlClash](/clients/flclash/) 与软路由 [OpenClash](/clients/openclash/)，导入后即可开箱实现国内外分流。
4. **sing-box JSON（严格强类型结构化配置）**：由 [sing-box 核心](/clients/sing-box/)定义的现代 JSON Schema，以模块化数组（`inbounds`、`outbounds`、`route`、`dns`）替代了传统冗余配置，并逐步以轻量二进制规则集 `.srs` 取代高内存占用的大型地理数据库。它要求极高，多一个过时字段或类型不匹配就会在启动前校验失败。

*(交付边界提示：根据站内品牌库资料，并非所有服务商都提供上述标准第三方订阅。例如 [光速云](/brands/guangsuyun/) 属于“自研+第三方订阅”双支持模式，[一翻云](/brands/yifan/) 等属于“第三方通用订阅”模式；而“仅专属客户端”品牌则将节点加密封在自有软件内，不会对外下发标准订阅链接。)*

---

## 二、技术原理：Schema 结构与字段深度对比

为了让你在拿到一段未知配置文本时能在三秒内判断其归属，下表从语法结构、包含信息范围与核心代表字段对比四类格式：

| 对比维度 | Base64 通用订阅（含 SIP002） | SIP008 JSON | Clash / Mihomo YAML | sing-box JSON |
| --- | --- | --- | --- | --- |
| **直观首行特征** | 无空格长串字母数字（解码后为 `vless://` 等行） | 以 `{ "version": 1, "servers": [` 开头 | 包含 `proxies:`、`proxy-groups:`、`rules:` | 包含 `"inbounds":`、`"outbounds":`、`"route":` |
| **是否含分流规则** | **否**（依赖客户端自带路由模板） | **否**（仅含节点及基础元数据） | **是**（自带策略组、分流规则与 DNS） | **是**（含严格 `route` 与 `dns` 模块） |
| **现代新协议兼容性** | 依赖客户端解析 URI 参数（如 `security=reality`） | 主要聚焦 Shadowsocks 及其 SIP003 插件 | [Mihomo](/clients/mihomo/) 原生覆盖 Reality/Hysteria 2/AnyTLS | 原生覆盖主流协议，强校验字段名与版本 |
| **语法容错率** | 中（单行错误通常仅跳过该行节点） | 高（标准 JSON 对象） | 低（Tab 与空格混用或缩进错位即整份崩溃） | 极低（版本跨度大时旧字段直接报错阻断启动） |
| **原生直读客户端** | [v2rayN](/clients/v2rayn/)、[v2rayNG](/clients/v2rayng/)、[Shadowrocket](/clients/shadowrocket/) | Shadowrocket、部分 SS 客户端 | Clash Verge Rev、FlClash、[Stash](/clients/stash/)、[Nikki](/clients/nikki/) | 官方 SFA/SFI/SFM、[HomeProxy](/clients/homeproxy/) |

### 1. Base64 解码后的真实节点 URI 结构示例

把一串 Base64 订阅文本解码后，可以看到明文按行排列的分享链接，其通用格式遵循 `协议://凭据@服务器:端口?查询参数#节点备注`（注意下列域名与凭据均为脱敏教学占位符）：

```text
ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@example.com:8388#HK-SIP002-01
vless://00000000-0000-0000-0000-000000000000@example.com:443?encryption=none&security=reality&sni=www.apple.com&fp=chrome&pbk=PUBLIC_KEY&sid=1a2b&type=tcp&flow=xtls-rprx-vision#JP-Reality-02
hysteria2://auth-token@example.com:443/?sni=example.com&alpn=h3#SG-Hy2-03
```

在 SIP002 规范中，`ss://` 后紧跟的加密方式与密码会先做一次 URL-Safe Base64 编码，再接 `@地址:端口`；部分客户端早期版本与现代插件对 `#` 后面的中文备注 URL 编码处理不一致，因此在终端检查节点是否乱码时应重点关注 `#` 之后的片段。

### 2. Clash / Mihomo YAML 最小运行骨架

```yaml
mixed-port: 7897
mode: rule
proxies:
  - name: "JP-Reality-02"
    type: vless
    server: example.com
    port: 443
    uuid: 00000000-0000-0000-0000-000000000000
    network: tcp
    tls: true
    servername: www.apple.com
    flow: xtls-rprx-vision
    reality-opts:
      public-key: PUBLIC_KEY
      short-id: 1a2b
    client-fingerprint: chrome
proxy-groups:
  - name: "Proxy"
    type: select
    proxies:
      - "JP-Reality-02"
rules:
  - GEOSITE,cn,DIRECT
  - MATCH,Proxy
```

**关键兼容性差异**：旧版已归档的 Clash 原核不认识 `flow: xtls-rprx-vision`、`reality-opts` 或 `type: hysteria2`。许多机场后端在收到旧版 UA 时，会自动把这些新协议节点从 `proxies:` 数组里静默剔除，造成“面板宣传有几十个节点，导入后却少了一大半”的假象。

### 3. sing-box JSON 强类型出站骨架

```json
{
  "dns": {
    "servers": [{ "tag": "remote", "address": "https://dns.google/dns-query" }]
  },
  "inbounds": [
    { "type": "tun", "tag": "tun-in", "interface_name": "singbox_tun", "auto_route": true }
  ],
  "outbounds": [
    {
      "type": "vless",
      "tag": "JP-Reality-02",
      "server": "example.com",
      "server_port": 443,
      "uuid": "00000000-0000-0000-0000-000000000000",
      "flow": "xtls-rprx-vision",
      "tls": {
        "enabled": true,
        "server_name": "www.apple.com",
        "utls": { "enabled": true, "fingerprint": "chrome" },
        "reality": { "enabled": true, "public_key": "PUBLIC_KEY", "short_id": "1a2b" }
      }
    }
  ],
  "route": {
    "rules": [
      { "ip_is_private": true, "outbound": "direct" }
    ]
  }
}
```

---

## 三、服务端自动协商机制：`User-Agent` 与 `subscription-userinfo` 响应头

为什么同一条看起来完全相同的 URL，在不同客户端里拿到的文件截然不同，甚至连面板套餐的流量进度条也能自动同步？秘密全在 HTTP 请求与响应的头部字段（Headers）里。

### 1. `User-Agent` 动态协商与显式 `flag` 优先级

现代机场面板（如 V2Board、XBoard、SSPanel 等）普遍采用“单一订阅入口 + 动态后端模板渲染”机制。客户端向订阅地址发起 `GET` 请求时，服务端按以下逻辑决定返回内容：

1. **显式 URL 查询参数优先级最高**：如果订阅链接尾部自带了 `?flag=clash`、`&flag=meta`、`&flag=singbox` 或 `&target=v2ray` 等强制标记，服务端通常会忽略请求头，强行按照该参数渲染对应格式。这也是为什么当你把带 `?flag=clash` 的链接塞进只认 Base64 的 `v2rayNG` 时必然解析失败。
2. **动态识别 `User-Agent`（UA）请求头**：当 URL 不带任何格式参数时，服务端会用正则匹配客户端发出的 HTTP `User-Agent` 字段：

| 客户端发送的典型 `User-Agent` 特征 | 面板后端识别结果 | 服务端动态返回格式 | 常见异常与踩坑 |
| --- | --- | --- | --- |
| `clash-verge/v2.x.x` / `ClashMetaForAndroid` / `mihomo` | Mihomo（Clash.Meta）系 | 含 Reality/Hy2 节点的 **Mihomo YAML** | 若伪装成旧版 `Clash/1.x`，新协议节点会被隐藏 |
| `ClashforWindows` / `Clash` | 传统原版 Clash | 仅含 SS/VMess/Trojan 的旧版 **Clash YAML** | 无法获取新协议，且部分机场已拒绝老旧 UA |
| `SFA/1.x` / `SFI/1.x` / `sing-box` | sing-box 原生生态 | **sing-box JSON** 配置文件 | 早期 V2Board 面板若未更新模板可能返回空或回退 Base64 |
| `v2rayNG/1.x` / `v2rayN/6.x` / `Shadowrocket` | 通用节点生态 | **Base64 编码节点列表** | 在部分强约束 UA 的面板中，浏览器默认 UA 可能被 WAF 拦截返回 `200+0` 空包 |

### 2. `subscription-userinfo` 响应头的字节与时间戳解析公式

客户端订阅列表卡片上显示的“已用流量 / 总配额”和“到期日期”，不是通过解析 YAML 正文算出来的，而是直接读取 HTTP 响应头中的 `subscription-userinfo` 字段。一个标准的响应头示例如下：

```http
HTTP/2 200 OK
content-disposition: attachment; filename*=UTF-8''ExampleCloud.yaml
profile-update-interval: 24
subscription-userinfo: upload=1073741824; download=21474836480; total=107374182400; expire=1798732800
```

其中各字段的严格换算公式与解析规则如下：

- **流量字节换算公式（通常以二进制 IEC `1024^3` 计算 GiB，部分面板按十进制 `1000^3` GB 展示）**：
  - `upload`：已上传字节数（Bytes）
  - `download`：已下载字节数（Bytes）
  - `total`：套餐总流量上限（Bytes）
  - **已用总流量（GiB）** `= (upload + download) / 1073741824`（即 `1024 × 1024 × 1024 = 1,073,741,824`）
  - **以上方示例代入**：`(1073741824 + 21474836480) / 1073741824 = 1 + 20 = 21 GiB`，总配额 `107374182400 / 1073741824 = 100 GiB`。
- **十六进制或编码文件名识别**：部分响应头中的 `content-disposition` 会采用 RFC 5987 编码（例如 `filename*=UTF-8''%E5%85%89%E9%80%9F%E4%BA%91`），客户端需执行百分号十六进制 UTF-8 解码后才能正确显示中文订阅名称；若 `subscription-userinfo` 数值出现极少数异常负值或为 `0`，客户端通常显示“不限时”或隐藏到期栏。
- **Unix 时间戳换算**：`expire=1798732800` 为标准 10 位 Unix Epoch 秒数（若为不限时一次性流量包，服务端常返回 `expire=0` 或省略该字段）。可在终端用如下命令直接把响应头里的数字还原成可读日期：

```bash
# Linux / macOS 将 Unix 秒级时间戳转为本地可读时间
date -d @1798732800 "+%Y-%m-%d %H:%M:%S" 2>/dev/null || date -r 1798732800 "+%Y-%m-%d %H:%M:%S"
```

```powershell
# Windows PowerShell 计算流量与到期日期
$u=1073741824; $d=21474836480; $t=107374182400; $e=1798732800
"已用: $([math]::Round(($u+$d)/1GB,2)) GiB / 总计: $([math]::Round($t/1GB,2)) GiB"
[DateTimeOffset]::FromUnixTimeSeconds($e).LocalDateTime
```

---

## 四、实际影响与命令行诊断：快速识别订阅真实返回内容

当你遇到“客户端提示 YAML 解析失败”“导入后节点数为 0”或者“HTTP 200 但配置为空”时，不要盲目反复点击更新。直接在本地终端模拟对应客户端的 `User-Agent` 抓取响应头和前 15 行正文，只需 5 秒就能锁定根因：

```bash
# 1. 同时打印响应头（观察 subscription-userinfo 与状态码）及模拟 Clash Verge Rev UA 后的前 15 行正文
curl -i -sL -A "clash-verge/v2.0.2" "你的订阅URL" | head -n 25

# 2. 模拟 sing-box 官方客户端 UA 探测返回内容是否为 JSON
curl -sL -A "SFA/1.10.0" "你的订阅URL" | head -n 15

# 3. 如果返回无空格的 Base64 文本，直接在本地离线管道解码观察明文节点行（不经过任何外网）
curl -sL -A "v2rayNG/1.9.0" "你的订阅URL" | base64 -d | head -n 10
```

**诊断判读对照**：
- 如果第 1 条命令返回了 `<!DOCTYPE html>` 或跳转登录页面，说明你的订阅 Token 已失效、域名被防火墙拦截，或服务端 WAF 拦截了该请求头；
- 如果响应头显示 `HTTP/2 200 OK` 但下方正文完全空白（`Content-Length: 0`），说明后端触发了 UA 校验拒绝、账号流量归零或套餐已到期；具体可顺藤摸瓜排查 `User-Agent` 覆写与本地环路问题，参见 [Clash Verge Rev 导入订阅与 UA 排雷指南](/guides/clash-verge-rev-import-subscription/)。

*(安全提示：上述命令中涉及你的真实订阅 Token 与节点密码，请仅在个人可信主机终端运行，切勿把未脱敏的输出完整截图发布到群聊或公开论坛。)*

---

## 五、使用场景与跨格式转换的安全边界

当机场只提供 Base64 订阅而你坚持要用桌面端 [Clash Verge Rev](/clients/clash-verge-rev/)，或者机场只提供 Clash YAML 而你想迁移到原生 [sing-box](/clients/sing-box/) 时，必然涉及“跨格式订阅转换”。在这一步，**安全优先级的选择直接决定你的订阅账号是否会被第三方盗用**。

### 1. 公共在线订阅转换网站的实质风险

互联网上存在大量免费“在线 Subconverter 订阅转换网页”。当你把自己的真实订阅 URL 填入这些网站并点击“生成 Clash 订阅”时，技术链路会发生一次极其危险的交权：
- **后端代拉明文凭据**：转换并不是在你的浏览器里完成的，而是由那个陌生网站的后端服务器拿着你的订阅链接，去向你的机场发起拉取请求。
- **全量节点与 Token 暴露**：转换服务器不仅永久拿到了你的订阅 Token（等同于免密通行证），还完整解密读取了你套餐内所有服务器的 IP、端口、UUID、密码与 Reality 公钥。恶意站点只需在后端加两行日志记录代码，就能暗中盗刷你的流量配额，甚至在订阅刷新时同步获取最新节点。

### 2. 安全转换的四级优先方案（从零风险到隔离自建）

1. **优先核查服务商面板原生参数（零风险）**：先回到机场后台查看“订阅说明”，许多面板只需在原链接末尾追加 `?flag=clash`、`&flag=meta` 或 `&flag=singbox` 即可由官方后端直接输出所需格式，无需任何中转。例如 [一翻云](/brands/yifan/)、[二猫云](/brands/ermao/) 等支持第三方通用订阅的架构下，通常直接在面板即提供了多格式一键复制按钮。
2. **使用内置本地转换的现代客户端（零外泄）**：如果你手头只有 Clash YAML 或 Base64，但想使用 sing-box 内核生态，直接选用 [Karing](/clients/karing/) 或 [Hiddify](/clients/hiddify/)。这两款客户端会在你的**本机内存里**直接把 Clash 或 Base64 转换成 sing-box JSON 运行，全程不经过任何第三方转换服务器。
3. **本机 Docker 隔离部署私有 Subconverter（完全可控）**：如果你必须将一份 Base64 节点列表加上自定义的规则模板转换成 Clash/Mihomo YAML，请使用支持现代协议（VLESS-Reality、Hysteria 2）的维护分支，在自己电脑上通过 Docker **仅绑定回环地址 `127.0.0.1`** 运行：
   ```bash
   # 仅绑定本机 127.0.0.1:25500，拒绝局域网和公网访问，转换完即可停止容器
   docker run -d --name local-subconverter -p 127.0.0.1:25500:25500 metacubex/subconverter:latest
   ```
   部署后，客户端在本地访问 `http://127.0.0.1:25500/sub?target=clash&url=...` 完成渲染，你的真实订阅令牌绝不会离开本机网络。
4. **切忌直接分享已转换好的链接给公共频道**：即便使用了自建服务器，也不要将带有 `url=` 明文参数的复合转换 URL 发给他人，避免 Token 扩散。

---

## 六、常见误区纠正

1. **误区一：“只要把 `.txt` 或 Base64 文本改个后缀名叫 `.yaml`，Clash 就能直接读”**
   - **事实**：配置文件解析靠的是内部数据结构而非文件名后缀。Clash/Mihomo 内核解析器遇到纯 Base64 字符串或 `vless://` 单行链接时，会直接抛出 `yaml: unmarshal errors` 语法错误并拒绝加载。
2. **误区二：“sing-box 是新内核，所以一定向下兼容 Clash YAML”**
   - **事实**：官方 `sing-box`（SFA/SFI/SFM）**完全不兼容** Clash YAML 语法，其只接受标准 sing-box JSON。之所以有人误以为 sing-box 能直接用 Clash 订阅，是因为混淆了原生 `sing-box` 与前端自带转换层的第三方套壳客户端（如 Karing、Hiddify）。
3. **误区三：“订阅卡片没显示剩余流量，说明机场要跑路或限速了”**
   - **事实**：能否显示流量进度条，仅取决于网关响应时是否携带标准的 `subscription-userinfo` 响应头，或者订阅拉取链路是否经过了不透传该 Header 的中间转换器。部分自建本地转换工具若未开启透传选项，转换后也会导致客户端界面隐藏流量条，但不影响节点实际连通。
4. **误区四：“浏览器能打开订阅链接并下载出一个文件，就一定能导进客户端”**
   - **事实**：有些面板在检测到浏览器 UA 时会返回一段用于提示用户的网页 HTML，甚至要求过一层人机校验。客户端拉取的是原始 API 接口返回的数据流，两者走的控制分支可能完全不同，一切应以对应客户端 UA 的 `curl` 测试或直接客户端导入结果为准。

---

## 常见问题（FAQ）

### 为什么同一条不带参数的订阅 URL，在浏览器里打开、在 Clash 里导入和在 Shadowrocket 里导入的结果不一样？

许多现代机场后端面板（如 V2Board、XBoard、SSPanel）会根据请求发出的 HTTP Header 中的 User-Agent 字段自动识别客户端类型并动态返回对应格式。浏览器访问通常返回 Base64 或网页提示，Clash 客户端 UA 返回 YAML，sing-box UA 返回 JSON。

### 如果机场只给了 Base64 节点订阅，但我用的是 Clash Verge Rev，能直接导入吗？

Clash Verge Rev 原生内核 Mihomo 只直接读取 YAML 配置，不直接把裸 Base64 文本当作完整策略配置导入。解决顺序应当是：1）优先在机场面板找“复制 Clash 订阅”按钮或查看面板文档的 ?flag=clash 参数；2）改用本身支持直接吞进 Base64 节点的客户端（如 v2rayN、Karing 或 Hiddify）；3）最后才考虑本地/自建转换工具。

### 网上搜到的免费“订阅转换网站（Subconverter）”到底安不安全？

存在明显的节点凭据泄露风险。把你的订阅链接填入公共陌生站点后，该转换服务器会代理你的账号去拉取包含服务器 IP、端口、UUID/密码在内的明文节点信息，理论上完全可以记录日志并盗用你的流量。如果必须做跨格式转换，请使用本地转换客户端（如 Karing/Hiddify 内置）或用 Docker 在自己本地/可信服务器部署 subconverter。

### SIP002 和 SIP008 与普通 Base64 节点订阅有什么关系？

SIP002 是 Shadowsocks 社区定义的单节点 URI 编码规范（以 ss:// 开头），常见于 Base64 订阅解码后的每一行；而 SIP008 则是基于 JSON 结构的 Shadowsocks 在线配置投递规范，可附带端口、插件参数及服务商元数据，Shadowrocket 等商业客户端也兼容此类结构。

### 客户端订阅卡片上显示的“已用流量、总配额和到期日期”到底存在配置文件哪里？

这些账单元数据并不保存在 YAML 或 Base64 的节点正文中，而是由订阅服务器在返回 HTTP 200 响应时，随 HTTP Header 中的 subscription-userinfo 字段一并下发。客户端读取 upload、download、total 字节数与 expire 时间戳后，在本地完成单位换算与界面渲染。

### 为什么用浏览器直接打开订阅链接时，看到的只是一堆乱码或根本看不出节点信息？

浏览器发送的默认 User-Agent 会被大多数机场后端识别为普通访客或通用拉取请求，从而下发经过 Base64 编码的节点文本块（看似无规律的字母数字串），或者直接跳转到面板首页与防爬拦截页。你需要使用标准 Base64 解码或在终端通过 curl 模拟对应客户端 UA 才能观察到明文结构。
