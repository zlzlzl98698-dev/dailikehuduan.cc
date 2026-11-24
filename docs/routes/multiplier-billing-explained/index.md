---
title: "机场线路倍率怎么算？双向流量扣费、0.2x–5x 倍率实算与 Mihomo 防偷跑过滤"
description: "深度解析机场线路倍率计费规则：拆解 (上行+下行) × 节点倍率 的双向扣费公式，附 100GB 套餐在 0.2x 至 5x 倍率下的真实可用流量矩阵、光速云/唯兔云/星岛梦/无忧链接等品牌库倍率核查，以及 Mihomo 全局脚本与 exclude-filter 防偷跑配置与验证教程。"
lastUpdated: 2026-11-24
author: 代理客户端编辑部
category: 线路技术
tags:
  - 流量倍率
  - 双向计费
  - Mihomo
  - exclude-filter
  - Clash Verge Rev
pillar: routes
parentTopic: /routes/multipliers/
primaryKeyword: 机场线路倍率怎么算
searchIntent: How-to
schemaType: TechArticle
relatedSlugs:
  - /routes/multipliers/
  - /guides/automatic-update/
  - /plans/traffic-100gb-vs-300gb/
  - /brands/weitu/
relatedBrands:
  - guangsuyun
  - weitu
  - xingdaomeng
  - wuyou
faq:
  - q: "机场线路的双向流量扣费公式究竟怎么算？"
    a: "商用机场后台面板（如 V2Board、SSPanel 等）普遍采用双向累计后乘以节点倍率的计费方式，公式为：实际扣减流量 = (上行流量 + 下行流量) × 节点倍率。哪怕你只在进行视频播放或网页浏览，TCP 确认包和请求头仍会产生少量上行流量；如果挂在全局代理下执行云盘上传、远程桌面推流或 BT 做种，上行和下行会同时按倍率成倍扣除。"
  - q: "每月 100GB 的套餐，在不同倍率节点下实际能用多少流量？"
    a: "假设日常浏览场景上行占比约 3% 至 5%，按近似单向等效计算：在 0.2x 节点上 100GB 套餐相当于可使用约 500GB 本地流量；0.5x 下约可使用 200GB；1x 标准节点为足额 100GB；2x 节点缩水至 50GB；3x 节点仅剩约 33.3GB；5x 节点实际只能消耗 20GB 左右。"
  - q: "为什么客户端开着自动选择节点，套餐流量一晚上就跑空了？"
    a: "高倍率节点（2x 至 5x）通常对应低拥堵的 IEPL/IPLC 专线或原生住宅 IP，延迟检测表现往往最好。如果客户端默认的 url-test 自动测速组没有过滤关键字，内核就会自动把全部流量长期锁定在延迟最低的高倍节点上；再叠加系统更新、OneDrive 同步或 Steam 后台更新偷跑，100GB 流量会按 3 倍或 5 倍迅速耗尽。"
  - q: "品牌资料里写了“全节点 1 倍”或“无倍率”，还需要配置防偷跑过滤吗？"
    a: "依然建议配置。一方面，部分品牌仅在特定档位明确标注 1 倍（例如光速云专用资料仅极速版标注全节点×1，其余档位在当前资料库仍为待核实），或后期新增临时高倍落地节点；另一方面，即使全线 1 倍，后台云盘同步、Windows 更新和局域网流量如果未做好规则直连分流，依然会无谓消耗宝贵的月度配额。"
  - q: "如何在 Mihomo（Clash Verge Rev）中把 2x/3x/5x 节点踢出自动测速组？"
    a: "可以在 Clash Verge Rev 的“全局扩展配置（Merge）”或“全局扩展脚本（Script）”中修改策略组，为 type: url-test 的自动优选组加上 exclude-filter 正则（例如 (?i)(1\\.5x|2x|3x|5x|高倍|家宽|VIP)），同时另建一个 type: select 的手动分组收纳高倍节点，并在 rules 顶部插入网盘与系统更新直连规则。"
  - q: "如果节点名字里根本没标倍率，怎么实测确认一条节点是不是暗中翻倍？"
    a: "最直接的方法是做单文件定额对照测试：先暂停其他联网程序并刷新官网面板，记录当前已用流量的精确数值；随后手动切换到待测节点，使用 curl 单线程下载一个恰好 100MB 的测试文件；等待 1 至 3 分钟待面板统计落库后刷新对比差值。扣减约 102MB 至 105MB 说明是 1x，扣减 200MB 以上则说明节点实际设置了 2x 或更高倍率。"
