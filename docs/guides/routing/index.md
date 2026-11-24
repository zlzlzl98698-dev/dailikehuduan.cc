---
title: "分流规则与策略组实战：首条命中原则、GEOSITE/MRS 规则集与 AI 定向分流"
description: "全面解析 Clash/Mihomo 与 sing-box 分流规则配置：深度拆解自上而下首条命中机制、七大规则类型与 no-resolve 防 DNS 泄漏原理，提供国内直连、ChatGPT/Claude/Gemini 与 Netflix/YouTube 独立策略组完整实战模板。"
lastUpdated: 2026-11-23
schemaType: TechArticle
faq:
  - q: "为什么我把自定义分流规则加到了配置文件里，访问网站时却依然走原来的节点？"
    a: "99% 的原因是你把自定义规则写在了 MATCH,Proxy（兜底规则）的下方，或者写在了大范围聚合规则（如 GEOSITE,geolocation-!cn）的后面。Mihomo 与 Clash 的路由引擎严格遵循“自上而下顺序比对、首条命中即终止”的铁律。任何写在 MATCH 下面的规则永远没有机会被执行；自定义高优先级规则必须通过 prepend-rules 或 unshift 插入到 rules 数组的最顶部。"
  - q: "IP-CIDR 和 GEOIP 规则末尾经常带有一个 ,no-resolve 参数，它到底有什么用？"
    a: "当一个域名请求进入 rules 列表向下比对时，一旦遇到不带 no-resolve 的 IP 类规则（如 IP-CIDR 或 GEOIP），内核为了判断该域名对应的 IP 是否属于目标网段，会立刻在本地发起一次真实的 DNS 解析。如果这是一个被污染的境外域名且排在规则表靠前位置，就会直接造成本地 DNS 查询等待甚至 DNS 泄漏。加上 ,no-resolve 后，内核仅在请求本身已经是纯 IP（或已被前置模块解析过）时才比对 IP 规则，对纯域名请求直接跳过继续往下匹配域名规则。"
  - q: "为什么香港节点延迟最低（20ms 左右），却不建议让 ChatGPT、Claude 和 Gemini 走香港节点？"
    a: "由于 OpenAI、Anthropic 与 Google Gemini 的服务区域合规限制，中国香港（HK）通常不在其官方直接开放的服务地区名单内（或仅支持部分受限 API）。如果你用香港节点作为日常默认主力，直接访问 ChatGPT 或 Claude 极易弹出 Unsupported Country 或触发账号风控。最科学的方案是保留香港节点用于日常 Google 搜索与 YouTube 秒开，同时单独建立一个仅包含日本、新加坡、美国节点的 AI 专用策略组，通过前置规则实现无感自动分流。"
  - q: "现代 Mihomo 配置里的 .mrs 规则集和传统 .yaml / .txt 规则集有什么区别？"
    a: ".mrs（Meta Rule Set）是 Mihomo 核心专门设计的二进制紧凑型规则集格式（类似 sing-box 的 .srs 二进制格式）。相比传统的纯文本 .yaml 列表，在处理包含数万条域名的广告拦截或全球归属地规则集时，.mrs 文件的体积和运行期内存占用可降低 70%–85%，且内核冷启动加载耗时从数秒缩短至毫秒级，特别适合内存受限的 OpenWrt 软路由与移动端设备。"
  - q: "开启代理后，家里的群晖 NAS（192.168.x.x）、打印机或公司内网 OA 系统打不开怎么办？"
    a: "这是因为内网流量被客户端误判送进了境外代理隧道。解决方法分为两步：第一，在 rules 列表最顶部插入局域网私有网段直连规则（IP-CIDR,192.168.0.0/16,DIRECT,no-resolve、10.0.0.0/8、172.16.0.0/12）以及内网域名后缀直连（DOMAIN-SUFFIX,local,DIRECT 与公司内网后缀）；第二，在 dns.fake-ip-filter 列表中加入对应的内网域名后缀，防止 Fake-IP 机制返回 198.18.x.x 虚拟地址。"
  - q: "如何让电脑上的迅雷、百度网盘或 Steam 游戏下载强制走本地宽带直连，不消耗机场套餐流量？"
    a: "在桌面端（Windows / macOS / Linux）开启 `find-process-mode: strict` 后，可以使用 `PROCESS-NAME` 进程分流规则。例如在 rules 顶部写入 `PROCESS-NAME,Thunder.exe,DIRECT`、`PROCESS-NAME,baidunetdisk.exe,DIRECT`，并在 Steam 下载分流中加入 `DOMAIN-SUFFIX,steamcontent.com,DIRECT`，这样即使你开着 TUN 全局虚拟网卡，这些下载工具也会 100% 走本地宽带满速直连。"
  - q: "配置完复杂的分流规则后，怎么验证某个网站或 App 到底命中了哪一条规则？"
    a: "不要靠主观感觉测速，直接打开 Clash Verge Rev、FlClash 或 OpenClash Web 面板的“连接（Connections）”实时监控页。在顶部搜索框输入你正在访问的域名关键词（如 anthropic 或 netflix），观察匹配条目的“规则（Rule）”与“链路（Chains）”列：它会精确显示该连接是被哪一条 DOMAIN-SUFFIX、GEOSITE 还是底部的 MATCH 命中的，以及最终交给了哪个策略组与落地节点。"
