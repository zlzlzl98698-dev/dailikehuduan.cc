---
title: "服务异常时的替代方案：双机场主备容灾配置、平滑迁移与不限时备用包策略"
description: "如何构建高可用的机场替代方案与双机场主备容灾配置？详解主力月付搭配 100GB-247GB 不限时备用包的跨体系组合策略，并提供 Clash Verge Rev / Mihomo proxy-providers 自动 fallback 故障转移完整 YAML 模板。"
lastUpdated: "2026-11-23"
schemaType: "TechArticle"
faq:
  - q: "更换机场服务商或启用机场替代方案时，之前配好的 Clash 分流规则和 AI 策略组需要重新写吗？"
    a: "完全不需要重写。只要你在 Clash Verge Rev、FlClash 或 OpenClash 中采用配置与节点解耦的设计——即通过全局扩展覆写（Global Merge / Script）或 proxy-providers 外部节点集合管理规则，换新机场时只需替换订阅 URL，原有的 ChatGPT、Claude 分流规则、国内直连白名单和 DNS 防泄漏设置都会 100% 原样继承。"
  - q: "准备备用机场最省钱又省心的方案是什么？为什么不建议同时买两家月付？"
    a: "同时买两家月付会导致备用套餐每个月白白浪费到期清零的流量。最科学的方案是主力买 ¥18–¥25 的月付专线，备用买一份支持第三方通用订阅、跨品牌体系的 100GB–247GB 一次性不限时流量包（如一翻云 ¥100/100GB 或光速云 ¥147/247GB）。平时不产生任何月租消耗，只在主力维护或突发拥堵时切过去救急，一份百元级不限时包通常可作为冷备使用 1 至 2 年。"
  - q: "主力和备用机场可以同时导入同一个客户端并实现自动故障切换吗？"
    a: "可以。初级用户可以在 Clash Verge Rev、v2rayN、Shadowrocket 或 Hiddify 中同时保存多个订阅 Profile，故障时手动点击切换（耗时约 3 秒）；进阶用户则可以使用 Mihomo 内核的 proxy-providers 功能，将主力订阅和备用订阅同时引入一份主配置中，并由 type: fallback 策略组每 300 秒自动探活，一旦主力全挂立即零感切换至备用节点。"
  - q: "为什么挑选备用机场时强调必须跨线路体系、跨协议栈且避开同源模板？"
    a: "如果主力和备用都买在同一个同源模板站群（例如同属 5.6 元极限平价系的大佬云、闪电鼠、云界线等）或共享同一国内中转机房，当上游发生机房级故障或域名批次被阻断时，主备会同时断联。理想的主备应当在入口线路（IEPL vs IPLC/BGP）与传输协议（VLESS vs Hysteria 2 / Trojan）上形成异构互补。"
  - q: "仅支持专属客户端的机场（如飞猫云、隐形人、SOGO 云）适合作为 Mihomo 自动容灾的备用源吗？"
    a: "不适合写入 Mihomo 或软路由的 proxy-providers 自动容灾配置，因为这类品牌不提供外部可拉取的 Clash YAML 或 Base64 订阅链接。但如果你只追求电脑桌面端的独立冷备，也可以在电脑上安装一款专属客户端但不开机自启，仅在开源客户端主力订阅出问题且急需联网查资料时临时打开应急。"
  - q: "配置了 fallback 自动容灾后，如何防止备用机场的不限时流量在不知不觉中被后台刷光？"
    a: "Mihomo 的 fallback 策略组严格按照 use 列表的先后顺序转发：只要排在第一位的主力机场节点能正常返回 HTTP 204 探活响应，哪怕备用机场延迟更低，流量也 100% 只走主力机场；只有当主力节点全部超时且主力恢复后，fallback 还会自动切回主力。此外建议将大体积下载与视频流限制在主力组，仅将办公与 AI 组挂载到双活容灾组。"
  - q: "长期不用的不限时备用订阅，平时需要做哪些维护动作以防关键时刻掉链子？"
    a: "建议每 60 天执行一次 1 分钟冷备演练：在客户端手动点击更新一次备用机场的订阅链接，并切过去打开一个网页确认连通性。这样能确保备用机场如果在这两个月内更换了中转入口 IP 或订阅下发域名，你的本地缓存能及时同步更新，避免主力断网当天才发现备用订阅早已因为域名变更而无法拉取。"
---

# 服务异常时的替代方案：平滑迁移配置与双机场主备容灾策略

<div class="answer-first-box">
  <div class="answer-first-label">核心结论 · Answer First</div>
  <p>真正高可用的跨境网络工作流，绝不是把所有希望押注在某一家“永远不出故障”的神仙机场上，而是建立<strong>“开源客户端规则解耦 + 跨体系异构双订阅 + 主力月付搭配百元级不限时备用包”</strong>的三层容灾体系。通过 [Clash Verge Rev](/clients/clash-verge-rev/) / [Mihomo](/clients/mihomo/) 的全局覆写（Merge）或 <code>proxy-providers</code> 自动 <code>fallback</code> 架构，你可以在不丢失任何本地 AI 分流与直连规则的前提下，实现 <strong>3 秒手动平滑迁移</strong>或<strong>零干预自动故障转移</strong>。</p>
</div>

## 一、为什么重度远程办公与 AI 用户绝不能只靠单一订阅？

