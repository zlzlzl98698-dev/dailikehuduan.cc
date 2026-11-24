---
title: 节点连接成功但打不开网页怎么办？端口占用、残留系统代理与异常退出修复
description: 系统排查代理节点测速正常（延迟 30ms）但浏览器打不开网页、报 ERR_PROXY_CONNECTION_FAILED、关闭代理后电脑全断网，以及仅浏览器通或仅终端不通的五大根因。涵盖 WinINET 注册表 ProxyEnable=1 残留、7897/7890 端口冲突、WinHTTP 残留、防火墙拦截与浏览器扩展冲突，附 PowerShell 一键诊断与修复命令。
lastUpdated: 2026-11-24
author: 代理客户端编辑部
category: 故障排查
tags: [连接成功打不开网页, ERR_PROXY_CONNECTION_FAILED, ProxyEnable, 端口占用, WinHTTP代理重置, 异常退出断网]
pillar: troubleshooting
parentTopic: /troubleshooting/disconnected/
primaryKeyword: 节点连接成功但打不开网页怎么办
searchIntent: Troubleshooting
schemaType: TechArticle
relatedSlugs: ["/troubleshooting/disconnected/", "/troubleshooting/tun/", "/troubleshooting/startup/", "/troubleshooting/dns-leak-and-hijack-fix/"]
relatedBrands: []
faq:
  - q: 为什么节点测速延迟只有 30ms 绿色正常，浏览器却报 ERR_PROXY_CONNECTION_FAILED 打不开网页？
    a: 节点延迟测速是代理内核直接向远端发起测试的结果，与浏览器能否把流量送进本地内核无关。ERR_PROXY_CONNECTION_FAILED 明确表示浏览器正试图连接一个已经关闭或无进程监听的本地代理端口。常见诱因是老版客户端异常退出后注册表 ProxyEnable=1 依然指向死掉的 127.0.0.1:7890，或者浏览器装了 SwitchyOmega 等扩展把端口硬编码成了旧端口，而当前新版 Clash Verge Rev 实际监听在 7897。
  - q: 为什么一关闭代理客户端，整个电脑的国内和国外网页就彻底断网了？
    a: 这是代理软件非正常退出（崩溃、强杀进程、电脑直接断电或蓝屏）留下的典型后遗症。客户端开启系统代理时会把 Windows 注册表 WinINET 的 ProxyEnable 改为 1 并写入 127.0.0.1:7890/7897，正常退出时会自动改回 0；一旦异常退出，注册表依然锁死指向本地回环代理端口，而此时代理内核已经停止运行，所有浏览器和系统软件都会把请求发向无人应答的死端口，造成全盘断网。如果同时开了 TUN 模式，还可能叠加网卡 Fake-IP 缓存残留。
  - q: 为什么命令行能用或者微信能发消息，唯独 Chrome / Edge 浏览器打不开网页（或反过来只有终端不通）？
    a: 浏览器和命令行走的是两套代理机制。如果仅浏览器不通而微信/终端正常，九成以上是 Chrome/Edge 里安装了 SwitchyOmega、ZeroOmega、跨境选品插件或第三方 VPN 扩展，扩展接管权限高于系统代理并指向了错误端口；反之如果浏览器正常但终端（Git、npm、PowerShell、Microsoft Store）报连接失败，则是命令行或系统后台服务不会自动读取 WinINET，或者残留了错误的 WinHTTP 代理规则，需要执行 netsh winhttp reset proxy 并核对环境变量。
  - q: 如何用一条命令查出 7897 或 7890 端口到底被哪个残留软件占用了？
    a: 在 Windows PowerShell 或命令提示符运行 netstat -ano | findstr 7897（或者把端口号换成 7890、10808）。观察输出行最后一列的数字 PID，再运行 Get-Process -Id 实际PID 或 tasklist | findstr 实际PID，就能准确看到占用端口的可执行文件名称。实际排障中经常会撞见已停止维护的旧版 Clash 僵尸进程、迅雷下载器、开发环境 IDE 本地预览服务或 Hyper-V 保留端口占用了代理口。
  - q: Windows 防火墙弹窗不小心点了“取消”或“阻止”，会导致节点连上却打不开网页吗？
    a: 会。Windows Defender 防火墙或第三方安全软件一旦阻止了 verge-mihomo.exe、mihomo.exe、xray.exe 或 sing-box.exe 访问公用/专用网络，客户端图形界面虽然能打开，但内核无法建立出站隧道或无法接管本地回环流量，部分情况下甚至会阻止局域网与本地虚拟网卡通信。需要在 Windows 安全中心的防火墙入站与出站规则中删除拦截项并放行对应内核程序。
  - q: 什么情况下必须执行 netsh winhttp reset proxy，它和修改浏览器代理有什么区别？
    a: Windows 内部存在 WinINET 与 WinHTTP 两套独立的代理配置层。Chrome、Edge 和 IE 设置面板读取的是 WinINET 注册表；而 Windows Update、PowerShell Invoke-WebRequest、部分后台服务以及依赖系统服务栈的程序读取的是 WinHTTP。如果之前运行过系统级脚本或旧版代理把 WinHTTP 设为 127.0.0.1:7890，即使在设置界面关闭了系统代理，系统级服务与终端依然会持续超时。用管理员权限运行 netsh winhttp reset proxy 可立即将其恢复为直接连接。