---

# 分流规则与策略组实战：首条命中原则、GEOSITE/MRS 规则集与 AI 定向分流

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>一套专业级的<strong>Clash 分流规则配置</strong>，追求的是在同一次连接会话中同时达成四个目标：<strong>① 局域网 NAS 与国内站点 100% 零损耗直连、② 日常海外网页与视频默认走 20–30ms 的低延迟香港/近程节点、③ ChatGPT / Claude / Gemini 自动定向分流至合规支持区（日本/新加坡/美国原生节点）、④ 大流量下载软件自动绕过代理省流量</strong>。要实现这一效果，核心在于严格遵循<strong>“自上而下首条命中（First-Match）”</strong>优先级金字塔，善用 <code>no-resolve</code> 阻断无效本地 DNS 查询，并采用现代二进制 <code>.mrs</code> 规则集与正则自动分组技术。</p>
</div>

## 一、分流引擎的最高铁律：自上而下首条命中（First-Match）原则

无论你使用的是基于 [Mihomo（Clash.Meta）](/clients/mihomo/) 内核的 [Clash Verge Rev](/clients/clash-verge-rev/)、[FlClash](/clients/flclash/)、[OpenClash](/clients/openclash/)，还是基于 [sing-box](/clients/sing-box/) 内核的 [Hiddify](/clients/hiddify/)、[Karing](/clients/karing/)，所有现代规则代理客户端的路由引擎都遵循同一个不可动摇的底层逻辑——**自上而下顺序扫描、首条命中即刻终止（First-Match Wins）**。

### 1. 路由引擎是如何处理一条网络请求的？

我们可以把 YAML 配置文件中的 `rules:` 数组想象成一道从上往下排列的“多层筛网”：
1. 当你访问 `https://claude.ai` 时，请求从 `rules:` 的**第 1 行**开始往下逐行比对；
2. 假设第 15 行写着 `DOMAIN-SUFFIX,claude.ai,AI-专用组`，内核比对成功，**立即停止继续往下看第 16 行及之后的任何规则**，直接将该连接移交给 `AI-专用组`；
3. 反之，如果你不小心把 `GEOSITE,geolocation-!cn,日常香港组`（匹配所有非中国大陆域名）写在了第 10 行，而把 `DOMAIN-SUFFIX,claude.ai,AI-专用组` 写在了第 20 行——那么当访问 `claude.ai` 时，请求在第 10 行就已经被“非中国大陆域名”这张大网截胡并送去了香港节点，第 20 行的专属规则就彻底变成了**永远无法被触发的死代码**！
4. 同理，位于规则表最底部的 `MATCH,Proxy`（在早期配置中也叫 `FINAL`）相当于编程语言中 `switch...case` 最后的 `default` 分支，它会无条件吞噬所有前面未命中的剩余流量。**任何写在 `MATCH` 下方的规则，生效概率永远是 0%**。

### 2. 黄金优先级金字塔（从第 1 行到最后 1 行的标准排布顺序）

为了彻底杜绝“大规则吞掉小规则”的截胡事故，任何规范的 `rules` 列表都必须严格按照**“从极窄精确匹配 → 到专项业务规则集 → 到国家归属地大类 → 最后全局兜底”**的金字塔顺序编排：

