---
title: "代理客户端故障排查中心：节点超时、订阅失败、DNS 异常与网络恢复全指南"
description: "结构化代理客户端故障排查中心：内置本地诊断向导，按“现象→可能原因→检查步骤→处理方法→验证结果→下一步”全流程排查节点超时、所有节点不可用、订阅 200+0 字节、客户端无法启动、DNS/Fake-IP 残留、系统代理与 TUN/WSL2 冲突。"
lastUpdated: 2026-11-23
schemaType: CollectionPage
itemListCount: 7
faq:
  - q: "代理客户端突然全部节点超时（timeout 或 -1ms），最先应该检查什么？"
    a: "优先检查本地系统时间与标准 UTC 的偏差（超过 90 秒会直接触发 VMess 时间窗校验与 TLS/VLESS-Reality 握手失败），其次确认套餐是否到期或流量耗尽，再排查是否同时开启了多款 VPN、游戏加速器或防火墙拦截了核心进程。"
  - q: "更新订阅时客户端提示 HTTP 200，但内容显示 0 字节（200+0 字节）是什么原因？"
    a: "常见原因为机场面板会校验请求头中的 User-Agent，当客户端发送了被过滤或未知的 UA、参数被截断或订阅 Token 已重置时，后端可能返回状态码 200 但响应体为空。修正订阅 User-Agent 或重新从控制台复制完整链接即可排查。"
  - q: "为什么客户端测试节点延迟只有 40ms，打开网页却提示连接超时或 ERR_PROXY_CONNECTION_FAILED？"
    a: "这说明节点本身大概率连通，但浏览器流量并没有正确进入代理端口。常见原因包括仅开启了核心却未打开系统代理、浏览器扩展（如 SwitchyOmega）指向了旧端口 7890 而非新版客户端端口 7897，或代理模式误设为 Direct 直连。"
  - q: "关闭代理软件后国内网页反而全部打不开，ping 域名显示 198.18.0.x 怎么恢复？"
    a: "这是 Fake-IP 模式异常退出后留下的系统或浏览器 DNS 缓存。198.18.0.0/16 是代理内核用于映射虚拟解析的保留网段，强杀进程或断电退出导致 DNS 未刷新，在终端执行 ipconfig /flushdns 并清理浏览器异步 DNS 缓存即可恢复。"
  - q: "Windows 安装 Clash Verge Rev 后打开是白屏，或者提示无法启动核心怎么办？"
    a: "白屏通常是因为精简版系统缺失 Microsoft Edge WebView2 Runtime 运行时或旧显卡驱动与 GPU 硬件加速冲突；核心无法启动则多为 Windows Defender 或第三方杀软隔离了 mihomo/xray 核心文件，或残留进程占用了 7897/9097 端口。"
  - q: "为什么开了系统代理后浏览器能正常访问，终端里的 git、curl、pip 却依然超时？"
    a: "系统代理仅在应用层对遵循系统 API 的浏览器和桌面软件生效，绝大多数命令行工具、Docker 与游戏默认忽略系统代理。需要为终端配置 HTTP_PROXY 环境变量，或安装服务模式并开启客户端的 TUN 虚拟网卡全局接管。"
  - q: "开启 TUN 模式后全机断网，或者 WSL2 与 Docker 容器无法联网是什么原因？"
    a: "全机断网通常因为同时开启了企业内网 VPN、游戏加速器或其他虚拟网卡软件，双方抢占默认路由 0.0.0.0/0 形成回环；WSL2 与 Docker 断联则源于 Hyper-V 虚拟交换机流量被 TUN 截获或 DNS 转发被劫持，需要配置网段排除与监听设置。"
  - q: "手机锁屏几分钟后微信或海外应用收不到消息、代理自动断开怎么处理？"
    a: "Android 端多为厂商省电策略清理后台进程或收回 VpnService 权限所致，需关闭电池优化并锁定后台；iOS 端则常见于导入了体积过大的广告屏蔽与分流规则集，导致系统 Network Extension 触及内存上限而被强行回收。"
  - q: "怎么快速区分是自己的本地网络故障，还是机场服务端节点或域名出问题？"
    a: "使用交叉验证法：先关闭所有代理直连国内网站，确认基础宽带正常；再切换手机 5G 热点排除家用路由或校园网 UDP/端口限制；最后用命令行分别测试面板与节点在不同端口协议下的连通性，即可明确责任边界。"
  - q: "向机场客服提交工单排查故障时，绝对不能发送哪些信息？"
    a: "绝对不要直接粘贴包含个人 token 或 uuid 的完整订阅 URL、账号登录密码、支付完整截图中的敏感个人隐私或未脱敏的明文配置文件。排查时只需提供脱敏后的节点名称、报错日志片段、测试时间段与本地网络运营商类型即可。"
---

# 代理客户端故障排查中心：按症状、系统与内核定位根因

<div class="answer-first-box">
<div class="answer-first-label">核心结论 · Answer First</div>
<p>代理网络出现断流、超时或报错时，<strong>近九成故障并非“全部服务器同时瘫痪”，而是本地系统时钟漂移、代理端口与浏览器插件错位、Fake-IP 虚拟网段缓存残留、订阅代理死循环或双虚拟网卡路由抢占所致</strong>。建议优先使用下方交互式诊断向导锁定层级，再严格按“现象 → 可能原因 → 检查步骤 → 处理方法 → 验证结果 → 下一步”六步闭环排除，避免盲目重装或轻信传言。</p>
</div>

代理排查最容易走入的误区，是遇到“网页打不开”就立刻不停点击更新订阅，甚至在没校准本地系统时间、没关掉残留代理插件的情况下频繁更换客户端或反复重装。现代代理体系横跨本地应用层、操作系统代理表、虚拟网卡驱动（TUN）、DNS 解析模块、加密传输隧道以及远端落地出口等多个环节，只要其中任意一环出现状态错位，外在表现都会趋同于“连不上”或“超时”。本中心将全平台高频故障拆解为可执行的标准化排查路径，覆盖 Windows、macOS、Android、iOS、Linux 与 OpenWrt 软路由环境。

## 一、快速故障诊断入口与症状速查矩阵

如果你希望根据当前使用的操作系统和客户端直接生成排查指令，请先使用下方纯本地运行的交互式向导；本向导不会向任何外部服务器发送你的设备信息或订阅链接。

<TroubleshootingWizard />

### 1. 七大核心专题排障手册导航

对于已经明确报错关键词或特定运行环境的故障，可直接通过下表定位对应的专题深度指南与底层基础教程：

| 核心故障类别 | 典型报错与直观表现 | 最高频技术根因 | 专题排障手册 | 关联配置教程 |
| :--- | :--- | :--- | :--- | :--- |
| **节点连接超时** | 全部节点红叉、真连接 `-1ms`、`i/o timeout` | 系统时间偏差超 90 秒、UDP QoS 阻断、入口维护 | [节点全部超时排查](/troubleshooting/timeout/) | [系统时间与 TLS 修复](/guides/system-time-tls-fix/) |
| **订阅更新失败** | `200+0` 字节、超时 `EOF`、`yaml: unmarshal errors` | 代理死循环、面板 UA 过滤、Base64 与 YAML 混用 | [订阅失败与 200+0 字节](/troubleshooting/subscription/) | [订阅格式解析说明](/guides/subscription-formats-explained/) |
| **连接正常但无网** | 测速正常但网页打不开、锁屏几分钟自动断开 | 端口 `7890/7897` 冲突、SwitchyOmega 覆盖、杀后台 | [连不上或频繁断线](/troubleshooting/disconnected/) | [多设备与并发限制](/airport/multi-device/) |
| **DNS 错误与泄漏** | 关代理后断网、`198.18.0.x` 残留、内网 OA 失灵 | Fake-IP 缓存未刷新、`.local` 未排除、IPv6 旁路泄漏 | [DNS 错误与泄漏检测](/troubleshooting/dns/) | [分流规则与策略组](/guides/routing/) |
| **客户端无法启动** | 双击无反应、界面白屏、macOS 提示损坏、端口占用 | 缺失 WebView2、Gatekeeper 隔离、杀软误杀核心 | [客户端无法启动处理](/troubleshooting/startup/) | [客户端标准安装流程](/guides/installation/) |
| **TUN 与代理冲突** | 开 TUN 全机断网、终端 `curl` 不走代理、开关弹回 | 未装 Service Mode、双 VPN/网游加速器抢默认路由 | [TUN 与系统代理冲突](/troubleshooting/tun/) | [TUN 模式深度配置](/guides/tun/) |
| **容器与子系统断网** | 开 TUN 后 WSL2 无法解析、Docker 拉镜像超时 | Hyper-V 网段被接管、虚拟网卡 DNS 劫持冲突 | [TUN 与 WSL2/Docker 冲突](/troubleshooting/tun-wsl-docker-conflict/) | [Clash Verge Rev 配置](/guides/clash-verge-rev-setup/) |

### 2. 三分钟通用快速定位漏斗（先排本地，再查上游）

在深入修改具体 YAML 规则或切换内核之前，按照以下五个固定顺序做一次快速筛查，可以在三分钟内确定故障究竟出在系统层、软件层、本地宽带还是远端节点：