---

# 机场线路倍率怎么算？双向流量扣费、0.2x–5x 倍率实算与 Mihomo 防偷跑过滤

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>商用机场的套餐扣费绝大多数执行<strong>双向乘数计费公式</strong>：<code>后台实际扣费 = (上行字节 + 下行字节) × 节点倍率</code>。一套标称 <code>100GB/月</code> 的套餐，如果长期运行在 <code>2x</code>、<code>3x</code> 或 <code>5x</code> 节点上，本机实际可用流量会分别缩水为 <strong>50GB、33.3GB 与 20GB</strong>；而在 <code>0.5x</code> 或 <code>0.2x</code> 闲时节点上则可放大至 <strong>200GB 与 500GB</strong>。防坑的关键不只是挑选标注 <code>1倍</code> 的套餐，更要通过 <strong>Mihomo 客户端的 <code>exclude-filter</code> 正则过滤与全局扩展脚本（Script）</strong>，把高倍节点彻底踢出 <code>url-test</code> 自动选点池，同时拦截系统更新与网盘同步流量防止后台偷跑。</p>
</div>

对于刚接触第三方客户端订阅的新手来说，最常见的困惑就是：明明买了每月 100GB 或 150GB 的套餐，自己不过每天看看文档、查查资料、偶尔刷几条 1080p 视频，怎么刚到月中面板就弹出“流量已耗尽”？绝大多数情况下，问题并不出在服务商“虚标总流量”，而是出在**双向计费放大、自动测速选中高倍率节点、以及后台进程偷跑**这三件事叠加在了一起。

本篇操作指南面向需要精细控制月度流量支出的个人与多设备用户，完整拆解双向扣费数学模型、真实品牌倍率核查边界，并给出可直接复制使用的 Mihomo（Clash.Meta）覆写模板与实测验证方法。想进一步了解套餐额度该如何选型，也可配合阅读[线路倍率基础说明](/routes/multipliers/)与[配置自动更新与覆写保护](/guides/automatic-update/)。

---

## 一、适用系统与客户端前提

本教程涉及的倍率核算方法适用于所有主流机场后台面板（包括 V2Board、SSPanel-UIM、Xboard 等），而客户端防偷跑过滤配置主要适用于搭载 **Mihomo（Clash.Meta）内核** 的各平台客户端：

| 平台 | 推荐客户端 | 是否支持 `exclude-filter` | 是否支持全局扩展脚本（Script） |
| --- | --- | --- | --- |
| Windows / macOS / Linux | [Clash Verge Rev](/clients/clash-verge-rev/) | 支持（YAML 原生字段） | 支持（内置 JS 覆写引擎） |
| Windows / macOS / Android | [FlClash](/clients/flclash/) | 支持（Mihomo 内核） | 支持（覆写配置） |
| iOS / macOS | [Stash](/clients/stash/) | 支持（规则与策略组过滤） | 支持（覆写配置） |
| OpenWrt 软路由 | [OpenClash](/clients/openclash/) | 支持（Meta 内核模式） | 支持（自定义覆写脚本） |

如果你的机场属于“仅提供官方闭源专属客户端、不提供第三方订阅链接”的模式（例如数据库中的[飞猫云](/brands/feimao/)、[隐形人](/brands/yinxingren/)、[灵猫网络](/brands/lingmao/)等），则无法在本地通过 Mihomo 修改策略组，只能依赖专属客户端内部的手动切节点与分流开关控制消耗。

---

## 二、核心原理与准备事项：算清双向账与品牌真实倍率

在动手修改客户端配置前，必须先把两项基础账目核对清楚：一是数据包在服务端是怎么记账的，二是你手头的机场品牌在官方资料里究竟对倍率做了什么承诺、又有哪些字段仍待核实。

### 1. 双向流量扣费公式与“上行放大”盲区

在家庭宽带或手机卡的常规习惯里，用户通常只关注“下载了多少 GB”。但代理服务端（Xray-core、sing-box 或 Shadowsocks 后端）在用户端口转发每一个加密数据包时，都会同时统计**入站（客户端发往服务端，即上行 `Upload`）**与**出站（服务端返回客户端，即下行 `Download`）**的总字节数，最后统一乘以该节点的倍率系数：