### 1. 跨境代理链路无法回避的四类“单点故障（SPOF）”

对于每天依赖 GitHub 协作、远程 SSH 运维、跨国视频会议，或者高频调用 [ChatGPT](/ai-streaming/chatgpt/)、[Claude](/ai-streaming/claude/)、[Gemini](/ai-streaming/gemini/) 的重度用户而言，“断网 2 小时”所造成的生产力损失往往远超几十元的套餐月租。然而，从网络基础设施的客观规律来看，任何单一代理订阅都无法彻底消灭以下四类单点故障（Single Point of Failure）：

1. **国内中转入口机房割接与 DDoS 攻击清洗**：
   无论是深港 [IEPL 专线](/routes/iepl/)、沪日 [IPLC 专线](/routes/iplc/) 还是三网 BGP 中转，其国内入口都依赖特定省市的云计算或数据中心机房。一旦上游机房遭遇同行恶意 DDoS 流量攻击触发黑洞封禁（通常封禁 2 至 24 小时），或者运营商进行夜间路由割接，所有绑定在该入口 IP 段上的节点会在同一秒钟全部断流。
2. **订阅域名与面板域名突发 DNS 污染 / SNI 阻断**：
   当你的主力机场恰好在更换入口 IP，而此时它的订阅下发域名又在国内直连网络下遭到了防火墙 SNI 阻断（俗称订阅被墙），如果你手头**没有任何第二个可用的代理节点**来勾选“通过代理更新订阅”，你就会陷入**“因为没节点所以拉不下新订阅，因为拉不下新订阅所以没节点”**的死锁悖论（详见 [订阅更新失败与 200+0 字节排查](/troubleshooting/subscription/)）。
3. **第三方 AI 与流媒体平台的批次 IP 连坐封禁**：
   OpenAI、Anthropic 与 Cloudflare 的风控引擎经常按整个 `/24` 子网段对高并发数据中心 IP 发起临时验证码拦截或 `403 Access Denied`。如果你只有一家机场，当它采购的某家日本或美国落地机房 ASN 被批次风控时，即使网络能翻墙，你的 Claude 或 ChatGPT 也会瞬间停摆。
4. **服务商突发停服或强制切换专属客户端**：
   如 [机场停服与状态核验指南](/safety/closures/) 所述，部分机场可能因经营调整长期失联，或者像部分品牌在 2026 年 10 月后突然宣布停止提供通用订阅链接、强制改用闭源专属端。没有预置的**机场替代方案**，你将被迫在断网状态下临时病急乱投医。

### 2. 单一长周期订阅 vs “主 + 备”异构双订阅成本与可靠性对比

很多用户之所以没有配置备用机场，是担心“养两家机场要花双倍的钱”。事实上，通过**“计费周期错配”**，双机场主备架构的年均总成本甚至比单买一家中高端年付还要低：

| 评估维度 | 传统脆弱方案：单买一家高价年付 / 两年付 | 浪费型双机方案：同时买两家包月套餐 | 推荐高可用架构：主力月付 + 跨体系不限时冷备包 |
| :--- | :--- | :--- | :--- |
| **资金配置方式** | 一次性预付 ¥240–¥500 锁定单一品牌 1–2 年 | 每月固定支出 ¥25 + ¥25 = ¥50/月（年支 ¥600） | **主力 ¥18–¥25/月（按月灵活续） + 备用 ¥100–¥147（一次性买断不过期）** |
| **备用流量损耗率** | 无备用（0 冗余） | **极高**（备用机场每月 150GB 流量到了月底不用也自动清零） | **0 浪费**（主力正常时备用包 1MB 都不扣，100GB–247GB 可兜底 1–2 年） |
| **遭遇“无节点拉订阅”死锁** | **无法自救**，只能在群里求别人发节点或到处找免费代理 | 可用B机场拉取A机场订阅 | **3 秒自救**：切到备用包节点，勾选“通过代理更新主力订阅”立即恢复 |
| **抗机房故障与 AI 风控能力** | 极弱（单一入口、单一落地 ASN） | 较强（但月均成本高昂） | **极强**（跨线路入口 + 跨协议栈 + 独立海外落地 IP 池互补） |
| **主力服务商恶化或停服损失** | 剩余数月至一整年预付款打水漂 | 随时停掉变差的一家 | **最大试错敞口仅当月 ≤¥25**，当天即可把备用包升格或平滑接入新主力 |

---

## 二、如何科学挑选“主力 + 备用”跨体系组合？（基于 `2026-11-23` 数据库）

构建**双机场主备容灾配置**不是随便闭着眼睛抓两家机场拼在一起，而必须严格遵守**“三跨一兼容”**选型法则，确保两套服务在物理链路与软件协议上真正实现故障隔离。

### 1. “三跨一兼容”异构选型四原则