| 优先级层级（由高到低） | 规则层名称 | 典型使用的规则类型 | 核心作用与设计意图 |
| --- | --- | --- | --- |
| **第 1 层（最顶部）** | **本地回环、私有内网与强制进程修正** | `PROCESS-NAME`、`DOMAIN-SUFFIX,local`、`IP-CIDR` (`192.168.0.0/16` 等带 `no-resolve`) | 保护本地打印机、群晖 NAS、企业内网与特定国产大流量下载软件（如迅雷、网盘、Steam 国服 CDN）第一时间强制 `DIRECT` 直连，绝不进入后续复杂的海外规则比对 |
| **第 2 层（高优先级）** | **个人自定义单域名微调与广告/隐私拦截** | `DOMAIN`、`DOMAIN-SUFFIX`、`DOMAIN-KEYWORD` | 存放用户自己手动添加的特殊白名单或黑名单域名，确保你的个人微调拥有高于一切远程公共规则集的绝对控制权 |
| **第 3 层（业务核心层）** | **AI 平台、流媒体解锁与通讯工具专项分流** | `RULE-SET` (`.mrs`)、`GEOSITE` (`openai`、`anthropic`、`gemini`、`netflix`、`disney`、`telegram`) | 在流量落入泛境外规则之前，先把对落地 IP 国家极其挑剔的 [ChatGPT](/ai-streaming/chatgpt/)、[Claude](/ai-streaming/claude/)、[Gemini](/ai-streaming/gemini/)、[Netflix](/ai-streaming/netflix/)、[Disney+](/ai-streaming/disney/) 定向导入各自的专属国家策略组 |
| **第 4 层（国内外分界层）** | **中国大陆域名与通用境外域名分流** | `GEOSITE,cn,DIRECT`、`RULE-SET,cn-domain,DIRECT`、`GEOSITE,geolocation-!cn,Proxy` | 依靠纯域名库完成 90% 以上的国内外常规网站快速分流（全程无需触发本地公网 DNS 查询） |
| **第 5 层（IP 归属地防线）** | **Telegram 专用 IP 段与中国大陆 IP 直连** | `GEOIP,telegram,Proxy,no-resolve`、`GEOIP,CN,DIRECT` | 对前面所有域名规则均未命中的长尾网站，解析其真实 IP 归属地；若 IP 属于中国大陆则直连，避免冷门国内小站绕道海外 |
| **第 6 层（绝对最底部）** | **全局唯一兜底规则** | `MATCH,Proxy`（或 `MATCH,DIRECT` 白名单模式） | 接管所有未命中前述五层筛网的未知境外连接，必须且只能放在整张 `rules` 表的最后一行 |

---

## 二、八大核心规则类型性能开销与 `no-resolve` 防泄漏机制深度拆解

在编写或审计分流规则时，你不仅要知道每一种规则关键字怎么写，更要理解它在内核底层**是否会触发阻塞式的本地 DNS 解析**。

### 1. 八大规则类型语法、匹配耗时与 DNS 触发对照表

| 规则类型关键字 | 标准语法示例 | 匹配逻辑说明 | 内存与 CPU 开销 | 是否会触发本地 DNS 解析？ |
| --- | --- | --- | --- | --- |
| **`DOMAIN`** | `DOMAIN,api.openai.com,AI-组` | 仅完全精确匹配该完整域名（不含子域名） | 极低（哈希表 $O(1)$ 查找） | **否**（纯字符串比对） |
| **`DOMAIN-SUFFIX`** | `DOMAIN-SUFFIX,anthropic.com,AI-组` | 匹配该主域名及其所有子域名（如 `api.anthropic.com`） | 极低（前缀树 Trie 查找） | **否**（纯字符串比对） |
| **`DOMAIN-KEYWORD`** | `DOMAIN-KEYWORD,openai,AI-组` | 只要域名任意位置包含该子串即命中（容易误伤，慎用） | 中等（需遍历子串比对） | **否**（纯字符串比对） |
| **`GEOSITE` / `RULE-SET` (domain)** | `GEOSITE,netflix,流媒体组` 或 `RULE-SET,ai,AI-组` | 匹配预编译域名集合中的数千条域名与后缀 | 低（推荐采用 `.mrs` 二进制格式） | **否**（纯内存树查找） |
| **`PROCESS-NAME`** | `PROCESS-NAME, WeChat.exe,DIRECT` | 按发起请求的本地操作系统进程可执行文件名匹配 | 中等（需内核查询系统 Socket 进程表） | **否**（仅限本机桌面/安卓端有效，软路由无效） |
| **`IP-CIDR` / `IP-CIDR6`** | `IP-CIDR,192.168.0.0/16,DIRECT,no-resolve` | 比对目标 IPv4 / IPv6 地址是否落在指定子网掩码段内 | 低（基数树 Radix Tree 查找） | **默认会触发！** 必须加 `,no-resolve` 才能跳过域名转 IP 解析 |
| **`GEOIP`** | `GEOIP,CN,DIRECT` 或 `GEOIP,LAN,DIRECT,no-resolve` | 查询 MaxMind / Meta-GeoIP 数据库判断目标 IP 所属国家 | 低（但若触发前置 DNS 解析则网络耗时极高） | **默认会触发！** 仅在确实需要解析未知域名 IP 时才不加 `no-resolve` |
| **`MATCH`** | `MATCH,日常主力组` | 无条件匹配一切剩余流量（兜底） | 零开销 | **否** |

### 2. 为什么 `,no-resolve` 是防范 DNS 泄漏与卡顿的生命线？

很多用户反映：“明明我的机场节点测速有 500Mbps，为什么每次在浏览器打开一个新网页时，前 2 秒钟总是卡在空白转圈，随后才突然加载出来？”