---

# 节点连接成功但打不开网页怎么办？端口占用、残留系统代理与异常退出修复

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>当你遇到<strong>“代理客户端节点延迟 30ms 绿色正常，但浏览器打不开网页”</strong>、报错 <code>ERR_PROXY_CONNECTION_FAILED</code>，或者<strong>“一关闭代理就全电脑断网”</strong>时，问题几乎从不在远端节点本身，而在于<strong>本地流量接管链路发生了错位或残留锁死</strong>。五大高频根因分别是：异常退出导致 Windows 注册表 WinINET 的 <code>ProxyEnable=1</code> 仍死指无效的 <code>127.0.0.1:7890</code>、<code>7897</code>/<code>7890</code> 端口被旧进程或下载工具抢占、Windows 防火墙拦截核心程序（<code>mihomo.exe</code> / <code>xray.exe</code>）、陈旧的 WinHTTP 代理未清空，以及浏览器扩展或内置安全 DNS 抢权覆盖。按本文提供的 PowerShell 命令核对注册表、清理占口 PID 与重置 WinHTTP，可在 3 分钟内彻底打通网络。</p>
</div>

## 一、症状判断：3 类典型“假连通”现象精准对照表

在开始修改电脑网络设置之前，先花 20 秒对照下表确认你遇到的是哪一类故障分支。不同症状的根因位于截然不同的系统层级：

| 典型故障现象 | 浏览器 / 终端报错表现 | 故障本质与所属层级 | 首选排查动作 |
|---|---|---|---|
| **延迟 30ms 但 `ERR_PROXY_CONNECTION_FAILED`** | 节点测试绿色正常，浏览器打开任何国内外网站均秒报 `ERR_PROXY_CONNECTION_FAILED` 或 `无法连接到代理服务器` | **端口映射失联**：系统代理或浏览器扩展指向的端口（如 `7890`）无进程监听，或实际监听口是 `7897` | 核对注册表 `ProxyServer` 与 `netstat` 实际监听口是否一致 |
| **关代理后全断网（重启也不好）** | 客户端一退出，微信、Edge、Chrome 全无法上网，只有重新打开代理才恢复 | **异常退出残留**：强杀或崩溃导致 `ProxyEnable=1` 未还原（或伴随 TUN Fake-IP 缓存残留） | PowerShell 清零 `ProxyEnable`、重置 WinHTTP 并刷新 DNS |
| **仅浏览器不通，或仅终端/软件不通** | 微信/游戏/命令行正常但 Chrome 打不开；或浏览器飞快，唯独 Git、`curl`、PowerShell、商店报错 | **多套代理栈打架**：浏览器被 SwitchyOmega/VPN 扩展接管；终端/系统服务被残留 WinHTTP 或环境变量劫持 | Chrome 无痕窗口测试 + `netsh winhttp show proxy` |
| **连上代理无流量，内核日志持续报拒绝或超时** | 所有浏览器与终端均无反应，任务管理器看内核无明显上下行流量 | **防火墙拦截或双客户端抢口**：安全软件拦截内核出站，或旧版僵尸进程/迅雷/IDE 占死端口 | `netstat -ano` 查 PID + 检查防火墙放行规则 |

