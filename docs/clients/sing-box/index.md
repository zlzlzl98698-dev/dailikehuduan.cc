---
title: "sing-box 通用代理平台、SFA/SFI/SFM 官方端与 JSON 配置深度教程"
description: "基于 2026-11-23 核验快照，详解 SagerNet/sing-box 通用代理平台架构、官方 SFA (Android) / SFI (iOS) / SFM (macOS) 与第三方封装端（Hiddify / Karing / NekoBox / HomeProxy）选型对比、inbounds/outbounds/route/dns/rule_set（.srs 二进制规则集）JSON 结构解析、1.10+ 新版规则迁移注意事项及 Clash 订阅转 sing-box 安全方案。"
lastUpdated: 2026-11-23
schemaType: SoftwareApplication
appName: sing-box
operatingSystem: Windows, macOS, Linux, Android, iOS, OpenWrt
isFree: true
faq:
  - q: "官方的 sing-box 客户端（SFA / SFI / SFM）可以直接导入机场的 Clash YAML 订阅吗？"
    a: "不能直接导入。sing-box 内核及官方原版客户端（SFA / SFI / SFM）仅原生识别严格结构化的 sing-box JSON 配置文件。如果你的服务商未直接下发 sing-box 专用订阅，推荐改用同样基于 sing-box 内核、但内置了多格式本地转换器的 Karing 或 Hiddify，或者查看机场后台是否支持添加 &flag=singbox 参数。"
  - q: "什么是 SFA、SFI 和 SFM？应该从哪里安全下载官方版本？"
    a: "它们分别是 SagerNet 官方团队维护的原生图形客户端简称：SFA 对应 Android（可通过 GitHub SagerNet/sing-box Releases 下载 APK 或 Google Play 获取）；SFI 对应 iOS 与 tvOS（需使用非大陆区 App Store 搜索 sing-box VT 免费下载）；SFM 对应 macOS（通过 App Store 或官方 Releases 安装）。"
  - q: "基于 sing-box 的 Hiddify、Karing、NekoBox 和官方客户端应该怎么选？"
    a: "若机场已原生提供 sing-box 订阅链接或你习惯自己编写 JSON 配置，优先使用轻巧稳定的官方原版 SFA/SFI/SFM；若手里主要是 Clash YAML 或 Base64 通用订阅且希望全平台开箱即用，首选 Karing 或 Hiddify；注意 NekoBox 近年存在 Google Play 非官方接管风险，新装机用户切勿从应用商店下载未知第三方 NekoBox 包。"
  - q: "为什么早期网上找到的 sing-box JSON 配置模板在新版（1.10 / 1.11 / 1.12+）客户端上启动报错？"
    a: "sing-box 版本演进严格遵循字段规范化路线，1.8 之后逐步废弃并移除了传统大型 geoip/geosite 数据库直连匹配，全面要求改用 .srs 二进制 rule_set；而 1.11/1.12+ 更对旧版 dns-out 出站、block 出站及入站 sniff/domain_strategy 字段进行了重构，统一迁移至 route.rules 中的 rule action 语法。导入任何旧配置前，务必运行 sing-box check -c config.json 进行兼容性校验。"
  - q: "什么是 .srs 规则集？它与 Mihomo 的 .mrs 以及传统规则文件有什么区别？"
    a: ".srs（sing-box rule-set）是 sing-box 官方定义的紧凑型二进制规则集格式，同时支持域名、IP-CIDR、进程名与端口等多维度条件预编译。相比传统直接加载几十兆的 geoip.db/geosite.db 完整库，按需加载远程或本地 .srs 文件能将移动端与低内存软路由的运行内存压缩至十余兆级别。"
  - q: "手里只有 Clash 订阅，用网上的免费在线“订阅转换网站”转成 sing-box JSON 安不安全？"
    a: "存在极高的凭据泄露风险。在线转换网站会代替你的设备去拉取并解码明文节点 IP、端口、UUID、密码以及你的个人订阅 Token，完全具备记录日志与盗刷流量的技术能力。绝对不要把个人付费订阅粘贴到陌生公共转换网页，优先选用 Karing/Hiddify 本地转换或自建隔离的 Docker subconverter。"
  - q: "sing-box 开启 TUN 模式后导致局域网设备失联或内网 IP 无法访问怎么办？"
    a: "通常是因为配置文件的 route.rules 中缺少 ip_is_private: true -> direct 的私有地址放行规则，或者没有在 TUN 入站的 route_exclude_address 字段中排除 Docker/WSL2 虚拟网桥网段。确保路由规则顶部最先放行私有 IP，并将本地直连 DNS 绑定正确的 direct 出站即可解决。"
---