当你打开这类卡顿配置文件的 `rules:` 部分时，十有八九会看到有人把几十条**没有加 `,no-resolve` 的 `IP-CIDR` 规则**（例如 Telegram 的 IP 段或广告商 IP 段）放在了整个规则表的最前面！
- **不加 `no-resolve` 时发生了什么？** 当你在浏览器输入 `www.youtube.com` 时，请求带着域名进入 `rules`。如果第 5 行是一条不带 `no-resolve` 的 `IP-CIDR,91.108.4.0/22,Telegram`，内核为了知道 `www.youtube.com` 的 IP 到底属不属于 `91.108.4.0/22`，会**当场暂停规则往下匹配**，转而在本地向你的上游 DNS 发起针对 `www.youtube.com` 的真实域名解析！由于 `youtube.com` 在国内宽带环境下极易遭遇 DNS 抢答污染或解析超时，这一步不仅直接把你正在访问 YouTube 的隐私暴露给了本地网络，还会白白卡顿几百毫秒甚至数秒。
- **加上 `no-resolve` 后的正确行为**：当规则写为 `IP-CIDR,91.108.4.0/22,Telegram,no-resolve` 时，内核看到当前请求是一个域名（`www.youtube.com`）而非纯 IP，就会**零等待直接跳过这条 IP 规则**，继续往下走毫秒级的纯内存域名匹配，最终在 `GEOSITE,youtube` 处瞬间命中并把域名直接打包通过加密隧道发给远端节点解析。

**工程铁律**：除了整张规则表倒数第二行专门用于分辨未知长尾网站归属地的 `GEOIP,CN,DIRECT` 可以不加 `no-resolve`（以便对未命中任何域名规则的冷门国内网站执行一次 DNS 解析来确认是否为国内 IP）之外，**所有排在前面的 `IP-CIDR`、`IP-CIDR6` 与 `GEOIP,LAN`、`GEOIP,telegram` 规则，末尾必须 100% 加上 `,no-resolve`！**

---

## 三、多场景互不干扰策略组架构设计：香港低延迟 + AI 美日原生 + 流媒体分流

为什么要费心设计多策略组分流，而不是所有流量无脑选同一个节点？我们可以从本站 **2026-11-23 品牌资料库快照**（含 `2026-10-19` 非晚高峰历史测速与 AI/流媒体兼容性矩阵）中看出物理距离与区域风控之间的天然矛盾：

1. **物理延迟维度**：在 [光速云](/brands/guangsuyun/)、[暮光加速](/brands/muguang/)、[微风网络](/brands/weifeng/)、[星岛梦](/brands/xingdaomeng/)、[隐形人](/brands/yinxingren/) 等主流 IEPL/BGP 专线样本中，**中国香港节点**的延迟普遍低至 **21ms–26ms**，下行吞吐量高达 **500Mbps 以上**；而**日本节点**延迟约为 **53ms–58ms**，**美国节点**受跨太平洋光缆物理极限限制，延迟普遍在 **143ms–180ms**。因此，日常刷网页、看 [YouTube 4K/8K 视频](/ai-streaming/youtube/)、查 GitHub 资料，无疑应该优先走 20ms 级的**香港或台湾/新加坡近程节点**（详见[香港节点专线选型](/routes/hong-kong/)与[节点延迟与抖动原理](/routes/latency/)）。
2. **区域合规与风控维度**：然而，[ChatGPT (OpenAI)](/ai-streaming/chatgpt/)、[Claude (Anthropic)](/ai-streaming/claude/) 与 [Google Gemini](/ai-streaming/gemini/) 均对中国香港 IP 实施了不同程度的区域限制或严苛风控。如果你把全局主力设为香港节点，每次打开 ChatGPT 或 Claude 就不得不手动去客户端里把节点切成日本或美国，用完再切回香港，极其繁琐。

### 生产级“日常+AI+流媒体+直连”四维独立分流完整模板

通过在客户端扩展配置（Merge）或配置模板中部署以下架构，你可以彻底实现**“网页与 YouTube 永远走 20ms 香港节点秒开，ChatGPT/Claude/Gemini 后台自动静默走日本/美国/新加坡节点，Netflix/Disney+ 走专属解锁节点，国内与局域网 100% 直连”**的无感体验：

