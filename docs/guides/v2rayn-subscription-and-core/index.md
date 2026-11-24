---
title: v2rayN 如何导入订阅与切换 Xray/sing-box/Mihomo 多核心？跨平台操作教程
description: 基于 2dust/v2rayN 跨平台版本（Windows / macOS / Linux），详细演示 WithCore 与基础压缩包选型、Base64 与 Clash YAML 订阅导入边界、User-Agent 请求头设置、Xray-core / sing-box / Mihomo 多核心按协议切换、Tun 虚拟网卡与绕过大陆规则配置，以及 curl 终端实测与常见报错定位。
lastUpdated: 2026-11-24
author: 代理客户端编辑部
category: 客户端配置
tags:
  - v2rayN
  - 导入订阅
  - 多核心切换
  - Xray-core
  - sing-box
  - Mihomo
  - Tun 模式
pillar: guides
parentTopic: /clients/v2rayn/
primaryKeyword: v2rayN 如何导入订阅链接
searchIntent: How-to
relatedSlugs:
  - /clients/v2rayn/
  - /guides/subscription-formats-explained/
  - /clients/sing-box/
  - /guides/installation/
relatedBrands:
  - yifan
  - kexin
  - guangsuyun
schemaType: TechArticle
faq:
  - q: 下载 v2rayN 时应该选 WithCore 完整包还是不含核心的基础包？
    a: 首次安装一律选择文件名包含 With-Core 的完整压缩包（例如 Windows 端 v2rayN-windows-64-With-Core.zip，系统精简版若缺少 .NET 运行库则优先选含运行时独立包）。With-Core 包已内置 Xray-core、sing-box 与 Mihomo 核心二进制以及 GeoIP/GeoSite 规则文件；不含核心的基础包只用于已有运行目录的覆盖升级，新手误下基础包会直接导致无法启动代理核心。
  - q: 为什么把机场的 Clash YAML 订阅直接粘进 v2rayN 默认订阅分组会提示解析失败或 0 节点？
    a: v2rayN 的常规“订阅分组”默认按 Base64 节点列表或单条分享链接解码，不直接把包含 proxy-groups 和 rules 的完整 Clash YAML 当作普通订阅解析。遇到 Clash 订阅时，要么在服务商后台复制通用 Base64 订阅链接，要么在 v2rayN 中使用“服务器 → 添加自定义配置服务器”导入 YAML 并指定由 Mihomo 或 sing-box 核心接管运行。
  - q: v2rayN 里的 Xray-core、sing-box 和 Mihomo 三个核心应该怎么按协议分配？
    a: 保持按协议分工最稳妥：VLESS-Reality、VMess、Trojan 与 Shadowsocks 优先分配给 Xray-core；遇到 Hysteria 2、TUIC、WireGuard 等现代 UDP 传输协议或需要开启高兼容 Tun 虚拟网卡模式时，切换或自动匹配为 sing-box；仅在需要原生运行外部 Clash YAML 配置文件时指定 Mihomo 核心。至于 AnyTLS 等新兴协议，需核对当前内置核心版本支持矩阵并优先匹配支持的 sing-box 或 Mihomo 分支。
  - q: 更新订阅时总是报错超时，或者提示远程服务器返回错误怎么办？
    a: 最常见的原因是更新前没有关闭本地“系统代理”或“Tun 模式”，导致更新请求穿过了失效的旧节点形成死循环。请先在底部状态栏选择“清除系统代理”并关闭“启用 Tun”，再点击“订阅分组 → 更新全部订阅（不通过代理）”；如果订阅域名本身被本地宽带污染，可先临时切到一条可用节点，再执行“通过代理更新”。
  - q: 为什么 v2rayN 选中节点按 Ctrl+O 测试延迟正常，打开网页或用 curl 却连不上？
    a: Ctrl+O 执行的是 Tcping，只探测目标端口能否完成 TCP 握手，即便节点 UUID 失效或后端已经宕机，只要中转入口端口开着仍会显示绿灯延迟。务必使用快捷键 Ctrl+R 执行“真连接延迟”测试，同时检查底部状态栏是否已开启“自动配置系统代理”或“启用 Tun”，并确认本机系统时间误差不超过一分钟。
  - q: macOS 和 Linux 用户现在也能直接用 2dust/v2rayN 吗，开启 Tun 需要什么权限？
    a: 可以。2dust/v2rayN 已演进为跨平台客户端，正式提供 Windows（x64/ARM64）、macOS（Apple Silicon arm64 与 Intel x64）以及 Linux（DEB 与 AppImage）版本。在 macOS 与 Linux 上开启 Tun 模式创建虚拟网卡时，需要在弹窗中输入系统管理员密码或预先为内核文件授予网络管理权限，并确保 Tun 由 sing-box 或 Mihomo 核心接管。