| 排查阶段 | 验证动作 | 通过标准 | 未通过时的直接跳转方向 |
| :--- | :--- | :--- | :--- |
| **第一步：基础直连** | 彻底退出代理客户端并关闭系统代理，打开国内常见网站 | 网页秒开且 DNS 返回正常公网 IP | 先清理 `198.18.0.0/16` Fake-IP 残留或检查本机宽带 |
| **第二步：时钟核对** | 对比电脑时间与手机网络标准时间（含分钟与秒） | 两者时间误差严格小于 30 秒，且时区准确 | 立即同步 NTP 时间，修复 TLS 与 VMess 握手拒绝 |
| **第三步：核心与端口** | 观察客户端核心版本号、运行状态指示与本地监听端口 | 端口唯一监听，无残留旧进程抢占 `7897`/`7890` | 结束僵尸进程、检查杀毒软件隔离区与 WebView2 |
| **第四步：最小化验证** | 用原生命令通过本地代理端口请求 `generate_204` 端点 | 返回 `HTTP 204` 状态码 | 判断为系统代理/浏览器插件未接管，或节点本身不可用 |
| **第五步：多网交叉** | 手机开启 5G 热点供电脑测试同一节点，或切换协议组 | 5G 正常但宽带超时说明本地网络存在端口/UDP 限制 | 将 Hysteria 2 换回 TCP+TLS 类协议，或排查路由器插件 |

---

## 二、节点连接超时排查

### 现象
在 [Clash Verge Rev](/clients/clash-verge-rev/)、[v2rayN](/clients/v2rayn/)、[FlClash](/clients/flclash/) 或 [Shadowrocket](/clients/shadowrocket/) 中点击测速，部分或大量节点延迟显示 `timeout`、`-1ms` 或红色叉号；有时软件列表显示 TCP 延迟只有 40ms，但一用真连接测试就失败，或者切换到 Hysteria 2、TUIC 等新协议节点时全部无响应，而旧的 Trojan、VLESS 节点却能偶尔连通。

### 可能原因
1. **测速机制差异导致误判**：ICMP Ping 仅测入口服务器是否允许回显（多数中转入口默认禁 Ping）；TCPing 只完成 TCP 三次握手，即便节点密钥失效或落地机宕机，只要入口端口开放就会显示低延迟；只有 URLTest（真连接）才会走完加密握手并访问 `generate_204` 测试地址。
2. **UDP/QUIC 协议被本地网络 QoS 或阻断**：Hysteria 2 与 TUIC 基于 UDP 承载 QUIC 传输，校园网、公司企业内网、部分省市家用宽带在晚高峰会对持续大流量 UDP 实施限速或直接丢包拦截。
3. **测试地址本身被干扰或内核版本过旧**：部分客户端默认测速地址使用 `http://www.gstatic.com/generate_204`，若本地分流或 DNS 配置不当，可能影响探测判断；同时老旧的 Clash for Windows 已停止维护，无法识别 VLESS-Reality、AnyTLS 等现代节点参数。

### 检查步骤
1. **确认客户端测速模式**：在 v2rayN 中检查使用的是「真连接延迟（Real Delay）」还是仅「TCP 延迟」；在 Clash Verge Rev 中查看测速设置里的测试 URL 是否可达。
2. **区分协议栈表现**：在同一家支持多协议的机场（例如同时提供 `Hysteria 2`、`VLESS-Reality` 与 `Shadowsocks` 的服务）中，分别对三类协议节点做真连接测试，观察是否仅 UDP 类协议全灭。
3. **用终端绕过 UI 检验真实端口**：不要只看界面延迟数值，打开终端针对客户端本地混合端口（Clash Verge Rev 默认 `7897`，v2rayN HTTP 默认 `10809`、SOCKS5 默认 `10808`）直接发起连接探测。

```bash
# 通过 Clash Verge Rev 默认混合端口验证真连接（Windows Git Bash / macOS / Linux）
curl -x http://127.0.0.1:7897 -I --connect-timeout 8 https://www.gstatic.com/generate_204

# 通过 v2rayN 默认 SOCKS5 端口验证备用探测地址
curl --socks5-hostname 127.0.0.1:10808 -I --connect-timeout 8 https://cp.cloudflare.com/generate_204
```

### 处理方法
- 若 `Hysteria 2` / `TUIC` 全部超时而 `VLESS-Reality` / `Trojan` 正常，说明当前网络对 UDP 不友好，立即在策略组中切换至 TCP+TLS 承载协议，并避免在校园网强行使用 QUIC 类节点。
- 若仍在使用已归档停更的老版客户端，迁移至持续维护的 [Mihomo 核心](/clients/mihomo/) 客户端（Clash Verge Rev / FlClash）或 [sing-box 核心](/clients/sing-box/) 客户端（Hiddify / Karing），确保完整解析新协议字段。
- 如果在 [节点延迟与抖动测量](/routes/latency/) 中发现入口延迟正常但海外落地极慢，可尝试切换同机场其他地区入口（如从移动入口换至 BGP 多线入口，或改选香港/日本中转节点）。

### 验证结果
重新执行上述 `curl` 命令后，终端应稳定返回 `HTTP/1.1 204 No Content` 或 `HTTP/2 204`，且客户端内真连接测速能返回具体的毫秒数值（通常香港中转或专线参考值在 20ms–80ms 之间，美国节点在 130ms–200ms 之间）。

### 下一步
如果命令行返回超时且**全部协议、全部地区节点**同时在多个设备超时，请立即转入下一节排查本地时钟同步与全节点失联根因，或查阅 [节点全部超时深度排查](/troubleshooting/timeout/)。

---

## 三、所有节点无法使用排查

### 现象
客户端没有任何节点能够通过真连接测试，不论切换到香港、日本、新加坡还是美国节点，日志均持续报出握手失败、证书时间无效、连接被重置（`connection reset by peer`）或认证拒接。哪怕重启电脑与路由器后，情况依然没有任何改善。

### 可能原因
1. **本地系统时间误差超过协议安全窗口**：VMess 协议硬性规定客户端与服务端 UTC 时间差不能超过 90 秒；TLS 1.3 证书校验及 VLESS-Reality 的时间戳防重放机制同样会直接拒绝时钟偏差过大的设备。Windows 与 Linux 双系统切换、主板电池没电或虚拟机挂起恢复后极易触发此问题。
2. **套餐过期、月流量配额耗尽或设备并发超限**：当月流量用完（尤其在使用 `2x`/`3x` 高倍率节点时消耗更快）、套餐到期或因家庭共享导致同时在线 IP 数超出机场限制时，所有节点都会瞬间集体拒绝服务。
3. **上游入口 IP 变更或大面积线路维护**：如果长期未更新订阅，本地保存的可能仍是已下线或更换过的旧中转入口 IP。
4. **本地双层代理或防火墙拦截**：安全软件或后台静默运行的第二款代理程序拦截了外发握手包。

### 检查步骤
1. **核对系统时间与标准时间**：在桌面右下角或终端核对当前系统时间、日期、年份和时区（例如是否误设为了东八区以外的时区导致 UTC 错位）。

```powershell
# Windows 查看时间服务状态与当前偏差
w32tm /query /status

# macOS 与 Linux 查看精确 UTC 时间
date -u
timedatectl status
```

2. **核查账户与套餐余量**：登录机场网页后台，确认当前套餐处于有效期内、剩余流量大于 0，且在线设备数未达到上限。部分品牌如 [光速云](/brands/guangsuyun/)、[星岛梦](/brands/xingdaomeng/)、[二猫云](/brands/ermao/) 标注不限设备，但部分平台或定制档位仍可能存在安全风控阈值，需以面板实时状态为准。
3. **测试更换网络环境**：用手机开启 5G 蜂窝热点让电脑接入测试，验证是否属于当前宽带运营商或路由器层的阻断。

### 处理方法
- **强制同步系统时间**：按照 [系统时间与 TLS 报错修正](/guides/system-time-tls-fix/) 执行同步，保证误差控制在 30 秒以内。

```powershell
# Windows 管理员 PowerShell 强制重新校时
net start w32time
w32tm /resync /force
```

```bash
# macOS 与 Linux 同步网络时钟
sudo sntp -sS time.apple.com
sudo timedatectl set-ntp true
```

- **确认余额并手动拉取最新订阅**：若面板已显示流量耗尽或入口变更公告，续费或重置流量后重新更新订阅以获取最新节点 IP。
- **使用跨体系备用包应急**：若正值机场突发入口维护，可暂时切入事先准备的不限时备用订阅（如 [不限时流量包指南](/plans/non-expiring/) 中整理的应急方案）。

### 验证结果
时间同步并刷新订阅后，重启一次客户端核心，观察日志不再出现 `bad timestamp`、`certificate is not yet valid` 或 `TLS handshake timeout`，任意挑选 2 个不同地区节点执行真连接测速均能返回正常耗时。

### 下一步
如果校准时间、核实套餐有效且手机 5G 热点也全节点无响应，需按 [机场停服与状态核验](/safety/closures/) 执行 `nslookup` 与 `curl` 客观检测，区分究竟是域名阻断还是服务端长期失联。

