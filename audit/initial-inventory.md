# 初始项目审计清单（Initial Inventory）

- **审计时间**：2026-11-23
- **工作区路径**：`c:\Users\Pro User\Desktop\dailikehuduan.cc`
- **目标域名**：`https://dailikehuduan.cc/`

## 1. 现有项目扫描结果

经扫描工作区目录，当前 `c:\Users\Pro User\Desktop\dailikehuduan.cc` 为**全新空目录**：

| 检查项 | 状态 | 实际发现 |
|---|---|---|
| `package.json` | 不存在 | 需新建 VitePress 项目配置 |
| `docs/` 与历史 Markdown 文章 | 不存在 | 无既有页面、无草稿、无空白占位页 |
| `.vitepress/config.*` / `theme/` | 不存在 | 需新建多级文档主题与组件 |
| `public/`、`robots.txt`、favicon | 不存在 | 需新建静态资源与 SEO 基础文件 |
| Git 仓库 | 未初始化 | 无历史提交记录 |
| Apache `.htaccess` | 不存在 | 需新建 `deploy/apache/.htaccess` 并在构建时同步至 `dist/` |
| 重复页面 / 旧 URL 重定向 | 无历史 URL | 全站按 10 一级 + 60 二级 + 31 品牌详情 + 客户端/文章规范路由新建 |

## 2. 外部输入数据源清单（2026-11-23 快照）

以下五份原始资料随任务提供，并与桌面 `C:\Users\Pro User\Desktop\机场品牌信息\` 核对一致：

1. `32家机场品牌清单.txt`（31,328 字节 / 1,214 行）：主表含 28 条编号记录 + 末尾 4 条扩展记录（灵动云、浪网、边缘节点 EdgeNova、Firefly 萤火虫），其中 Firefly 与 Firefly 萤火虫需合并去重，最终为 **31 个独立品牌**。
2. `第三方代理客户端.txt`（3,351 字节 / 108 行）：覆盖 Windows、Android、iOS、macOS、Linux、OpenWrt 六大平台客户端。
3. `光速云品牌信息.txt`（1,861 字节 / 85 行）：主推品牌光速云独立信息表（与清单主表存在 59GB vs 69GB、3/4/7 档套餐等冲突）。
4. `机场品牌图表样式.txt`（5,215 字节 / 107 行）：测速、解锁、拓扑样式参考及 Dark Network Observatory / Infrastructure Dashboard 设计系统要求。
5. `内容矩阵.txt`（2,445 字节 / 179 行）：品牌库、内容大纲、SEO/GEO、内链矩阵与验收标准（注：原文提及“Astro 项目”，按主指令以 VitePress 实现）。

## 3. 桌面归档图片资产核查

1. `C:\Users\Pro User\Desktop\logos\`：存在部分品牌主图与 Logo（如 `光速云主图.png`、`飞猫云主图.png`、`u1s1主图.png`、`v2云主图.png`、`1fly_logo.webp`、`2mao_logo.webp`、`edgenova_logo.webp`、`xdm_logo.webp`、`yuzhou_logo.webp`、`sogo.webp`、`sujie_logo.webp`、`光年梯主图.png`、`全球云主图.png`、`极连云主图.png`、`梯子云256x256.png`、`灵动云256x256.png`、`隐形人256x256.png`）。
2. `C:\Users\Pro User\Desktop\光速云测试图解锁图\`：存在 5 张 `2026-08-19` 归档 MiaoKo 测速/解锁截图，但经图像读取核对，前 3 张显示协议为 `Shadowsocks`（62 节点），后 2 张显示 `Vless` + `AnyTLS`（70 节点），且未标注来源品牌名称，仅可作为“待核实归档测速参考图”展示并注明协议差异，不可冒充已核实的最新光速云实测图。