如果你发现退出后连本地 `ping www.baidu.com` 都解析出 `198.18.0.x` 地址，说明同时叠加了 TUN 模式的 Fake-IP 缓存残留，可结合 [DNS 错误与 Fake-IP 残留一键恢复方案](/troubleshooting/dns-leak-and-hijack-fix/) 同步清理。如果是在开机阶段软件拉不起来或服务模式报错，可继续参阅 [客户端启动异常与 TUN 排查](/troubleshooting/startup/) 与 [TUN 虚拟网卡冲突指南](/troubleshooting/tun/)。

## 二、原因分类：深入剖析五大本地链路阻塞根因

为什么“软件自己测速有延迟，电脑其他软件却没网”？因为节点测速是由内核直接从本机网卡发往机场服务器的；而浏览器、微信和命令行要想走代理，必须老老实实经过操作系统代理开关、本地回环端口监听、防火墙和扩展策略这四道关口。任何一道关口错位都会断流。

### 1. 异常退出遗留 WinINET 死锁（`ProxyEnable=1` 指向已停止的 `127.0.0.1:7890`）

Windows 系统桌面应用（Chrome、Edge、微信、QQ 等）默认遵循一套名为 **WinINET** 的代理配置体系，其状态储存在注册表 `HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings` 中。当你打开代理客户端的“系统代理”开关时，程序会向注册表写入 `ProxyEnable = 1` 与 `ProxyServer = 127.0.0.1:7897`（老旧版常为 `7890`）。

正常情况下，你点“退出客户端”，软件会在关闭前把 `ProxyEnable` 还原为 `0`。但如果遇到电脑突然断电、蓝屏、Windows 注销强制结束进程、在任务管理器直接杀掉进程，或者旧版客户端崩溃，这个清理动作就没有机会执行。结果就是**注册表里还写着 `ProxyEnable=1` 和 `127.0.0.1:7890`**，可 `7890` 端口后面早已没有任何程序在工作。于是无论国内外网站，所有请求都被浏览器发去撞一堵不存在的墙，造成“关了代理全断网”，而开回旧代理或修复注册表后才恢复。

### 2. 本地端口碰撞与被非代理软件抢占

本地回环端口（`127.0.0.1` 上的端口号）具有独占性，或者被抢占后产生流量误投递。常见碰撞源有四类：
- **新旧代理客户端并发或僵尸残留**：例如电脑里同时装过已停止维护的旧版 Clash、以及现代的 [Clash Verge Rev](/clients/clash-verge-rev/)、[FlClash](/clients/flclash/) 或 [v2rayN](/clients/v2rayn/)。旧进程崩溃后没有完全释放，占死了 `7890` 或 `10808`，新客户端被迫监听在 `7897` 或启动失败，而浏览器还傻傻地连向 `7890`。
- **迅雷、网盘与开发工具 IDE 抢占**：某些版本下载工具（如迅雷内置加速服务）、前端开发热更新服务器（Vite/Webpack 默认端口附近）、本地测试 Mock 服务或数据库监控工具，会顺手绑定常见的 `7890`、`8080`、`9090` 或 `10808` 端口。
- **Windows Hyper-V / WSL 动态端口保留**：启用了 WSL2 或 Docker Desktop 的 Windows 电脑，系统 NAT 服务偶尔会随机保留一段连续的本地 TCP 端口（包含 `7890`–`7899` 区间），导致客户端虽然界面没报错但核心根本绑定失败，无法收包。

### 3. Windows 防火墙或第三方安全软件静默拦截核心进程

代理客户端通常由“前端界面程序”和“底层转发内核”（例如 `verge-mihomo.exe`、`mihomo.exe`、`xray.exe`、`sing-box.exe`）两部分组成。首次启动并切换到公共 Wi-Fi 时，Windows Defender 防火墙会弹出是否允许程序访问网络的提示。如果你随手点了“取消”，或者第三方杀毒软件把刚更新的内核识别为未知网络程序并拉黑了其出站/入站规则，就会出现界面能打开、甚至面板配置能刷新，但内核根本发不出流量或收不到本地浏览器连接包的僵局。