---

# v2rayN 如何导入订阅与切换 Xray/sing-box/Mihomo 多核心？跨平台操作教程

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>在跨平台版 <strong>v2rayN</strong>（官方仓库 <code>2dust/v2rayN</code>）中跑通订阅与多核心调度的标准流程分为五步：<strong>下载包含核心的 <code>With-Core</code> 完整包并完整解压至纯英文目录 → 确认服务商支持第三方通用订阅并先关闭本机残留代理 → 在“订阅分组设置”粘贴 Base64 订阅 URL（必要时指定 <code>User-Agent</code>）拉取节点 → 在“Core 类型设置”按协议把 VLESS-Reality 交给 <code>Xray-core</code>、把 Hysteria 2/TUIC 与 Tun 接管交给 <code>sing-box</code>、把外部 Clash YAML 交给 <code>Mihomo</code> → 启用系统代理（默认混合端口 <code>10808</code>）或提权开启 Tun 并用 <code>Ctrl + R</code> 与 <code>curl</code> 实测验证</strong>。切勿将 Clash YAML 直接塞入默认 Base64 订阅分组。</p>
</div>

许多用户对 [v2rayN](/clients/v2rayn/) 的印象仍停留在“早年只能跑 V2Ray 的 Windows 小工具”，但随着 `2dust/v2rayN` 完成跨平台架构重构，如今它已经同时覆盖 **Windows、macOS 与 Linux** 三大桌面系统，并把最大的工程优势集中在一处：**单个图形前端同时调度 `Xray-core`、`sing-box` 与 `Mihomo` 多个代理核心**。

只要理解了“哪种安装包带核心”“哪种订阅格式进哪个入口”以及“哪类协议该分配给哪个核心”，你就不需要为了换协议而频繁重装客户端。下文按从系统边界到命令行验证的完整操作顺序拆解每一步动作。

---

## 一、适用系统与跨平台版本边界

本教程适用于官方开源仓库 `2dust/v2rayN` 发布的跨平台版客户端（核验快照日期：`2026-11-23`），主要技术边界与系统支持范围如下：

| 操作系统 | 支持处理器架构与包形态 | 底层代理运行依赖 | 默认本地监听端口 | 权限与界面机制 |
| --- | --- | --- | --- | --- |
| **Windows 10 / 11** | `x64`（主流 Intel/AMD PC）与 `ARM64`（骁龙笔记本），提供 `.zip` 解压包 | 依赖 `.NET 8 Desktop Runtime`（或直接下载含运行时的 `SelfContained` 版） | 混合端口 `10808`（同时支持 SOCKS5 与 HTTP） | 常规系统代理无需提权；启用 `Tun` 必须右键以管理员身份运行 |
| **macOS 桌面端** | Apple Silicon（`arm64` / M 系列）与 Intel（`x64`），提供 `.dmg` 镜像 | 自带跨平台运行支撑，核心二进制内置于应用包内 | 混合端口 `10808` | 首次启动需消除苹果隔离属性；启用 `Tun` 需授权管理员密码调用 `utun` |
| **Linux 桌面发行版** | `amd64` / `arm64`，提供 `.deb` 安装包与 `.AppImage` 便携包 | Debian/Ubuntu 推荐 `apt` 补全图形依赖；`AppImage` 需内核支持 FUSE | 混合端口 `10808` | 启用 `Tun` 需确认 `/dev/net/tun` 存在并对核心授予网络管理权限 |

在开始部署前，建议对照 [全平台客户端安全安装流程](/guides/installation/) 核实本机 CPU 架构（Windows PowerShell 执行 `$env:PROCESSOR_ARCHITECTURE`，macOS 与 Linux 终端执行 `uname -m`），防止下错指令集导致双击闪退或转译卡顿。

---

## 二、准备事项：安装包选型、格式避坑与机场订阅核对

动手添加订阅前，必须先扫清三个在社区问答中最高频的前置障碍：压缩包选错导致无核心、订阅格式与入口不匹配，以及服务商本身是否支持第三方导入。

### 1. 严格区分 `WithCore` 完整包与无核心基础包

