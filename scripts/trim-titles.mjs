import fs from 'fs';

const replacements = [
  {
    file: 'docs/ai-streaming/chatgpt/index.md',
    from: 'title: "ChatGPT 机场与节点兼容性指南：地区白名单、Cloudflare 1020/403 降智排查与分流规则"',
    to: 'title: "ChatGPT 机场节点兼容指南：白名单、1020/403 降智排查与分流"'
  },
  {
    file: 'docs/ai-streaming/index.md',
    from: 'title: "AI 与流媒体兼容性总览：ChatGPT、Claude、Gemini、Netflix、YouTube 与原生 IP 排查指南"',
    to: 'title: "AI 与流媒体节点兼容总览：ChatGPT、Netflix 与原生 IP 排查"'
  },
  {
    file: 'docs/ai-streaming/youtube/index.md',
    from: 'title: "YouTube 加速与 4K/8K 缓冲诊断：Stats for nerds 解读、QUIC 回落、送中修复与倍率预警"',
    to: 'title: "YouTube 4K/8K 缓冲诊断：Stats 解读、送中修复与倍率预警"'
  },
  {
    file: 'docs/clients/index.md',
    from: 'title: "客户端软件总览：Clash Verge Rev、v2rayN、Shadowrocket 与 Mihomo/sing-box 全平台选型指南"',
    to: 'title: "代理客户端全平台选型指南：Clash、v2rayN 与小火箭对比"'
  },
  {
    file: 'docs/clients/platform/macos/index.md',
    from: 'title: "macOS 客户端中心：Apple Silicon (arm64) 与 Intel (x64) 安装包区分"',
    to: 'title: "macOS 代理客户端中心：M系列芯片与 Intel 版本安装区分"'
  },
  {
    file: 'docs/reviews/edgenova/index.md',
    from: 'title: "边缘节点 EdgeNova 深度评测与历史资料审计：多线路自动分配定位、6档套餐精算与性能核验（2026）"',
    to: 'title: "EdgeNova 深度评测：多线路分配、6档套餐精算与性能核验（2026）"'
  },
  {
    file: 'docs/reviews/guangsuyun/index.md',
    from: 'title: "光速云（GSY）万字深度评测与资料审计：7档套餐精算、4项数据冲突与5张MiaoKo归档图复核（2026）"',
    to: 'title: "光速云（GSY）万字深度评测：7档套餐、数据冲突与MiaoKo图复核"'
  },
  {
    file: 'docs/routes/japan/index.md',
    from: 'title: "日本与新加坡节点深度对比：东京/大阪海缆拓扑、NTT/IIJ/SoftBank/Singtel 上游差异及 AI/4K 落地实操"',
    to: 'title: "日本与新加坡节点对比：海缆拓扑、上游线路与 AI 落地实操"'
  },
  {
    file: 'docs/routes/latency/index.md',
    from: 'title: "低延迟节点、丢包与机场测速口径详解：ICMP/TCPing/TLS RTT/HTTPS 204 差异、8 倍单位换算与晚高峰标准化脚本"',
    to: 'title: "低延迟节点与测速口径详解：RTT 差异、单位换算与晚高峰测速"'
  },
  {
    file: 'docs/routes/multipliers/index.md',
    from: 'title: "线路倍率与流量计费机制完全指南：双向扣费公式、0.2x–5x 单价模拟、Mihomo 隔离防坑与 1 倍品牌盘点"',
    to: 'title: "线路倍率与计费完全指南：扣费公式、单价模拟与防坑盘点"'
  },
  {
    file: 'docs/troubleshooting/startup/index.md',
    from: 'title: "客户端无法启动排查：Clash Verge 白屏、v2rayN 启动失败、杀软误杀与 macOS 隔离修复"',
    to: 'title: "客户端无法启动排查：白屏、启动失败、误杀与系统隔离修复"'
  }
];

for (const item of replacements) {
  let content = fs.readFileSync(item.file, 'utf8');
  if (content.includes(item.from)) {
    content = content.replace(item.from, item.to);
    fs.writeFileSync(item.file, content, 'utf8');
    console.log(`Trimmed title in ${item.file}`);
  } else {
    console.warn(`Could not find target in ${item.file}`);
  }
}