### 4. 陈旧的 WinHTTP 代理配置污染系统服务与终端

除了浏览器读取的 WinINET，Windows 还有第二套系统底层代理配置机制——**WinHTTP**。Windows Update、微软应用商店、企业认证客户端、部分命令行工具以及不少底层系统服务使用的是 WinHTTP 而非 WinINET。很多用户以前折腾过系统级代理脚本、`netsh` 命令或老旧加速软件，把 WinHTTP 写死成了 `127.0.0.1:7890` 却忘记重置。这会导致“桌面浏览器上网完全正常，唯独 PowerShell、商店或系统服务始终连不上网”的割裂现象。

### 5. 浏览器代理扩展、VPN 插件与安全 DNS（DoH）接管冲突

Chrome 与 Edge 浏览器允许扩展程序通过 `chrome.proxy` API 接管代理控制权，且**扩展接管的优先级高于 Windows 系统代理**。许多用户几年前装过 Proxy SwitchyOmega、ZeroOmega，或是海外免费 VPN 浏览器扩展、跨境电商选品助手。只要其中任何一个扩展处于启用并控制代理的状态，浏览器设置页就会显示“您的代理设置正由某个扩展程序控制”。哪怕你把电脑系统代理来回开关十遍，浏览器也只听插件的话把流量扔进过期端口（例如旧插件写死的 `7890`）或强行直连。此外，浏览器开启自带“使用安全 DNS（DoH）”也可能绕过代理分流或引发连接阻断。

## 三、逐项检查：用 PowerShell 与浏览器工具定位病灶

打开 Windows PowerShell（建议右键“以管理员身份运行”，以便后续能顺畅检查防火墙与重置 WinHTTP），依次执行以下四步只读诊断命令。

### 第 1 步：核查 WinINET 注册表代理开关与地址

直接读取当前用户生效的系统代理注册表键值，看清楚是否处于异常开启或指向了错误端口：

```powershell
# 查看 WinINET 系统代理开关（ProxyEnable）、代理地址（ProxyServer）及绕过列表（ProxyOverride）
Get-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" |
  Select-Object ProxyEnable, ProxyServer, ProxyOverride, AutoConfigURL
```

**判读要点**：
- 当你已经关闭代理客户端时，如果 `ProxyEnable` 依然显示为 `1`，或者 `AutoConfigURL`（PAC 自动脚本地址）留有一串失效的 `http://127.0.0.1:...`，即可实锤 **异常退出残留导致断网**。
- 当你开着代理时，仔细核对 `ProxyServer` 的端口号（例如 Clash Verge Rev 默认是 `127.0.0.1:7897`，v2rayN HTTP 代理默认常见 `127.0.0.1:10809`，FlClash 默认常见 `127.0.0.1:7890`）是否与软件主界面显示的端口一字不差。如果界面写 `7897` 而注册表写 `7890`，浏览器必报 `ERR_PROXY_CONNECTION_FAILED`。

### 第 2 步：检查端口监听归属与抢占进程（`netstat -ano`）

把命令里的端口号换成你客户端实际使用的端口以及容易残留冲突的 `7890`、`7897`、`10808`、`10809`：

```powershell
# 1. 检查 7897 端口监听状态与占用进程 PID
netstat -ano | findstr 7897

# 2. 顺带排查常见的 7890、10808、10809 是否存在残留或冲突监听
netstat -ano | findstr ":7890 :10808 :10809"

# 3. 假设上一条最后一列返回的 PID 为 18432，反查进程名称与路径
Get-Process -Id 18432 | Select-Object Id, ProcessName, Path
# 若权限受限看不到 Path，也可用传统命令确认进程名
tasklist | findstr 18432
```

**判读要点**：
- 如果你开着客户端，但 `netstat -ano | findstr 7897` **没有任何输出**（即没有任何 `LISTENING` 状态），说明底层内核根本没启动成功，或者该端口被 Hyper-V 动态保留了（可执行 `netsh interface ipv4 show excludedportrange protocol=tcp` 查看排除端口区间）。
- 如果输出显示 `LISTENING`，但 `Get-Process` 查出来的进程名不是你当前使用的 `verge-mihomo`、`mihomo`、`FlClashCore`、`xray` 或 `sing-box`，而是旧版进程、迅雷服务或某款 IDE，即实锤 **端口碰撞抢占**。