1. **原则一：必须跨品牌母体与模板站群（防同源共沉没）**
   绝对不能把两家属于同一套站群模板或明确存在同系渊源的品牌互为主备。例如本站 `2026-11-23` 数据库中明确指出的：
   - **5.6 元极限平价同系群**：[大佬云](/brands/dalaoyun/)、[闪电鼠](/brands/shandianshu/)、[云界线](/brands/yunjiexian/)、[榴莲云](/brands/liulianyun/)、[环球梯](/brands/huanqiuti/)（以及同 `qwerty.*aff.com` 推广结构的 [神行加速](/brands/shenxing/)）在价格规格、优惠折扣与路由架构上高度同源，**绝不可在这几家内部互作主备**。
   - **历史同系与价格雷同组**：[Firefly（萤火虫）](/brands/firefly/) 在 `2026-08-09` 历史资料中标注与 [微风网络](/brands/weifeng/) 存在同系关系；[全球云](/brands/quanqiu/) 的轻量/定制档位结构与 [光速云](/brands/guangsuyun/) 高度近似。主备选型应当跨出同源圈子（详情见 [同类品牌替代方案横向矩阵](/brands/alternatives/)）。
2. **原则二：必须兼容第三方通用开源订阅（防客户端割裂）**
   要想在 [Clash Verge Rev](/clients/clash-verge-rev/)、[FlClash](/clients/flclash/)、[v2rayN](/clients/v2rayn/)、[Shadowrocket](/clients/shadowrocket/)、[Hiddify](/clients/hiddify/) 或 [OpenWrt 软路由](/clients/platform/openwrt/) 中实现一键切换或 `proxy-providers` 自动故障转移，你挑选的**主力机场与备用机场都必须支持导出第三方通用订阅链接**（即数据库中标注为 `第三方通用订阅` 或 `自研+第三方订阅` 的品牌）。
3. **原则三：尽量实现传输协议与专线入口异构互补（防单一协议特征受扰）**
   如果主力机场采用的是单一 `VLESS` 或 `Trojan` TCP 传输，备用机场优先挑选同时提供基于 UDP/QUIC 拥塞控制的 **`Hysteria 2`**、抗主动探测能力极强的 **`VLESS-Reality`** 以及经典 **`Shadowsocks`** 多协议组合的品牌。当本地运营商对 TCP 大流量连接实施 QoS 劣化时，切到 Hysteria 2 往往能获得奇效。
4. **原则四：计费周期采用“主力按月重置 + 备用一次性不限时总额”**
   主力负责扛下日常 95% 的流媒体、大文件下载与高频网页浏览；备用包只负责在主力维护、晚高峰局部抽风或某地区 AI 节点被封时顶上去，按使用量精确扣减，永不过期（详见 [不限时流量包核算指南](/plans/non-expiring/)）。

### 2. 数据库中低门槛“一次性不限时备用包”真实参数核查表

根据本站 `2026-11-23` 核验的 31 家品牌数据库，我们将单笔投入在 **¥99–¥239 区间**、提供**一次性付费不限时流量包**的代表性方案整理如下，并明确标注其客户端订阅兼容性，方便你按需选作冷备底座：

| 品牌名称 | 不限时套餐名称 | 一次性实付价格与总流量 | 折算每 GB 单价 | 线路与协议栈特征（源自数据库） | 客户端订阅支持模式 | 作为主备容灾底座的适配评估 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **[一翻云](/brands/yifan/)** | 轻享版·不限时包<br>（另有 ¥200/250G） | **¥100 / 100GB**<br>（一次性总额） | **¥1.00 / GB** | IEPL 物理专线；**Hysteria 2 + VLESS-Reality + Shadowsocks 三协议** | **第三方通用订阅** | **首选异构备用底座**：三协议齐全，完美接入 Mihomo / sing-box `proxy-providers` 自动容灾 |
| **[光速云](/brands/guangsuyun/)** | 致敬斯诺克147永久套餐 | **¥147 / 247GB**<br>（不过期，不打折） | **¥0.60 / GB** | IEPL/IPLC 混合资料；VLESS（归档图曾见 SS/AnyTLS）；覆盖 12 国/地区 | **自研+第三方订阅** | **高性价比大容量冷备**：单 GB 成本仅 0.6 元，覆盖港台日新美及英法德土泰巴等冷门落地 |
| **[二猫云](/brands/ermao/)** | 二猫云·不限时套餐 | **¥99 / 100GB**<br>（一次性总额） | **¥0.99 / GB** | 全线 IEPL 专线；VLESS 协议 | 待核实（配独家定制端，是否兼供通用订阅需后台确认） | 百元内 IEPL 备选，下单前需确认当前是否开放 Clash 通用订阅导出 |
| **[星岛梦](/brands/xingdaomeng/)** | 永久不限时100<br>（另有 ¥300/300G） | **¥100 / 100GB**<br>（1倍流量） | **¥1.00 / GB** | IEPL 专线；**Trojan 协议**；覆盖港台日美新及韩国/东南亚 | 待核实（支持 Trojan 为主） | 2020 年老牌方案，Trojan 协议可与 VLESS 主力形成协议互补 |
| **[唯兔云](/brands/weitu/)** | 永久不限时（100G）<br>（另有 ¥160/200G） | **¥100 / 100GB**<br>（1倍流量） | **¥1.00 / GB** | **IPLC 专线 + Trojan 协议**；1倍流量不限设备 | 待核实（支持 Trojan 常见客户端） | IPLC + Trojan 组合，适合给 IEPL + VLESS 主力做异构备份 |
| **[暮光加速](/brands/muguang/)** | 不限时轻量包 | **¥219 / 150GB**<br>（一次性总额） | **¥1.46 / GB** | BGP 智能调度 + 专线级出口 | 待核实（全平台支持） | 预算充裕时的 BGP 多设备备选，下单前需确认订阅导出格式 |
| **[无忧链接](/brands/wuyou/)** | 100G永久不限时 | **¥108 / 100GB**<br>（无倍率） | **¥1.08 / GB** | 港/新/日/美/台基础覆盖 | 仅专属客户端（与汇总表“订阅无需转换”冲突） | 仅适合习惯独立客户端冷备的轻度用户，不适合写入软路由双活 |
| **[Firefly](/brands/firefly/) / [全球云](/brands/quanqiu/) / [SOGO 云](/brands/sogo/)** | 不限时轻量包 | **¥100/100G** 或 **¥120/120G** | ¥1.00 / GB | IPLC 或 IEPL+BGP | **明确仅专属客户端**（不提供第三方订阅） | 无法导入 Clash Verge Rev 或软路由，仅可作为独立桌面 App 应急 |

