# 图像与静态资产来源审计（Image Provenance）

- **审计日期**：2026-11-23
- **原则**：仅使用来源明确的品牌主图/Logo 与归档截图；不伪造不存在的测速图；所有 `<img>` 明确 `alt`、`width`/`height` 及说明。

## 1. 原创站点图形（SVG）

| 文件路径 | 用途 | 来源 |
|---|---|---|
| `docs/public/images/site-avatar.webp` | 站点主头像 / 顶栏 Logo / 页脚头像 / 主 Favicon | 用户上传头像文件（2026-11-23） |
| `docs/public/favicon.svg` | 站点备用矢量图标 | 本项目原创 SVG |

## 2. 品牌 Logo 与主图（源自 `C:\Users\Pro User\Desktop\logos\`）

经核对文件名与品牌对应关系，将以下确切匹配的图片复制到 `docs/public/images/brands/`：

| 品牌 Slug | 原始文件名 | 站点路径 |
|---|---|---|
| `guangsuyun` | `光速云主图.png` | `/images/brands/guangsuyun.png` |
| `feimao` | `飞猫云主图.png` | `/images/brands/feimao.png` |
| `xingdaomeng` | `xdm_logo.webp` | `/images/brands/xingdaomeng.webp` |
| `ermao` | `2mao_logo.webp` | `/images/brands/ermao.webp` |
| `weitu` | `v2云主图.png` | `/images/brands/weitu.png` |
| `yuzhou` | `yuzhou_logo.webp` | `/images/brands/yuzhou.webp` |
| `u1s1` | `u1s1主图.png` | `/images/brands/u1s1.png` |
| `jilian` | `极连云主图.png` | `/images/brands/jilian.png` |
| `guangnian` | `光年梯主图.png` | `/images/brands/guangnian.png` |
| `yifan` | `1fly_logo.webp` | `/images/brands/yifan.webp` |
| `sogo` | `sogo.webp` | `/images/brands/sogo.webp` |
| `sujie` | `sujie_logo.webp` | `/images/brands/sujie.webp` |
| `quanqiu` | `全球云主图.png` | `/images/brands/quanqiu.png` |
| `yinxingren` | `隐形人256x256.png` | `/images/brands/yinxingren.png` |
| `tiziyun` | `梯子云256x256.png` | `/images/brands/tiziyun.png` |
| `lingdong` | `灵动云256x256.png` | `/images/brands/lingdong.png` |
| `edgenova` | `edgenova_logo.webp` | `/images/brands/edgenova.webp` |

其余未在 `logos/` 中找到确切同名文件的品牌，使用基于品牌 `accentColor` 与首字生成的纯前端矢量徽标（无虚假外部图床链接）。

## 3. 归档测试截图（源自 `C:\Users\Pro User\Desktop\光速云测试图解锁图\`）

| 站点路径 | 原始文件名 | 图像实际内容审计 | 使用限制 |
|---|---|---|---|
| `/images/archives/gsy-miaoko-cs-telecom.jpg` | `photo_2026-08-19_12-13-01.jpg` | MiaoKo 62 节点测速/解锁表（SC-2.3.1 长沙电信 2Gbps，协议显示 `Shadowsocks`） | 仅作历史归档参考，必须标注“协议显示 SS，与文案 VLESS 存在差异，待核实” |
| `/images/archives/gsy-miaoko-gx-mobile.jpg` | `photo_2026-08-19_12-13-50.jpg` | MiaoKo 62 节点测速/解锁表（SC-2.3.1 广西移动 2Gbps，协议显示 `Shadowsocks`） | 同上 |
| `/images/archives/gsy-miaoko-hb-unicom.jpg` | `photo_2026-08-19_12-13-58.jpg` | MiaoKo 62 节点测速/解锁表（SC-2.3.1 河北联通 2Gbps，协议显示 `Shadowsocks`） | 同上 |
| `/images/archives/gsy-miaoko-vless-unlock.jpg` | `photo_2026-08-19_12-18-40.jpg` | MiaoKo 70 节点基础流媒体解锁表（珠海联通 9Gbps，协议显示 `Vless` / `AnyTLS`） | 标注“2026-08-19 归档解锁参考，含 AnyTLS 节点，待核实与现行套餐一致性” |
| `/images/archives/gsy-miaoko-vless-speed.jpg` | `photo_2026-08-19_12-20-10.jpg` | MiaoKo 70 节点订阅速度表（珠海联通 9Gbps 单线程，协议显示 `Vless`） | 标注“2026-08-19 归档测速参考，非当前实时实测” |
