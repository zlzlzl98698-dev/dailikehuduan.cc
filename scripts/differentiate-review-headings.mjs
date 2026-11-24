import fs from 'fs';
import path from 'path';
import { BRANDS, BRAND_BY_SLUG } from '../docs/.vitepress/data/brands.ts';

const reviewsDir = path.resolve('docs/reviews');

for (const b of BRANDS) {
  const p = path.join(reviewsDir, b.slug, 'index.md');
  if (!fs.existsSync(p)) continue;

  let text = fs.readFileSync(p, 'utf8');

  // Skip guangsuyun, lingdong, xingdaomeng, yinxingren, ermao as they are already customized flagship/specialized
  if (['guangsuyun', 'lingdong', 'xingdaomeng', 'yinxingren', 'ermao'].includes(b.slug)) {
    console.log(`Skipping already customized flagship/specialized review: ${b.slug}`);
    continue;
  }

  // Define unique brand-specific heading sets based on brand attributes
  const name = b.name;
  const isClosed = b.clientMode === '仅专属客户端';
  const isOpen = b.clientMode === '第三方通用订阅';
  const isBudget = ['dalaoyun', 'shandianshu', 'shenxing', 'yunjiexian', 'liulianyun', 'huanqiuti'].includes(b.slug);
  const isHistorical = ['langwang', 'tiziyun', 'u1s1', 'edgenova'].includes(b.slug);
  const isStarter = ['sujie', 'jilian', 'guangnian', 'yuzhou'].includes(b.slug);

  // Replace each H2 systematically with a brand-differentiated, SEO-rich heading
  const lines = text.split('\n');
  const newLines = [];
  let h2Index = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('## 一、') || (h2Index === 0 && line.startsWith('## '))) {
      h2Index = 1;
      newLines.push(`## 一、${name}评测核心结论与五级证据链评级`);
    } else if (line.startsWith('## 二、') || (h2Index === 1 && line.startsWith('## '))) {
      h2Index = 2;
      if (isClosed) {
        newLines.push(`## 二、${name}专属客户端深度剖析：极简免配置与软路由封锁边界`);
      } else if (isOpen) {
        newLines.push(`## 二、${name}开源生态兼容性实测：Clash、Sing-box 与小火箭通用订阅`);
      } else if (isBudget) {
        newLines.push(`## 二、${name}同源架构特征与超低价引流陷阱排查`);
      } else if (isHistorical) {
        newLines.push(`## 二、${name}历史归档出处核验、截图遮挡与已知冲突审计`);
      } else if (isStarter) {
        newLines.push(`## 二、${name}入门套餐定价核算与“资料缺口”透明披露`);
      } else {
        newLines.push(`## 二、${name}品牌背景、运营沿革与服务交付边界`);
      }
    } else if (line.startsWith('## 三、') || (h2Index === 2 && line.startsWith('## '))) {
      h2Index = 3;
      newLines.push(`## 三、${name}全周期套餐财务精算与真实每 GB 成本拆解`);
    } else if (line.startsWith('## 四、') || (h2Index === 3 && line.startsWith('## '))) {
      h2Index = 4;
      newLines.push(`## 四、${name}线路架构、专线宣称与全球节点覆盖剖析`);
    } else if (line.startsWith('## 五、') || (h2Index === 4 && line.startsWith('## '))) {
      h2Index = 5;
      if (isClosed) {
        newLines.push(`## 五、${name}客户端生态限制：多设备并发与跨平台体验`);
      } else {
        newLines.push(`## 五、${name}全平台客户端兼容矩阵与无感导入实操规范`);
      }
    } else if (line.startsWith('## 六、') || (h2Index === 5 && line.startsWith('## '))) {
      h2Index = 6;
      newLines.push(`## 六、${name} AI 生产力与主流流媒体解锁能力边界核查`);
    } else if (line.startsWith('## 七、') || (h2Index === 6 && line.startsWith('## '))) {
      h2Index = 7;
      newLines.push(`## 七、${name}品牌服务条款、退款红线与资金安全止损指南`);
    } else if (line.startsWith('## 八、') || (h2Index === 7 && line.startsWith('## '))) {
      h2Index = 8;
      newLines.push(`## 八、${name}与同价位梯队横向对比决策矩阵`);
    } else if (line.startsWith('## 九、') || (h2Index === 8 && line.startsWith('## '))) {
      h2Index = 9;
      newLines.push(`## 九、${name}常见问题解答（FAQ 深度释疑）`);
    } else if (line.startsWith('## 十、') || (h2Index === 9 && line.startsWith('## '))) {
      h2Index = 10;
      newLines.push(`## 十、${name}最终评测结论与商业详情/注册入口`);
    } else {
      newLines.push(line);
    }
  }

  const updatedText = newLines.join('\n');
  fs.writeFileSync(p, updatedText, 'utf8');
  console.log(`Updated differentiated H2 headings for: ${b.slug}`);
}

console.log('Successfully differentiated all review H2 headings!');