### 3. 三套经过实战检验的“主力月付 + 不限时备用”黄金组合模板

根据上表的协议与线路矩阵，重度办公与 AI 用户可以直接照抄以下三套异构组合：

- **组合方案 A（全开源订阅 + 多协议自动容灾首选）**：
  - **日常主力**：[光速云](/brands/guangsuyun/) 极速版（**月付 ¥25 / 168GB**，全节点×1，VLESS，支持第三方订阅）或 [可信云](/brands/kexin/) / [速界](/brands/sujie/)（**月付 ¥25 / 150GB**，IEPL + VLESS，支持第三方订阅）。
  - **异构冷备**：[一翻云](/brands/yifan/) 轻享版·不限时包（**一次性 ¥100 / 100GB**，IEPL + **Hysteria 2 / VLESS-Reality / SS 三协议**，支持第三方通用订阅）。
  - **互补优势**：主力用 VLESS 跑日常大流量；一旦主力维护或本地宽带 TCP 受阻，备用包的 Hysteria 2（UDP/QUIC）与 VLESS-Reality 能瞬间顶上，且两者均支持标准 Clash / Mihomo 订阅，可完美写入同一份 `proxy-providers` 配置文件。
- **组合方案 B（低门槛 18–20 元月付主力 + 0.6元/GB 大容量永久备胎）**：
  - **日常主力**：[一翻云](/brands/yifan/) 轻享版（**月付 ¥20 / 150GB**）或 [光年梯](/brands/guangnian/)（**月付 ¥18 / 110GB**，IEPL + VLESS，自研+第三方订阅）或 [极连云](/brands/jilian/)（**月付 ¥18 / 100GB**）。
  - **异构冷备**：[光速云](/brands/guangsuyun/) 致敬斯诺克147永久套餐（**一次性 ¥147 / 247GB**，支持第三方订阅，含欧美冷门地区节点）。
  - **互补优势**：每月固定开支仅 18–20 元，同时手握 247GB 不过期的大容量冷备池，连英国、德国、土耳其、巴西等冷门地区需求都能一并兜底。
- **组合方案 C（零配置新手的“通用订阅 + 独立专属端”物理双保险）**：
  - 如果你担心自己把 Clash Verge Rev 的配置文件改坏导致断网，可以在电脑上用 [Clash Verge Rev](/clients/clash-verge-rev/) 挂载一家通用订阅月付主力，同时在电脑里安装一个明确采用**专属客户端模式**的不限时包（如 [Firefly（萤火虫）](/brands/firefly/) ¥100/100GB 或 [全球云](/brands/quanqiu/) ¥100/100GB）。平时完全不开专属端，万一自己折腾 Clash 把本地网络弄断了，直接双击打开专属客户端一键登录，即可上网查阅排障文档。

---

## 三、服务异常平滑迁移实操：如何在更换机场时 100% 保留本地分流规则？

很多用户在主力机场抽风时不敢换机场，是因为“以前花了好几个小时在配置文件里添加了公司内网直连域名、游戏加速规则和 Claude 专用策略组，一换新机场订阅，原来的配置就全没了”。

之所以会出现这种痛点，是因为你**直接修改了机场远程下发的订阅文件本身**。只要按照现代客户端的**“规则与节点分离（Decoupling）”**架构进行改造，以后无论换多少家机场，你的自定义规则永远不需要重写一行代码。

### 方式 1：使用 Clash Verge Rev 全局扩展覆写（Merge / Script）——3 秒手动切换订阅

在 [Clash Verge Rev](/clients/clash-verge-rev/)（详细入门可看 [Clash Verge Rev 安装与订阅导入完整设置指南](/guides/clash-verge-rev-setup/)）或 [FlClash](/clients/flclash/) 中，正确的做法是把所有“个人分流规则（Rules）”“自定义 DNS 防污染设置”写在**全局扩展配置（Merge）**里，让机场订阅只提供纯粹的节点列表：

1. 打开 Clash Verge Rev 左侧菜单的 **「订阅 (Profiles)」**。
2. 点击顶部导入框，分别把你的**主力机场订阅链接**和**备用机场订阅链接**导入进来，此时列表中会出现两张独立的订阅卡片。
3. 在下方找到 **「全局扩展覆写 (Merge)」**（或新建一个 Merge 扩展配置并右键勾选“全局启用”），写入你的高优先级直连与 AI 规则（详见 [Clash 配置文件结构解析](/guides/clash-config/) 与 [分流规则编写教程](/guides/routing/)）：

