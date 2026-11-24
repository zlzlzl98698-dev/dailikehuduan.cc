---
title: HomeProxy OpenWrt 指南：原生 sing-box 与 firewall4 软路由插件
description: HomeProxy（immortalwrt/homeproxy）OpenWrt/ImmortalWrt 插件详解：基于 sing-box 与 nftables/firewall4 的轻量透明代理、节点分享链接导入及不支持 Clash YAML 的边界说明。
lastUpdated: 2026-11-23
schemaType: SoftwareApplication
appName: HomeProxy
operatingSystem: OpenWrt, ImmortalWrt
isFree: true
faq:
  - q: HomeProxy 可以直接导入 Clash YAML 订阅吗？
    a: 不可以。HomeProxy 原生基于 sing-box 与 OpenWrt UCI 配置结构构建，支持导入节点分享链接与 Base64 节点订阅并自动生成 sing-box JSON 运行配置，但不支持直接套用复杂的 Clash YAML 策略组语法。如果主力使用 Clash 订阅，请选择 Nikki（OpenWrt 24.10+）或 OpenClash。
  - q: HomeProxy 必须使用 ImmortalWrt 固件才能装吗？
    a: 虽然项目托管在 immortalwrt/homeproxy，但它同样适用于具备 firewall4（nftables）与对应版本 sing-box 依赖的官方 OpenWrt（22.03/23.05/24.10+）。不过注意不要与 fw3（iptables）老版本固件混用。
  - q: HomeProxy 相比 PassWall2 有什么优势？
    a: HomeProxy 专门面向现代 nftables/firewall4 与 sing-box 单一核心原生打造，彻底抛弃了 iptables 历史包袱，内存占用与 LuCI 响应非常轻快，界面也全面整合了 sing-box 的规则集（Rule Set）理念。
---

# HomeProxy OpenWrt 指南：原生 sing-box 与 firewall4 软路由插件

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>HomeProxy（官方仓库 <code>immortalwrt/homeproxy</code>）是一款专为现代 <strong>OpenWrt / ImmortalWrt（<code>firewall4 / nftables</code>）</strong> 打造的原生 <strong>sing-box</strong> 透明代理插件。它抛弃了传统 <code>iptables</code> 兼容包袱，内存效率极高，原生支持节点订阅链接导入、单节点调优与现代规则集分流；但需要注意它<strong>不支持直接套用 Clash YAML 复杂策略组</strong>。</p>
</div>

## 基础信息与官方来源

| 项目属性 | 核验结果（核实日期：2026-11-23） |
| --- | --- |
| **官方项目地址** | [GitHub: immortalwrt/homeproxy](https://github.com/immortalwrt/homeproxy) |
| **底层代理核心** | sing-box |
| **适用系统** | OpenWrt / ImmortalWrt（必须具备 `firewall4 / nftables` 环境） |
| **授权与费用** | 免费开源（GPL-3.0） |
| **支持订阅格式** | 节点分享链接、Base64 节点订阅、sing-box 出站参数配置 |
| **维护状态** | 活跃维护 |

## 选型边界：什么时候选择 HomeProxy？

在[OpenWrt 软路由中心](/clients/platform/openwrt/)的四大插件中，HomeProxy 最适合以下场景：
1. **硬件性能或内存适中的现代路由器**：只运行单一 `sing-box` 二进制核心，不需要同时挂起多套后端进程，在 ARM 硬路由（如 MT7981/MT7986 设备）上表现非常省内存。
2. **原生使用新版 OpenWrt / ImmortalWrt**：系统已自带 `firewall4 (nftables)`，无需像旧插件那样折腾庞大的兼容依赖。
3. **节点导向管理（非 Clash YAML 依赖）**：手里有自建的 `VLESS-Reality` / `Hysteria 2` 节点，或服务商提供通用 Base64 节点订阅，希望按自己的需求在路由器上指定“主节点 + 分流规则”。

反之，如果你的服务商只下发高度编排好的 Clash YAML 且你不想自己重新配分流规则，应优先选择 [Nikki（24.10+）](/clients/nikki/) 或 [OpenClash](/clients/openclash/)。

## 安装前检查与部署要点

通过 SSH 确认设备支持 `firewall4` 且软件源内有匹配的 `sing-box` 版本：

```sh
# 1. 验证系统存在 firewall4（必须输出 /sbin/fw4）
which fw4

# 2. 检查当前软件源中的 sing-box 版本（HomeProxy 对 sing-box 核心版本有对应要求）
opkg update
opkg info sing-box luci-app-homeproxy
```

在 ImmortalWrt 官方源或已配置相应 Feed 的 OpenWrt 固件中，直接安装 `luci-app-homeproxy` 时包管理器会自动拉取适配版本的 `sing-box` 与所需的 `kmod-nft-tproxy` 等内核模块。安装前同样务必停用路由器上已有的其他代理插件。

## 基础配置流程

1. **订阅与节点导入**：进入 **服务 → HomeProxy → 节点订阅**，填入通用 Base64 订阅 URL 并更新，解析出节点列表；也可手动添加单条分享链接或自建服务器出站参数。
2. **选择主出站节点**：在 **路由设置 → 主节点** 中指定用于境外默认出口的节点（支持配置 `URLTest` 自动测速分组）。
3. **规则分流与 DNS 配置**：
   - 利用内置的 **路由模式（如绕过中国大陆）** 或自定义 **规则集（Rule Sets / `.srs`）**，指定国内网站与局域网直连。
   - 在 **DNS 设置** 中配置本地直连服务器（国内 DoH/UDP）与远程代理 DNS 服务器，防止本地解析落入污染结果。
4. **启用与日志验证**：勾选 **启用** 后保存并应用，在主页的 **状态与日志** 面板中查看 `sing-box` 核心是否正常输出监听与转发记录，确认无配置文件校验报错。

## 常见问题（FAQ）

### HomeProxy 可以直接导入 Clash YAML 订阅吗？

不可以。HomeProxy 原生基于 `sing-box` 与 OpenWrt UCI 配置结构构建，支持导入节点分享链接与 Base64 节点订阅并自动生成 `sing-box` JSON 运行配置，但不支持直接套用复杂的 Clash YAML 策略组语法。如果主力使用 Clash 订阅，请选择 Nikki（OpenWrt 24.10+）或 OpenClash。

### HomeProxy 必须使用 ImmortalWrt 固件才能装吗？

虽然项目托管在 `immortalwrt/homeproxy`，但它同样适用于具备 `firewall4`（`nftables`）与对应版本 `sing-box` 依赖的官方 OpenWrt（22.03/23.05/24.10+）。不过注意不要与 `fw3`（`iptables`）老版本固件混用。

### HomeProxy 相比 PassWall2 有什么优势？

HomeProxy 专门面向现代 `nftables/firewall4` 与 `sing-box` 单一核心原生打造，彻底抛弃了 `iptables` 历史包袱，内存占用与 LuCI 响应非常轻快，界面也全面整合了 `sing-box` 的规则集（Rule Set）理念。
