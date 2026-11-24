# Apache 静态部署指南（dailikehuduan.cc）

## 1. 构建产物目录
执行 `npm run docs:build` 后，完整静态站点与 `.htaccess` 将输出至：
- `docs/.vitepress/dist/`

产物包含：
- 所有页面静态 HTML（适配 `cleanUrls: true`，目录页为 `<route>/index.html`，单页为 `<route>.html`）
- `sitemap.xml`（由 VitePress 自动生成，`hostname: https://dailikehuduan.cc/`）
- `robots.txt`、`favicon.svg`、`llms.txt`、`404.html`
- `.htaccess`（由 `scripts/postbuild-apache.mjs` 自动从 `deploy/apache/.htaccess` 复制到 `dist/` 根目录）

## 2. Apache 虚拟主机配置要点
1. 将站点 `DocumentRoot` 指向上传后的 `dist` 内容根目录。
2. 确保已启用 `mod_rewrite`、`mod_headers`、`mod_expires`、`mod_deflate`：
   ```bash
   sudo a2enmod rewrite headers expires deflate
   ```
3. 在 `<VirtualHost>` 中允许 `.htaccess` 覆盖：
   ```apache
   <Directory /var/www/dailikehuduan.cc/public_html>
       AllowOverride All
       Require all granted
   </Directory>
   ```
4. 若宿主机未开启 `mod_rewrite` 权限，请在 `docs/.vitepress/config.ts` 中将 `cleanUrls: false` 后重新构建，以使用标准 `.html` 路径。

## 3. Git + rsync / 手动发布流程示例
```bash
npm ci
npm run docs:build
npm run audit:qa
# 将 docs/.vitepress/dist/ 下全部文件（含隐藏文件 .htaccess）同步至 Apache 站点根目录
```