```yaml
# 全局扩展覆写 (Merge) 模板：无论你切换到哪一家机场订阅，以下规则都会自动注入置顶生效
 prepend-rules:
  # 1. 强制公司内网、本地局域网与国内银行政务直连，绝不经过任何机场
  - GEOSITE,cn,DIRECT
  - GEOIP,private,DIRECT,no-resolve
  - DOMAIN-SUFFIX,internal.mycompany.com,DIRECT

  # 2. 将 AI 平台绑定到当前订阅的默认代理组（注意核对目标机场主策略组名称，通常为 Proxy 或 节点选择）
  - DOMAIN-SUFFIX,openai.com,Proxy
  - DOMAIN-SUFFIX,chatgpt.com,Proxy
  - DOMAIN-SUFFIX,claude.ai,Proxy
  - DOMAIN-SUFFIX,anthropic.com,Proxy
  - DOMAIN-SUFFIX,gemini.google.com,Proxy
```

4. **故障迁移效果**：当主力机场突然维护断网时，你只需打开「订阅 (Profiles)」界面，**鼠标左键单击一下备用机场的卡片**（耗时不到 3 秒），客户端会立即加载备用机场的节点，并自动把上面这段 `prepend-rules` 注入进去，你的本地工作流实现无缝衔接！

### 方式 2：配置 Mihomo `proxy-providers` 双机场自动 `fallback` 容灾（零干预无人值守）

如果你是远程办公重度依赖者，或者在家里部署了 [OpenClash](/clients/openclash/) / [Nikki](/clients/nikki/) 软路由供全家人使用，希望做到**“主力机场一旦断网，系统在后台自动切到备用不限时包；主力一恢复，系统自动切回主力省流量，全程无需人工打开软件点击”**，那么 [Mihomo 核心](/clients/mihomo/) 原生支持的 `proxy-providers` + `fallback` 架构就是终极解决方案。

你可以在 Clash Verge Rev 中新建一份**「本地配置（Local Profile）」**，将以下完整 YAML 模板粘贴进去（仅需把两处 `url` 替换为你自己的主力订阅和备用不限时订阅地址）：

```yaml
# Mihomo (Clash.Meta) 双机场主备自动容灾完整配置模板 (2026 标准版)
mixed-port: 7897
allow-lan: false
mode: rule
log-level: info
unified-delay: true
tcp-concurrent: true

dns:
  enable: true
  ipv6: false
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  nameserver:
    - https://223.5.5.5/dns-query
    - https://1.12.12.12/dns-query

# 一、定义两个独立的外部机场节点源（Proxy Providers）
proxy-providers:
  # 1. 日常包月主力机场（每 12 小时自动更新一次）
  Main_Monthly_Airport:
    type: http
    url: "https://example-main.com/api/v1/client/subscribe?token=你的主力机场Token"
    interval: 43200
    path: ./providers/main_airport.yaml
    health-check:
      enable: true
      url: "https://cp.cloudflare.com/generate_204"
      interval: 300
      timeout: 5000
      lazy: true

  # 2. 跨体系不限时备用机场（每 24 小时更新一次，平时处于冷备待命）
  Backup_NonExpiring_Airport:
    type: http
    url: "https://example-backup.com/api/v1/client/subscribe?token=你的不限时备用Token"
    interval: 86400
    path: ./providers/backup_airport.yaml
    health-check:
      enable: true
      url: "https://cp.cloudflare.com/generate_204"
      interval: 600
      timeout: 5000
      lazy: true

# 二、构建主备隔离与自动故障转移策略组
proxy-groups:
  # 总入口：平时你可以选“自动主备容灾”，也可手动强制切到主力或备用
  - name: "🚀 核心办公与AI总出口"
    type: select
    proxies:
      - "🛡️ 自动主备容灾 (Fallback)"
      - "⚡ 主力机场·优选节点"
      - "🛟 备用不限时包·应急节点"

  # 核心魔法：Fallback 组严格按 proxies 顺序探活！
  # 只要“⚡ 主力机场·优选节点”能通，100% 流量走主力；只有主力全挂，才自动切到“🛟 备用不限时包”
  - name: "🛡️ 自动主备容灾 (Fallback)"
    type: fallback
    proxies:
      - "⚡ 主力机场·优选节点"
      - "🛟 备用不限时包·应急节点"
    url: "https://cp.cloudflare.com/generate_204"
    interval: 180
    timeout: 4000
    lazy: false

  # 主力机场内部自动选最优节点（过滤掉高倍率与账单说明占位节点）
  - name: "⚡ 主力机场·优选节点"
    type: url-test
    use:
      - Main_Monthly_Airport
    filter: "^(?!.*(剩余|到期|官网|套餐|3x|5x)).*$"
    url: "https://cp.cloudflare.com/generate_204"
    interval: 300
    tolerance: 50

  # 备用机场内部选取日本/新加坡/台湾/美国节点（兼顾 AI 与通用翻墙，排除到期提示节点）
  - name: "🛟 备用不限时包·应急节点"
    type: url-test
    use:
      - Backup_NonExpiring_Airport
    filter: "(?i)(日本|新加坡|台湾|美国|JP|SG|TW|US)"
    exclude-filter: "(?i)(剩余|到期|官网|重置)"
    url: "https://cp.cloudflare.com/generate_204"
    interval: 600
    tolerance: 80

  # 大流量视频流媒体组：仅挂载主力机场！防止主力断网时看 4K 视频把备用不限时包刷光
  - name: "🎬 流媒体大流量 (仅走主力)"
    type: select
    use:
      - Main_Monthly_Airport
    filter: "^(?!.*(剩余|到期|官网)).*$"

# 三、精细化分流规则：办公与 AI 享受双机场容灾，视频大流量锁死主力
rules:
  - GEOSITE,private,DIRECT
  - DOMAIN-SUFFIX,openai.com,🚀 核心办公与AI总出口
  - DOMAIN-SUFFIX,chatgpt.com,🚀 核心办公与AI总出口
  - DOMAIN-SUFFIX,claude.ai,🚀 核心办公与AI总出口
  - DOMAIN-SUFFIX,anthropic.com,🚀 核心办公与AI总出口
  - DOMAIN-SUFFIX,gemini.google.com,🚀 核心办公与AI总出口
  - DOMAIN-SUFFIX,github.com,🚀 核心办公与AI总出口
  - GEOSITE,youtube,🎬 流媒体大流量 (仅走主力)
  - GEOSITE,netflix,🎬 流媒体大流量 (仅走主力)
  - GEOSITE,cn,DIRECT
  - GEOIP,cn,DIRECT,no-resolve
  - MATCH,🚀 核心办公与AI总出口
```

