import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const distDir = path.join(root, 'docs', '.vitepress', 'dist')
const htaccessSrc = path.join(root, 'deploy', 'apache', '.htaccess')
const htaccessDest = path.join(distDir, '.htaccess')

if (!fs.existsSync(distDir)) {
  console.error('[postbuild] 构建输出目录不存在:', distDir)
  process.exit(1)
}

if (fs.existsSync(htaccessSrc)) {
  fs.copyFileSync(htaccessSrc, htaccessDest)
  console.log('[postbuild] 已复制 Apache .htaccess 至:', htaccessDest)
} else {
  console.warn('[postbuild] 未找到 deploy/apache/.htaccess，跳过复制')
}