# sing-box 通用代理平台、SFA/SFI/SFM 官方端与 JSON 配置深度教程

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p><strong>sing-box</strong>（官方源码仓库 <code>SagerNet/sing-box</code>）是当前跨平台代理领域架构最严谨、内存开销极低的新一代通用代理平台，不仅面向服务器与全平台命令行提供统一的核心，还衍生出了官方原生端 <strong>SFA（Android）/ SFI（iOS / tvOS）/ SFM（macOS）</strong>，同时也是 <a href="/clients/hiddify/">Hiddify</a>、<a href="/clients/karing/">Karing</a>、<a href="/clients/v2rayn/">v2rayN</a> 与 OpenWrt 软路由 <a href="/clients/homeproxy/">HomeProxy</a> 的共同底层核心（核验日期：<code>2026-11-23</code>）。需要注意：<strong>sing-box 官方客户端与内核只原生识别结构化的 sing-box JSON 格式</strong>，不直接吞入 Clash YAML；普通机场用户若未获取服务商下发的 sing-box 专用订阅，推荐直接使用本地内置格式转换的 Karing 或 Hiddify。</p>
</div>

## 一、 SagerNet/sing-box 通用代理平台架构与核心规格

在代理内核的技术版图中，如果说 [Mihomo](/clients/mihomo/) 代表了对既有 Clash YAML 生态的兼容与扩展巅峰，那么由 `SagerNet` 团队从零重构打造的 **sing-box**，则代表了摒弃历史包袱、完全从工程规范化与极低内存占出发的现代通用代理架构。

sing-box 最大的架构特点在于**“客户端与服务端一体化（Universal Proxy Platform）”**以及**“严格强类型 JSON Schema”**。在传统方案中，服务端可能跑着 Xray 或 Hysteria 服务端，客户端却得装另一套规则解析器，配置字段互不相通；而 sing-box 使用同一套清晰解耦的模块模型（`inbounds` 接收流量、`route` 执行嗅探与决策、`dns` 控制防污染解析、`outbounds` 封装加密协议发出），无论是作为 VPS 服务端、Windows/macOS 桌面端、iOS/Android 手机端，还是仅几十兆内存的路由器固件，都能以统一的逻辑高效运行。得益于抛弃了庞大沉重的全局完整数据库、转向按需加载的 `.srs` 二进制规则集，sing-box 在常规手机或路由器上的常驻运行内存通常可控制在 **15MB 至 40MB** 之间，远低于传统跨平台工具。