前往 `github.com/2dust/v2rayN` 的 Releases 页面展开资产列表时，同一版本号下往往存在多个体积差距很大的 `.zip` 文件：

- **`With-Core` 完整版（新手必选）**：例如 `v2rayN-windows-64-With-Core.zip`。文件体积较大，内部已预先打包好 `bin/` 目录下的 `xray`、`sing-box`、`mihomo` 可执行核心及 `geoip.dat`、`geosite.dat` 路由数据库，解压后即可直接联网。
- **`SelfContained` 独立运行版（精简系统必选）**：如果你使用的是 Windows 10 LTSC 等精简版系统，且本机尚未安装 `.NET 8` 桌面运行时，直接选用标记为 `SelfContained` 的完整包即可免去额外安装运行库的报错。
- **不含核心的基础版（仅用于覆盖升级）**：例如体积较小的 `v2rayN-windows-64.zip`。该包内**没有任何代理核心文件**，一旦新手直接解压启动，打开界面后选中节点点击连接会直接抛出“找不到核心文件”或连接失败。

**解压路径铁律**：拿到 Windows 压缩包后，千万不要在压缩软件预览窗口直接双击 `v2rayN.exe`。必须右键完整解压到**纯英文、非系统受保护路径**（例如 `D:\Tools\v2rayN\`），避开 `C:\Program Files\`，以免程序因没有写入权限而无法保存配置 JSON。同时，建议将解压目录加入 Windows 安全中心排除项，避免 `xray.exe` 或 `sing-box.exe` 被误隔离。

### 2. 切勿把 Clash YAML 直接粘贴到普通订阅分组

许多刚从 [Clash Verge Rev](/clients/clash-verge-rev/) 转过来的用户，习惯性复制一条 `?flag=clash` 的链接直接丢进 v2rayN 的“订阅分组”，结果刷新后节点数显示为 `0` 或直接报错。

根因在于两者的解析边界不同（详细数据结构对照可阅读 [主流机场订阅格式深度解析](/guides/subscription-formats-explained/)）：
- v2rayN 的常规 **订阅分组** 预期拉取的是 **Base64 编码节点列表**（解码后是一行行 `vless://`、`vmess://`、`trojan://`、`ss://`、`hy2://`）或单条分享链接，路由分流由 v2rayN 本地的 `GeoIP/GeoSite` 与自定义规则负责。
- **Clash YAML** 则是节点与策略组混编的文本格式。如果你直接将纯 Clash YAML 当成普通节点订阅拉取而没有选定 Mihomo 核心自定义配置入口，解析器无法提取标准单节点行，自然会导入失败。

### 3. 核对服务商 `clientMode` 与协议特征

并非所有机场都会在后台暴露标准订阅链接。根据站内 `2026-11-23` 品牌档案核对：
- 如果服务商采用“第三方通用订阅”或“自研+第三方订阅”模式，例如主推多协议与第三方通用订阅的 [一翻云](/brands/yifan/)（档案标注提供 `Hysteria 2`、`VLESS-Reality` 与 `Shadowsocks` 三协议）、支持第三方通用客户端与 `VLESS` 协议的 [科信云](/brands/kexin/)，以及支持“自研+第三方订阅”模式的 [光速云](/brands/guangsuyun/)（文字资料标注 `VLESS`，归档测试记录曾出现 `Shadowsocks` 与 `AnyTLS` 差异待实时核验），均可在服务商后台复制通用订阅链接接入 v2rayN。
- 如果服务商属于“仅专属客户端”模式（后台只给专有客户端安装包、不提供订阅 URL），则无法导入 v2rayN、Shadowrocket 或任何第三方开源工具。

---

## 三、实际操作：订阅导入、`User-Agent` 设置与多核心切换

完成解压并确认软件能正常启动后，先看一眼底部状态栏，确保 **系统代理** 处于 `清除系统代理`、**启用 Tun** 处于关闭状态，避免未连节点先形成本地环路死锁。

### 第一步：添加订阅分组与设置 `User-Agent`