#### 这套配置模板的三大工程巧思：
1. **严格顺序优先（保护备用包流量不被偷跑）**：在 `🛡️ 自动主备容灾 (Fallback)` 组中，我们没有直接把两个 `use` 混在一起，而是先分别用 `url-test` 选出主力最优节点和备用最优节点，再把 `⚡ 主力机场·优选节点` 放在 `fallback` 的第 1 位、`🛟 备用不限时包·应急节点` 放在第 2 位。根据 Mihomo 内核规范，`fallback` 组**永远优先使用排在前面的可用项**——只要你的主力机场还有哪怕 1 个节点能通，备用不限时包就处于零流量待命状态；一旦主力全军覆没，`fallback` 会在一个探测周期内自动切向备用包；等主力机房修好恢复响应，它又会自动切回主力！
2. **正则过滤占位符与高倍率节点（`filter` / `exclude-filter`）**：很多机场会在订阅列表前排塞入“剩余流量：120GB”“官网地址：xxx”之类的假节点（它们往往绑定在 `127.0.0.1` 或面板 IP 上）。如果不加 `exclude-filter: "(?i)(剩余|到期|官网|重置)"`，自动测速有可能会误选到假节点导致断网。
3. **业务分级保护**：我们将 YouTube 和 Netflix 单独绑定到了 `🎬 流媒体大流量 (仅走主力)`。这样即使主力机场在半夜断网触发了自动切换，也只有你的网页办公、GitHub、ChatGPT/Claude 会消耗备用包流量，家里的电视盒子看 4K 视频不会在后台把宝贵的 100GB 备用不限时包刷空。

### 方式 3：其他主流客户端（v2rayN / Shadowrocket / sing-box）的平滑主备切换

如果你使用的是非 Clash 系的客户端，同样可以在 10 秒内建立不丢规则的主备冗余：

- **[v2rayN](/clients/v2rayn/)（Windows / macOS / Linux）与 [v2rayNG](/clients/v2rayng/)（Android）**：
  - 点击顶部菜单「订阅分组 → 订阅分组设置」，分别添加 `主力-月付` 和 `备用-不限时` 两个分组，填入各自的订阅 URL。
  - 更新订阅后，主界面上方会出现两个独立的 Tab 标签页。由于 v2rayN 的「路由设置（Routing）」是全局独立存储的，你在两个订阅 Tab 之间切换激活节点时，**所有自定义路由规则、分应用代理与 Core 核心设置 100% 保持不变**。
- **[Shadowrocket（小火箭）](/clients/shadowrocket/)（iOS / iPadOS）**：
  - 在首页顶部点击「添加节点 → 类型选 `Subscribe`」，把主力机场和备用机场同时添加在首页列表中。
  - 下方切换到「配置（Config）」页面，你自定义的本地分流规则（`.conf` 文件）存储在本地配置层，与首页上方的节点订阅完全独立。主力维护时，只需在首页折叠主力分组、展开备用分组点选一个节点即可，规则分流毫发无损。
- **[Hiddify](/clients/hiddify/) / [Karing](/clients/karing/) / [sing-box](/clients/sing-box/)（全平台）**：
  - [Karing](/clients/karing/) 原生支持将多个机场订阅同时添加进配置源，并在同一个自定义策略组中勾选来自不同机场的节点进行自动 `urltest` 或 `fallback`；[Hiddify](/clients/hiddify/) 则支持在主界面顶部下拉框中秒级切换不同 Profile，同时保留全局设置中的分流区域与 TUN 网卡参数（详见 [订阅导入与管理标准流程](/guides/subscription/)）。

---

## 四、平滑切换后的四项安全扫尾与定期演练规范

完成了**服务异常平滑迁移**或搭建好双机场容灾架构后，还需养成四个良好的日常运维习惯，确保这套容灾体系在关键时刻真正管用：