| 项目属性 | 核验结果（核实日期：2026-11-23） |
| --- | --- |
| **软件与平台名称** | sing-box 核心及官方原生端（SFA / SFI / SFM） |
| **官方文档主页** | [sing-box 官方文档（sing-box.sagernet.org）](https://sing-box.sagernet.org/) |
| **官方源码仓库** | `SagerNet/sing-box`（Go 语言开发） |
| **官方图形客户端** | **SFA**（Android）、**SFI**（iOS / tvOS / Apple Watch）、**SFM**（macOS） |
| **授权与费用** | 免费开源（GPL-3.0 协议；官方 App Store 端命名为 `sing-box VT` 免费上架） |
| **原生支持配置格式** | **sing-box JSON**（强类型校验，原生不读取 Clash YAML 或裸 Base64 文本） |
| **核心现代协议支持** | `VLESS-Reality`、`Hysteria 2`、`TUIC v5`、`ShadowTLS v3`、`WireGuard`、`AnyTLS`、`SSH`、`Trojan`、`VMess`、`Shadowsocks` |
| **当前维护状态** | 活跃维护（迭代节奏快，需特别关注大版本间的配置字段变更） |

如果你还不清楚自己手中的机场订阅链接属于哪种格式，或者不清楚如何区分 YAML 与 JSON，建议先查阅[2026 订阅格式识别与转换原则](/guides/subscription-formats-explained/)；若希望与另一大核心做横向评估，也可对照阅读[Mihomo 核心与生态指南](/clients/mihomo/)。

## 二、 官方端（SFA/SFI/SFM）与第三方封装端（Hiddify/Karing/NekoBox/HomeProxy）选型对比

虽然 sing-box 内核能力极强，但官方原版客户端（SFA / SFI / SFM）在设计定位上非常“极客”——它不负责帮用户把杂乱的 Base64 链接或 Clash YAML 翻译成 sing-box JSON，而是严格要求输入符合官方 Schema 的 Profile（远程 JSON 订阅或本地 JSON 文件）。因此，生态中涌现了一批底层跑 sing-box、但在前端加入了易用 UI 和订阅格式翻译层的第三方优秀客户端。

根据本站 `2026-11-23` 客户端矩阵核验数据，全平台 sing-box 阵营核心工具选型对照如下：

| 客户端名称 | 适用平台 | 是否直接兼容 Clash / Base64 订阅 | 定位优势与生态角色 | 关键风险与避坑边界 |
| --- | --- | --- | --- | --- |
| **官方 SFA / SFI / SFM** | Android / iOS / tvOS / macOS | **否**（仅认原生 sing-box JSON 与官方远程 Profile） | 官方血统，新协议与 `1.11+` 特性支持最快，内存最低、界面极其清爽 | 必须服务商已原生提供 sing-box 订阅，或自建用户手写/脚本生成 JSON |
| **[Karing](/clients/karing/)** | Win / Mac / Linux / Android / iOS | **是**（本地内置格式转换器与规则兼容） | 免费开源，专门解决 Clash 规则向 sing-box 迁移，iOS 外区可免费下载替代付费小火箭 | iOS 商店区域上架策略可能波动，安装前需确认外区账号所属地区 |
| **[Hiddify](/clients/hiddify/)** | Win / Mac / Linux / Android / iOS | **是**（多格式自动识别解析） | 全平台统一简洁 UI，主打“一键粘贴订阅即连”，适合不愿研究复杂参数的新手 | 若机场 YAML 包含极偏门的 Clash 私有脚本字段，转换兼容度需实测核对 |
| **[v2rayN](/clients/v2rayn/)** | Windows / macOS / Linux | 支持 Base64 与单节点自动转 sing-box 运行 | 桌面老牌多核调度器，可在 Xray、sing-box 与 Mihomo 之间按协议热切换 | 适合管理 Base64/单节点与开启 Tun；重度 Clash 策略组用户建议用 Clash Verge Rev |
| **[NekoBox](/clients/nekobox/)** | Android（及衍生桌面端 NekoRay） | 支持 Base64 与部分规则 | 早期推动 sing-box 在安卓普及的经典开源端，底层参数可调粒度极细 | **高危提醒**：官方曾提示维护资源有限，**严禁在 Google Play 下载同名第三方接管版本**！新装机建议改选 Karing / Hiddify / SFA |
| **[HomeProxy](/clients/homeproxy/)** | OpenWrt / ImmortalWrt 软路由 | 支持节点分享链接导入（后台自动转 JSON） | 原生适配新版 `firewall4 (nftables)` 的轻量 LuCI 插件，与新架构路由器契合极佳 | 明确依赖 `firewall4` 新系统，不直接套用复杂 Clash YAML 策略组 |
| **[PassWall2](/clients/passwall2/)** | OpenWrt 软路由 | 支持 Base64 节点列表与单节点直选 | 同样支持调用 sing-box 作为高速透明代理与分流后端，社区普及度高 | 低闪存硬路由（如 16MB/32MB Flash）安装前需检查同时容纳 Xray 与 sing-box 的剩余空间 |

### 官方原版客户端（SFA / SFI / SFM）安装与导入流程

如果你已经拥有服务商下发的 sing-box 专用订阅，或自己维护了一份标准 JSON 配置文件，按以下四步即可快速启用官方客户端：
1. **核对正规下载渠道**：
   - **Android（SFA）**：前往 GitHub `SagerNet/sing-box` Releases 下载 `SFA-*-universal.apk`（或 `arm64-v8a` 版），或在 Google Play 商店认准 `SagerNet` 开发者发布的 `sing-box`。
   - **iOS / tvOS / macOS（SFI / SFM）**：由于中国大陆区 App Store 未上架，需切换非大陆区 Apple ID 在商店搜索 **`sing-box VT`** 免费安装（Apple TV 也可直接使用 SFI 实现家庭客厅大屏原生代理，iCloud 同步配置极方便）。macOS 用户亦可在 GitHub Releases 获取独立的 `.dmg` 安装包。
2. **创建并导入 Profile**：打开客户端进入 **Profiles** → 点击 **New Profile**，将 **Type** 选为 **Remote**，填入你的 sing-box 专用订阅链接并设定 **Auto Update** 自动更新周期（如 1440 分钟）。
3. **检查内核权限并启动**：切换回 **Dashboard**，选中刚创建好的配置后点击 **Start**。Android 端首次启动需允许创建 `VpnService` 隧道，iOS/macOS 端需在系统弹窗中允许添加 VPN 描述文件并验证面容或指纹。
4. **查看实时日志**：如果启动即断或无法联网，直接点击 Dashboard 下的 **Logs** 标签页，sing-box 会输出极其明确的 JSON 校验报错行号或远程握手失败原因。

## 三、 `inbounds` / `outbounds` / `route` / `dns` / `rule_set` JSON 结构深度解析

想要真正驾驭 sing-box，或者看懂服务商下发的 JSON 配置出了什么错，必须理解它清晰解耦的五大核心 JSON 模块。与 YAML 依靠缩进和隐式默认行为不同，sing-box JSON 要求每个节点、每个 DNS 服务器、每条路由都通过唯一的 **`tag`（标签）** 相互显式引用。

```text
[应用流量] ──> inbounds (tun-in / mixed-in)
                  │
                  ├──> route.rules (按 action: sniff 嗅探域名 / hijack-dns 劫持DNS)
                  │       │
                  │       ├── 命中 rule_set (geosite-cn / geoip-cn .srs) ──> outbounds ("direct")
                  │       └── 命中代理或 final 兜底 ──> outbounds ("proxy" selector / urltest ──> 具体节点)
                  │
                  └──> dns (servers 配合 strategy 与 rule_set 分流解析)
```

### 1. 五大核心模块职责拆解

1. **`inbounds`（入站监听模块）**：定义客户端如何接收本机或局域网设备发来的网络流量。
   - `type: "tun"`：现代桌面与移动端最核心的三层虚拟网卡接管入口。关键参数包括 `address`（如 `["172.19.0.1/30"]`）、`auto_route: true`（自动写入系统路由表）、`strict_route: true`（防泄露严格路由）以及 `stack`（Windows/macOS 常用 `mixed` 或 `system`，部分兼容性受限容器环境可选 `gvisor`）。
   - `type: "mixed"`：在本地回环（如 `127.0.0.1:2080`）同时开启 HTTP 与 SOCKS5 混合代理端口，供浏览器或命令行显式代理使用。
2. **`outbounds`（出站转发模块）**：包含所有真实服务器节点以及策略组控制逻辑。
   - 具体协议节点（如 `type: "vless"`、`hysteria2`、`tuic`），每个节点都必须拥有唯一 `"tag"`。
   - 策略组节点：`type: "selector"`（对应 Clash 手动选择组）与 `type: "urltest"`（自动测速择优组），通过 `"outbounds": ["auto", "HK-01", "JP-02"]` 引用其他节点标签。
   - 功能性基础出站：`type: "direct"`（直连出站，通常标记为 `"direct"`）。*(注：1.11+ 新版中传统 `block` 与 `dns` 出站已被路由动作取代)*。
3. **`dns`（域名解析分流模块）**：彻底解决本地 DNS 污染与泄漏。
   - `"servers"` 数组定义多组上游 DNS（例如代理组 DNS 走 `https://1.1.1.1/dns-query` 且强制设定 `"detour": "proxy"` 从代理出口发出；直连组 DNS 走 `223.5.5.5` 且 `"detour": "direct"`）。
   - `"rules"` 决定哪些域名交给直连 DNS，其余交由 `"final": "dns_proxy"`。同时可嵌套 `fakeip` 模块降低首包解析耗时。
4. **`route`（核心路由决策模块）**：决定每一条数据包最终送往哪一个 `outbound`。
   - 必须包含最高优先级的局域网私有 IP 放行（`"ip_is_private": true, "outbound": "direct"`）。
   - 配合 `"rule_set"` 实现大陆域名/IP 直连与海外 AI/流媒体分流，未命中任何规则的流量进入 `"final": "proxy"`。
5. **`rule_set`（`.srs` 二进制规则集模块）**：位于 `route` 对象内部，取代了早期体积庞大的全局数据库。
   - 通过 `"type": "remote"`, `"format": "binary"`, `"url": ".../*.srs"` 从远程仓库按需拉取仅包含目标分类的紧凑 `.srs` 二进制文件，配合 `"download_detour": "proxy"` 确保在直连网络无法访问 GitHub 时也能通过代理通道顺利更新规则。

### 2. 符合 1.11+ 新版规范的现代 sing-box JSON 完整参考骨架

以下配置骨架展示了 `1.11+` 现代架构下 `rule action`、`.srs` 二进制规则集与 `tun` 入站的标准协作结构（在真实部署时只需补充合法节点至 `outbounds` 即可校验运行）：

```json
{
  "log": {
    "level": "info",
    "timestamp": true
  },
  "dns": {
    "servers": [
      { "tag": "dns_proxy", "address": "https://1.1.1.1/dns-query", "detour": "proxy" },
      { "tag": "dns_direct", "address": "223.5.5.5", "detour": "direct" }
    ],
    "rules": [
      { "clash_mode": "Direct", "server": "dns_direct" },
      { "clash_mode": "Global", "server": "dns_proxy" },
      { "rule_set": "geosite-cn", "server": "dns_direct" }
    ],
    "final": "dns_proxy",
    "strategy": "ipv4_only"
  },
  "inbounds": [
    {
      "type": "tun",
      "tag": "tun-in",
      "address": ["172.19.0.1/30"],
      "auto_route": true,
      "strict_route": true,
      "stack": "mixed"
    }
  ],
  "outbounds": [
    {
      "type": "selector",
      "tag": "proxy",
      "outbounds": ["auto", "HK-Node-01", "direct"]
    },
    {
      "type": "urltest",
      "tag": "auto",
      "outbounds": ["HK-Node-01"]
    },
    {
      "type": "vless",
      "tag": "HK-Node-01",
      "server": "example.com",
      "server_port": 443,
      "uuid": "00000000-0000-0000-0000-000000000000",
      "flow": "xtls-rprx-vision",
      "tls": { "enabled": true, "server_name": "www.apple.com" }
    },
    {
      "type": "direct",
      "tag": "direct"
    }
  ],
  "route": {
    "auto_detect_interface": true,
    "rules": [
      { "action": "sniff" },
      { "protocol": "dns", "action": "hijack-dns" },
      { "ip_is_private": true, "outbound": "direct" },
      { "rule_set": ["geosite-cn", "geoip-cn"], "outbound": "direct" }
    ],
    "rule_set": [
      {
        "tag": "geosite-cn",
        "type": "remote",
        "format": "binary",
        "url": "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-cn.srs",
        "download_detour": "proxy"
      },
      {
        "tag": "geoip-cn",
        "type": "remote",
        "format": "binary",
        "url": "https://raw.githubusercontent.com/SagerNet/sing-geoip/rule-set/geoip-cn.srs",
        "download_detour": "proxy"
      }
    ],
    "final": "proxy"
  }
}
```

## 四、 `1.10+`（含 `1.11` / `1.12`）新版规则与字段迁移注意事项

许多用户在使用 sing-box 时遇到最大的挫折感，来自于“网上搜了一篇一两年前的教程复制 JSON 过来，结果新版客户端启动直接报错崩溃”。这是因为 sing-box 开发者极度重视架构洁癖与长期规范化，在 `1.8 → 1.10 → 1.11/1.12` 几个核心版本跨度中推进了几项影响深远的破坏性变更（Breaking Changes）。

如果你正在把旧配置迁移到当前现役客户端，务必对照下表完成四项关键升级检查：

| 废弃或变更项目 | 旧版写法（已废弃 / 触发警告或报错） | 1.10 / 1.11 / 1.12+ 现代标准写法 | 迁移原因与技术影响 |
| --- | --- | --- | --- |
| **内置 Geo 数据库路由** | 在 `route.rules` 中直接写 `"geosite": "cn"` 或 `"geoip": "cn"`，并依赖 `route.geoip` / `geosite` 大文件 | 删除大库下载，在 `route.rule_set` 定义远程 `.srs` 文件并在规则中改用 **`"rule_set": ["geosite-cn", "geoip-cn"]`** | 彻底消除几十 MB 级大数据库加载引起的手机端或路由器内存爆炸（OOM） |
| **入站嗅探与 DNS 策略字段** | 在 `inbounds` 内配置 `"sniff": true`、`"sniff_override_destination": true`、`"domain_strategy": "prefer_ipv4"` | 从入站移除！改在 `route.rules` 顶部添加 **`{ "action": "sniff" }`** 与 **`{ "action": "resolve" }`** | 将流量识别与决策权统一收归 `route` 引擎，消除不同入站行为不一致的混乱 |
| **DNS 劫持与流量阻断** | 定义 `"type": "dns"` 与 `"type": "block"` 特殊出站，在路由里写 `"outbound": "dns-out"` 或 `"block"` | 废弃这两个虚拟出站，直接在 `route.rules` 中使用 **`"action": "hijack-dns"`** 与 **`"action": "reject"`** | 逻辑语义更清晰，避免把“丢弃/劫持动作”和“真正转发流量的出站”混为一谈 |
| **Fake-IP DNS 独立服务器写法** | 在 `dns.fakeip` 块中启用，再配合 `"type": "fakeip"` 的旧式 server 占位引用 | 关注 `1.12+` 对 `dns.servers` 类型（如 `type: "fakeip"` 与 `local`/`udp`/`https` 结构化定义）的官方最新 Schema | 在升级大版本前建议先执行官方迁移命令或对照最新版官方文档文档逐项校验 |

### 命令行一键校验与格式化工作流

在桌面端或 Linux 服务器端修改 `config.json` 后，养成先用内核自带校验命令跑一遍的习惯，能在 1 秒内精确暴露所有拼写错误与废弃字段警告：

```bash
# 1. 查看当前本机运行的 sing-box 精确版本号与编译内置特性标签（tags）
sing-box version

# 2. 对配置文件执行严格字段校验与废弃语法检查（不真正启动端口）
sing-box check -c /etc/sing-box/config.json

# 3. 如果配置完全合法，命令将无任何报错直接静默退出（退出码 0）
# 4. 如需自动格式化 JSON 缩进以便阅读排查，可执行：
sing-box format -c /etc/sing-box/config.json -w
```

## 五、 Clash 订阅转 sing-box 安全方案与隐私边界

在当前国内机场服务商的生态中，虽然越来越多面板已经开始陆续支持直接下发 sing-box 配置，但仍有相当一部分老牌服务商后台只提供“Clash 订阅”和“通用 Base64 订阅”两个按钮。如果你想在官方 SFA/SFI 或 HomeProxy 上使用这些机场的节点，**绝对不能直接把 Clash URL 粘贴进官方客户端**，而必须解决格式转换问题。

为了兼顾可用性与账户安全，请严格遵循以下**由高到低四级安全优先级**操作：

1. **第一优先级：核对服务商面板的原生转换参数**：许多采用 V2Board、XBoard 或定制后端的机场其实已经默默支持 sing-box 订阅，只是前端网页按钮还没放出来。你可以查阅服务商的“使用文档/FAQ”，或在浏览器中尝试往通用订阅链接末尾追加 `?flag=singbox` 或 `&target=singbox` 参数（也可参照[订阅格式识别指南](/guides/subscription-formats-explained/)中 `curl -A "SFA/1.10.0"` 的方式探测服务商是否已经响应了 `User-Agent` 动态下发）。这是最安全、零第三方经手的方案。
2. **第二优先级：改用客户端内置本地转换（[Karing](/clients/karing/) / [Hiddify](/clients/hiddify/)）**：如果你不想自己维护复杂的 JSON 模板，直接把机场的 Clash YAML 或 Base64 订阅粘贴进 Karing 或 Hiddify。这两款客户端的底层内核同样是纯正的 sing-box，但它们把“Clash/Base64 转 sing-box JSON”这一过程完全放在你的**本机内存**中完成，节点密码、端口与订阅 Token 绝不会离开你的设备。
3. **第三优先级：在个人隔离环境部署自建转换工具**：如果必须为官方 SFI（如客厅 Apple TV）或原生软路由生成定制化的 sing-box JSON 订阅，推荐使用支持新协议与 sing-box 模板的转换分支（如 `sub-store` 或支持 sing-box 规则的本地转换服务），通过 Docker 部署在**个人本机回环地址（`127.0.0.1`）或个人私有受控 VPS** 上，转换完毕立即导出静态 JSON 或仅限内网拉取。
4. **绝对禁止的底线：拒绝把个人订阅粘贴到陌生免费“在线订阅转换网页”**：搜索引擎里排在前几页的公共在线 Subconverter 网站风险极大。当你点击生成短链接时，对方的后端服务器必须代理你的账号向机场请求明文订阅，这意味着站长可以完整记录你的所有落地服务器 IP、端口、加密密码与订阅密钥，进而导致流量被盗刷甚至账号被平台风控封禁，详见[安全防骗与隐私边界指南](/safety/privacy/)。

## 六、 常见 JSON 报错诊断与高频排障对照表

当使用 SFA/SFI/SFM 或命令行运行 sing-box 遇到加载失败、启动闪退或网络异常时，请按下方对照表定位根因：

| 故障现象与日志报错关键字 | 核心触发根因 | 标准化排查与修复步骤 | 深度排查参考 |
| --- | --- | --- | --- |
| **`unexpected character` 或 `json: cannot unmarshal`** | 误把机场的 Clash YAML（文本缩进格式）或 Base64 节点串当成 JSON 导入了官方客户端 | 1. 核对机场是否下发了 sing-box 专用订阅；2. 若无原生支持，改用 **Karing / Hiddify** 直接导入原订阅 | [订阅格式识别与转换原则](/guides/subscription-formats-explained/) |
| **`unknown field` / `deprecated` 或版本校验不通过** | 套用了网上的陈年 JSON 模板，包含了 `1.10/1.11+` 已废弃的 `geoip`、`dns-out` 或入站 `sniff` 字段 | 1. 执行 `sing-box check -c config.json` 定位具体报错行；2. 将旧规则迁移至 `.srs` `rule_set` 与 `route` `action` 语法 | [订阅更新与配置排障](/troubleshooting/subscription/) |
| **打开开关后浏览器能上外网，但局域网 NAS 或路由器后台失联** | `route.rules` 中缺失私有 IP 段放行，导致 `192.168.x.x` 或 `10.x.x.x` 流量被送进 `final` 代理节点 | 在 `route.rules` 最顶部优先加入 `{ "ip_is_private": true, "outbound": "direct" }`，并确认桌面端排除了 WSL2/Docker 网段 | [TUN 与 WSL2/Docker 冲突修复](/troubleshooting/tun-wsl-docker-conflict/) |
| **远程 `.srs` 规则集首次下载卡死，导致无法启动核心** | 首次初始化时 `download_detour` 指向了尚未连通的节点或被直连网络阻断，规则集下载超时 | 确认 `rule_set` 的 `download_detour` 指向有效可用的代理组，或首次先使用精简本地规则启动后再拉取远程 `.srs` | [启动失败与依赖排查](/troubleshooting/startup/) |
| **所有节点能连上但访问国内视频、网银极慢或报错** | `geosite-cn` / `geoip-cn` 规则集未正确命中，或 `dns.rules` 中把国内域名错送给了境外 DNS 解析 | 核对 `dns.rules` 中是否配置了 `geosite-cn -> dns_direct` 分流，并确保国内直连 DNS 设置了 `"detour": "direct"` | [DNS 异常与防泄漏排查](/troubleshooting/dns/) |
| **iOS (SFI) / Android (SFA) 后台锁屏一段时间后突然断网** | Android 系统杀后台限制 `VpnService`，或 iOS 规则集过大导致网络扩展进程突破内存上限被系统强杀 | Android 关闭电池优化限制并锁定后台；iOS 端精简冗余超大规则集，全面采用紧凑 `.srs` 二进制规则集 | [代理断连与保活修复](/troubleshooting/disconnected/) |

## 本专题三级内容集群与延伸阅读

为了让你能顺畅完成“官方/封装端选型 → 看懂并迁移 JSON 配置 → 在移动端与软路由稳定落地”的全流程进阶，以下整理了与 sing-box 强相关的三个三级内容集群：

### 集群一：官方客户端（SFA/SFI/SFM）与生态封装端选型
- **已发布关联指南**：
  - [Karing（全平台 sing-box 规则兼容客户端）](/clients/karing/)：完美吞入 Clash YAML 与 Base64 订阅且免费开源的首选替代方案。
  - [Hiddify（全平台多格式现代客户端）](/clients/hiddify/)：同样以 sing-box 为核心、主打零配置门槛与跨多端统一界面。
  - [NekoBox for Android 风险警示与选型说明](/clients/nekobox/)：了解早期安卓端工具现状及规避 Google Play 李鬼版本的重要提示。
  - [v2rayN 多核心调度指南](/clients/v2rayn/)：桌面端需要同时兼顾 Xray 与 sing-box 双引擎时的推荐调度工具。
- **规划中待发布选题**（纯文本预告，后续上线）：
  - 《Apple TV（tvOS）安装 SFI 客户端实战：结合 iCloud 配置同步打造极简客厅流媒体终端》（待发布选题）
  - 《sing-box 生态客户端深度横评：官方 SFA/SFI vs Karing vs Hiddify 内存占用与复杂规则还原度测试》（待发布选题）

### 集群二：sing-box JSON 配置结构与 `1.10+` 迁移调优
- **已发布关联指南**：
  - [2026 订阅格式识别与转换原则](/guides/subscription-formats-explained/)：掌握 `curl` 检测订阅类型与安全使用本地转换服务的标准流程。
  - [TUN 模式深度配置与原理](/guides/tun/)：了解 `mixed`、`system` 与 `gvisor` 网络栈在不同操作系统中的路由接管细节。
  - [TUN 与 WSL2 / Docker 虚拟网桥冲突修复](/troubleshooting/tun-wsl-docker-conflict/)：解决开发者开启全局 Tun 后容器网络中断的实操策略。
  - [分流规则原理与自定义策略组](/guides/routing/)与[DNS 防泄漏排障](/troubleshooting/dns/)：打通域名解析与出站匹配的底层逻辑闭环。
- **规划中待发布选题**（纯文本预告，后续上线）：
  - 《sing-box 1.8 至 1.12 破坏性字段迁移对照手册：Rule Action 与新 DNS Schema 逐行改写指南》（待发布选题）
  - 《从零构建轻量 `.srs` 二进制规则集：使用 `sing-box rule-set compile` 定制个人专属分流库》（待发布选题）

### 集群三：OpenWrt 软路由透明代理与同类内核对比
- **已发布关联指南**：
  - [HomeProxy（OpenWrt / ImmortalWrt 原生 sing-box 插件）](/clients/homeproxy/)：基于 `firewall4 (nftables)` 构建的现代软路由极简方案。
  - [PassWall2（多核软路由方案）](/clients/passwall2/)：熟悉节点列表模式用户的 sing-box 透明代理后端配置。
  - [OpenWrt 软路由平台选型中心](/clients/platform/openwrt/)：核对路由器 CPU 架构、可用 Flash 空间与固件内核要求。
  - [Mihomo 核心与生态客户端指南](/clients/mihomo/)：横向对比两大现役核心在协议、内存、配置语法与生态工具上的差异。
- **规划中待发布选题**（纯文本预告，后续上线）：
  - 《OpenWrt 路由器内存极限测试：HomeProxy（sing-box）vs OpenClash（Mihomo）在 256MB 内存设备上的稳定性实测》（待发布选题）

## 常见问题（FAQ）

### 官方的 sing-box 客户端（SFA / SFI / SFM）可以直接导入机场的 Clash YAML 订阅吗？

不能直接导入。sing-box 内核及官方原版客户端（SFA / SFI / SFM）仅原生识别严格结构化的 sing-box JSON 配置文件。如果你的服务商未直接下发 sing-box 专用订阅，推荐改用同样基于 sing-box 内核、但内置了多格式本地转换器的 [Karing](/clients/karing/) 或 [Hiddify](/clients/hiddify/)，或者查看机场后台是否支持添加 `&flag=singbox` 参数。

### 什么是 SFA、SFI 和 SFM？应该从哪里安全下载官方版本？

它们分别是 SagerNet 官方团队维护的原生图形客户端简称：SFA 对应 Android（可通过 GitHub `SagerNet/sing-box` Releases 下载 APK 或 Google Play 获取）；SFI 对应 iOS 与 tvOS（需使用非大陆区 App Store 搜索 `sing-box VT` 免费下载）；SFM 对应 macOS（通过 App Store 或官方 Releases 安装）。

### 基于 sing-box 的 Hiddify、Karing、NekoBox 和官方客户端应该怎么选？

若机场已原生提供 sing-box 订阅链接或你习惯自己编写 JSON 配置，优先使用轻巧稳定的官方原版 SFA/SFI/SFM；若手里主要是 Clash YAML 或 Base64 通用订阅且希望全平台开箱即用，首选 [Karing](/clients/karing/) 或 [Hiddify](/clients/hiddify/)；注意 [NekoBox](/clients/nekobox/) 近年存在 Google Play 非官方接管风险，新装机用户切勿从应用商店下载未知第三方 NekoBox 包。

### 为什么早期网上找到的 sing-box JSON 配置模板在新版（1.10 / 1.11 / 1.12+）客户端上启动报错？

sing-box 版本演进严格遵循字段规范化路线，`1.8` 之后逐步废弃并移除了传统大型 `geoip`/`geosite` 数据库直连匹配，全面要求改用 `.srs` 二进制 `rule_set`；而 `1.11`/`1.12+` 更对旧版 `dns-out` 出站、`block` 出站及入站 `sniff`/`domain_strategy` 字段进行了重构，统一迁移至 `route.rules` 中的 `rule action` 语法。导入任何旧配置前，务必运行 `sing-box check -c config.json` 进行兼容性校验。

### 什么是 .srs 规则集？它与 Mihomo 的 .mrs 以及传统规则文件有什么区别？

`.srs`（sing-box rule-set）是 sing-box 官方定义的紧凑型二进制规则集格式，同时支持域名、IP-CIDR、进程名与端口等多维度条件预编译。相比传统直接加载几十兆的 `geoip.db`/`geosite.db` 完整库，按需加载远程或本地 `.srs` 文件能将移动端与低内存软路由的运行内存压缩至十余兆级别。

### 手里只有 Clash 订阅，用网上的免费在线“订阅转换网站”转成 sing-box JSON 安不安全？

存在极高的凭据泄露风险。在线转换网站会代替你的设备去拉取并解码明文节点 IP、端口、UUID、密码以及你的个人订阅 Token，完全具备记录日志与盗刷流量的技术能力。绝对不要把个人付费订阅粘贴到陌生公共转换网页，优先选用 [Karing](/clients/karing/)/[Hiddify](/clients/hiddify/) 本地转换或自建隔离的 Docker 转换服务。

### sing-box 开启 TUN 模式后导致局域网设备失联或内网 IP 无法访问怎么办？

通常是因为配置文件的 `route.rules` 中缺少 `ip_is_private: true -> direct` 的私有地址放行规则，或者没有在 TUN 入站的 `route_exclude_address` 字段中排除 Docker/WSL2 虚拟网桥网段。确保路由规则顶部最先放行私有 IP，并将本地直连 DNS 绑定正确的 `direct` 出站即可解决。
