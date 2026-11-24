<script setup lang="ts">
import { ref, computed } from 'vue'

const os = ref<'windows' | 'macos' | 'android' | 'ios' | 'openwrt'>('windows')
const client = ref<string>('clash-verge-rev')
const symptom = ref<'timeout' | 'subscription' | 'disconnected' | 'dns' | 'startup' | 'tun'>('timeout')
const netState = ref<'normal' | 'restricted'>('normal')
const subState = ref<'valid' | 'unknown'>('valid')

interface DiagnosisPlan {
  title: string
  targetGuide: string
  checks: string[]
  commands: string[]
  expectedResult: string
}

const diagnosis = computed<DiagnosisPlan>(() => {
  const osTimeHint =
    os.value === 'windows'
      ? '打开 Windows「设置 → 时间和语言 → 立即同步」，确保本地误差 < 30 秒。'
      : os.value === 'macos'
      ? '确保 macOS 已开启「自动设置日期与时间」，或终端执行 `sntp -sS time.apple.com`。'
      : '确认手机/路由器系统时间与网络时间自动同步（时间偏差 > 90 秒会直接导致 VLESS/TLS 握手失败）。'

  switch (symptom.value) {
    case 'timeout':
      return {
        title: '节点全部超时 / 真连接测试 -1ms',
        targetGuide: '/troubleshooting/timeout/',
        checks: [
          osTimeHint,
          subState.value === 'unknown'
            ? '先在机场控制台核实套餐是否过期或当月流量已用尽。'
            : '更新一次订阅并检查节点列表是否仍为旧域名或已下线节点。',
          netState.value === 'restricted'
            ? '当前处于校园网/企业内网/受限环境，尝试关闭 IPv6 或改用 443 端口 / Reality 节点测试，排查上游 UDP 阻断。'
            : '临时关闭同类 VPN、加速器或安全软件网卡过滤，避免多代理链式转发死循环。',
        ],
        commands:
          os.value === 'windows'
            ? ['w32tm /resync', 'curl -I https://www.gstatic.com/generate_204']
            : ['date -u', 'curl -I https://www.gstatic.com/generate_204'],
        expectedResult: '至少 1 个落地节点返回 `204 No Content` 或延迟测试恢复为 20–300ms 区间。',
      }
    case 'subscription':
      return {
        title: '订阅拉取失败 / 返回 200+0 字节 / 格式解析报错',
        targetGuide: '/troubleshooting/subscription/',
        checks: [
          '拉取订阅前先暂时关闭当前系统代理或 TUN 模式（防止旧无效节点劫持订阅域名本身）。',
          `核对客户端（${client.value}）所需订阅格式：Mihomo 系需 YAML，v2rayNG 需 Base64，sing-box 原生需 JSON。`,
          '若出现 200 状态码但 0 字节，通常是服务端 User-Agent 识别限制或订阅地址参数被截断。',
        ],
        commands: ['# 切勿将含密钥的完整订阅链接粘贴给任何第三方网页', 'curl -A "clash-verge/v2.0" -I "<你的订阅域名首页仅测试连通性>"'],
        expectedResult: '客户端配置列表新增或覆盖出正确节点数量，且能看到剩余流量与到期时间头信息。',
      }
    case 'disconnected':
      return {
        title: '能测出延迟但网页打不开 / 频繁断线',
        targetGuide: '/troubleshooting/disconnected/',
        checks: [
          '检查系统代理端口（如 7890 / 7897 / 10808）是否与浏览器扩展（SwitchyOmega 等）冲突。',
          os.value === 'android' || os.value === 'ios'
            ? '移动端关闭系统省电策略对客户端的后台限制，Android 开启通知栏常驻保活。'
            : '检查代理模式是否误设为 Direct（直连）或被 Windows/macOS 系统休眠重置代理。',
          '核实品牌套餐是否限制同时在线设备数。',
        ],
        commands:
          os.value === 'windows'
            ? ['netstat -ano | findstr 7897']
            : ['lsof -i :7897'],
        expectedResult: '本地监听端口仅被当前代理客户端占用，直连与代理分流规则可正常命中。',
      }
    case 'dns':
      return {
        title: 'DNS 解析失败 / 无法访问内网域名 / IPv6 泄漏',
        targetGuide: '/troubleshooting/dns/',
        checks: [
          '若开启 Fake-IP 模式后关闭客户端未正确退出，会残留 `198.18.0.0/16` DNS 缓存，需刷新本地 DNS 缓存。',
          '内网 OA、路由器管理页（`.local` / `192.168.*`）需加入 `fake-ip-filter` 或 `skip-domain`。',
          '若本地宽带无稳定 IPv6 而节点开启了 IPv6 解析，建议先关闭客户端 IPv6 或配置 `ipv6: false`。',
        ],
        commands:
          os.value === 'windows'
            ? ['ipconfig /flushdns', 'nslookup www.baidu.com']
            : ['dscacheutil -flushcache 2>/dev/null || sudo resolvectl flush-caches'],
        expectedResult: '国内域名快速解析为国内 CDN IP，内网地址直连可访，无 Fake-IP 残余污染。',
      }
    case 'startup':
      return {
        title: '客户端无法启动 / 白屏 / 内核报错退出',
        targetGuide: '/troubleshooting/startup/',
        checks: [
          os.value === 'windows'
            ? 'Clash Verge Rev 等 Tauri 应用依赖 Microsoft Edge WebView2 Runtime，缺失会导致白屏或闪退。'
            : os.value === 'macos'
            ? 'macOS 若提示“已损坏”或无法验证开发者，先核对下载来源是否为官方 GitHub Release 与对应芯片架构（arm64 vs x64）。'
            : '检查杀毒软件是否误杀 mihomo / xray 核心可执行文件。',
          '排查配置文件（YAML/JSON）是否存在缩进错误或重复端口占用（如 7890/9090 被残留进程占用）。',
        ],
        commands:
          os.value === 'windows'
            ? ['tasklist | findstr mihomo']
            : ['ps aux | grep -E "mihomo|sing-box|xray"'],
        expectedResult: 'GUI 界面正常加载且核心进程状态灯显示 Running。',
      }
    default:
      return {
        title: 'TUN 虚拟网卡与系统代理 / WSL2 / Docker 冲突',
        targetGuide: '/troubleshooting/tun/',
        checks: [
          '不要同时长期开启“另一款 VPN / 游戏加速器”与本地客户端 TUN 模式，两者抢占默认路由必断网。',
          'Windows 用户使用 Clash Verge Rev 开启 TUN 前需先安装 Service Mode（服务模式）或以管理员权限运行。',
          'WSL2 / Docker Desktop 若因 TUN 导致无网，需开启 `auto-route` 排除虚拟交换机网段或使用 WSL mirrored 网络模式。',
        ],
        commands:
          os.value === 'windows'
            ? ['route print -4']
            : ['ip route show'],
        expectedResult: '系统路由表出现独立虚拟网卡（如 Meta / singbox_tun），终端 CLI 与 Docker 流量均按规则正常路由。',
      }
  }
})
</script>