---

## 四、订阅链接更新失败排查

### 现象
在客户端中点击更新订阅时，进度条长时间转圈后弹出 `context deadline exceeded`、`connection refused`、`EOF`、`403 Forbidden` 或 SSL 证书验证错误，导致节点列表一直停留在旧版本甚至被清空。

### 可能原因
1. **代理死循环（最常见）**：客户端在“系统代理”或“TUN 模式”开启的状态下更新订阅，而当前选中的节点恰好已经失效；更新订阅的网络请求被客户端自己拦截并转发给死节点，最终永远超时。
2. **订阅域名在国内直连网络下被屏蔽或 DNS 污染**：部分机场的主域名或订阅专用域名未接入海外直连优化，在国内宽带下被阻断 SNI 或解析到错误 IP，此时关闭代理反而连不上订阅地址。
3. **触发 Cloudflare 人机盾或订阅 Token 已失效**：在面板重置过订阅密钥（Reset Token）、更换过密码，或当前公共网络 IP 被 CDN 判定为异常请求，会直接返回 `401` / `403`。
4. **系统时间错误导致 HTTPS 证书校验失败**：本地系统日期滞后或超前，使得更新订阅时的 TLS 握手直接中止。

### 检查步骤
1. **确认当前代理开关状态**：检查系统代理与 TUN 模式是否仍处于激活状态。
2. **独立验证订阅域名可达性（注意保护 Token 隐私）**：只提取订阅 URL 的主域名根路径（**切勿把包含 `?token=xxx` 的完整链接贴进公开网页**），在本地终端测试直连与代理两种路径下的 HTTP 响应状态。

```bash
# 测试直连访问订阅域名首页（去掉 token 参数）
curl -I --connect-timeout 8 https://example-sub-domain.com/

# 若直连超时，通过本地还可用的备用代理端口（例如 7897）测试
curl -x http://127.0.0.1:7897 -I --connect-timeout 8 https://example-sub-domain.com/
```

### 处理方法
- **场景 A（直连可达、开代理反而不通）**：在 [Clash Verge Rev](/clients/clash-verge-rev/)、[FlClash](/clients/flclash/) 或 [v2rayN](/clients/v2rayn/) 中，先彻底关闭系统代理与 TUN 模式，并在订阅配置右键菜单确保取消勾选「通过代理更新（Use Proxy）」，再执行直连更新。
- **场景 B（直连超时、代理可达）**：先切换到另一家还能用的备用机场节点（或临时启用手机端有效代理共享），保持节点连通后，在桌面客户端开启「通过代理更新订阅」再点击刷新；或登录面板查看官方是否公布了新的防污染直连订阅域名。
- **场景 C（返回 401/403）**：登录机场网页控制台重置订阅链接后重新复制；若遇 Cloudflare 盾拦截，临时关闭代理切换手机 4G/5G 热点网络后再点更新。

### 验证结果
更新按钮点击后在 1 至 3 秒内返回成功提示，节点列表数量刷新为当前面板最新数目，同时头部正常显示剩余流量与套餐到期时间（来自 `subscription-userinfo` 响应头）。

### 下一步
如果终端显示更新请求返回了 HTTP `200 OK`，但客户端节点列表依然为空或解析报错，请继续排查下一节的「200+0 字节与格式解析失败」，或参考 [订阅拉取失败与 200+0 字节专篇](/troubleshooting/subscription/)。

---

## 五、订阅返回空内容（`200+0` 字节与格式错乱）

### 现象
更新订阅时客户端没有报超时或 403，而是显示状态码 `200 OK`，但下载字节数为 `0`（俗称 `200+0` 字节）；或者更新完成后弹出 `yaml: unmarshal errors`、`cannot unmarshal string into Go value`、节点列表变成空的，甚至报错显示读取到了一段 `<!DOCTYPE html>` 网页代码。

### 可能原因
1. **User-Agent 被服务端规则过滤**：V2Board、SSPanel-Uim 或部分自研面板会根据 HTTP 请求头里的 `User-Agent` 动态决定下发 Clash YAML、Base64 还是 sing-box JSON。如果客户端自定义了非标准 UA、或者旧版 UA 被面板拉黑，服务器就会返回 `200 OK` 但响应体长度为 `0` 字节。
2. **订阅格式与客户端内核完全不匹配**：把通用的 Base64 节点列表链接当成 Clash YAML 导入了 Clash Verge Rev，或者把 Clash YAML 导入了仅识别 Base64 链接的 [v2rayNG](/clients/v2rayng/)，以及把传统 Clash 配置直接塞入原生 [sing-box](/clients/sing-box/) 核心。
3. **第三方短链或在线转换剥离内容**：使用了失效的在线订阅转换接口，或短链跳转页面被防火墙拦截返回了登录验证页 HTML。
4. **专属客户端品牌不开放标准订阅**：部分品牌如 [飞猫云](/brands/feimao/)、[隐形人](/brands/yinxingren/)、[Firefly](/brands/firefly/)、[灵猫网络](/brands/lingmao/)、[SOGO 云](/brands/sogo/)、闪跃、全球云采用「仅专属客户端」模式，本身不提供通用第三方订阅链接；若误把官网面板链接当作订阅 URL 导入，就会直接拉取到网页 HTML 源码。

### 检查步骤
1. **核对客户端与订阅格式要求**：对照下表确认当前客户端支持的订阅类型。

| 客户端 | 底层内核 | 原生支持的订阅格式 | 常见误导入导致的报错 |
| :--- | :--- | :--- | :--- |
| **[Clash Verge Rev](/clients/clash-verge-rev/)** / **[FlClash](/clients/flclash/)** | Mihomo | Clash YAML、Mihomo YAML | 导入 Base64 链接会报 `cannot unmarshal string` |
| **[v2rayN](/clients/v2rayn/)** | 多核心切换 | Base64 通用订阅、v2rayN JSON、Clash YAML（需切 Mihomo） | 核心未切换或下载了非 `WithCore` 壳导致解析失败 |
| **[v2rayNG](/clients/v2rayng/)** | Xray-core | Base64 通用订阅、节点分享链接 | 导入 Clash YAML 提示无效格式或无节点 |
| **[Hiddify](/clients/hiddify/)** / **[Karing](/clients/karing/)** | sing-box | sing-box JSON、Clash YAML、Base64（自动识别转换） | 导入含生僻 JS 脚本的订阅可能转换失败 |
| **[Shadowrocket](/clients/shadowrocket/)** | 私有核心 | Base64、SIP008、Shadowrocket 配置、部分 Clash | 参数残缺时仅显示节点但缺少分流规则 |

2. **在完全本地终端检查响应头与返回长度**：在自己电脑的 PowerShell 本地测试完整订阅 URL（切勿上传或截图暴露含 Token 的屏幕），核对 `Content-Length` 与返回文本开头内容。

```powershell
# 仅在本地终端执行，查看状态码、字节长度及前 5 行文本特征（注意保护隐私）
$resp = Invoke-WebRequest -Uri "替换为你的完整订阅URL" -UserAgent "clash-verge/v2.0.0" -UseBasicParsing
$resp.StatusCode
$resp.Headers["Content-Length"]
$resp.Headers["subscription-userinfo"]
$resp.Content.Substring(0, [Math]::Min(200, $resp.Content.Length))
```

### 处理方法
- **修改订阅 User-Agent**：在 Clash Verge Rev 中右键订阅 → 「编辑信息」 → 将 `User-Agent` 改为标准标识（如 `clash-verge/v2.0.0` 或 `ClashMetaForAndroid/2.11`），保存后再次更新；在 v2rayN「订阅分组设置」中将自定义 UA 留空以使用默认标识。
- **使用客户端自带参数或面板原生链接**：从机场官网控制台重新点击“一键复制 Clash 订阅”或“复制通用 Base64 订阅”；避免把含个人 Token 的链接粘贴给陌生的第三方在线订阅转换网站。详细格式差异可查阅 [订阅格式解析说明](/guides/subscription-formats-explained/)。
- **核对品牌客户端模式**：如果你购买的是明确不支持第三方订阅的专属端品牌，需下载其官方客户端使用；若未来需要接入软路由或开源桌面端，可参考 [同类品牌替代方案](/brands/alternatives/) 选择支持「自研+第三方订阅」或「第三方通用订阅」的服务。

### 验证结果
本地请求 `Content-Length` 大于 0，响应文本开头为正常的 `proxies:`（YAML）或 Base64 编码字符串，客户端成功渲染出完整节点分组且顶部出现剩余流量条。

### 下一步
如果订阅已经成功更新出节点列表，但软件界面本身白屏、闪退或无法开启服务，请进入下一节排查客户端启动故障。

---

## 六、客户端无法启动排查

### 现象
双击客户端快捷方式没有任何反应、弹出空白白色窗口、刚打开就闪退；或者虽然能打开图形界面，但右侧状态栏始终转圈、提示核心启动失败、`address already in use`，或者 macOS 上直接弹出“文件已损坏，无法打开，你应该将它移到废纸篓”。