### 第 3 步：检查 WinHTTP 代理与终端环境变量残留

```powershell
# 1. 查看 Windows 底层 WinHTTP 代理状态
netsh winhttp show proxy

# 2. 检查当前 PowerShell 会话与系统环境变量是否残留过时的 HTTP_PROXY / HTTPS_PROXY
Get-ChildItem Env: | Where-Object { $_.Name -match "PROXY" }
```

**判读要点**：
- 正常日常桌面环境下，`netsh winhttp show proxy` 应输出 `直接访问 (无代理服务器)`。如果显示 `代理服务器: 127.0.0.1:7890` 等死端口，就会拖垮命令行与系统服务。
- 如果环境变量里长期写死了过期的 `HTTP_PROXY=http://127.0.0.1:7890`，即使系统代理关掉或改了端口，Git、Python、`curl` 和 Node 终端依然会顽固报错。

### 第 4 步：检查 Windows 防火墙拦截规则与浏览器扩展权限

```powershell
# 在 PowerShell 查询是否存在针对代理内核程序的防火墙阻止（Block）规则
Get-NetFirewallApplicationFilter |
  Where-Object { $_.Program -match "mihomo|clash|xray|sing-box|v2ray|flclash|hiddify" } |
  ForEach-Object {
    $rule = Get-NetFirewallRule -AssociatedNetFirewallApplicationFilter $_
    [PSCustomObject]@{
      Program   = $_.Program
      DisplayName = $rule.DisplayName
      Direction = $rule.Direction
      Action    = $rule.Action
      Enabled   = $rule.Enabled
    }
  } | Format-Table -AutoSize
```

同时，用 **20 秒完成浏览器隔离测试**：
1. 按 `Ctrl + Shift + N` 打开 Chrome 或 Edge 的**无痕窗口（InPrivate）**。
2. 在地址栏输入 `chrome://settings/system`（Edge 为 `edge://settings/system`），观察是否有“您的代理设置正由某个扩展程序控制”的提示，并检查 `chrome://net-internals/#proxy` 显示的有效代理模式。
3. 若无痕窗口能秒开网页而普通窗口报 `ERR_PROXY_CONNECTION_FAILED`，直接锁定是**浏览器扩展（如 SwitchyOmega / VPN 插件）**覆盖了系统代理。

## 四、修复操作：按根因一步到位的恢复方案

对照上面查出的问题点，直接执行对应的修复步骤即可，不要盲目修改无关网络配置。

### 1. 清理 WinINET 残留代理（解决异常退出后全断网）

如果你已经关闭代理但电脑完全没网，在 PowerShell 运行以下命令一键清除注册表死锁与 PAC 残留：

```powershell
# 将 WinINET 系统代理开关重置为 0（关闭），并清理可能残留的 PAC 自动脚本
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -Name ProxyEnable -Value 0
Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -Name AutoConfigURL -ErrorAction SilentlyContinue
```

执行后，打开 Windows「设置 → 网络和 Internet → 代理」，确认「使用代理服务器」与「使用设置脚本」均为关闭状态，此时国内网站应立即恢复直连。

### 2. 重置 WinHTTP 代理与清理过时终端环境变量

如果终端命令、系统更新或应用商店无法联网，以**管理员身份**运行 PowerShell 执行：

```powershell
# 重置 WinHTTP 代理为直接访问
netsh winhttp reset proxy

# 若存在过期用户级代理环境变量，清理当前会话演示（永久修改请进“系统属性 → 环境变量”删除对应条目）
Remove-Item Env:HTTP_PROXY -ErrorAction SilentlyContinue
Remove-Item Env:HTTPS_PROXY -ErrorAction SilentlyContinue
Remove-Item Env:ALL_PROXY -ErrorAction SilentlyContinue
```

### 3. 解除端口抢占与更换高位避让端口