1. **及时冻结或删除已确认停服的死订阅**：
   如果旧的主力机场已经按 [机场停服与状态核验流程](/safety/closures/) 确认为长期失联，请立即在客户端或 `proxy-providers` 中移除其订阅 URL（或关闭定时更新）。不要让客户端后台常年向已过期的域名发送携带你个人 Token 的 HTTP 请求。
2. **若旧订阅曾粘贴到不明第三方在线转换站，尽快在面板重置订阅 Token**：
   如果你在排查故障期间曾病急乱投医，把还没过期的订阅链接粘贴到了搜索引擎随便找的“在线 Clash 订阅转换网站”，你的订阅配额极可能被后台记录并盗刷。恢复正常后，请登录机场面板点击“重置订阅链接 / 刷新 Token”（详见 [代理隐私与订阅泄露防护](/safety/privacy/)）。
3. **开启客户端配置自动备份（WebDAV / 本地导出）**：
   在 [Clash Verge Rev](/clients/clash-verge-rev/)、[FlClash](/clients/flclash/) 或 [v2rayN](/clients/v2rayn/) 中，每当修改完满意的全局扩展规则或 `proxy-providers` 模板，花 10 秒钟导出一个本地备份文件或同步至私有 WebDAV（参考 [订阅自动更新与配置备份指南](/guides/automatic-update/)），重装系统或换新电脑时 1 分钟即可满血还原。
4. **每 60 天进行一次“冷备通道 60 秒演练”**：
   很多用户买了一份 ¥100 的不限时备用包后，连续一年都不去更新它的订阅。结果一年后主力机场某天维护，切到备用包时才发现：备用机场半年前换过一次国内中转入口 IP 和订阅域名，而你本地缓存的还是半年前废弃的旧入口，同时旧订阅域名又直连不通！**每隔两个月，在主力网络正常联网的状态下，顺手点一下备用机场的“更新订阅（通过代理更新）”并切过去打开一个网页测一下延迟**，就能让你的冷备通道永远保持热备可用状态。

---

## 本专题三级内容集群与延伸阅读

围绕**机场替代方案**、**服务异常平滑迁移**与**双机场主备容灾配置**，本专题（`/safety/alternatives/`）向下辐射三个实操性极强的三级（L3）技术内容集群：

### 集群 A：跨体系替代品牌筛选与不限时备用包核算（已发布选型页面 + 进阶规划）
当原有机场涨价、线路劣化或强制改用专属客户端时，如何按协议栈和预算精准找到平替：
- **已发布关联页面**：
  - [同类机场品牌替代方案对照表：按 IEPL/IPLC 专线、协议栈与订阅模式寻找平替](/brands/alternatives/)
  - [一次性不限时流量包机场推荐与单 GB 成本核算（主力+冷备最佳拍档）](/plans/non-expiring/)
  - [31 家机场品牌数据库检索中心（支持一键筛选“第三方通用订阅”品牌）](/brands/directory/)
  - 代表性支持第三方订阅的不限时包样本页：[一翻云评测（¥100/100GB Hysteria2/Reality/SS）](/brands/yifan/) · [光速云评测（¥147/247GB 永久套餐）](/brands/guangsuyun/)
- **本集群规划三级选题（待发布选题）**：
  - 《主力月付 + 备用不限时包全年账单推演：为什么双机场组合比单买年付更省钱且不断网？》（状态：`待发布选题`）
  - 《当原机场强制取消 Clash 订阅改用专属端时，如何按 VLESS / Hysteria 2 协议平滑寻找替代品》（状态：`待发布选题`）

### 集群 B：Mihomo / sing-box 多机场合并与规则解耦实操（已发布核心教程 + 进阶规划）
掌握将本地自定义分流规则与远程节点订阅彻底解耦的核心配置技术：
- **已发布关联页面**：
  - [Clash Verge Rev 安装与订阅导入完整设置指南（含系统代理、TUN 与排错）](/guides/clash-verge-rev-setup/)
  - [机场订阅格式详解：Clash YAML、sing-box JSON 与 Base64 差异及转换安全](/guides/subscription-formats-explained/)
  - [Clash / Mihomo 配置文件结构深度解析：Proxy Groups 与 Rules 运作机制](/guides/clash-config/)
  - [分流规则（Routing）配置教程：实现国内外精准分流与 AI 平台独立走线](/guides/routing/)
  - [订阅自动更新与本地配置备份（WebDAV）设置教程](/guides/automatic-update/)
- **本集群规划三级选题（待发布选题）**：
  - 《Mihomo proxy-providers 进阶教程：手把手编写双机场 fallback 自动故障转移与正则节点过滤》（状态：`待发布选题`）
  - 《Clash Verge Rev 全局扩展覆写（Merge 与 JavaScript Script）完全指南：换机场永不丢规则》（状态：`待发布选题`）