### 可能原因
1. **Windows 缺失 WebView2 Runtime 或显卡加速兼容问题**：基于 Tauri 架构的现代客户端（如 Clash Verge Rev）依赖系统的 Microsoft Edge WebView2 组件，精简版 Windows 10/11 或 LTSC 系统常未预装该运行时，导致打开后白屏。
2. **杀毒软件误杀或隔离核心二进制文件**：Windows Defender、火绒或第三方安全管家容易将未购买商业数字签名的开源核心程序（`verge-mihomo.exe`、`xray.exe`、`sing-box.exe`）识别为风险文件并静默删除，导致 GUI 成了“空壳”。
3. **macOS Gatekeeper 隔离标记或芯片架构下载错位**：未经苹果公证的开源软件首次下载会被加上 `com.apple.quarantine` 属性；或者把 `x64`（Intel）包装进了 Apple Silicon（M 系列）Mac，甚至反过来下载错架构导致一闪而过。
4. **僵尸进程占用监听端口**：上一次异常关闭客户端后，`mihomo` 或 `xray` 后台进程未退出，死死占用了 `7890`、`7897` 或外部控制端口 `9090` / `9097`。

### 检查步骤
1. **安全源头与架构核对（最高前提）**：在调整任何系统拦截策略前，必须先通过 [客户端下载安全防钓鱼](/safety/security/) 核对下载包确实来自官方 GitHub Releases（例如 `clash-verge-rev/clash-verge-rev`、`2dust/v2rayN`、`chen08209/FlClash`、`hiddify/hiddify-app`、`KaringX/karing`）并完成 `SHA256` 哈希校验，确认不是搜索引擎广告推广的山寨木马包。
2. **检查 Windows WebView2 与核心文件状态**：

```powershell
# 1. 检查 WebView2 Runtime 是否安装
Get-ItemProperty -Path "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" -ErrorAction SilentlyContinue | Select-Object pv

# 2. 检查常用代理端口与控制端口是否被残留进程占用
netstat -ano | findstr ":7890 :7897 :9090 :9097 :10808 :10809"
```

3. **检查 macOS 应用隔离属性与系统架构**：

```bash
# 查看当前 Mac 芯片架构（arm64 为 M 系列芯片，x86_64 为 Intel）
uname -m

# 查看应用程序隔离属性（仅对官方校验后的软件检查）
xattr -l "/Applications/Clash Verge.app"
```

### 处理方法
- **补全 WebView2 与禁用问题硬件加速**：若注册表查询无输出，前往微软官网下载安装 **WebView2 Evergreen Standalone Installer**；若已安装仍白屏，在快捷方式或配置文件中关闭 GPU 渲染。
- **恢复被误杀核心并设置目录白名单**：在确认文件哈希与官方 Release 一致的前提下，去杀毒软件「保护历史记录 / 隔离区」恢复核心二进制，并将客户端便携目录（如 `D:\Tools\ClashVerge`）加入排除项；使用 v2rayN 的用户请确认下载的是自带核心的 `WithCore` 安装包。
- **清理残留僵尸进程**：若 `netstat` 或 `lsof -i :7897` 发现残留 `mihomo`、`clash` 或 `xray` 进程，通过任务管理器或 `taskkill /F /PID 进程号`（macOS/Linux 用 `kill -9 进程号`）清理后再重启客户端。
- **合规处理 macOS 拦截**：确认下载来源及 SHA256 完全无误且芯片架构匹配后，先尝试在「系统设置 → 隐私与安全性」点击「仍要打开」；若仍提示已损坏，可在终端清除 `quarantine` 标记后重新打开（完整步骤见 [客户端无法启动处理](/troubleshooting/startup/)）。

### 验证结果
客户端主窗口正常渲染全部侧边栏菜单，左下角或设置页能正确读取到当前内核版本号（如 Mihomo v1.18+ / v1.19+），启动代理开关后无端口占用报错弹窗。

### 下一步
客户端启动正常且能顺利测出节点延迟后，如果浏览器打开网页仍然报错，请进入下一节排查「连接成功但无网络」。

---

## 七、连接成功但无法打开网页

### 现象
客户端开关已打开，节点真连接测速显示几十毫秒且一切正常，但在 Chrome、Edge、Safari 或桌面应用中打开任何海外（甚至国内）网站都提示 `ERR_CONNECTION_TIMED_OUT`、`ERR_PROXY_CONNECTION_FAILED` 或一直空白加载。

### 可能原因
1. **客户端混合端口与浏览器/扩展端口不一致**：[Clash Verge Rev](/clients/clash-verge-rev/) 默认端口是 `7897`，旧版 Clash 系是 `7890`，[v2rayN](/clients/v2rayn/) 默认 HTTP 端口是 `10809`、SOCKS5 是 `10808`。若浏览器中启用了 **Proxy SwitchyOmega** 或 **ZeroOmega**，并且情景模式写死了 `7890` 端口，流量就会全部撞向无监听的死端口。
2. **出站代理模式选错**：客户端意外切换到了 `Direct（直连）` 模式；或者开启了 `Global（全局）` 模式，却没有点开 `GLOBAL` 策略组选中实际海外节点（很多配置文件的 `GLOBAL` 组默认第一项停在 `DIRECT`）。
3. **未打开系统代理开关或休眠后连接句柄僵死**：只启动了软件没有勾选「系统代理（System Proxy）」，或电脑合盖休眠唤醒后网卡 DHCP 重配导致旧代理通道半死。
4. **配置文件存在语法错误或覆写脚本冲突**：自定义全局脚本（Script / Parser）或规则覆写导致内核规则匹配瘫痪。

### 检查步骤
1. **核对系统代理实际指向的端口**：在 Windows 与 macOS 上分别查询当前系统代理是否真的指向了客户端正在监听的端口。

```powershell
# Windows 查看系统注册表当前代理配置
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" | findstr /i "ProxyEnable ProxyServer ProxyOverride"
```

```bash
# macOS 查看 Wi-Fi 当前代理配置
networksetup -getwebproxy "Wi-Fi"
networksetup -getsecurewebproxy "Wi-Fi"
```

2. **排查浏览器插件与隐私模式**：打开一个不加载任何扩展插件的无痕/隐私窗口访问测试网页，确认是不是 SwitchyOmega 等插件抢占了系统代理控制权。
3. **查看客户端代理模式与连接面板（Connections）**：在客户端左侧进入「连接（Connections）」实时监控界面，刷新网页时观察是否有请求记录出现，以及匹配到的规则与出站节点究竟是 `DIRECT`、`REJECT` 还是目标代理节点。

### 处理方法
- **统一端口或交回系统控制权**：将 SwitchyOmega 情景模式中的代理端口修正为当前客户端实际端口（如 `127.0.0.1:7897`），或者直接把扩展切换为「系统代理」模式并由客户端统一接管。
- **修正代理模式并选定有效节点**：日常使用保持在 **`Rule（规则）` 模式**，点开主力策略组确认已选中一个延迟正常且非 `DIRECT` 的节点；若需使用 `Global` 全局模式，务必同步展开 `GLOBAL` 分组选中有效节点。
- **使用空白/默认配置做最小化隔离测试**：如果连接列表一片空白或全部 `REJECT`，临时禁用所有自定义覆写（Merge/Script），切换回未改动的原版订阅测试连通性（详细配置原则见 [Clash 配置基础](/guides/clash-config/) 与 [连不上或频繁断线专篇](/troubleshooting/disconnected/)）。

### 验证结果
在客户端「连接（Connections）」监控面板中可以实时看到浏览器的域名请求记录，国内站点命中 `DIRECT` 秒开，海外站点命中目标代理节点组并正常加载出网页内容。

### 下一步
如果浏览器能打开部分网站，但关闭代理后彻底断网、公司内网打开失败或海外服务提示地理位置异常，请立即进入下一节排查 DNS 异常。

---

## 八、DNS 异常排查（Fake-IP 残留与 IPv6 泄漏）

### 现象
1. 关闭或退出代理客户端后，电脑瞬间无法打开任何国内网页，在命令行 `ping` 百度或淘宝返回的 IP 地址竟然是 `198.18.0.x` 或 `198.19.x.x`。
2. 开启代理后，外网全部顺畅，但访问公司内网 OA、局域网 NAS（如 `nas.local`）、路由器后台（`router.lan`）或校园网认证页彻底打不开。
3. 挂着香港、日本或新加坡节点访问 YouTube 或 Google，页面依然显示在中文区（俗称“送中”）或流媒体提示所在地区不可用。