$$\text{后台实际扣减流量} = (\text{上行流量 } U + \text{下行流量 } D) \times \text{节点倍率 } M$$

不同使用场景下，上行流量 $U$ 在双向总量中的占比差异极大：

1. **纯看视频与网页浏览**：上行主要是 TCP 确认包（ACK）与 HTTP 请求头，一般只占下行流量的 `3%–5%`。下载 10GB 视频，实际双向合计约 `10.3GB–10.5GB`。
2. **远程办公与开发者场景**：如果开启全局或 [TUN 模式](/guides/tun/) 后执行 `git push` 大仓库、`docker push` 镜像、Zoom/Teams 高清摄像头视频推流，上行流量会快速接近甚至超过下行流量。
3. **云盘同步与 P2P 误走代理（最容易一夜跑空）**：Google Drive、OneDrive、iCloud 照片库后台上传，或者忘记将 BT/PT 客户端排除出代理，上行流量可以直接把 100GB 套餐在几小时内消耗殆尽。如果此时正好挂在 `3x` 节点上，上传 20GB 素材就会被扣掉 `60GB` 配额。

### 2. `100GB` 标称套餐在 `0.2x–5x` 下的真实可用流量矩阵

为了方便评估不同倍率对月度额度的真实挤压程度，下面以最常见的 **`100GB/月`** 套餐为例（按常规交互约含 4% 上行开销做精细对比，同时给出纯理论折算值），列出从 `0.2x` 到 `5x` 的真实可用量对照表：

| 节点倍率 | 常见线路定位与运营用途 | 理论等效可用总额（`100 ÷ 倍率`） | 计入 4% 常规上行后的本机净下载上限 | 消耗 50GB 本机下行时后台真实扣费 |
| --- | --- | --- | --- | --- |
| **`0.2x`** | 闲时大带宽节点、普通直连下载池 | **500.0 GB** | 约 **480.8 GB** | 仅扣 **10.4 GB** |
| **`0.5x`** | 低成本备用线、分流大文件拉取线 | **200.0 GB** | 约 **192.3 GB** | 仅扣 **26.0 GB** |
| **`1.0x`** | 常规主力中转或标准共享节点（基准） | **100.0 GB** | 约 **96.2 GB** | 扣 **52.0 GB** |
| **`1.5x`** | 部分沪日/深港优化入口加权节点 | **66.7 GB** | 约 **64.1 GB** | 扣 **78.0 GB** |
| **`2.0x`** | 常见 IEPL/IPLC 保护倍率节点 | **50.0 GB** | 约 **48.1 GB** | 扣 **104.0 GB**（已爆表） |
| **`3.0x`** | 稀缺原生 IP、低超售重保专线 | **33.3 GB** | 约 **32.1 GB** | 扣 **156.0 GB** |
| **`5.0x`** | 极稀缺家宽/商宽、防滥用隔离节点 | **20.0 GB** | 约 **19.2 GB** | 扣 **260.0 GB** |

从表中可以看出，同样花钱买 100GB 套餐，`0.2x` 与 `5x` 之间的真实可用额度差距高达 **25 倍**。如果在 `2x` 节点上按“我才下载了 50GB”来估算，后台实际扣费已经达到 `52 × 2 = 104GB`，直接触发超额停用。

### 3. 品牌资料库真实倍率标注与“待核实”边界

在选型和配置过滤之前，必须区分品牌“明确写出 1 倍”与“资料未写明倍率”的差异。根据本站 2026-11-23 整理的机场品牌数据库，代表品牌的倍率字段核查情况如下：