1. **清理僵尸进程**：如果 `netstat` 发现旧版客户端残留或无关进程占用了端口，先完全退出当前代理软件，在 PowerShell 执行 `Stop-Process -Id <PID> -Force` 结束僵尸进程；或直接卸载早已停止维护的旧客户端，仅保留一款活跃维护的客户端（如 [Clash Verge Rev](/clients/clash-verge-rev/)、[FlClash](/clients/flclash/) 或 [v2rayN](/clients/v2rayn/)）。
2. **改用无冲突高位端口**：如果端口被迅雷、IDE 或 Windows Hyper-V 保留段（`excludedportrange`）占死，最稳妥的解法不是跟系统硬碰硬，而是直接进入代理客户端的设置面板，把**混合代理端口（Mixed Port）**从 `7890` / `7897` 修改为 `17897` 或 `27897` 等高位端口，再重新关闭并开启一次「系统代理」，让客户端把新端口重新写入注册表。

### 4. 修复 Windows 防火墙拦截

如果在第 4 步中查出 `Action` 为 `Block` 的规则：
1. 打开「Windows 安全中心 → 防火墙和网络保护 → 允许应用通过防火墙」。
2. 点击「更改设置」，在列表中找到对应的核心程序（如 `verge-mihomo.exe`、`mihomo.exe`、`xray.exe`、`sing-box.exe`），同时勾选**「专用」**与**「公用」**网络复选框；若存在同名被阻止条目，打开「高级设置（`wf.msc`）」在入站和出站规则中删除所有 `Block`（阻止）规则后重启客户端。
3. 若装有第三方安全软件且开启了“HTTPS 防护 / 网络流量扫描”，建议将客户端安装目录及核心程序加入白名单，避免加密代理握手流量被中间拦截重置。

### 5. 梳理浏览器扩展与内置安全 DNS 冲突

1. **清理冗余代理扩展**：对于绝大多数使用系统代理或 [TUN 模式](/guides/tun/) 的桌面用户，浏览器里**不需要**也不建议再安装 SwitchyOmega、ZeroOmega 或任何来路不明的免费代理扩展。直接进入扩展管理页（`chrome://extensions`）停用或卸载所有具备代理权限的扩展，把流量接管权彻底交还给操作系统与代理客户端。
2. **开发者保留扩展的正确配置**：若因开发测试必须保留 SwitchyOmega/ZeroOmega，请务必**关闭代理客户端自带的「系统代理」开关**，然后在插件情景模式里把协议与端口（例如 `HTTP`、`127.0.0.1`、`7897`）核对到与客户端面板完全一致，并点击「应用选项」。
3. **关闭浏览器内置安全 DNS 并清缓存**：在浏览器「设置 → 隐私与安全 → 安全」中暂时关闭「使用安全 DNS」，接着访问 `chrome://net-internals/#proxy` 点击 `Re-apply settings`，访问 `chrome://net-internals/#sockets` 点击 `Flush socket pools`。

## 五、验证结果：端到端命令行与浏览双重确认

全部修复操作完成后，请按顺序执行以下三步验收测试，确认故障彻底根除且不会在关掉软件后复发：

1. **代理端口与隧道实测（开着客户端测）**：
   先打开代理客户端并开启系统代理，在 PowerShell 对当前设置的端口（以 `7897` 为例，请替换为你的实际端口）运行：
   ```powershell
   curl.exe -I --connect-timeout 8 --proxy http://127.0.0.1:7897 https://cp.cloudflare.com/generate_204
   ```
   终端返回 `HTTP/1.1 200 Connection established` 及 `HTTP/2 204`（或 `204 No Content`），证明“本地端口监听 → 代理内核 → 节点加密出口”全链路通畅。
2. **浏览器普通窗口验收**：
   关闭无痕模式，回到普通 Chrome/Edge 窗口访问海外网页与国内网页，确认不再报错 `ERR_PROXY_CONNECTION_FAILED`，且在客户端的「连接（Connections）」监控面板中能实时看到 `chrome.exe` 或 `msedge.exe` 的活动连接字节数增长。