### 可能原因
1. **Fake-IP（`198.18.0.0/16`）缓存残留**：Mihomo 与 sing-box 的 TUN 模式常用 Fake-IP 加速分流：内核截获 DNS 请求后立即返回 `198.18.0.0/16` 保留网段的假 IP，待真正发包时再映射回域名。一旦电脑异常断电、蓝屏或任务管理器强杀客户端，代理服务没来得及还原网卡与刷新缓存，系统及浏览器缓存就会把国内域名继续解析成无效的 `198.18.x.x`。
2. **内网域名未加入 `fake-ip-filter`**：局域网设备后缀（`.local`、`.lan`、`.internal`）或企业内网专属域名没有被排除在 Fake-IP 映射之外，导致内网请求被返回了虚拟 IP 并误送入代理规则。
3. **IPv6 旁路泄漏或本地宽带 DoH 冲突**：很多家庭宽带已下发公网 IPv6，但代理客户端或机场节点未妥善接管 IPv6 流量；结果浏览器优先拿到了直连的 IPv6 地址绕开代理通道，或者 Chrome/Edge 内置的「安全 DNS（DoH）」抢先向本地 DNS 发起解析，绕过了客户端的 DNS 劫持模块。

### 检查步骤
1. **验证是否存在 Fake-IP 残留**：彻底关闭代理客户端后，在终端测试国内常用域名解析结果。

```powershell
# Windows 排查是否解析出 198.18.x.x 假地址及当前网卡 DNS 设置
nslookup www.baidu.com
netsh interface ip show dns
```

```bash
# macOS / Linux 验证解析结果
dig +short www.baidu.com
```

2. **排查 IPv6 与浏览器内置安全 DNS**：在浏览器设置中搜索“安全 DNS / Use secure DNS”，查看是否处于强制开启并指定了自定义 DoH 提供商；使用命令行或连接面板查看访问海外站点时是否发起了直连 `AAAA`（IPv6）请求。

### 处理方法
- **彻底清理残留 Fake-IP 缓存**：

```powershell
# Windows 刷新系统 DNS 缓存
ipconfig /flushdns
```

```bash
# macOS 刷新 mDNSResponder 缓存
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Linux (systemd-resolved) 刷新缓存
sudo resolvectl flush-caches
```

  同时务必在 Chrome / Edge 地址栏输入 `chrome://net-internals/#dns`（Edge 为 `edge://net-internals/#dns`），点击 **Clear host cache** 清除浏览器自带的异步 DNS 缓存，必要时关闭浏览器自带「安全 DNS」以免与客户端 DNS 模块打架。如果网卡 IPv4 属性里的首选 DNS 被死死改成了 `127.0.0.1` 或 `198.18.0.2`，请手动改回「自动获得 DNS 服务器地址」。
- **配置 `fake-ip-filter` 排除局域网与企业内网域名**：在 Mihomo 全局覆写中确保加入常见内网后缀、NTP 对时域及微软连接探测域（完整配置模板见 [DNS 错误与泄漏检测](/troubleshooting/dns/)与 [分流规则配置](/guides/routing/)）。
- **处理 IPv6 泄漏**：当本地网络或机场节点不具备完整双栈支持时，在客户端设置中关闭 IPv6 解析或为规则分流关闭 `ipv6: false`，防止流量从 IPv6 旁路逃逸造成解锁失效或“送中”。

### 验证结果
关闭客户端后 `nslookup www.baidu.com` 恢复返回正常的公网 IP；开启 Fake-IP 与 TUN 后，访问内网 NAS 域名能正常解析为 `192.168.x.x` 或 `10.x.x.x` 局域网地址；查看代理日志中的海外请求 DNS 均由远端或加密 DoH 完成解析。

### 下一步
如果 DNS 解析正常，但发现系统里其他软件与代理设置互相覆盖、命令行仍走直连，请转入下一节排查「系统代理设置冲突」。

---

## 九、系统代理设置冲突排查

### 现象
系统托盘显示代理开着，但每隔几分钟就自己弹回关闭状态；或者关掉代理软件后，系统仍提示无法连接代理服务器；亦或是浏览器访问一切正常，而命令行终端里的 `git clone`、`npm install`、`pip`、`curl`、Python 脚本和部分桌面端应用全部超时走直连。

### 可能原因
1. **系统代理仅作用于应用层接口**：Windows（WinINET）和 macOS 系统代理设置只是一组给浏览器和兼容应用程序“自愿读取”的本地端口声明，它不会拦截底层网络数据包。命令行工具（CLI）、Docker、UWP/微软商店应用和游戏客户端默认不读取系统代理，除非显式设置环境变量或启用三层 TUN 模式。
2. **多款软件同时改写系统代理注册表**：同时安装了两个代理客户端、某些国产软件自带的加速模块、浏览器代理管理插件或企业安全策略组（GPO），双方持续覆盖 `ProxyEnable` 与 `ProxyServer` 字段，导致代理端口来回跳变。
3. **强制关闭软件导致代理标志位未复位**：直接关机或结束进程，使得 `ProxyEnable` 停留在 `1`，造成无代理软件运行却指向死端口的“假断网”。

### 检查步骤
1. **检查系统级代理状态与 PAC 脚本**：在 Windows「设置 → 网络和 Internet → 代理」中检查是否同时开启了「使用设置脚本（PAC）」和「手动设置代理」，以及脚本地址是否指向已失效的本地文件。
2. **检查当前终端环境变量**：

```powershell
# Windows PowerShell 检查是否残留了旧代理环境变量
Get-ChildItem Env: | Where-Object { $_.Name -match "PROXY" }
```

```bash
# macOS / Linux / Git Bash 检查环境变量
env | grep -i proxy
git config --global --get http.proxy
```

### 处理方法
- **区分应用需求选择接管方式**：
  - 仅日常浏览网页：保持开启单一客户端的「系统代理」，并在扩展冲突时禁用多余的浏览器代理插件。
  - 需要终端与开发工具走代理：临时在当前会话注入环境变量（以 Clash Verge Rev `7897` 端口为例），或直接安装服务模式启用 **TUN 模式**。

```powershell
# PowerShell 临时为当前终端窗口设置代理（关闭窗口即失效）
$env:HTTP_PROXY="http://127.0.0.1:7897"
$env:HTTPS_PROXY="http://127.0.0.1:7897"
```

```bash
# macOS / Linux 临时设置终端代理
export http_proxy=http://127.0.0.1:7897
export https_proxy=http://127.0.0.1:7897
export all_proxy=socks5://127.0.0.1:7897
```

- **清理冲突的旧版客户端与残留 PAC**：卸载不再使用的旧版代理软件（如已停止维护的 Clash for Windows），清空无效的 `git` 全局代理设置与系统手动 PAC 脚本。
- **修复异常退出后的无网状态**：在 Windows 设置中手动关闭「使用代理服务器」开关，或运行命令行把注册表 `ProxyEnable` 置为 `0`。

### 验证结果
重启命令行后 `env` 中无残留错误端口；开启系统代理时 `reg query` 显示的端口唯一匹配主力客户端；关闭系统代理后立即恢复干净直连状态。

### 下一步
如果你决定启用 TUN 虚拟网卡来一劳永逸解决终端、游戏和 UWP 应用的代理问题，却在开启后遇到权限弹回或全机断网，请阅读下一节「TUN 模式异常排查」。

---

## 十、TUN 模式异常排查（Service Mode、双 VPN 与 WSL2/Docker）

### 现象
在桌面端尝试打开「TUN 模式（虚拟网卡模式）」时，开关闪烁一下自动弹回关闭，或者弹出权限报错；另一些用户能够成功打开 TUN，但打开瞬间整个电脑彻底断网，或者导致本地开发的 **WSL2** 子系统、**Docker Desktop** 容器内部无法拉取镜像与解析域名。

### 可能原因
1. **缺少高权限服务授权**：创建虚拟网卡驱动并重写操作系统 IPv4/IPv6 默认路由属于内核级高权限操作。Windows 普通用户直接启动客户端无法创建网卡，必须安装 **Service Mode（服务模式）**；macOS 需授权 Helper 服务；Linux 需给二进制内核授予 `cap_net_admin` 权限。
2. **双虚拟网卡默认路由（`0.0.0.0/0`）冲突**：同时运行了企业 SSL VPN（如 EasyConnect、Sangfor aTrust、GlobalProtect、Cisco AnyConnect）、商业组网工具（WireGuard、Tailscale、ZeroTier）或网游加速器（UU、雷神、奇游等）。多款软件同时向系统注入虚拟网卡并争夺默认网关路由，引发路由回环与全面断网。
3. **WSL2 / Docker 虚拟交换机网段冲突**：Windows 下的 WSL2 依赖 Hyper-V 虚拟交换机与宿主机的 `172.16.0.0/12` 网段及内置 DNS 转发通信。开启全局 TUN 后若未排除这些私有网段或未开启合适的栈模式（`gvisor`/`mixed`/`system`），宿主机会把原本属于容器的响应包误送进代理隧道。

### 检查步骤
1. **确认 Service Mode / 内核权限状态**：在 [Clash Verge Rev](/clients/clash-verge-rev/) 中进入「设置 → Clash 内核/服务模式」检查服务徽章是否为绿色运行中；或在管理员 PowerShell 中查询服务状态。

```powershell
# 检查 Clash Verge 服务状态
sc.exe query "clash_verge_service"

# 查看当前路由表中 0.0.0.0 默认路由与多块虚拟网卡（观察是否有多个接口争夺低跃点数 Metric）
route print 0.0.0.0
```