1. 打开 v2rayN 主界面，点击顶部菜单栏 **订阅分组 → 订阅分组设置**。
2. 点击弹窗左上角的 **添加**，按以下字段填写：
   - **备注**：填写易于辨识的品牌简称，方便后续多机场切换。
   - **可选地址（Url）**：完整粘贴后台复制的 **通用订阅 / V2Ray 订阅链接**。粘贴后务必检查首尾不能多出空格或回车换行。
   - **User-Agent**：多数情况下保持默认留空即可；如果服务商面板开启了防爬虫或按客户端标识动态过滤节点，导致导入后节点数为零或缺失新协议，可在此栏按服务商文档显式填入对应标识（例如 `v2rayN/7.0` 或 `v2rayNG/1.9.x`；若确定通过后端切换下发格式，再按需测试其他标识）。
   - **自动更新间隔（分钟）**：主力订阅建议填 `720`（12 小时）或 `1440`（24 小时），避免设成几分钟一次引发服务端 `429` 限流。
3. 点击 **确定** 保存设置并关闭弹窗。
4. 回到主界面，点击 **订阅分组 → 更新全部订阅（不通过代理）**。等待几秒，主列表出现各地区节点即表示拉取成功。
5. **补充场景——导入自建单节点或 Clash YAML**：
   - 若持有单条 `vless://...` 或 `hysteria2://...` 链接，直接复制后在 v2rayN 主界面按 `Ctrl + V`（或点击 **服务器 → 从剪贴板导入批量 URL**）即可批量解码。
   - 若服务商确实只提供 Clash YAML 文件或链接而没有 Base64 入口，不要放进普通订阅分组，请下载 YAML 后点击 **服务器 → 添加自定义配置服务器**，将文件导入并把核心明确指定为 **mihomo**，再单独启用该自定义条目（注意此时节点切换需通过 Mihomo 外部面板管理）。

### 第二步：在 `Core 类型设置` 中切换 Xray / sing-box / Mihomo 多核心

这是发挥 v2rayN 跨平台多核优势的核心环节。点击顶部菜单 **设置 → Core 类型设置**（部分版本入口为 **设置 → 参数设置 → Core 类型设置**），你会看到针对不同协议类型绑定的核心下拉列表：

| 协议与功能场景 | 推荐绑定核心 | 核心技术原因与适用边界 |
| --- | --- | --- |
| **VLESS（含 Reality / XTLS-Vision）** | `Xray`（或 `sing-box`） | `Xray-core` 是 VLESS-Reality 生态源头引擎，常规 TCP 吞吐与内存控制极其稳定；若全局强依赖 Tun 模式亦可交由 `sing-box` 统一接管 |
| **VMess / Trojan / Shadowsocks** | `Xray` | 兼容各种早期与现代传输层参数（如 WebSocket、gRPC、AEAD），日常最省资源 |
| **Hysteria 2 / TUIC / WireGuard** | **`sing-box`** | `Xray-core` 原生不支持 Hysteria 2 与 TUIC v5；必须交由 `sing-box` 核心（或独立核心）才能正常完成 QUIC 握手与带宽控制 |
| **AnyTLS 等新兴抗指纹协议** | **`sing-box`** 或 **`Mihomo`** | `AnyTLS` 属于近年引入的新协议，要求配套升级 `bin/` 下的 `sing-box` 或 `mihomo` 至最新支持版本并在 Core 类型设置中指派对应引擎 |
| **外部 Clash YAML 完整规则配置** | **`Mihomo`** | 通过“添加自定义配置服务器”加载，完整还原原 YAML 里的 `proxy-groups` 与 `.mrs` 规则集 |

> **实战建议**：在日常多协议混合订阅中，只要确认 `VLESS` / `VMess` / `Trojan` / `Shadowsocks` 设为 `Xray`，`Hysteria2` / `TUIC` / `WireGuard` 设为 `sing-box`，并在主界面参数设置中允许 **Tun 模式优先调用 `sing-box`**，软件就会在你点击不同节点时无缝自动拉起对应引擎，无需每次人工切换进程。关于 `sing-box` 的底层配置规范，可延伸阅读 [sing-box 核心与官方端详解](/clients/sing-box/)。

### 第三步：配置系统代理、Tun 模式与自定义路由规则

节点导入并匹配好核心后，需要让系统流量真正流向代理引擎：

1. **普通浏览器场景（系统代理）**：
   - 在 v2rayN 主界面选中一条节点，按 `Enter`（回车）将其设为活动服务器。
   - 在界面最底部的 **系统代理** 下拉菜单中，将其从 `清除系统代理` 切换为 **`自动配置系统代理`**。此时 v2rayN 会将系统 HTTP/HTTPS 代理指向本地混合端口 `127.0.0.1:10808`。