<template>
  <section class="wizard diw-card">
    <div class="wizard__head">
      <span class="diw-badge diw-badge--blue">纯本地诊断交互 · 不收集任何订阅链接或密钥</span>
      <h3 class="wizard__title">按问题开始：5 秒定位客户端故障分支</h3>
    </div>

    <div class="wizard__grid">
      <label class="wizard__field">
        <span>1. 操作系统</span>
        <select v-model="os">
          <option value="windows">Windows 10 / 11</option>
          <option value="macos">macOS (Apple Silicon / Intel)</option>
          <option value="android">Android 安卓</option>
          <option value="ios">iOS / iPadOS</option>
          <option value="openwrt">OpenWrt 软路由</option>
        </select>
      </label>

      <label class="wizard__field">
        <span>2. 当前客户端</span>
        <select v-model="client">
          <option value="clash-verge-rev">Clash Verge Rev / FlClash</option>
          <option value="v2rayn">v2rayN / v2rayNG</option>
          <option value="shadowrocket">Shadowrocket / Stash</option>
          <option value="sing-box">Hiddify / Karing / sing-box</option>
          <option value="openwrt-plugin">OpenClash / PassWall2 / Nikki</option>
        </select>
      </label>

      <label class="wizard__field">
        <span>3. 核心报错症状</span>
        <select v-model="symptom">
          <option value="timeout">节点全部超时 / 延迟 -1ms</option>
          <option value="subscription">订阅拉取失败 / 200+0 字节</option>
          <option value="disconnected">能测速但网页打不开 / 频繁断线</option>
          <option value="dns">DNS 错误 / 域名解析异常 / 泄漏</option>
          <option value="startup">客户端打不开 / 白屏 / 内核异常</option>
          <option value="tun">TUN 模式断网 / WSL2 或游戏冲突</option>
        </select>
      </label>

      <label class="wizard__field">
        <span>4. 本地网络与订阅状态</span>
        <div class="wizard__subselects">
          <select v-model="netState" aria-label="本地网络状态">
            <option value="normal">家用宽带 / 5G 正常</option>
            <option value="restricted">校园网 / 公司内网 / 防火墙严格</option>
          </select>
          <select v-model="subState" aria-label="订阅状态">
            <option value="valid">套餐未到期且有余量</option>
            <option value="unknown">未确认是否过期或超设备数</option>
          </select>
        </div>
      </label>
    </div>

    <div class="wizard__output">
      <div class="wizard__out-head">
        <strong>建议排查路径：{{ diagnosis.title }}</strong>
        <a :href="diagnosis.targetGuide" class="wizard__guide-link">打开完整图文排障手册 →</a>
      </div>
      <ol class="wizard__steps">
        <li v-for="(chk, idx) in diagnosis.checks" :key="idx">{{ chk }}</li>
      </ol>
      <div class="wizard__cmd-box">
        <div class="wizard__cmd-label">可复制验证命令：</div>
        <pre><code>{{ diagnosis.commands.join('\n') }}</code></pre>
      </div>
      <div class="wizard__expected">
        <strong>预期验证结果：</strong>{{ diagnosis.expectedResult }}
      </div>
    </div>
  </section>