2. **清查后台是否有共存的 VPN 或网游加速器**：检查系统托盘和后台服务中是否同时运行着公司 VPN、Tailscale 或游戏加速器。
3. **测试 WSL2 与 Docker 连通性**：在开启 TUN 前后分别进入 WSL2 终端运行 `cat /etc/resolv.conf` 与 `curl -I https://www.baidu.com`，确认是在开启 TUN 瞬间触发的断联。

### 处理方法
- **规范安装或重装 Service Mode（不要长期直接用“管理员身份运行”客户端）**：
  - 每次右键管理员运行会导致桌面文件拖拽失效、系统路径权限错乱。正确做法是在设置面板点击安装 Service Mode；若因杀毒软件拦截或旧版本残留导致安装失败，以管理员 PowerShell 先停掉并删除损坏的旧服务，再回到软件重装（完整步骤见 [TUN 与系统代理权限冲突](/troubleshooting/tun/)）。
  - **Linux 授权命令**：为真实内核路径赋予网络管理能力（以常见包安装路径为例）：

```bash
sudo setcap cap_net_admin,cap_net_bind_service=+ep /usr/bin/verge-mihomo
```

- **彻底错开双 VPN 与加速器的运行边界**：需要同时使用公司内网 VPN 或玩游戏加速时，关闭代理客户端的 TUN 模式，改为仅用「系统代理」处理浏览器流量；或者将企业内网网段与域名完整写入 `route-exclude-address` 与 `fake-ip-filter` 中。
- **修复 WSL2 与 Docker Desktop 断联**：在 Mihomo TUN 配置中将 `route-exclude-address` 加入 WSL2/Docker 常见私有网段（如 `172.16.0.0/12`、`192.168.0.0/16`），开启 `auto-route: true` 与合适的 `stack`（Windows 常见 `gvisor` 或 `mixed` 兼容性较好），并按需在 `.wslconfig` 中启用 `networkingMode=mirrored` 镜像网络模式。完整实操指令与配置片段请参阅 [TUN 与 WSL2/Docker 冲突解决指南](/troubleshooting/tun-wsl-docker-conflict/) 与 [TUN 模式深度配置](/guides/tun/)。

### 验证结果
Service Mode 状态显示活跃，开启 TUN 后系统网卡列表出现虚拟适配器，普通命令行执行 `curl -I https://github.com` 无需配置环境变量即可秒通，同时 WSL2 内部 `apt update` 或 `docker pull` 恢复正常联网。

### 下一步
如果基础网络、TUN 与 DNS 都已经通畅，但唯独某几个海外网站（例如 ChatGPT、Claude 或 Netflix）打不开或提示地区受限，请进入下一节。

---

## 十一、部分网站无法访问排查

### 现象
Google、YouTube、GitHub 等常规海外网站加载飞快，国内银行、微信、淘宝也完全正常，唯独特定网站或服务打不开、一直转圈、提示 `Access Denied`、`1020` 错误码，或者在访问 AI 与流媒体平台时被拒绝服务。

### 可能原因
1. **落地节点地区不符合平台准入范围**：OpenAI（ChatGPT）、Anthropic（Claude）与 Google（Gemini）均明确限制或封锁香港、中国大陆及部分受限地区 IP；同时 Netflix、Disney+ 等流媒体会对机房 IDC 共享 IP 实施强校验，仅允许原生 IP 或特定解锁区域观看自制剧以外的内容。
2. **公共节点 IP 触发高频风控**：部分机场在同一节点上承载了大量并发用户，导致该落地 IP 在 Cloudflare、OpenAI 或 Anthropic 风控库里信誉分暴跌，表现为持续弹人机验证码或直接阻断 API 请求。
3. **分流规则缺失或域名归类错误**：目标网站本身是海外小众服务或新启用域名，尚未被本地老旧 `geosite` 规则库收录，被 `Rule` 模式误判匹配到了 `MATCH` 或 `DIRECT` 直连，导致国内无法打开。
4. **DNS 送中或 IPv6 泄露出真实属地**：即使节点选了日本或美国，如果 DNS 解析或 IPv6 走回了本地网络，YouTube 与部分站点仍会判定你在受限地区。

### 检查步骤
1. **检查连接面板中该域名的命中去向**：打开客户端「连接（Connections）」监控，刷新打不开的网站，看它究竟走的是 `DIRECT` 还是 `Proxy`，以及最终分配到了哪一个地区的落地节点。
2. **核实品牌文档中该服务的支持边界**：不同品牌在 AI 与流媒体上的保障范围并不相同。例如在我们整理的档案中，[光速云](/brands/guangsuyun/) 提示 ChatGPT/Gemini 并非所有节点稳定支持需手动切换，[二猫云](/brands/ermao/) 对 Claude/Gemini 标注视节点而定，[可信云](/brands/kexin/) 诚实标注缺乏统一实测数据，而 [灵动云](/brands/lingdong/) 2026-07 历史实测曾记录 OpenAI 全解锁但新/台 YouTube 存在送中、TikTok 多失败。因此不要盲目把单平台报错当成整个节点坏掉。

### 处理方法
- **为 AI 与流媒体建立独立策略组并避开香港节点**：在配置文件中把 `ChatGPT`、`Claude`、`Gemini` 域名分流至单独策略组，强制绑定日本、新加坡、台湾或美国节点（详细分流设置见 [ChatGPT 排查](/ai-streaming/chatgpt/)、[Claude 排查](/ai-streaming/claude/)、[Gemini 排查](/ai-streaming/gemini/) 与 [Netflix 解锁指南](/ai-streaming/netflix/)）。
- **测试切换不同落地节点与协议**：当某个日本节点提示风控拦截时，依次切换同地区其他编号节点（如 JP-02、JP-05）或改用新加坡/美国原生标记节点。
- **更新 `geosite` / `geoip` 规则数据库或临时切 `Global` 验证**：在客户端设置中更新一次 GeoData 规则库；若怀疑是小众域名漏分流，先临时切至 `Global` 模式并选中海外节点刷新，若立刻打开则实锤是分流规则遗漏，把该域名加入自定义 `DOMAIN-SUFFIX` 规则即可永久修复（参见 [分流规则配置](/guides/routing/)）。

### 验证结果
目标网站在 `Rule` 规则模式下稳定命中指定海外策略组，浏览器无地域封锁报错，且国内网银、淘宝和本地服务依然维持低延迟直连不绕路。

### 下一步
如果网站能打开但加载图片、视频缓存极其缓慢，或者一到晚上就频繁卡顿丢包，请进入下一节排查「速度慢与延迟高」。

---

## 十二、速度慢与延迟高排查

### 现象
节点能连接，网页也能打开，但 YouTube 4K 缓冲卡顿、大文件下载仅有几百 KB/s，或白天流畅而晚高峰（20:00–23:00）延迟暴涨、码率跌至 360p。

### 可能原因
1. **带宽单位混淆与单线程限制**：测速常用 `Mbps`（兆比特每秒），浏览器显示 `MB/s`（兆字节每秒），`1 MB/s = 8 Mbps`。跨国单线程受 TCP 窗口与物理 RTT 限制，通常低于多线程跑满值。
2. **中转线路与晚高峰负载**：普通公网中转晚高峰易拥塞；[IEPL 专线](/routes/iepl/) 与 [IPLC 国际专线](/routes/iplc/) 虽通过内网过境，但仍受入口分配带宽与共享负载影响。
3. **协议与运营商策略冲突**：高丢包网络下纯 TCP 易触发拥塞退避；部分运营商则对 UDP 限速，强行使用 Hysteria 2 速率反而暴跌。
4. **倍率耗尽与 `url-test` 震荡**：`tolerance` 容差设过小（如 10ms）会导致节点频繁跳变断流；高倍率节点也会加速耗尽流量配额，详见 [倍率计算](/routes/multipliers/)。

### 检查步骤
1. **对比非高峰与晚高峰表现**：分别在下午与晚间 21:00 对同一节点测试，区分全天限速与晚高峰拥塞。
2. **切换节点区域对比**：依次对比 [香港节点](/routes/hong-kong/)、[日本节点](/routes/japan/) 与新加坡节点，排查是否单一机房路由临时绕行。
3. **检查本地网络负载**：确认未连在拥挤的 2.4GHz Wi-Fi 上，且后台无网盘同步或 BT/P2P 占满上行带宽。

### 处理方法
- **调大 `url-test` 容差或手动选点**：将覆写规则中的 `tolerance` 调整为 `80`–`150`，或用 `select` 组固定晚高峰稳定的专线节点。
- **按丢包特征切换协议**：TCP 丢包严重时可切至支持 `Hysteria 2` 的节点（如标注三协议的 [一翻云](/brands/yifan/)）；若 UDP 被限死则立刻换回 `VLESS-Reality` 或 `Trojan`。
- **排除本地带宽瓶颈**：暂停后台大流量上传，桌面改用网线或 5GHz Wi-Fi；长期晚高峰卡顿可对照 [晚高峰稳定性评估](/airport/stable/) 更换线路。

### 验证结果
晚高峰播放 1080p/4K 视频缓冲条平稳前置加载，真连接延迟抖动收敛，不再频繁卡顿掉帧。

