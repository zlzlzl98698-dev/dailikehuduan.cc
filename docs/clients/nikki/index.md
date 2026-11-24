---
title: Nikki（原 MihomoTProxy）OpenWrt 24.10+ 透明代理安装指南
description: Nikki（nikkinikki-org/OpenWrt-nikki，原 MihomoTProxy）专题教程：明确 OpenWrt 24.10+ 与 nftables/firewall4 硬性要求、精简 TProxy/TUN 架构优势、配置导入与旧版系统避坑说明。
lastUpdated: 2026-11-23
schemaType: SoftwareApplication
appName: Nikki
operatingSystem: OpenWrt (24.10+)
isFree: true
faq:
  - q: 为什么我的路由器装了 OpenWrt 23.05 或 22.03，却无法安装或运行 Nikki？
    a: 因为 Nikki（原 MihomoTProxy，仓库 nikkinikki-org/OpenWrt-nikki）明确要求 OpenWrt 24.10 及以上版本。它高度依赖新版系统的 firewall4（nftables）、内核 TProxy 模块以及更新后的包架构，在 23.05 或更早版本强行安装会出现依赖缺失或规则不生效。
  - q: Nikki 和 OpenClash 都用 Mihomo 内核，为什么有人从 OpenClash 换成 Nikki？
    a: OpenClash 需要同时兼容十几年前至今的各种老旧 OpenWrt 版本与 fw3/fw4 架构，脚本体积与边界条件较多；而 Nikki 轻装上阵，只服务于 OpenWrt 24.10+ 的现代 nftables/TProxy 环境，配置文件与防火墙规则更干净透明、启动速度更快。
  - q: Nikki 支持导入 Clash 订阅吗？需要单独再安装其他核心吗？
    a: 支持直接导入标准 Clash/Mihomo YAML 订阅。它底层直接调用系统已安装的 mihomo 核心包（在官方 Feed/Release 说明中需一并安装核心包与 luci-app-nikki）。
---

# Nikki（原 MihomoTProxy）OpenWrt 24.10+ 透明代理安装指南

<div class="answer-first-box">
  <div class="answer-first-label">核心结论（Answer-First）</div>
  <p>Nikki（原名 <strong>MihomoTProxy</strong>，官方仓库 <code>nikkinikki-org/OpenWrt-nikki</code>）是专为现代 OpenWrt 打造的 Mihomo 透明代理插件。它的核心设计哲学是抛弃历史包袱、结构精简且直接依托原生 <code>nftables / TProxy</code> 实现高效转发。<strong>硬性前提：该项目明确要求 OpenWrt 24.10 及以上版本</strong>，仍在使用 OpenWrt 21.02 / 22.03 / 23.05 的路由器请继续使用 OpenClash 或先升级固件。</p>
</div>

## 基础信息与官方来源