</template>

<style scoped>
.wizard {
  margin: 1.25rem 0;
  border-left: 4px solid var(--diw-accent-teal);
}

.wizard__head {
  margin-bottom: 0.9rem;
}

.wizard__title {
  margin: 0.4rem 0 0;
  font-size: 1.12rem;
}

.wizard__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.wizard__field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.wizard__field select {
  padding: 0.48rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--diw-border-strong);
  background: var(--diw-surface);
  color: var(--vp-c-text-1);
  font-size: 0.84rem;
}

.wizard__subselects {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.45rem;
}

.wizard__output {
  background: var(--diw-surface-alt);
  border: 1px solid var(--diw-border);
  border-radius: 10px;
  padding: 0.95rem 1.05rem;
}

.wizard__out-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}

.wizard__guide-link {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.wizard__steps {
  margin: 0.4rem 0 0.75rem;
  padding-left: 1.25rem;
  font-size: 0.86rem;
  line-height: 1.65;
}

.wizard__cmd-box {
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  margin-bottom: 0.65rem;
}

.wizard__cmd-label {
  font-size: 0.74rem;
  color: #94a3b8;
  margin-bottom: 0.25rem;
}

.wizard__cmd-box pre {
  margin: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 0.8rem;
  white-space: pre-wrap;
}

.wizard__expected {
  font-size: 0.83rem;
  color: var(--diw-accent-teal);
}

@media (max-width: 720px) {
  .wizard__grid,
  .wizard__subselects {
    grid-template-columns: 1fr;
  }
}
</style>