### 下一步
若电脑端流畅但手机端频繁断线或卡死，请进入下一节排查「电脑与手机故障差异」。

---

## 十三、电脑与手机故障差异排查

### 现象
同一条订阅链接、同一个账户，在 Windows 或 Mac 电脑上稳定运行一整天毫无异常，但导入手机后要么锁屏几分钟就自动掉线、微信/Telegram 收不到推送，要么刚打开代理几秒就闪退，或者手机切出 Wi-Fi 连上 5G 后所有页面瞬间卡死。

### 可能原因
1. **Android 省电策略与后台杀进程**：国内主流 Android 定制系统（MIUI/HyperOS、ColorOS、OriginOS、HarmonyOS/EMUI）会在息屏 5–15 分钟后限制非白名单应用的网络唤醒与后台存活，直接杀掉 [FlClash](/clients/flclash/)、[v2rayNG](/clients/v2rayng/)、[Clash Meta for Android](/clients/clash-meta/) 或 [Hiddify](/clients/hiddify/) 的系统 `VpnService`。
2. **iOS Network Extension 内存硬上限（OOM）**：苹果系统对 VPN 扩展进程（Network Extension）设置了极其严苛的运行内存上限（早期与常规模型下往往在 15MB–50MB 级）。如果你在 [Shadowrocket](/clients/shadowrocket/)、[Stash](/clients/stash/) 或 [Quantumult X](/clients/quantumult-x/) 中导入了包含数十万条去广告或巨型 `RULE-SET` 的配置，扩展进程会瞬间触发 OOM 被系统强杀，表现为界面开关突然弹回关闭。
3. **Wi-Fi 与蜂窝 5G 切换导致连接重置**：从家里 Wi-Fi 走出门切到 5G 时，设备公网 IP 发生变更，基于长连接的 QUIC/TLS 会话未及时感知断链，造成数十秒假死。
4. **机场同时在线设备数或并发限制**：部分套餐（或部分时段策略）限制同时在线 IP 或设备数量；当电脑、平板、手机同时在线且后台各自开启自动测速时，容易触发服务端的连接数或并发保护。

### 检查步骤
1. **检查手机客户端的权限与后台存活设置**：在 Android 设置中查看客户端的「电池优化」「自启动」「后台弹出界面」权限及多任务卡片是否已锁定。
2. **评估 iOS 规则集与节点规模**：查看 Shadowrocket / Stash 中的配置文件大小与规则条目数量，确认是否挂载了多个超大体积的第三方去广告拦截列表或全量 GeoSite 库。
3. **核对多设备同时在线规则**：登录机场控制台确认当前账户是否允许无限设备（部分品牌虽然标注不限设备，但仍建议检查是否因多地 IP 同时高频并发被临时限流，参考 [多设备与家庭共享方案](/airport/multi-device/)）。

### 处理方法
- **Android 端保活标准化设置**（详见 [Android 客户端平台指南](/clients/platform/android/)）：
  1. 在系统「电池与性能 / 耗电管理」中将代理应用设为**无限制 / 允许后台高耗电**。
  2. 打开应用自启动权限，并在最近任务界面下拉卡片将其**加锁锁定**。
  3. 仅在应用内启用「分应用代理（绕过模式）」，让微信、支付宝等国内通讯与支付 App 不进虚拟网卡隧道，既省电又防止推送延迟。
- **iOS 端防 OOM 精简方案**（详见 [iOS 客户端平台指南](/clients/platform/ios/)）：
  1. 删除几十万行的超大广告过滤规则与臃肿脚本，优先使用精简版常规分流规则。
  2. 如果机场自身节点超过几百个导致 YAML 解析占满内存，在面板或本地使用过滤参数精简出常用地区节点。
- **网络切换与双端习惯优化**：出门从 Wi-Fi 切到 5G 若遇短暂卡顿，手动开关一次客户端或点击“断开重连”重建会话；桌面端与手机端避免同时用过短间隔（如每 10 秒）高频自动测速。

### 验证结果
Android 手机锁屏静置 30 分钟后点亮屏幕，代理状态栏图标（钥匙/VPN 标识）依然稳固在线且能立即接收消息；iOS 客户端连续运行数小时不再发生无故弹回关闭。

### 下一步
在排除了手机与电脑端软件环境差异后，如果问题依然存在且难以判断究竟是家里宽带路由器的问题还是远端机场服务的问题，请继续阅读下一节。

---

## 十四、本地网络与服务端问题区分

### 现象
你同时检查了客户端版本、端口和系统时间，似乎都没有明显配置错，但节点连接就是极不稳定，让人难以判断到底是自家宽带/光猫/软路由出了问题，还是机场服务商的上游入口或服务器本身正在出故障。

### 可能原因
1. **家庭路由、光猫或软路由内部插件冲突**：如果在 [OpenWrt 软路由](/clients/platform/openwrt/) 上同时启用了 [OpenClash](/clients/openclash/)、[PassWall2](/clients/passwall2/)、[Nikki](/clients/nikki/) 或 [HomeProxy](/clients/homeproxy/) 中的两个插件，或者电脑客户端与软路由透明代理同时开启（形成“套娃双层代理”），数据包会在局域网与代理网关之间来回劫持甚至直接丢弃。
2. **特定宽带运营商/地区级路由波动**：国内电信、联通、移动与广电在跨省互联和国际出口带宽策略上差异巨大，可能出现在“公司电信光纤稳如泰山，回家移动宽带全部超时”的明显分化。
3. **机场上游入口维护或部分域名受限**：服务商后台正在更换中转机器，或者前端域名在当前地区运营商下遭遇临时 DNS 污染。

### 检查步骤（交叉对照矩阵）

使用下面这张「四象限客观对照测试表」，依次用同一台设备做两次对照测试（直连网络 vs 手机 5G 热点，以及单节点 vs 全节点）：

| 测试对比组合 | 测试结果特征 | 明确指向的问题归属 | 下一步对应动作 |
| :--- | :--- | :--- | :--- |
| **家宽带全部超时** + **手机 5G 热点正常** | 同一客户端配置，一换网立刻恢复 | **100% 本地网络或路由问题**（ISP 阻断、光猫 DNS 污染、软路由插件冲突） | 检查 OpenWrt 是否套娃开启双代理、重启光猫、更换协议躲避 ISP 限速 |
| **家宽带直连国内失灵** + **5G 热点正常** | 连不上代理前国内网就已不通 | **本地宽带欠费、光猫掉线或本机网卡异常** | 排查宽带与本机网卡，先恢复物理直连 |
| **多网络均能直连国内** + **仅特定 1–2 个节点超时** | 其他地区节点正常且面板能登录 | **机场个别节点临时维护或负载过载** | 切换同区域其他编号节点，或刷新一次订阅列表 |
| **家宽带与 5G 均全节点超时** + **官网直连/代理全不通** | 多网络、多协议同时失效且面板无法访问 | **机场域名阻断或服务端长期故障** | 转入 [停服与状态核验](/safety/closures/) 做 `dig`/`curl` 客观确认 |

### 处理方法
- **消除局域网软路由“套娃”代理**：若路由器本身已经在跑 OpenClash / PassWall2 / Nikki 提供全屋透明代理，手机与电脑连在同一个 Wi-Fi 下时**请关闭本机客户端的代理开关**（或将本机明确加入软路由的“绕过代理设备 MAC/IP 白名单”），绝不要让本机与软路由同时劫持流量。
- **使用客观命令检查本地域名解析与 HTTPS 握手**：

```powershell
# Windows 测试目标域名在本地默认 DNS 与公共 DNS 下的解析差异
nslookup example-panel.com
nslookup example-panel.com 223.5.5.5
```

```bash
# macOS / Linux 用 dig 对比解析记录
dig +short example-panel.com
dig @1.1.1.1 +short example-panel.com
```

### 验证结果
通过切换网络对照测试和路由器白名单隔离后，你能用客观事实清楚界定问题究竟在本地宽带路由侧，还是远端服务商侧，不会再盲目重装系统或误判服务状态。

### 下一步
在明确了故障大致边界之后，如果仍无法直接自愈，就需要学会正确读取客户端底层日志来找到精确报错行。

---

## 十五、检查日志与错误信息方法

### 现象
软件界面只给出了一句含糊的“连接失败”或“更新错误”，或者某些网站莫名其妙打不开，但肉眼看配置表根本找不出哪里写错了。

### 可能原因
图形界面为了简化操作，往往会把内核底层的详细错误栈折叠起来；实际上 Mihomo、Xray-core 和 sing-box 都会在内部日志流中精确打印出出错的协议阶段（DNS、TLS、Dial、Rule Match 或 Config Parse）。

### 检查步骤（各主流客户端日志打开路径）
1. **Clash Verge Rev / FlClash（Mihomo 核心）**：
   - 左侧导航进入 **「日志（Logs）」** 标签，将日志级别临时调整为 `info` 或 `debug`（排查结束后记得调回 `info` 或 `warning` 以节省性能）；同时可在「设置 → 打开配置目录 / 日志目录」查看完整 `.log` 文件。