3. **退出还原安全测试（最关键的一步）**：
   正常点击客户端菜单的「退出（Quit）」，等待 3 秒后再次执行：
   ```powershell
   (Get-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings").ProxyEnable
   ```
   确认返回值自动变回 `0`，且浏览器可以无障碍直连打开国内网站，说明客户端与系统的接管及释放闭环已经完全健康。

## 六、常见问题（FAQ）

### 为什么节点测速延迟只有 30ms 绿色正常，浏览器却报 ERR_PROXY_CONNECTION_FAILED 打不开网页？

节点延迟测速是代理内核直接向远端发起测试的结果，与浏览器能否把流量送进本地内核无关。ERR_PROXY_CONNECTION_FAILED 明确表示浏览器正试图连接一个已经关闭或无进程监听的本地代理端口。常见诱因是老版客户端异常退出后注册表 ProxyEnable=1 依然指向死掉的 127.0.0.1:7890，或者浏览器装了 SwitchyOmega 等扩展把端口硬编码成了旧端口，而当前新版 Clash Verge Rev 实际监听在 7897。

### 为什么一关闭代理客户端，整个电脑的国内和国外网页就彻底断网了？

这是代理软件非正常退出（崩溃、强杀进程、电脑直接断电或蓝屏）留下的典型后遗症。客户端开启系统代理时会把 Windows 注册表 WinINET 的 ProxyEnable 改为 1 并写入 127.0.0.1:7890/7897，正常退出时会自动改回 0；一旦异常退出，注册表依然锁死指向本地回环代理端口，而此时代理内核已经停止运行，所有浏览器和系统软件都会把请求发向无人应答的死端口，造成全盘断网。如果同时开了 TUN 模式，还可能叠加网卡 Fake-IP 缓存残留。

### 为什么命令行能用或者微信能发消息，唯独 Chrome / Edge 浏览器打不开网页（或反过来只有终端不通）？

浏览器和命令行走的是两套代理机制。如果仅浏览器不通而微信/终端正常，九成以上是 Chrome/Edge 里安装了 SwitchyOmega、ZeroOmega、跨境选品插件或第三方 VPN 扩展，扩展接管权限高于系统代理并指向了错误端口；反之如果浏览器正常但终端（Git、npm、PowerShell、Microsoft Store）报连接失败，则是命令行或系统后台服务不会自动读取 WinINET，或者残留了错误的 WinHTTP 代理规则，需要执行 netsh winhttp reset proxy 并核对环境变量。

### 如何用一条命令查出 7897 或 7890 端口到底被哪个残留软件占用了？

在 Windows PowerShell 或命令提示符运行 netstat -ano | findstr 7897（或者把端口号换成 7890、10808）。观察输出行最后一列的数字 PID，再运行 Get-Process -Id 实际PID 或 tasklist | findstr 实际PID，就能准确看到占用端口的可执行文件名称。实际排障中经常会撞见已停止维护的旧版 Clash 僵尸进程、迅雷下载器、开发环境 IDE 本地预览服务或 Hyper-V 保留端口占用了代理口。

### Windows 防火墙弹窗不小心点了“取消”或“阻止”，会导致节点连上却打不开网页吗？

会。Windows Defender 防火墙或第三方安全软件一旦阻止了 verge-mihomo.exe、mihomo.exe、xray.exe 或 sing-box.exe 访问公用/专用网络，客户端图形界面虽然能打开，但内核无法建立出站隧道或无法接管本地回环流量，部分情况下甚至会阻止局域网与本地虚拟网卡通信。需要在 Windows 安全中心的防火墙入站与出站规则中删除拦截项并放行对应内核程序。

### 什么情况下必须执行 netsh winhttp reset proxy，它和修改浏览器代理有什么区别？

Windows 内部存在 WinINET 与 WinHTTP 两套独立的代理配置层。Chrome、Edge 和 IE 设置面板读取的是 WinINET 注册表；而 Windows Update、PowerShell Invoke-WebRequest、部分后台服务以及依赖系统服务栈的程序读取的是 WinHTTP。如果之前运行过系统级脚本或旧版代理把 WinHTTP 设为 127.0.0.1:7890，即使在设置界面关闭了系统代理，系统级服务与终端依然会持续超时。用管理员权限运行 netsh winhttp reset proxy 可立即将其恢复为直接连接。