```yaml
# 第一部分：定义高性能 .mrs 二进制远程规则集（每 24 小时自动静默更新）
rule-providers:
  private-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/private.mrs"
    path: ./ruleset/private-domain.mrs
    interval: 86400

  ai-non-cn:
    type: http
    behavior: domain
    format: mrs
    url: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/category-ai-!cn.mrs"
    path: ./ruleset/ai-non-cn.mrs
    interval: 86400

  netflix-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/netflix.mrs"
    path: ./ruleset/netflix-domain.mrs
    interval: 86400

  disney-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/disney.mrs"
    path: ./ruleset/disney-domain.mrs
    interval: 86400

  youtube-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/youtube.mrs"
    path: ./ruleset/youtube-domain.mrs
    interval: 86400

  cn-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/cn.mrs"
    path: ./ruleset/cn-domain.mrs
    interval: 86400

  cn-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/cn.mrs"
    path: ./ruleset/cn-ip.mrs
    interval: 86400

# 第二部分：设计互不干扰的业务策略组与按国家正则自动测速组
proxy-groups:
  # 1. 日常默认总入口（优先选香港低延迟组）
  - name: "日常主力Proxy"
    type: select
    proxies:
      - "香港自动-低延迟"
      - "狮城自动-均衡"
      - "日本自动-原生"
      - "美国自动-原生"
      - DIRECT

  # 2. AI 平台独立策略组（严格剔除香港节点！默认固定走日本或美国组，且优先手选固定节点防 IP 频繁跳变封号）
  - name: "AI-ChatGPT与Claude"
    type: select
    include-all: true
    filter: "(?i)日|JP|Japan|美|US|America|States|新|坡|狮城|SG|Singapore"
    exclude-filter: "(?i)港|HK|Hong Kong|剩余|到期|官网"
    proxies:
      - "日本自动-原生"
      - "美国自动-原生"
      - "狮城自动-均衡"

  # 3. 流媒体（Netflix / Disney+）独立解锁组
  - name: "流媒体解锁组"
    type: select
    proxies:
      - "狮城自动-均衡"
      - "香港自动-低延迟"
      - "日本自动-原生"
      - "美国自动-原生"

  # 4. YouTube 4K 高吞吐专属组
  - name: "YouTube高速组"
    type: select
    proxies:
      - "香港自动-低延迟"
      - "狮城自动-均衡"
      - "日常主力Proxy"

  # 5. 底层国家自动测速子组（带 50ms 容差防频繁抖动切换）
  - name: "香港自动-低延迟"
    type: url-test
    include-all: true
    filter: "(?i)港|HK|Hong Kong"
    exclude-filter: "(?i)5x|10x|倍率"
    url: "https://www.gstatic.com/generate_204"
    interval: 300
    tolerance: 50

  - name: "日本自动-原生"
    type: url-test
    include-all: true
    filter: "(?i)日|JP|Japan|Tokyo|Osaka"
    exclude-filter: "(?i)5x|10x|倍率"
    url: "https://www.gstatic.com/generate_204"
    interval: 300
    tolerance: 50

  - name: "狮城自动-均衡"
    type: url-test
    include-all: true
    filter: "(?i)新|坡|狮城|SG|Singapore"
    exclude-filter: "(?i)5x|10x|倍率"
    url: "https://www.gstatic.com/generate_204"
    interval: 300
    tolerance: 50

  - name: "美国自动-原生"
    type: url-test
    include-all: true
    filter: "(?i)美|US|United States|America|Los Angeles|San Jose"
    exclude-filter: "(?i)5x|10x|倍率"
    url: "https://www.gstatic.com/generate_204"
    interval: 300
    tolerance: 50

# 第三部分：严格遵循优先级金字塔的分流规则表
rules:
  # [层级 1] 局域网私有域名、内网 IP 与大流量国产下载客户端强制直连
  - RULE-SET,private-domain,DIRECT
  - DOMAIN-SUFFIX,local,DIRECT
  - DOMAIN-SUFFIX,lan,DIRECT
  - IP-CIDR,127.0.0.0/8,DIRECT,no-resolve
  - IP-CIDR,192.168.0.0/16,DIRECT,no-resolve
  - IP-CIDR,10.0.0.0/8,DIRECT,no-resolve
  - IP-CIDR,172.16.0.0/12,DIRECT,no-resolve
  - IP-CIDR,100.64.0.0/10,DIRECT,no-resolve
  - PROCESS-NAME,Thunder.exe,DIRECT
  - PROCESS-NAME,baidunetdisk.exe,DIRECT
  - DOMAIN-SUFFIX,steamcontent.com,DIRECT

  # [层级 2] AI 生产力平台（OpenAI / Anthropic Claude / Google Gemini）定向至非香港 AI 组
  - DOMAIN-SUFFIX,openai.com,AI-ChatGPT与Claude
  - DOMAIN-SUFFIX,chatgpt.com,AI-ChatGPT与Claude
  - DOMAIN-SUFFIX,oaistatic.com,AI-ChatGPT与Claude
  - DOMAIN-SUFFIX,oaiusercontent.com,AI-ChatGPT与Claude
  - DOMAIN-SUFFIX,anthropic.com,AI-ChatGPT与Claude
  - DOMAIN-SUFFIX,claude.ai,AI-ChatGPT与Claude
  - DOMAIN-SUFFIX,gemini.google.com,AI-ChatGPT与Claude
  - DOMAIN-SUFFIX,aistudio.google.com,AI-ChatGPT与Claude
  - DOMAIN-SUFFIX,generativelanguage.googleapis.com,AI-ChatGPT与Claude
  - RULE-SET,ai-non-cn,AI-ChatGPT与Claude

  # [层级 3] 国际流媒体（Netflix / Disney+ / YouTube）独立分流
  - RULE-SET,netflix-domain,流媒体解锁组
  - RULE-SET,disney-domain,流媒体解锁组
  - RULE-SET,youtube-domain,YouTube高速组

  # [层级 4] 中国大陆域名与 IP 白名单直连
  - RULE-SET,cn-domain,DIRECT
  - RULE-SET,cn-ip,DIRECT

  # [层级 5] 最终全局兜底规则（必须在最后一行）
  - MATCH,日常主力Proxy
```