### 集群 C：多平台客户端与软路由容灾切换（已发布客户端与排障专区）
在不同操作系统与家庭网关设备上落地主备双订阅方案：
- **已发布关联页面**：
  - 桌面与移动端核心工具：[Clash Verge Rev 专区](/clients/clash-verge-rev/) · [FlClash 跨平台指南](/clients/flclash/) · [v2rayN 多核心教程](/clients/v2rayn/) · [Shadowrocket 小火箭指南](/clients/shadowrocket/) · [Hiddify 全平台教程](/clients/hiddify/) · [Karing 规则兼容端](/clients/karing/)
  - 软路由与底层内核：[OpenWrt 软路由平台总览](/clients/platform/openwrt/) · [OpenClash 配置指南](/clients/openclash/) · [Nikki (MihomoTProxy) 教程](/clients/nikki/) · [Mihomo 内核详解](/clients/mihomo/) · [sing-box 核心详解](/clients/sing-box/)
  - 关联故障排除：[订阅更新失败与 200+0 字节修复](/troubleshooting/subscription/) · [TUN 模式与 WSL2 / Docker 虚拟网卡冲突解决方案](/troubleshooting/tun-wsl-docker-conflict/)
- **本集群规划三级选题（待发布选题）**：
  - 《OpenClash 与 Nikki 软路由双订阅自动容灾配置：实现全屋设备无感知主备切换》（状态：`待发布选题`）

---

## 常见问题（FAQ）

### 更换机场服务商或启用机场替代方案时，之前配好的 Clash 分流规则和 AI 策略组需要重新写吗？

完全不需要重写。只要你在 [Clash Verge Rev](/clients/clash-verge-rev/)、[FlClash](/clients/flclash/) 或 [OpenClash](/clients/openclash/) 中采用配置与节点解耦的设计——即通过全局扩展覆写（Global Merge / Script）或 `proxy-providers` 外部节点集合管理规则，换新机场时只需替换订阅 URL，原有的 [ChatGPT](/ai-streaming/chatgpt/)、[Claude](/ai-streaming/claude/) 分流规则、国内直连白名单和 DNS 防泄漏设置都会 100% 原样继承。

### 准备备用机场最省钱又省心的方案是什么？为什么不建议同时买两家月付？

同时买两家月付会导致备用套餐每个月白白浪费到期清零的流量。最科学的方案是主力买 ¥18–¥25 的月付专线，备用买一份支持第三方通用订阅、跨品牌体系的 100GB–247GB 一次性不限时流量包（如 [一翻云](/brands/yifan/) ¥100/100GB 或 [光速云](/brands/guangsuyun/) ¥147/247GB）。平时不产生任何月租消耗，只在主力维护或突发拥堵时切过去救急，一份百元级不限时包通常可作为冷备使用 1 至 2 年。

### 主力和备用机场可以同时导入同一个客户端并实现自动故障切换吗？

可以。初级用户可以在 [Clash Verge Rev](/clients/clash-verge-rev/)、[v2rayN](/clients/v2rayn/)、[Shadowrocket](/clients/shadowrocket/) 或 [Hiddify](/clients/hiddify/) 中同时保存多个订阅 Profile，故障时手动点击切换（耗时约 3 秒）；进阶用户则可以使用 [Mihomo 内核](/clients/mihomo/) 的 `proxy-providers` 功能，将主力订阅和备用订阅同时引入一份主配置中，并由 `type: fallback` 策略组每 180–300 秒自动探活，一旦主力全挂立即零感切换至备用节点。

### 为什么挑选备用机场时强调必须跨线路体系、跨协议栈且避开同源模板？

如果主力和备用都买在同一个同源模板站群（例如同属 5.6 元极限平价系的 [大佬云](/brands/dalaoyun/)、[闪电鼠](/brands/shandianshu/)、[云界线](/brands/yunjiexian/) 等）或共享同一国内中转机房，当上游发生机房级故障或域名批次被阻断时，主备会同时断联。理想的主备应当在入口线路（[IEPL](/routes/iepl/) vs [IPLC](/routes/iplc/)/BGP）与传输协议（VLESS vs Hysteria 2 / Trojan）上形成异构互补。

### 仅支持专属客户端的机场（如飞猫云、隐形人、SOGO 云）适合作为 Mihomo 自动容灾的备用源吗？

不适合写入 Mihomo 或软路由的 `proxy-providers` 自动容灾配置，因为这类品牌不提供外部可拉取的 Clash YAML 或 Base64 订阅链接。但如果你只追求电脑桌面端的独立冷备，也可以在电脑上安装一款专属客户端但不开机自启，仅在开源客户端主力订阅出问题且急需联网查资料时临时打开应急。

### 配置了 fallback 自动容灾后，如何防止备用机场的不限时流量在不知不觉中被后台刷光？

Mihomo 的 `fallback` 策略组严格按照 `proxies` 列表的先后顺序转发：只要排在第一位的主力机场节点能正常返回 HTTP 204 探活响应，哪怕备用机场延迟更低，流量也 100% 只走主力机场；只有当主力节点全部超时才切向备用，且主力恢复后 `fallback` 会自动切回主力。此外建议如上文模板所示，将大体积下载与视频流媒体组限制在主力节点池，仅将办公与 AI 组挂载到双活容灾组。

### 长期不用的不限时备用订阅，平时需要做哪些维护动作以防关键时刻掉链子？

建议每 60 天执行一次 1 分钟冷备演练：在客户端手动点击更新一次备用机场的订阅链接，并切过去打开一个网页确认连通性。这样能确保备用机场如果在这两个月内更换了中转入口 IP 或订阅下发域名，你的本地缓存能及时同步更新，避免主力断网当天才发现备用订阅早已因为域名变更而无法拉取。