2. **终端、游戏与全应用接管场景（Tun 模式）**：
   - Windows 用户须先彻底退出 v2rayN，右键 `v2rayN.exe` 选择 **以管理员身份运行**（macOS/Linux 则在触发弹窗时输入系统密码赋权）。
   - 打开底部的 **启用 Tun** 开关，使虚拟网卡接管三层网络数据包（底层自动切换至 `sing-box` 或 `mihomo` 运行 Tun 栈）。
   - 若本机同时运行 **WSL2 或 Docker Desktop** 导致容器无法联网，请务必参照 [TUN 模式与 WSL2/Docker 冲突修复](/troubleshooting/tun-wsl-docker-conflict/) 排除 `172.16.0.0/12` 等私有网段。
3. **路由分流规则调整（绕过大陆与自定义规则）**：
   - 底部 **路由** 下拉框默认推荐选择 **`绕过大陆（Bypass Mainland）`**，确保私有局域网与国内主流域名/IP（`geosite:cn`、`geoip:cn`）直连不消耗节点流量。
   - 点击顶部 **设置 → 路由设置**，确认 **域名策略（domainStrategy）** 为 **`IPIfNonMatch`**（先按域名库匹配，未命中再做 DNS 解析比对 IP，兼顾速度与防 DNS 泄漏）。
   - 如需定期同步国内新网段，每隔两周点击顶部 **更新 → 更新 Geo 文件** 刷新 `geoip.dat` 与 `geosite.dat`。

---

## 四、成功验证：真连接测速与终端 `curl` 全链路实测

图形界面显示“已启动”并不等于链路已经打通。请按下面两个层级完成端到端实测验证。

### 1. 客户端内先做“真连接延迟”筛选

在节点列表中选中所有节点（`Ctrl + A`），直接按下快捷键 **`Ctrl + R`**（或右键选 **测试服务器真连接延迟**），切勿只看 `Ctrl + O`（Tcping）。真连接测试会真实拉起核心完成加密握手并请求 `204` 探针，只有返回正数毫秒值（而非 `-1` 或 `Timeout`）的节点，才说明密码、TLS 证书与落地出口全线可用。

### 2. 用 `curl` 验证系统代理与 Tun 模式的真实出口

打开一个新的终端窗口，分别测试“本地混合端口”和“全局 Tun 接管”是否生效：

```powershell
# 【场景 A】仅开启“自动配置系统代理”（未开 Tun）时，通过默认 10808 端口验证代理出口
curl.exe -s -x http://127.0.0.1:10808 https://api.ip.sb/geoip

# 【场景 B】已开启“启用 Tun”时，不加任何 -x 代理参数直接发起请求，应同样返回境外节点 IP 信息
curl.exe -s https://api.ip.sb/geoip

# 【场景 C】验证国内站点直连响应是否正常（不应出现明显绕路高延迟或证书报错）
curl.exe -I https://www.baidu.com
```

*(macOS 与 Linux 用户将上述命令中的 `curl.exe` 替换为 `curl` 执行即可。)*

**预期成功结果**：
- 访问 `api.ip.sb/geoip` 返回的 JSON 字段中，`country` 与 `ip` 必须与你当前选中的境外节点地区一致；
- 同时查看 v2rayN 主界面底部日志区或信息面板，可以看到海外请求命中了 `proxy` 出站，而国内站点命中了 `direct` 直连出站，且没有 `TLS handshake timeout` 或 `connection refused` 红字警告。

---

## 五、常见错误快速定位与处理表

实际操作中遇到导入失败、断流或开关弹回，请对照下表按现象精准排查，不要盲目删光配置重装：

| 常见故障现象 | 核心诱因 | 标准化修复动作 |
| --- | --- | --- |
| **启动后连节点报错“找不到核心文件”** | 误下载了不含核心的精简压缩包，或 `bin/` 核心文件被杀软误杀 | 换用 `With-Core` 完整包完整解压；检查安全中心隔离区并将整个 v2rayN 目录加入白名单 |
| **导入 Clash 链接后提示失败或节点数为 `0`** | 把 Clash YAML 链接直接塞进了默认按 Base64 解析的“订阅分组” | 在机场后台改复制“通用/V2Ray Base64 订阅”；或改走“添加自定义配置服务器”+ `mihomo` 核心 |
| **更新订阅超时或返回 `200+0` 空内容** | 更新前未关闭旧系统代理导致死循环，或 `User-Agent` 被拦截 | 先设为“清除系统代理”与关闭 Tun 后选“不通过代理更新”；仍报错则在订阅设置中补全合规 UA 或改用“通过代理更新” |
| **全部节点 `Ctrl + R` 返回 `-1` / 超时** | 本机系统时间偏差大于 60 秒导致 TLS/Reality 握手失败，或订阅节点已变更 | 对照 [系统时间偏差修复](/guides/system-time-tls-fix/) 同步网络时间后，重新更新一次订阅 |
| **点击“启用 Tun”后开关立刻自动弹回** | Windows 未以管理员权限运行，或目标节点对应核心未切为 `sing-box`/`mihomo` | 完全退出软件后右键“以管理员身份运行”；检查核心设置确保由 `sing-box` 接管 Tun；详情参阅 [TUN 不生效排查](/troubleshooting/tun/) |
| **Hysteria 2 或 AnyTLS 节点始终连不通** | `Core 类型设置` 中仍误绑在 `Xray`，或内置 `sing-box`/`mihomo` 版本过旧 | 检查对应协议的核心绑定改为 `sing-box`（或支持 `AnyTLS` 的最新核心），并在“检查更新”中同步升级核心二进制 |

