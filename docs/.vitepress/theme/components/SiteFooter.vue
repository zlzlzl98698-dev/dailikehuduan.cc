<script setup lang="ts">
import { useSidebar } from 'vitepress/theme'

const { hasSidebar } = useSidebar()
</script>

<template>
  <footer :class="['diw-footer', { 'has-sidebar': hasSidebar }]">
    <div class="diw-footer__inner">
      <div class="diw-footer__brand">
        <div class="diw-footer__title-row">
          <img src="/images/site-avatar.webp" alt="代理客户端头像" width="32" height="32" loading="lazy" class="diw-footer__avatar" />
          <div class="diw-footer__title">代理客户端 · dailikehuduan.cc</div>
        </div>
        <p class="diw-footer__desc">
          原创简体中文代理客户端文档知识库、安装教程中心、排障手册与机场品牌可核验资料库。资料快照基准日期：2026-11-23。
        </p>
        <p class="diw-footer__notice">
          合规声明：本站外部品牌注册链接均为历史收集的推广入口（含 <code>nofollow sponsored</code>），不代表实时官网有效性或客观性能排名；请优先参照官方开源仓库校验客户端并合规使用网络工具。
        </p>
      </div>

      <div class="diw-footer__cols">
        <div>
          <div class="diw-footer__col-head">客户端与排障核心</div>
          <ul>
            <li><a href="/clients/">客户端下载与教程中心</a></li>
            <li><a href="/clients/clash-verge-rev/">Clash Verge Rev 教程</a></li>
            <li><a href="/clients/v2rayn/">v2rayN 多核心教程</a></li>
            <li><a href="/guides/tun/">TUN 模式深度配置</a></li>
            <li><a href="/troubleshooting/">故障诊断向导</a></li>
          </ul>
        </div>
        <div>
          <div class="diw-footer__col-head">品牌与方案决策</div>
          <ul>
            <li><a href="/brands/directory/">31 家机场品牌库</a></li>
            <li><a href="/airport/ranking/">机场排行与口径说明</a></li>
            <li><a href="/plans/value/">性价比与折算价格计算</a></li>
            <li><a href="/brands/status/">品牌资料冲突与变动</a></li>
            <li><a href="/safety/security/">客户端防钓鱼与下载安全</a></li>
            <li><a href="/about/">关于本站与评测准则</a></li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.diw-footer {
  border-top: 1px solid var(--diw-border);
  background: var(--diw-surface-alt);
  padding: 2.2rem 1.5rem;
  margin-top: 3rem;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.diw-footer__inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 2rem;
}

.diw-footer__title-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.45rem;
}

.diw-footer__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--diw-border-strong);
}

.diw-footer__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.diw-footer__desc,
.diw-footer__notice {
  margin: 0.35rem 0;
  line-height: 1.6;
  color: var(--vp-c-text-3);
}

.diw-footer__cols {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
}

.diw-footer__col-head {
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 0.6rem;
}

.diw-footer ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.diw-footer a {
  color: var(--vp-c-text-2);
  text-decoration: none;
}

.diw-footer a:hover {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}

@media (max-width: 768px) {
  .diw-footer__inner {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 960px) {
  .diw-footer.has-sidebar {
    padding-left: calc(var(--vp-sidebar-width, 272px) + 2rem);
    padding-right: 2rem;
  }
  .diw-footer.has-sidebar .diw-footer__inner {
    max-width: 980px;
    margin: 0;
  }
}

@media (min-width: 1440px) {
  .diw-footer.has-sidebar .diw-footer__inner {
    max-width: 1100px;
    margin: 0 auto;
  }
}
</style>