| 项目属性 | 核验结果（核实日期：2026-11-23） |
| --- | --- |
| **官方项目地址** | [GitHub: nikkinikki-org/OpenWrt-nikki](https://github.com/nikkinikki-org/OpenWrt-nikki) |
| **曾用项目名称** | MihomoTProxy |
| **底层代理核心** | Mihomo（Clash.Meta） |
| **系统版本要求** | **OpenWrt 24.10 及以上版本（`firewall4` / `nftables`）** |
| **授权与费用** | 免费开源 |
| **支持订阅格式** | Mihomo YAML、Clash YAML |
| **维护状态** | 活跃维护 |

## 硬性前提核验：确认你的系统是 OpenWrt 24.10+

> [!IMPORTANT] 版本不兼容警告
> 如果你的软路由固件版本低于 **24.10**（例如官方 23.05.x 或各类旧版第三方打包固件），**请勿强行安装 Nikki**。强行忽略依赖安装会导致 `nftables` 规则加载失败、内网断网或核心无法拉起。

部署前请先通过 SSH 验证系统版本与包管理器类型（OpenWrt 24.10 仍普遍支持 `opkg`，而部分最新 Snapshot/24.10+ 分支逐步切换为 `apk`，安装前需核对仓库 Release 说明）：

```sh
# 1. 检查系统版本号（确认 DISTRIB_RELEASE 包含 24.10 或更高版本 / 对应 ImmortalWrt 24.10）
cat /etc/openwrt_release

# 2. 确认 firewall4 存在
which fw4

# 3. 查看剩余闪存空间
df -h /overlay
```

## Nikki 相比传统插件的架构优势

1. **原生 `nftables` 规则简洁**：不再拼接复杂的 `iptables` 链与冗余脚本，直接通过精简明确的 `nft` 表完成本地转发与 DNS 劫持，排查路由表时一目了然。
2. **完整暴露 Mihomo 原生能力**：界面划分清晰，支持直接在 LuCI 中切换 TProxy 与 TUN 混合模式、管理配置文件覆写（Mixin）、查看实时 Mihomo 日志与连接面板（支持直连 Zashboard / Metacubexd 等现代化 Web UI）。
3. **不强依赖复杂 `dnsmasq-full` 魔改流程**：现代架构下，Nikki 更多利用 Mihomo 自身强大的 DNS 监听与 `nftables` 劫持配合，大幅减少因为 `dnsmasq` 替换失败导致的断网故障。

## 部署与配置基本流程

1. **按架构下载安装包**：前往 `nikkinikki-org/OpenWrt-nikki` Releases 页面，根据 `cat /etc/openwrt_release` 输出的 `DISTRIB_ARCH` 下载对应包（通常含 `mihomo` 核心包、`nikki` 主服务包及 `luci-app-nikki` 中文界面包；官方亦提供一键安装脚本供确认源架构）。
2. **清理冲突插件**：确保此前安装的 OpenClash、PassWall2 或 HomeProxy 已被停用或卸载，防止端口 53 与 789x 系列端口冲突。
3. **导入订阅与开启 Mixin 覆写**：
   - 登录 OpenWrt 后台，进入 **服务 → Nikki → 配置文件** 添加远程 Clash/Mihomo 订阅 URL，执行更新拉取。
   - 如需统一强制覆盖订阅内的 DNS 或嗅探参数，可在 **混入配置（Mixin）** 页面开启自定义覆盖（例如统一启用 `sniffer` 与合规 DNS 上游），无需每次手动修改原始订阅。
4. **启动并打开面板验证**：回到 **基本设置** 开启服务并应用，点击打开内置的 Web 控制面板（如 Metacubexd/Yacd），测试各节点延迟并观察“连接（Connections）”标签页内网设备流量是否已按预期分流。

## 常见问题（FAQ）

### 为什么我的路由器装了 OpenWrt 23.05 或 22.03，却无法安装或运行 Nikki？

因为 Nikki（原 MihomoTProxy，仓库 `nikkinikki-org/OpenWrt-nikki`）明确要求 OpenWrt 24.10 及以上版本。它高度依赖新版系统的 `firewall4`（`nftables`）、内核 TProxy 模块以及更新后的包架构，在 23.05 或更早版本强行安装会出现依赖缺失或规则不生效。

### Nikki 和 OpenClash 都用 Mihomo 内核，为什么有人从 OpenClash 换成 Nikki？

OpenClash 需要同时兼容十几年前至今的各种老旧 OpenWrt 版本与 `fw3/fw4` 架构，脚本体积与边界条件较多；而 Nikki 轻装上阵，只服务于 OpenWrt 24.10+ 的现代 `nftables/TProxy` 环境，配置文件与防火墙规则更干净透明、启动速度更快。

### Nikki 支持导入 Clash 订阅吗？需要单独再安装其他核心吗？

支持直接导入标准 Clash/Mihomo YAML 订阅。它底层直接调用系统已安装的 `mihomo` 核心包（在官方 Feed/Release 说明中需一并安装核心包与 `luci-app-nikki`）。