**针对 Claude 与 ChatGPT 用户的进阶风控提示**：正如我们在 [Claude 封号预防与纯净 IP 分流指南](/ai-streaming/claude/) 中强调的，Anthropic 对短时间内出口 IP 频繁变动的账号风控极为严厉。因此，在上方 `AI-ChatGPT与Claude` 策略组中，我们故意将其顶层类型设为 `type: select` 并通过 `include-all: true` + `filter` 把所有日本、美国、新加坡的单节点也列了出来。对于重度使用 Claude Pro 或 ChatGPT Plus 的用户，建议在客户端界面直接在该策略组中**手动点选并固定某一个延迟稳定的日本或美国原生节点**（详见[日本节点延迟与 AI 适配评测](/routes/japan/)），比交给 `url-test` 每 5 分钟自动测速跳变 IP 要安全得多。

---

## 四、现代 `.mrs` 与 `.srs` 二进制规则集 vs 传统明文规则集

在早期 Clash 配置中，许多用户习惯引入包含十几个 `.yaml` 或 `.txt` 远程规则文件的配置模板。每当客户端启动或软路由重启时，内核需要把几十兆的纯文本 YAML 下载下来，逐行做字符串解析并在内存中构建庞大的对象树，经常导致路由器 CPU 瞬间飙到 100% 甚至因 OOM（内存耗尽）崩溃重启。

如今，无论是 Mihomo 生态还是 sing-box 生态，都已完成向**预编译二进制规则集**的代际跨越：

| 对比维度 | 传统明文规则集 (`.yaml` / `.txt`) | Mihomo 二进制规则集 (`.mrs`) | sing-box 二进制规则集 (`.srs`) |
| --- | --- | --- | --- |
| **适用代理内核** | 旧版 Clash / Mihomo 向下兼容 | [Mihomo (Clash.Meta)](/clients/mihomo/) 全系客户端 | [sing-box](/clients/sing-box/)、[Hiddify](/clients/hiddify/)、[Karing](/clients/karing/)、[HomeProxy](/clients/homeproxy/) |
| **文件存储结构** | UTF-8 纯文本（每行带 `- DOMAIN-SUFFIX,` 前缀） | 预编译紧凑型前缀树/基数树二进制流 | 预编译结构化二进制流 |
| **同规模规则文件体积** | 100%（基准，如 15 万条域名约 4.5MB） | **约 15%–25%**（压缩率极高，仅数百 KB） | **约 15%–25%** |
| **运行期内存占用与加载耗时** | 高（需在本地做 YAML 词法语法解析，耗时长） | **极低**（直接映射入内存树，毫秒级瞬时加载） | **极低**（毫秒级瞬时加载） |
| **推荐官方开源维护源** | 仅建议用于百条以内的本地自写小规则列表 | `MetaCubeX/meta-rules-dat` (`meta` 分支 `.mrs`) | `SagerNet/sing-geosite` 与 `sing-geoip` (`.srs`) |

---

## 五、三步闭环：如何验证你的分流规则是否 100% 精准生效？

写完或注入分流规则后，请严格按照以下三步执行实测核验，确保没有任何一条规则被意外截胡：

1. **第一步：通过客户端 `Connections`（连接）面板实时观测命中链**
   - 打开 [Clash Verge Rev](/clients/clash-verge-rev/)、[FlClash](/clients/flclash/) 或 [OpenClash](/clients/openclash/) 的 **连接（Connections）** 标签页；
   - 打开浏览器分别访问 `https://chatgpt.com`、`https://claude.ai`、`https://www.netflix.com` 和 `https://www.bilibili.com`；
   - 在连接面板顶部的搜索过滤框中依次输入上述域名关键词，重点核对列表中的 **规则（Rule）** 列与 **链路（Chains）** 列：
     - 访问 `bilibili.com` 时，链路应明确显示为 `RuleSet(cn-domain) → DIRECT`；
     - 访问 `chatgpt.com` 时，链路应明确显示为 `DOMAIN-SUFFIX(chatgpt.com) → AI-ChatGPT与Claude → 日本/美国节点`；
     - 如果你发现访问 `chatgpt.com` 时显示的依然是 `MATCH → 日常主力Proxy → 香港节点`，说明你的自定义规则没有成功插到原机场兜底规则的上方（请检查 Merge 的 `prepend-rules` 或 Script 的 `config.rules.unshift` 顺序，详见[自动更新与配置备份指南](/guides/automatic-update/)）。

