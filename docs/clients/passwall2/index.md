---
title: PassWall2 OpenWrt 安装、多核心配置与闪存空间控制指南
description: PassWall2（xiaorouji/openwrt-passwall2）OpenWrt 软路由部署教程：支持 sing-box 与 Xray 核心、节点订阅与直观分流规则配置、硬件闪存容量排查及与 OpenClash 选型对比。
lastUpdated: 2026-11-23
schemaType: SoftwareApplication
appName: PassWall2
operatingSystem: OpenWrt
isFree: true
faq:
  - q: PassWall2 和 OpenClash 的主要区别是什么？我该选哪个？
    a: OpenClash 使用 Mihomo 核心，直接读取整套 Clash YAML 配置与策略组；PassWall2 主打 sing-box / Xray 后端，直接导入通用节点订阅（Base64/分享链接）并在插件界面中以极直观的“节点列表 + 规则分流动作”管理，适合习惯选定单节点或自建节点混合机场节点的用户。
  - q: 为什么小闪存路由器安装 PassWall2 会失败或提示空间不足？
    a: PassWall2 虽然界面简洁，但同时依赖 Xray-core 与 sing-box 等核心二进制及 GeoIP/GeoSite 规则数据库，全套安装往往需要 25MB–45MB 以上可用空间。16MB/32MB 闪存的硬路由若未外接 U 盘扩容或精简核心，极易撑爆 /overlay。
  - q: PassWall2 可以直接导入 Clash YAML 订阅链接吗？
    a: PassWall2 主要读取 Base64 / V2Ray / Xray 等通用节点列表订阅，不支持完整解析复杂的 Clash 策略组和自定义脚本规则。如果你的服务商只提供 Clash 订阅，建议直接用 OpenClash 或 Nikki。
---

# PassWall2 OpenWrt 安装、多核心配置与闪存空间控制指南

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>PassWall2（官方仓库 <code>xiaorouji/openwrt-passwall2</code>）是 OpenWrt 软路由端主打“单节点直选与直观规则分流”的开源透明代理插件，主要依托 <strong>sing-box</strong> 与 <strong>Xray-core</strong> 作为转发引擎。它非常适合手里既有机场通用 Base64 订阅、又有自建 VPS 节点的用户；但部署前务必检查路由器剩余闪存空间，避免同时安装多个庞大核心撑爆存储。</p>
</div>

## 基础信息与官方来源

| 项目属性 | 核验结果（核实日期：2026-11-23） |
| --- | --- |
| **官方项目地址** | [GitHub: xiaorouji/openwrt-passwall2](https://github.com/xiaorouji/openwrt-passwall2) |
| **底层代理核心** | 多核心（主要为 sing-box / Xray-core，可选配合其他组件） |
| **适用系统** | OpenWrt 各主流架构（`x86_64`、`aarch64`、`arm`、`mips` 等） |
| **授权与费用** | 免费开源 |
| **支持订阅格式** | Base64 节点订阅、单条分享链接（`vless://` / `vmess://` / `trojan://` / `ss://` / `hysteria2://`） |
| **维护状态** | 活跃维护 |

## 部署前硬性检查：剩余存储与防火墙

PassWall2 之所以在部分硬路由上容易“安装一半报错”，核心原因在于 `xray-core` 与 `sing-box` 两个编译后的 Go 二进制体积较大。在安装前请务必通过 SSH 检查：

```sh
# 1. 查看系统架构与版本
cat /etc/openwrt_release

# 2. 检查 /overlay 剩余空间（建议至少保留 40MB 以上再同时装 sing-box + xray + geoip/geosite）
df -h /overlay

# 3. 检查防火墙引擎（fw4 对应 nftables，fw3 对应 iptables）
which fw4 || which fw3
```

**闪存精简技巧**：如果可用空间紧张（例如仅 20MB–30MB），在自行编译或选包时只保留 `sing-box` 单个核心即可覆盖 `VLESS-Reality`、`Hysteria 2`、`TUIC`、`VMess`、`Trojan` 与 `Shadowsocks` 全协议，无需同时安装 `xray-core`。

## 快速配置流程（从订阅到内网分流）

1. **导入节点订阅**：
   - 进入 LuCI 面板 **服务 → PassWall 2 → 节点订阅**。
   - 点击 **添加**，粘贴机场面板复制的 **通用订阅 / Base64 链接**（注意不要填 Clash YAML 链接），填写备注并保存，随后点击 **手动订阅** 拉取全部节点。
2. **启用默认分流规则（重要）**：
   - PassWall2 的默认规则逻辑建立在“分流节点（Shunt）”与“规则列表”之上。
   - 检查 **规则管理** 中的 `GeoIP` 与 `GeoSite` 规则数据库是否已下载完整。
   - 初学者可直接启用内置的 **中国列表直连（China Direct）** 与默认代理规则，确保国内网站与局域网 IP 走 `DIRECT`，境外流量走选定节点或分流组。
3. **指定客户端与 DNS 模式**：
   - 在 **基本设置 → DNS** 中配置分流解析（通常设置国内域名走国内公共 DNS 或本地 ISP，海外域名通过代理节点或 `1.1.1.1`/`8.8.8.8` DoH 解析），防止 DNS 污染与泄漏。
   - 返回基本设置开启 **主开关** 并 **保存并应用**。
4. **验证生效**：在 PassWall2 主页状态栏点击自带连通性检查按钮（如检测 Google / Baidu 访问状态），确认国内延迟正常且境外返回通畅。

## 注意事项与冲突排查

- **绝对不要与 OpenClash 同时启用**：两个插件都会写入底层的防火墙劫持链与 `dnsmasq` 上游配置，切换前必须彻底停用旧插件。详见[OpenWrt 软路由中心](/clients/platform/openwrt/)。
- **局域网部分设备不需要代理**：如果家里电视盒子或访客设备不想走代理，可在 **访问控制（ACL）** 中按内网 IP 或 MAC 地址将其设为“不走代理”。

## 常见问题（FAQ）

### PassWall2 和 OpenClash 的主要区别是什么？我该选哪个？

OpenClash 使用 Mihomo 核心，直接读取整套 Clash YAML 配置与策略组；PassWall2 主打 sing-box / Xray 后端，直接导入通用节点订阅（Base64/分享链接）并在插件界面中以极直观的“节点列表 + 规则分流动作”管理，适合习惯选定单节点或自建节点混合机场节点的用户。

### 为什么小闪存路由器安装 PassWall2 会失败或提示空间不足？

PassWall2 虽然界面简洁，但同时依赖 Xray-core 与 sing-box 等核心二进制及 GeoIP/GeoSite 规则数据库，全套安装往往需要 25MB–45MB 以上可用空间。16MB/32MB 闪存的硬路由若未外接 U 盘扩容或精简核心，极易撑爆 `/overlay`。

### PassWall2 可以直接导入 Clash YAML 订阅链接吗？

PassWall2 主要读取 Base64 / V2Ray / Xray 等通用节点列表订阅，不支持完整解析复杂的 Clash 策略组和自定义脚本规则。如果你的服务商只提供 Clash 订阅，建议直接用 OpenClash 或 Nikki。