- **[光速云（guangsuyun）](/brands/guangsuyun/)**：原始资料存在档位差异，**仅 `极速版`（¥25/月 · 168GB/月）在专用资料中明确标注了 `全节点×1`**；而同品牌的 `致敬斯诺克147永久套餐（¥147/247GB）`、`轻量版（¥99/年 · 69GB/月，概要曾提 59GB）`、`流光版（¥34/268GB）`、`量子版（¥68/568GB）` 与 `无界版（¥138/900GB）` 在现存文档中倍率均标记为 **`待核实`**（¥680/月定制套餐为独享定制）。因此购买非极速版档位时，切勿默认全节点一定为 1 倍。
- **[唯兔云（weitu）](/brands/weitu/)**：品牌方资料标注全线年付限量款（¥79.9/45GB）、常规月付普通版（¥19.9/150GB）起及永久不限时包均为 **`1倍`**；但需注意数据冲突审计中曾发现汇总表将另一品牌“宇宙云”描述串行至唯兔云，具体导入订阅后仍需核对节点名称后缀。
- **[星岛梦（xingdaomeng）](/brands/xingdaomeng/)**：资料标注年付贴心小包（¥96/60GB）、月付超量150G（¥25/150GB）起及三档永久不限时包均为 **`1倍`**（定制套餐 ¥680/500GB 为定制）。
- **[无忧链接（wuyou）](/brands/wuyou/)**：资料标注 MINI 链接（¥79/年 · 40GB/月）、舒心链接（¥19/月 · 100GB/月）及永久包均为 **`无倍率（1倍）`**，但该品牌客户端模式存在“专属客户端与无需转换订阅”的冲突说明，导入方式需下单前确认。
- **其余未明确标明倍率的品牌**：例如[一翻云（yifan）](/brands/yifan/)、[二猫云（ermao）](/brands/ermao/)、[暮光加速（muguang）](/brands/muguang/) 等在现存清单中均未提供统一倍率说明，倍率字段统一标记为 **`待核实`**。

> 凡是倍率字段属于 `待核实`、或节点名称混有 `1.5x / 2x / 3x / 5x / 家宽 / 专线` 字样的订阅，都**绝对不能直接裸跑客户端默认的自动选点组**，必须按下面第三节的步骤加上硬过滤。

---

## 三、实际操作：配置 Mihomo `exclude-filter` 与 Global Script 防偷跑

要彻底避免自动测速切入 `2x/3x/5x` 节点，同时拦截系统后台大流量偷跑，最稳妥的方式是在 [Clash Verge Rev](/clients/clash-verge-rev/) 中使用 **“全局扩展配置（Merge）”** 或 **“全局扩展脚本（Script）”**。这样即便机场后台开启了每 12 小时或 24 小时自动更新订阅，你的防偷跑策略依然会在每次拉取后自动生效，不会被覆盖还原（原理见[配置结构与策略组基础](/guides/clash-config/)）。

### 第一步：用 `exclude-filter` 改造 `url-test`（YAML 声明式方案）

在 Clash Verge Rev 左侧进入 **订阅（Profiles）**，如果你不想写 JavaScript，可以直接针对当前订阅右键点击 **扩展配置（Merge）**，或者在全局扩展配置中重新梳理策略组，核心在于**让 `url-test` 组显式排除高倍关键字**，并把高倍节点单独放进一个只能手动点选的 `select` 分组：

```yaml
# 适用于 Mihomo (Clash.Meta) 内核的防高倍率自动选点策略组参考
proxy-groups:
  # 1. 日常默认总出口：默认锁定在安全 1x 自动优选组
  - name: "🚀 日常主代理"
    type: select
    proxies:
      - "♻️ 安全自动优选 (排除≥1.5x)"
      - "⬇️ 低倍下载专用 (0.2x–0.5x)"
      - "🎯 高倍专线/家宽 (仅手动切换)"

  # 2. 核心防坑组：利用 exclude-filter 把高倍率节点踢出 url-test
  - name: "♻️ 安全自动优选 (排除≥1.5x)"
    type: url-test
    url: "https://cp.cloudflare.com/generate_204"
    interval: 300
    tolerance: 50
    include-all: true
    # 忽略大小写，踢出 1.5x-9x、带小数点倍率、家宽/住宅/VIP 以及流量到期提示节点
    exclude-filter: "(?i)(1\\.5x|2x|2\\.5x|3x|4x|5x|[2-9]\\.\\dx|高倍|倍率|家宽|住宅|独享|VIP|剩余流量|套餐到期|官网)"

  # 3. 低倍省流组：专门用于大文件拉取或视频缓存
  - name: "⬇️ 低倍下载专用 (0.2x–0.5x)"
    type: url-test
    url: "https://cp.cloudflare.com/generate_204"
    interval: 600
    include-all: true
    filter: "(?i)(0\\.1x|0\\.2x|0\\.3x|0\\.5x|低倍|下载|直连)"

  # 4. 高倍隔离池：必须手动切进来才会扣高倍流量，绝不自动命中
  - name: "🎯 高倍专线/家宽 (仅手动切换)"
    type: select
    include-all: true
    filter: "(?i)(1\\.5x|2x|2\\.5x|3x|4x|5x|高倍|家宽|住宅|VIP)"
```

