---
title: OpenWrt 软路由中心：系统版本、CPU 架构与 fw3/fw4 插件选型
description: OpenWrt / ImmortalWrt 软路由代理插件权威选型指南：对比 OpenClash、PassWall2、Nikki（明确要求 OpenWrt 24.10+）与 HomeProxy，详解安装前系统版本、CPU 架构、nftables/fw4 及闪存容量核查命令。
lastUpdated: 2026-11-23
schemaType: TechArticle
faq:
  - q: 为什么在 OpenWrt 22.03 或 23.05 上安装 Nikki（MihomoTProxy）会失败或无法启动透明代理？
    a: 因为 Nikki（原 MihomoTProxy，仓库 nikkinikki-org/OpenWrt-nikki）明确要求 OpenWrt 24.10 及以上版本，且依赖新版的 nftables/firewall4 环境及对应版本的内核模块。旧版本系统应选择 OpenClash 或 PassWall2。
  - q: 安装 OpenWrt 插件前，怎么确认路由器的 CPU 架构和防火墙版本（fw3 vs fw4）？
    a: SSH 登录路由器后，运行 `cat /etc/openwrt_release` 查看版本号与 `DISTRIB_ARCH`（CPU 架构）；运行 `which fw4` 或 `opkg list-installed | grep firewall` 即可确认使用的是传统 iptables（fw3）还是现代 nftables（fw4）。
  - q: OpenWrt 上可以同时启用 OpenClash 和 PassWall2 吗？
    a: 绝对不能同时开启！两个透明代理插件都会接管 DNS（53 端口重定向）与防火墙转发规则（iptables/nftables），同时运行必然导致流量环路、DNS 彻底瘫痪甚至路由器卡死。同一时间只能启用其中一个插件。
---

# OpenWrt 软路由中心：版本、架构与 fw3/fw4 插件选型

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>在 OpenWrt / ImmortalWrt 路由器上部署透明代理插件，绝不能直接盲目套用安装包，必须先 SSH 核对三项底层前提：<strong>OpenWrt 主版本号、CPU 指令集架构、防火墙引擎（<code>fw3/iptables</code> vs <code>fw4/nftables</code>）与剩余可用闪存</strong>。通用兼容首选 <strong>OpenClash</strong>；习惯节点列表与轻量分流可选 <strong>PassWall2</strong>；若路由器运行 <strong>OpenWrt 24.10 及以上版本</strong>，可优先考虑精简现代的 <strong>Nikki（原 MihomoTProxy）</strong> 或基于 sing-box 的 <strong>HomeProxy</strong>。</p>
</div>

## OpenWrt 四大主流插件对比矩阵

| 插件名称 | 底层核心 | 系统版本与防火墙要求 | 适用场景与特点 | 详情教程 |
| --- | --- | --- | --- | --- |
| **OpenClash** | Mihomo | 兼容 `fw3` (21.02) 与 `fw4` (22.03+) | 生态最成熟、支持 Fake-IP/Redir-Host 与订阅直接拉取，需注意依赖包完整 | [OpenClash 教程](/clients/openclash/) |
| **PassWall2** | sing-box / Xray | 兼容 `fw3` 与 `fw4` | 面向单节点、Base64 订阅与直观分流规则，硬件要求相对适中 | [PassWall2 教程](/clients/passwall2/) |
| **Nikki** *(原 MihomoTProxy)* | Mihomo | **明确要求 OpenWrt 24.10+** (`fw4`) | 结构极简清晰、原生基于 `nftables` TProxy/TUN，不兼容 23.05 及更早系统 | [Nikki 教程](/clients/nikki/) |
| **HomeProxy** | sing-box | `fw4` / `nftables`（OpenWrt / ImmortalWrt） | 原生契合新版 OpenWrt 架构，内存与规则效率高，不支持 Clash YAML | [HomeProxy 教程](/clients/homeproxy/) |

## 第一步：SSH 登录并核对路由器环境（必做）