---

## 常见问题（FAQ）

### 下载 v2rayN 时应该选 WithCore 完整包还是不含核心的基础包？

首次安装一律选择文件名包含 With-Core 的完整压缩包（例如 Windows 端 v2rayN-windows-64-With-Core.zip，系统精简版若缺少 .NET 运行库则优先选含运行时独立包）。With-Core 包已内置 Xray-core、sing-box 与 Mihomo 核心二进制以及 GeoIP/GeoSite 规则文件；不含核心的基础包只用于已有运行目录的覆盖升级，新手误下基础包会直接导致无法启动代理核心。

### 为什么把机场的 Clash YAML 订阅直接粘进 v2rayN 默认订阅分组会提示解析失败或 0 节点？

v2rayN 的常规“订阅分组”默认按 Base64 节点列表或单条分享链接解码，不直接把包含 proxy-groups 和 rules 的完整 Clash YAML 当作普通订阅解析。遇到 Clash 订阅时，要么在服务商后台复制通用 Base64 订阅链接，要么在 v2rayN 中使用“服务器 → 添加自定义配置服务器”导入 YAML 并指定由 Mihomo 或 sing-box 核心接管运行。

### v2rayN 里的 Xray-core、sing-box 和 Mihomo 三个核心应该怎么按协议分配？

保持按协议分工最稳妥：VLESS-Reality、VMess、Trojan 与 Shadowsocks 优先分配给 Xray-core；遇到 Hysteria 2、TUIC、WireGuard 等现代 UDP 传输协议或需要开启高兼容 Tun 虚拟网卡模式时，切换或自动匹配为 sing-box；仅在需要原生运行外部 Clash YAML 配置文件时指定 Mihomo 核心。至于 AnyTLS 等新兴协议，需核对当前内置核心版本支持矩阵并优先匹配支持的 sing-box 或 Mihomo 分支。

### 更新订阅时总是报错超时，或者提示远程服务器返回错误怎么办？

最常见的原因是更新前没有关闭本地“系统代理”或“Tun 模式”，导致更新请求穿过了失效的旧节点形成死循环。请先在底部状态栏选择“清除系统代理”并关闭“启用 Tun”，再点击“订阅分组 → 更新全部订阅（不通过代理）”；如果订阅域名本身被本地宽带污染，可先临时切到一条可用节点，再执行“通过代理更新”。

### 为什么 v2rayN 选中节点按 Ctrl+O 测试延迟正常，打开网页或用 curl 却连不上？

Ctrl+O 执行的是 Tcping，只探测目标端口能否完成 TCP 握手，即便节点 UUID 失效或后端已经宕机，只要中转入口端口开着仍会显示绿灯延迟。务必使用快捷键 Ctrl+R 执行“真连接延迟”测试，同时检查底部状态栏是否已开启“自动配置系统代理”或“启用 Tun”，并确认本机系统时间误差不超过一分钟。

### macOS 和 Linux 用户现在也能直接用 2dust/v2rayN 吗，开启 Tun 需要什么权限？

可以。2dust/v2rayN 已演进为跨平台客户端，正式提供 Windows（x64/ARM64）、macOS（Apple Silicon arm64 与 Intel x64）以及 Linux（DEB 与 AppImage）版本。在 macOS 与 Linux 上开启 Tun 模式创建虚拟网卡时，需要在弹窗中输入系统管理员密码或预先为内核文件授予网络管理权限，并确保 Tun 由 sing-box 或 Mihomo 核心接管。