### 第二步：使用 Mihomo Global Script 动态注入过滤（通用性更强）

很多时候机场下发的 YAML 订阅里，原本就自带了名为 `节点选择`、`自动选择` 或 `Fallback` 的策略组，直接用 Merge 覆盖可能会和原分组名称对不上。更工程化的做法是在 Clash Verge Rev 的 **订阅页面 → 全局扩展脚本（Script）** 中写入一段通用 JavaScript：无论你的机场订阅怎么改名，脚本都会在加载时自动扫描所有 `url-test` 和 `fallback` 策略组，强制剔除 `2x/3x/5x` 等高倍率节点，同时在规则最顶部插入系统更新、云盘与局域网直连规则防偷跑：

```javascript
// Clash Verge Rev / Mihomo 全局扩展脚本（Global Script）
// 功能：1) 自动从所有 url-test/fallback 组剔除高倍率节点  2) 插入防后台偷跑直连规则
function main(config) {
  // 正则匹配常见高倍率与非节点提示关键字（可按实际机场命名增补）
  const highMultRegex = /(1\.5x|2x|2\.5x|3x|4x|5x|[2-9]\dx|×[2-9]|x[2-9]|高倍|家宽|住宅|独享|VIP|剩余流量|到期时间|重置)/i;

  // 1. 构建安全 1x 节点名列表（用于兜底）
  const allProxies = Array.isArray(config.proxies) ? config.proxies : [];
  const safeProxyNames = allProxies
    .filter((p) => p && p.name && !highMultRegex.test(p.name))
    .map((p) => p.name);
  const highMultProxyNames = allProxies
    .filter((p) => p && p.name && highMultRegex.test(p.name))
    .map((p) => p.name);

  // 2. 遍历原有策略组，净化所有自动测速组（url-test / fallback / load-balance）
  if (Array.isArray(config["proxy-groups"])) {
    config["proxy-groups"].forEach((group) => {
      const autoTypes = ["url-test", "fallback", "load-balance"];
      if (group && autoTypes.includes(group.type)) {
        // 若原策略组采用 include-all 模式，则直接注入/合并 exclude-filter
        if (group["include-all"] || group["include-all-proxies"]) {
          const oldExclude = group["exclude-filter"] ? `${group["exclude-filter"]}|` : "";
          group["exclude-filter"] = `${oldExclude}(?i)(1\\.5x|2x|2\\.5x|3x|4x|5x|×[2-9]|x[2-9]|高倍|家宽|住宅|VIP)`;
        }
        // 若原策略组为静态 proxies 数组，则直接过滤数组中的高倍节点名
        if (Array.isArray(group.proxies) && safeProxyNames.length > 0) {
          const filtered = group.proxies.filter((name) => !highMultRegex.test(name));
          // 防止过滤后为空导致内核启动报错，若全为空则保留原列表并打日志提示
          if (filtered.length > 0) {
            group.proxies = filtered;
          }
        }
      }
    });

    // 3. 若存在高倍节点，额外追加一个仅供手动点选的隔离组，方便按需使用
    if (highMultProxyNames.length > 0) {
      config["proxy-groups"].push({
        name: "🎯 高倍/家宽(手动隔离)",
        type: "select",
        proxies: highMultProxyNames,
      });
    }
  }

  // 4. 在 rules 最顶部前置防偷跑直连规则（优先于订阅末尾的 MATCH 兜底）
  const antiLeakRules = [
    // 局域网与私有网段强制直连，防止内网 NAS 传文件走代理
    "IP-CIDR,192.168.0.0/16,DIRECT,no-resolve",
    "IP-CIDR,10.0.0.0/8,DIRECT,no-resolve",
    "IP-CIDR,172.16.0.0/12,DIRECT,no-resolve",
    // Windows Update 与微软商店下载直连（避免数十 GB 补丁烧高倍流量）
    "DOMAIN-SUFFIX,windowsupdate.com,DIRECT",
    "DOMAIN-SUFFIX,update.microsoft.com,DIRECT",
    "DOMAIN-SUFFIX,delivery.mp.microsoft.com,DIRECT",
    // 国内网盘与大流量游戏分发平台直连示例（按需删减）
    "DOMAIN-SUFFIX,baidupcs.com,DIRECT",
    "DOMAIN-SUFFIX,aliyundrive.com,DIRECT",
    "DOMAIN-SUFFIX,steamcontent.com,DIRECT",
    // 常见 P2P/BT 进程直接放行直连，防止做种上行放大扣费
    "PROCESS-NAME,qbittorrent.exe,DIRECT",
    "PROCESS-NAME,BitComet.exe,DIRECT"
  ];

  config.rules = Array.isArray(config.rules)
    ? [...antiLeakRules, ...config.rules]
    : antiLeakRules;

  return config;
}
```