在下载 `.ipk` 或 `.apk`（OpenWrt 24.10 SNAPSHOT/新包管理器）文件之前，请通过 SSH 连接软路由并执行以下核验命令：

```sh
# 1. 查看系统发行版本、代号与 CPU 架构（例如 x86_64、aarch64_cortex-a53、mipsel_24kc）
cat /etc/openwrt_release

# 2. 确认防火墙架构（有输出 /sbin/fw4 表示 firewall4 / nftables；否则多为旧版 fw3 / iptables）
which fw4 || which fw3

# 3. 核查剩余可用存储空间（overlay 至少预留 30MB–60MB 以上再装多核心插件）
df -h /overlay

# 4. 检查 DNS 组件（OpenClash/PassWall 通常需要 dnsmasq-full 替换精简版 dnsmasq）
opkg list-installed | grep dnsmasq
```

## 第二步：避开软路由部署的三大典型坑

### 1. 严格遵守系统版本约束（特别是 Nikki）
- **OpenWrt 21.02 及更早版本**：仍处于 `firewall3`（iptables）时代，仅可考虑适配旧环境的 OpenClash 或 PassWall2，且老旧固件往往伴随内核模块缺失问题。
- **OpenWrt 22.03 / 23.05**：已全面切换至 `firewall4`（nftables），但核心与包版本尚未达到 **Nikki** 要求。
- **OpenWrt 24.10 及以上**：同时支持 **Nikki**、**HomeProxy**、**OpenClash** 与 **PassWall2**；此外请注意 OpenWrt 24.10+ 在部分分支及后续体系中向 `apk` 包格式演进的兼容性说明，下载插件时需对应仓库说明选择 `.ipk` 或新包格式。

### 2. 硬路由闪存容量不足（Overlay 写满变砖/无法保存配置）
很多百元级硬路由闪存只有 16MB 或 32MB，强行安装包含 Xray + sing-box + Mihomo + GeoIP/GeoSite 数据库的插件会直接撑爆 `/overlay` 导致路由器配置无法保存或重启失效。低闪存硬路由建议精简核心（如单装一个核心，或仅保留客户端在 PC/手机运行），软路由 x86/ARM 盒子（建议 ≥ 128MB 可用空间与 ≥ 512MB 内存）则游刃有余。

### 3. 严禁多款透明代理插件同时启用
无论你在固件里预装了多少插件，**同一时刻只能启用其中一个**。如要从 OpenClash 切换到 Nikki 或 PassWall2，必须先在原插件界面点击“停用”并确认重启防火墙或释放 53 端口劫持后，再启动另一个插件，否则内网所有设备都将断网。

## 常见问题（FAQ）

### 为什么在 OpenWrt 22.03 或 23.05 上安装 Nikki（MihomoTProxy）会失败或无法启动透明代理？

因为 Nikki（原 MihomoTProxy，仓库 `nikkinikki-org/OpenWrt-nikki`）明确要求 OpenWrt 24.10 及以上版本，且依赖新版的 `nftables`/`firewall4` 环境及对应版本的内核模块。旧版本系统应选择 OpenClash 或 PassWall2。

### 安装 OpenWrt 插件前，怎么确认路由器的 CPU 架构和防火墙版本（fw3 vs fw4）？

SSH 登录路由器后，运行 `cat /etc/openwrt_release` 查看版本号与 `DISTRIB_ARCH`（CPU 架构）；运行 `which fw4` 或 `opkg list-installed | grep firewall` 即可确认使用的是传统 iptables（fw3）还是现代 nftables（fw4）。

### OpenWrt 上可以同时启用 OpenClash 和 PassWall2 吗？

绝对不能同时开启！两个透明代理插件都会接管 DNS（53 端口重定向）与防火墙转发规则（iptables/nftables），同时运行必然导致流量环路、DNS 彻底瘫痪甚至路由器卡死。同一时间只能启用其中一个插件。