2. **第二步：命令行分流出口 IP 对照验证**
   在开启了 TUN 模式或配置了终端代理环境变量的前提下，用一条 `curl` 命令同时向国内 IP 检测接口与国际 IP 检测接口发起请求：
   ```bash
   # 测试国内域名是否命中 DIRECT（应返回你本地中国大陆宽带的真实省市 IP）
   curl -s https://myip.ipip.net
   
   # 测试海外未知域名是否命中日常主力代理（应返回你香港/主力节点的海外 IP）
   curl -s https://api.ip.sb/geoip
   ```

3. **第三步：排查 WebRTC 与 DNS 分流泄漏**
   访问浏览器无痕窗口检查 DNS 解析出口，确保访问国内网站时解析服务器为国内运营商/阿里/腾讯 DoH，访问海外被分流站点时未暴露本地运营商递归 DNS。如发现异常，请参照[DNS 解析污染与泄漏修复指南](/troubleshooting/dns/)调整 `nameserver-policy` 与 `respect-rules`。

4. **第四步：排查移动端与桌面端的差异化规则绕过需求**
   在电脑与手机共用一套规则模板时，切忌直接照搬桌面端进程名规则。Windows 上生效的 `PROCESS-NAME,Thunder.exe,DIRECT` 在安卓或苹果设备上完全无法匹配，反而可能造成局部报错或规则冗余。针对安卓端，应改用包名匹配或分应用代理开关把国内银行、网盘与本地工具移出代理通道；针对苹果端则应保留精确域名列表与局域网绕过段，并结合各端系统特点定期通过连接面板核对未知请求是否误入国际代理，做到桌面与移动端各自精简高效。养成在每次大幅修改规则后同步跑一遍终端双接口对照测试的习惯，能够第一时间发现规则顺序写反引发的分流失效问题。

---

## 六、本专题三级内容集群与延伸阅读

围绕“分流规则工程、AI/流媒体专项解锁与透明网关路由”，本站构建了以下三个三级（L3）深度内容集群：

### 集群 1：AI 大模型与国际流媒体专项分流实战（已发布场景专题 + 规划选题）
- **已发布深度指南**：
  - [ChatGPT 访问与节点风控排查：Web/App 分流规则与常见报错修复](/ai-streaming/chatgpt/)
  - [Claude 封号预防与网络环境配置：纯净原生 IP 与固定节点策略](/ai-streaming/claude/)
  - [Google Gemini 地区限制解除：Google 账号关联域名完整分流清单](/ai-streaming/gemini/)
  - [Netflix 解锁原理：自制剧与非自制剧 DNS/分流判断](/ai-streaming/netflix/)、[YouTube 4K/8K 缓冲测速与 QUIC 分流](/ai-streaming/youtube/)、[Disney+ 区域解锁排查](/ai-streaming/disney/)
- **待发布三级选题（规划中）**：
  - 《Google 搜索被送中（跳转 .com.hk 强制开启安全搜索）的根因与 Google 服务独立分流规则》（待发布选题）
  - 《Telegram 客户端内置 IP 直连绕过域名规则的完整 CIDR 规则集与防延迟配置》（待发布选题）

### 集群 2：Mihomo `.mrs` 与 sing-box `.srs` 规则集架构及覆写持久化（已发布指南 + 规划选题）
- **已发布深度指南**：
  - [Clash YAML 配置详解：Mihomo 六大核心模块、DNS 防泄漏架构与语法校验](/guides/clash-config/)
  - [自动更新与配置备份：Merge/Script 覆写保护与多端同步方案](/guides/automatic-update/)（用 `prepend-rules` 和 JS 脚本永久固化你的自定义分流）
  - [节点流量倍率（Multiplier）深度解析：用 exclude-filter 正则排除高倍率节点](/routes/multipliers/)
- **待发布三级选题（规划中）**：
  - 《从 GeoIP.dat / GeoSite.dat 迁移至 MetaCubeX .mrs 按需加载规则集的内存优化对比》（待发布选题）
  - 《sing-box 1.10+ route.rule_set (.srs) 与 Clash rule-providers 语法双向迁移对照表》（待发布选题）

### 集群 3：进程分流、局域网绕过与软路由设备级策略（已发布指南 + 规划选题）
- **已发布深度指南**：
  - [TUN 模式深度配置：route-exclude-address 与局域网路由排除](/guides/tun/)
  - [Clash TUN 虚拟网卡与 WSL2 / Docker 容器网段冲突修复方案](/troubleshooting/tun-wsl-docker-conflict/)
  - [OpenClash 软路由局域网分流指南](/clients/openclash/) 与 [Nikki (OpenWrt 24.10+) 透明代理教程](/clients/nikki/)
- **待发布三级选题（规划中）**：
  - 《Windows 桌面端 PROCESS-NAME 进程分流大全：让国产网游、网银盾与 PT 下载工具 100% 绕过代理》（待发布选题）

---

## 常见问题（FAQ）