### 第三步：检查 TUN 路由排除，防止局域网与容器流量误扣

如果你开启了 [TUN 虚拟网卡模式](/guides/tun/)，除了上面的 `rules` 前置直连之外，还建议在全局扩展配置（Merge）中保留 `route-exclude-address` 排除 Docker 与局域网网段，以免本机与本地 Docker 容器、NAS 或 WSL2 互传数据时绕经 TUN 接口引发无谓转发。

---

## 四、成功验证：确认过滤生效与实测真实倍率

脚本保存并重新加载配置后，不能只看“没有报错”就以为万事大吉，必须完成以下两项实操验证：

### 1. 策略组结果与规则命中验证

1. 打开 Clash Verge Rev 的 **代理（Proxies）** 页面，展开你的 `自动选择` 或 `url-test` 分组，肉眼核对列表里是否已经**完全找不到 `2x`、`3x`、`5x`、`家宽` 等高倍节点**；同时在底部能看到新生成的 `🎯 高倍/家宽(手动隔离)` 组。
2. 打开 **连接（Connections）** 或 **日志（Logs）** 页面，触发一次 Windows 更新检查或打开局域网设备访问，确认命中的规则显示为 `DIRECT`（来自前置的 `antiLeakRules`），而不是走 `Proxy` 代理组。

### 2. 定额 `100MB` 单文件实测（验证暗倍率）

如果某家机场的节点名字里干脆没写倍率，如何验证它到底是不是 `1x`？

1. 暂停电脑和手机上所有网盘同步、视频播放和下载任务，确保同一账号下只有当前这一台设备在连接。
2. 登录机场用户中心面板，记录当前**已用流量精确数值**（例如 `12.40 GB`）。
3. 在客户端手动选中待测的单一节点，在 Windows PowerShell 或终端执行单线程拉取一个 100MB 测速文件并直接丢弃（假设本地代理端口为 `7897`）：

```powershell
# 下载 100MB 样本直丢入 NUL，仅用于测量单节点真实扣费倍率
curl.exe -x http://127.0.0.1:7897 -o NUL https://speed.cloudflare.com/__down?bytes=104857600
```

4. 下载完成后等待 **2–3 分钟**（多数 V2Board/SSPanel 面板每 60 秒汇总上报一次流量），刷新官网面板查看新数值：
   - 增量在 **`102MB–108MB`** 之间：确认为 **`1x` 真实倍率**；
   - 增量在 **`204MB–216MB`** 之间：节点实际配置了 **`2x` 倍率**；
   - 增量在 **`306MB–324MB`** 之间：节点实际配置了 **`3x` 倍率**，应立即将该节点关键字加入你的 `highMultRegex` 黑名单中。

---

## 五、常见错误与排查

1. **错误一：正则过滤太宽泛，把所有节点都过滤光了，导致内核报错无法启动**
   - **原因**：例如节点名字是 `HK-Example-02`，而你在正则里错误写了 `2` 而不是 `2x` 或 `×2`，结果把带数字序号 `02`、`20` 的正常节点全部踢掉了。
   - **解决**：正则中务必绑定倍率符号（如 `2x|3x|5x|×2|x2`），并在 JS 脚本里保留“若过滤后数组为空则回退原数组”的保护判断。
