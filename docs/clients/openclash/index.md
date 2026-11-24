---
title: OpenClash 软路由安装、依赖排查与透明代理配置教程
description: OpenClash（vernesong/OpenClash）OpenWrt 插件部署全流程：详解架构与 fw3/fw4 依赖（dnsmasq-full、kmod-tun）、Fake-IP vs Redir-Host 选择、订阅导入及禁用双插件冲突规则。
lastUpdated: 2026-11-23
schemaType: SoftwareApplication
appName: OpenClash
operatingSystem: OpenWrt
isFree: true
faq:
  - q: 安装 OpenClash 时为什么总提示缺少 dnsmasq-full 或 kmod-tun 依赖？
    a: 官方 OpenWrt 固件默认内置精简版 `dnsmasq`，不支持 ipset/nftset 域名分流集，而 TUN 模式依赖内核虚拟网卡驱动 `kmod-tun`。安装 OpenClash 前必须先移除 `dnsmasq` 并安装 `dnsmasq-full` 及对应防火墙（fw3 或 fw4）所需的内核依赖包。
  - q: OpenClash 应该选 Fake-IP 模式还是 Redir-Host 模式？
    a: 绝大多数家庭与游戏场景推荐 Fake-IP（增强）模式，响应更快、对路由器 CPU 压力更低且能避免大部分 DNS 污染；但如果内网存在需要获取真实公网 IP 的设备、部分老旧监控或本地 BT/PT 严格校验端，可改用 Redir-Host（兼容）模式，或将特定域名加入 Fake-IP 过滤列表。
  - q: 路由器启动 OpenClash 后所有设备彻底断网怎么办？
    a: 首先检查是否同时开启了 PassWall2、HomeProxy 等其他透明代理插件；其次核对本机是否误改了网关 IP 或 DHCP DNS；最后可在 OpenClash 日志页面查看 Mihomo 核心是否启动报错（如核心二进制缺失或订阅 YAML 语法不合法）。
---

# OpenClash 软路由安装、依赖排查与透明代理配置教程

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>OpenClash（官方仓库 <code>vernesong/OpenClash</code>）是 OpenWrt 软路由生态使用最广泛的 LuCI 图形化透明代理插件，底层依托 <strong>Mihomo（Clash.Meta）</strong> 核心，同时兼容旧版 <code>fw3/iptables</code> 与新版 <code>fw4/nftables</code> 环境。成功部署的关键前提有三点：<strong>补全 <code>dnsmasq-full</code> 与内核依赖、提前核对芯片架构并下载 Mihomo 核心、严禁与 PassWall2 等同类插件同时启用</strong>。</p>
</div>

## 基础信息与官方来源