### 为什么我把自定义分流规则加到了配置文件里，访问网站时却依然走原来的节点？

99% 的原因是你把自定义规则写在了 `MATCH,Proxy`（兜底规则）的下方，或者写在了大范围聚合规则（如 `GEOSITE,geolocation-!cn`）的后面。Mihomo 与 Clash 的路由引擎严格遵循“自上而下顺序比对、首条命中即终止”的铁律。任何写在 `MATCH` 下面的规则永远没有机会被执行；自定义高优先级规则必须通过 `prepend-rules` 或 `unshift` 插入到 `rules` 数组的最顶部。

### IP-CIDR 和 GEOIP 规则末尾经常带有一个 ,no-resolve 参数，它到底有什么用？

当一个域名请求进入 `rules` 列表向下比对时，一旦遇到不带 `no-resolve` 的 IP 类规则（如 `IP-CIDR` 或 `GEOIP`），内核为了判断该域名对应的 IP 是否属于目标网段，会立刻在本地发起一次真实的 DNS 解析。如果这是一个被污染的境外域名且排在规则表靠前位置，就会直接造成本地 DNS 查询等待甚至 DNS 泄漏。加上 `,no-resolve` 后，内核仅在请求本身已经是纯 IP（或已被前置模块解析过）时才比对 IP 规则，对纯域名请求直接跳过继续往下匹配域名规则。

### 为什么香港节点延迟最低（20ms 左右），却不建议让 ChatGPT、Claude 和 Gemini 走香港节点？

由于 OpenAI、Anthropic 与 Google Gemini 的服务区域合规限制，中国香港（HK）通常不在其官方直接开放的服务地区名单内（或仅支持部分受限 API）。如果你用香港节点作为日常默认主力，直接访问 [ChatGPT](/ai-streaming/chatgpt/) 或 [Claude](/ai-streaming/claude/) 极易弹出 `Unsupported Country` 或触发账号风控。最科学的方案是保留香港节点用于日常 Google 搜索与 YouTube 秒开，同时单独建立一个仅包含日本、新加坡、美国节点的 AI 专用策略组，通过前置规则实现无感自动分流。

### 现代 Mihomo 配置里的 .mrs 规则集和传统 .yaml / .txt 规则集有什么区别？

`.mrs`（Meta Rule Set）是 [Mihomo](/clients/mihomo/) 核心专门设计的二进制紧凑型规则集格式（类似 [sing-box](/clients/sing-box/) 的 `.srs` 二进制格式）。相比传统的纯文本 `.yaml` 列表，在处理包含数万条域名的广告拦截或全球归属地规则集时，`.mrs` 文件的体积和运行期内存占用可降低 70%–85%，且内核冷启动加载耗时从数秒缩短至毫秒级，特别适合内存受限的 OpenWrt 软路由与移动端设备。

### 开启代理后，家里的群晖 NAS（192.168.x.x）、打印机或公司内网 OA 系统打不开怎么办？

这是因为内网流量被客户端误判送进了境外代理隧道。解决方法分为两步：第一，在 `rules` 列表最顶部插入局域网私有网段直连规则（`IP-CIDR,192.168.0.0/16,DIRECT,no-resolve`、`10.0.0.0/8`、`172.16.0.0/12`）以及内网域名后缀直连（`DOMAIN-SUFFIX,local,DIRECT` 与公司内网后缀）；第二，在 `dns.fake-ip-filter` 列表中加入对应的内网域名后缀，防止 Fake-IP 机制返回 `198.18.x.x` 虚拟地址。

### 如何让电脑上的迅雷、百度网盘或 Steam 游戏下载强制走本地宽带直连，不消耗机场套餐流量？

在桌面端（Windows / macOS / Linux）开启 `find-process-mode: strict` 后，可以使用 `PROCESS-NAME` 进程分流规则。例如在 `rules` 顶部写入 `PROCESS-NAME,Thunder.exe,DIRECT`、`PROCESS-NAME,baidunetdisk.exe,DIRECT`，并在 Steam 下载分流中加入 `DOMAIN-SUFFIX,steamcontent.com,DIRECT`，这样即使你开着 TUN 全局虚拟网卡，这些下载工具也会 100% 走本地宽带满速直连。

### 配置完复杂的分流规则后，怎么验证某个网站或 App 到底命中了哪一条规则？

不要靠主观感觉测速，直接打开 [Clash Verge Rev](/clients/clash-verge-rev/)、[FlClash](/clients/flclash/) 或 [OpenClash](/clients/openclash/) Web 面板的“连接（Connections）”实时监控页。在顶部搜索框输入你正在访问的域名关键词（如 `anthropic` 或 `netflix`），观察匹配条目的“规则（Rule）”与“链路（Chains）”列：它会精确显示该连接是被哪一条 `DOMAIN-SUFFIX`、`GEOSITE` 还是底部的 `MATCH` 命中的，以及最终交给了哪个策略组与落地节点。