2. **v2rayN（Xray / sing-box / Mihomo）**：
   - 主界面下方「日志信息」面板默认输出关键错误；如需深度核心日志，进入「参数设置 → 核心基础设置」开启 `debug` 日志级别并在 `guiLogs` 目录查阅文本记录。
3. **Hiddify / Karing（sing-box 核心）**：
   - 在主页或设置菜单进入「日志 / Logs」，支持直接筛选 `ERROR` 与 `WARN` 级别条目。
4. **Shadowrocket（iOS）**：
   - 进入「设置 → 诊断（Diagnostics）→ 日志」开启核心日志抓取，重现故障后再关闭并查阅最近几百行记录。

### 处理方法（高频核心报错关键词速查字典）

提取日志中带有 `ERR`、`WARN` 或 `level=error` 的条目，对照下表直接定位修复动作：

| 日志高频报错关键词 | 精准技术含义 | 立即执行的修复方案 |
| :--- | :--- | :--- |
| `bad timestamp` / `certificate is not yet valid` | 本地时间与标准 UTC 偏差过大 | 校准电脑/手机系统时间与时区 |
| `tls: first record does not look like a TLS handshake` | 端口协议配错、入口非 TLS 或遭遇中间拦截 | 更新订阅获取最新端口，或切换其他协议节点 |
| `dial tcp ...: i/o timeout` / `connectex: ...` | 无法抵达入口 IP 或端口，本地网络阻断或节点下线 | 排除本地端口/防火墙，切换网络或更换有效节点 |
| `bind: address already in use` | 本地 `7890`/`7897`/`9090` 端口被僵尸进程占死 | 结束残留核心进程后重启客户端 |
| `yaml: unmarshal errors` / `cannot unmarshal` | 配置文件 YAML 缩进错、或把 Base64 当 YAML 导入 | 检查格式匹配，临时禁用自定义覆写脚本 |
| `operation not permitted` / `tun ... access denied` | 开启 TUN 时缺乏管理员服务或内核能力授权 | 安装 Service Mode（Win）/授权 Helper（Mac）/执行 `setcap`（Linux） |
| `EOF` / `connection reset by peer` | 远端主动断开或途中遭到 SNI/特征重置阻断 | 检查客户端内核是否过旧、确认套餐未过期、换协议测试 |

### 验证结果
在日志窗口把等级调回 `info` 后，刷新目标网页可以看到清晰的 `matched rule` 规则命中记录与正常的 `tcp/udp` 转发流水，不再有连续滚动的红色 `error` 刷屏。

### 下一步
如果你已经按前十四步排除全部本地问题，并从日志里抓到了明确指向服务端或账号权限的报错（例如全节点返回认证失败或连续返回 `i/o timeout`），请进入下一节准备安全地联系服务商技术支持。

---

## 十六、何时联系服务商及安全提交信息规范

### 现象
本地时间精准、直连国内正常、客户端为官方正版最新内核，且在家宽带与手机 5G 热点下测试均全节点异常；或遇到流量扣减错乱、付费未到账、特定地区节点连续数日失联。

### 可能原因
此类故障超出本地调优范畴，通常涉及面板账户同步异常、套餐权限未激活、后端节点宕机或专线入口机房维护割接。

### 检查步骤（提交工单前的“三不三要”准备）
1. **绝对不要泄露的三项敏感数据**：
   - **切勿贴出完整订阅 URL**：末尾 `?token=xxx` 或 `uuid` 等价于节点密码，泄露会导致他人盗用流量。
   - **切勿发送登录密码与支付隐私码**：核对订单只需商户订单号。
   - **切勿发送未脱敏完整配置**：`proxies` 节点列表包含真实服务器密码与 UUID。
2. **必须准备的四项高价值诊断信息**：
   - **账号与订单信息**：脱敏邮箱、故障准确起止时间、商户订单号。
   - **环境与客户端信息**：系统版本、官方客户端及版本号、已确认规则模式且时间误差小于 30 秒。
   - **网络交叉对照结论**：说明已在宽带与 5G 下同时复现。
   - **脱敏报错片段**：例如“香港组全部 `dial tcp i/o timeout`，新加坡正常”，附关键错误日志行。

### 处理方法
- **优先走网页控制台工单**：核对条款与售后边界可参阅 [退款政策与维权留证](/safety/refunds/) 与 [品牌信息数据库](/brands/directory/)。
- **区分客户端模式反馈**：支持第三方订阅的品牌（如 [光速云](/brands/guangsuyun/)、[一翻云](/brands/yifan/)）需写明使用的内核（Mihomo/sing-box/Xray）；仅专属端品牌（如 [飞猫云](/brands/feimao/)、[隐形人](/brands/yinxingren/)、[Firefly](/brands/firefly/)）需提供专属端版本号。
- **遇到工单长期无回复**：立即停止追加付款，参考 [品牌变动与异常记录](/brands/status/) 与 [停服核验指南](/safety/closures/) 交叉确认。

### 验证结果
完成前置自检与脱敏的工单，能让客服跳过基础模板问答，直接核查账户权限或给出维护恢复时间。

### 下一步
如确认服务长期无法恢复，请参考 [服务异常时的替代方案](/safety/alternatives/) 建立跨体系双订阅容灾配置。

---

## 十七、常见问题（FAQ）

### 代理客户端突然全部节点超时（timeout 或 -1ms），最先应该检查什么？

优先检查本地系统时间与标准 UTC 的偏差（超过 90 秒会直接触发 VMess 时间窗校验与 TLS/VLESS-Reality 握手失败），其次确认套餐是否到期或流量耗尽，再排查是否同时开启了多款 VPN、游戏加速器或防火墙拦截了核心进程。

### 更新订阅时客户端提示 HTTP 200，但内容显示 0 字节（200+0 字节）是什么原因？

常见原因为机场面板会校验请求头中的 User-Agent，当客户端发送了被过滤或未知的 UA、参数被截断或订阅 Token 已重置时，后端可能返回状态码 200 但响应体为空。修正订阅 User-Agent 或重新从控制台复制完整链接即可排查。

### 为什么客户端测试节点延迟只有 40ms，打开网页却提示连接超时或 ERR_PROXY_CONNECTION_FAILED？

这说明节点本身大概率连通，但浏览器流量并没有正确进入代理端口。常见原因包括仅开启了核心却未打开系统代理、浏览器扩展（如 SwitchyOmega）指向了旧端口 7890 而非新版客户端端口 7897，或代理模式误设为 Direct 直连。

### 关闭代理软件后国内网页反而全部打不开，ping 域名显示 198.18.0.x 怎么恢复？

这是 Fake-IP 模式异常退出后留下的系统或浏览器 DNS 缓存。198.18.0.0/16 是代理内核用于映射虚拟解析的保留网段，强杀进程或断电退出导致 DNS 未刷新，在终端执行 ipconfig /flushdns 并清理浏览器异步 DNS 缓存即可恢复。

### Windows 安装 Clash Verge Rev 后打开是白屏，或者提示无法启动核心怎么办？

白屏通常是因为精简版系统缺失 Microsoft Edge WebView2 Runtime 运行时或旧显卡驱动与 GPU 硬件加速冲突；核心无法启动则多为 Windows Defender 或第三方杀软隔离了 mihomo/xray 核心文件，或残留进程占用了 7897/9097 端口。

### 为什么开了系统代理后浏览器能正常访问，终端里的 git、curl、pip 却依然超时？

系统代理仅在应用层对遵循系统 API 的浏览器和桌面软件生效，绝大多数命令行工具、Docker 与游戏默认忽略系统代理。需要为终端配置 HTTP_PROXY 环境变量，或安装服务模式并开启客户端的 TUN 虚拟网卡全局接管。

### 开启 TUN 模式后全机断网，或者 WSL2 与 Docker 容器无法联网是什么原因？

全机断网通常因为同时开启了企业内网 VPN、游戏加速器或其他虚拟网卡软件，双方抢占默认路由 0.0.0.0/0 形成回环；WSL2 与 Docker 断联则源于 Hyper-V 虚拟交换机流量被 TUN 截获或 DNS 转发被劫持，需要配置网段排除与监听设置。

### 手机锁屏几分钟后微信或海外应用收不到消息、代理自动断开怎么处理？

Android 端多为厂商省电策略清理后台进程或收回 VpnService 权限所致，需关闭电池优化并锁定后台；iOS 端则常见于导入了体积过大的广告屏蔽与分流规则集，导致系统 Network Extension 触及内存上限而被强行回收。

### 怎么快速区分是自己的本地网络故障，还是机场服务端节点或域名出问题？

使用交叉验证法：先关闭所有代理直连国内网站，确认基础宽带正常；再切换手机 5G 热点排除家用路由或校园网 UDP/端口限制；最后用命令行分别测试面板与节点在不同端口协议下的连通性，即可明确责任边界。

### 向机场客服提交工单排查故障时，绝对不能发送哪些信息？

绝对不要直接粘贴包含个人 token 或 uuid 的完整订阅 URL、账号登录密码、支付完整截图中的敏感个人隐私或未脱敏的明文配置文件。排查时只需提供脱敏后的节点名称、报错日志片段、测试时间段与本地网络运营商类型即可。