| 项目属性 | 核验结果（核实日期：2026-11-23） |
| --- | --- |
| **官方项目地址** | [GitHub: vernesong/OpenClash](https://github.com/vernesong/OpenClash) |
| **底层代理内核** | Mihomo（Clash.Meta） |
| **适用系统** | OpenWrt / ImmortalWrt（x86_64 / aarch64 / arm / mips） |
| **授权与费用** | 免费开源（GPL-3.0） |
| **支持订阅格式** | Clash YAML、Mihomo YAML |
| **维护状态** | 活跃维护 |

## 安装前必做：检查 OpenWrt 架构与系统依赖

在安装 `.ipk` 之前，SSH 登录 OpenWrt 执行以下环境核对与依赖补齐（以常见的 `fw4/nftables` OpenWrt 22.03/23.05/24.10 为例）：

```sh
# 1. 确认系统版本、架构及防火墙类型
cat /etc/openwrt_release
which fw4 || which fw3

# 2. 更新软件源并安装常见依赖（注意：移除 dnsmasq 替换为 dnsmasq-full 会短暂中断 DNS 解析，建议先确保连贯执行）
opkg update
opkg remove dnsmasq && opkg install dnsmasq-full
opkg install coreutils-nohup bash curl ca-certificates ipset ip-full libcap libcap-bin ruby ruby-yaml kmod-tun kmod-inet-diag unzip kmod-nft-tproxy
```

*(注：若你的固件仍使用旧版 `fw3/iptables`（如 OpenWrt 21.02），则需安装 `iptables-mod-tproxy` 与 `iptables-mod-extra` 替代 `kmod-nft-tproxy`，具体依赖列表以 `vernesong/OpenClash` 官方 Wiki 为准。)*

安装主插件 `.ipk` 后，进入 OpenWrt 管理页 **服务 → OpenClash**；若提示“内核未安装”，可在 **插件设置 → 版本更新** 中在线更新 Meta 内核，或手动将对应 CPU 架构的 `mihomo` 二进制上传至 `/etc/openclash/core/clash_meta` 并赋予 `chmod +x` 权限。

## 核心模式配置与订阅导入

1. **导入订阅**：进入 **配置订阅 → 添加**，填写配置文件名与服务商提供的 **Clash 订阅链接**，勾选“在线订阅转换”仅在手头无 Clash 格式链接时才需考虑，否则建议保持关闭以使用原汁原味的 Mihomo YAML。点击 **保存配置** 后再点击 **更新配置**。
2. **运行模式选择（插件设置 → 模式设置）**：
   - **Fake-IP（增强）**：**多数家庭首选**。本地 DNS 请求立即返回 `198.18.0.0/16` 虚拟地址，减少一次本地等待并天然防止 DNS 污染，支持直接接管全部内网终端与游戏主机（Switch/PS5）。
   - **Redir-Host（兼容）**：适合局域网有 NAS 反向代理、严格内网域名校验或遇到某软件与 Fake-IP 冲突的场景，需开启 **本地 DNS 劫持（使用 Dnsmasq 转发）** 并妥善配置覆写 DNS。
3. **绕过内网与大陆流量**：确认 **插件设置 → 流量控制** 中勾选了 **绕过中国大陆 IP**（或使用配置自带完善的 GeoIP/GeoSite 规则），确保局域网 NAS、打印机及国内视频网站不经过外网代理。

## 常见故障与排障红线

- **绝对禁止双插件并发**：如果路由器内同时安装了 PassWall2、HomeProxy 或 Nikki，启用 OpenClash 前必须先彻底停用其他插件，否则端口 53 劫持与防火墙链必定死锁。更多系统选型差异见[OpenWrt 软路由中心](/clients/platform/openwrt/)。
- **闪存空间不足导致配置丢失**：小闪存（16MB/32MB）硬路由无法容纳完整插件 + 内核 + Geo 数据库，安装前请先运行 `df -h /overlay` 确认剩余空间充足。
- **开启后内网部分软件打不开或 DNS 泄漏**：检查 OpenClash 是否正确开启了 **自定义上游 DNS 服务器** 并关闭了 ISP 下发的 IPv6 DNS 广播（防止局域网设备直接通过 ISP 的 IPv6 DNS 绕过软路由分流），参考[DNS 错误与泄漏检测](/troubleshooting/dns/)。

## 常见问题（FAQ）

### 安装 OpenClash 时为什么总提示缺少 dnsmasq-full 或 kmod-tun 依赖？

官方 OpenWrt 固件默认内置精简版 `dnsmasq`，不支持 ipset/nftset 域名分流集，而 TUN 模式依赖内核虚拟网卡驱动 `kmod-tun`。安装 OpenClash 前必须先移除 `dnsmasq` 并安装 `dnsmasq-full` 及对应防火墙（fw3 或 fw4）所需的内核依赖包。

### OpenClash 应该选 Fake-IP 模式还是 Redir-Host 模式？

绝大多数家庭与游戏场景推荐 Fake-IP（增强）模式，响应更快、对路由器 CPU 压力更低且能避免大部分 DNS 污染；但如果内网存在需要获取真实公网 IP 的设备、部分老旧监控或本地 BT/PT 严格校验端，可改用 Redir-Host（兼容）模式，或将特定域名加入 Fake-IP 过滤列表。

### 路由器启动 OpenClash 后所有设备彻底断网怎么办？

首先检查是否同时开启了 PassWall2、HomeProxy 等其他透明代理插件；其次核对本机是否误改了网关 IP 或 DHCP DNS；最后可在 OpenClash 日志页面查看 Mihomo 核心是否启动报错（如核心二进制缺失或订阅 YAML 语法不合法）。