2. **错误二：把自定义直连规则写在了 `append-rules`（末尾追加）**
   - **原因**：绝大多数机场订阅最后一行是 `MATCH,节点选择`。写在末尾的规则永远排在 `MATCH` 后面，根本不会触发。
   - **解决**：必须像上文脚本那样使用 `[...antiLeakRules, ...config.rules]` 插到最顶部，或在 Merge 中使用 `prepend-rules`（详见[分流规则优先级教程](/guides/routing/)）。
3. **错误三：只管了下行下载，忘了 OneDrive / iCloud 云盘同步也在走代理**
   - **原因**：开启全局模式或 TUN 模式后，微软 OneDrive、苹果 iCloud Drive 或 Docker Desktop 推流往往走微软/苹果海外域名，会被通用国外规则归入代理，产生大量上行扣费。
   - **解决**：对于国内网盘、系统镜像源和本地 P2P 下载工具，务必按域名或 `PROCESS-NAME` 强制指定 `DIRECT`。
4. **错误四：误以为把 `url-test` 间隔调成 30 秒更稳定**
   - **原因**：过于频繁地轮询测速不仅会增加大量无意义的 `generate_204` 握手包，还容易导致正在使用的 AI 对话频繁切换出口 IP 触发账号风控。
   - **解决**：自动优选组 `interval` 设为 `300` 至 `600` 秒即可，AI 类业务建议单独绑定固定的 `select` 手动策略组。

---

## 常见问题（FAQ）

### 机场线路的双向流量扣费公式究竟怎么算？

商用机场后台面板（如 V2Board、SSPanel 等）普遍采用双向累计后乘以节点倍率的计费方式，公式为：实际扣减流量 = (上行流量 + 下行流量) × 节点倍率。哪怕你只在进行视频播放或网页浏览，TCP 确认包和请求头仍会产生少量上行流量；如果挂在全局代理下执行云盘上传、远程桌面推流或 BT 做种，上行和下行会同时按倍率成倍扣除。

### 每月 100GB 的套餐，在不同倍率节点下实际能用多少流量？

假设日常浏览场景上行占比约 3% 至 5%，按近似单向等效计算：在 0.2x 节点上 100GB 套餐相当于可使用约 500GB 本地流量；0.5x 下约可使用 200GB；1x 标准节点为足额 100GB；2x 节点缩水至 50GB；3x 节点仅剩约 33.3GB；5x 节点实际只能消耗 20GB 左右。

### 为什么客户端开着自动选择节点，套餐流量一晚上就跑空了？

高倍率节点（2x 至 5x）通常对应低拥堵的 IEPL/IPLC 专线或原生住宅 IP，延迟检测表现往往最好。如果客户端默认的 url-test 自动测速组没有过滤关键字，内核就会自动把全部流量长期锁定在延迟最低的高倍节点上；再叠加系统更新、OneDrive 同步或 Steam 后台更新偷跑，100GB 流量会按 3 倍或 5 倍迅速耗尽。

### 品牌资料里写了“全节点 1 倍”或“无倍率”，还需要配置防偷跑过滤吗？

依然建议配置。一方面，部分品牌仅在特定档位明确标注 1 倍（例如光速云专用资料仅极速版标注全节点×1，其余档位在当前资料库仍为待核实），或后期新增临时高倍落地节点；另一方面，即使全线 1 倍，后台云盘同步、Windows 更新和局域网流量如果未做好规则直连分流，依然会无谓消耗宝贵的月度配额。

### 如何在 Mihomo（Clash Verge Rev）中把 2x/3x/5x 节点踢出自动测速组？

可以在 Clash Verge Rev 的“全局扩展配置（Merge）”或“全局扩展脚本（Script）”中修改策略组，为 type: url-test 的自动优选组加上 exclude-filter 正则（例如 (?i)(1\\.5x|2x|3x|5x|高倍|家宽|VIP)），同时另建一个 type: select 的手动分组收纳高倍节点，并在 rules 顶部插入网盘与系统更新直连规则。

### 如果节点名字里根本没标倍率，怎么实测确认一条节点是不是暗中翻倍？

最直接的方法是做单文件定额对照测试：先暂停其他联网程序并刷新官网面板，记录当前已用流量的精确数值；随后手动切换到待测节点，使用 curl 单线程下载一个恰好 100MB 的测试文件；等待 1 至 3 分钟待面板统计落库后刷新对比差值。扣减约 102MB 至 105MB 说明是 1x，扣减 200MB 以上则说明节点实际设置了 2x 或更高倍率。
