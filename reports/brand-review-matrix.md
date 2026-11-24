# 31 家独立品牌评测矩阵报告：架构原型、字数分布与实测证据

## 1. 评测矩阵建设目标与架构分离
本站坚决打破行业内“评测即带货软文”的潜规则，实行严格的 **「商业入口页 (`/brands/<slug>/`) 与技术评测长文 (`/reviews/<slug>/`) 物理分离」**：
- **`/brands/<slug>/`**：聚焦交易决策参数（套餐表格、优惠码条件、支付方式、安全风险警示与受控跳转）；
- **`/reviews/<slug>/`**：聚焦工程技术事实（五级证据链台账、历史快照与冲突审计、真实每 GB 单价拆解、网络拓扑与多协议分流实操、同价位横向对比）。

---

## 2. 六大评测架构原型 (Archetypes) 与品牌分布

| 评测原型代码 | 原型特征与叙事侧重 | 包含品牌名单 | 篇均字数 |
| :--- | :--- | :--- | :---: |
| **旗舰万字标杆** | 覆盖全周期 7 档套餐、揭示 4 大历史数据冲突、逐张技术复核 5 张 MiaoKo 跨网长图 | **光速云 (guangsuyun)** | **10,723** |
| **A_DUAL_HIGH (双模高规格)** | 双模交付（自研端+第三方订阅）、IEPL 专线、多地区多节点、月付¥20–35 | 暮光加速、微风网络、二猫云、唯兔云、Firefly、全球云 | 6,500–8,500 |
| **B_OPEN_SUB (开放通用订阅)** | 专注标准 Clash/小火箭订阅、透明倍率、中低门槛 | 一翻云、可信云 | 5,600–6,200 |
| **C_CLOSED_CLIENT (专属封闭端)** | 强推自研客户端、隐藏订阅 URL、封锁软路由、高新手友好度与高锁定度 | 飞猫云、星岛梦、隐形人 | 7,200–7,800 |
| **D_MID_HISTORICAL (历史扩展归档)** | 历史清单记录、多线路自动分配宣称、周期倒挂或字段遮挡、链接待核验 | 浪网、灵动云、边缘节点 EdgeNova、U1S1、梯子云 | 5,800–7,500 |
| **E_ENTRY_STARTER (百元内轻量小包)** | 年付¥80–120引流小包、学生低门槛套餐、大流量限制 | 速界、极连云、光年梯、宇宙云 | 5,500–6,200 |
| **F_ULTRA_BUDGET (极致性价比与特惠)** | 月付¥10以下、年付超低价折算陷阱、高倍率混线审计 | 大佬云、闪电鼠、神行加速、云界线、榴莲云、环球梯、无忧链接、灵猫网络、SOGO云、闪跃 | 5,800–6,900 |

---

## 3. 全量 31 家品牌评测汉字字数与证据链统计表

| 序号 | 品牌名称 | Slug | 评测 URL | 纯汉字字数 | 主数据状态 | 资料完整度 | 核心特色/冲突审计要点 |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | 光速云 | guangsuyun | `/reviews/guangsuyun/` | **10,723** | historical | 高 | 旗舰长文；5张MiaoKo归档图复核；59G/69G冲突；7档精算 |
| 2 | 二猫云 | ermao | `/reviews/ermao/` | **8,597** | historical | 高 | 8,500+深度长文；大额不限时流量包；月付¥25主力分析 |
| 3 | 飞猫云 | feimao | `/reviews/feimao/` | **7,818** | historical | 高 | 仅专属客户端；¥84学生年付精算；样式图与实测隔离 |
| 4 | 隐形人 | yinxingren | `/reviews/yinxingren/` | **7,505** | historical | 高 | 仅专属客户端；零测试数据；优惠码与流量冲突审计 |
| 5 | 灵动云 | lingdong | `/reviews/lingdong/` | **7,476** | historical | 中 | 珠海联通9Gbps归档图技术复核；定制套餐流量遮挡 |
| 6 | 边缘节点 | edgenova | `/reviews/edgenova/` | **7,231** | historical | 中 | 多线路分配宣称；年付¥270倒挂精算；TH888优惠码 |
| 7 | 星岛梦 | xingdaomeng | `/reviews/xingdaomeng/` | **7,221** | historical | 高 | 9档套餐阶梯；客户端模式待核实；¥96贴心小包审计 |
| 8 | 无忧链接 | wuyou | `/reviews/wuyou/` | **6,904** | historical | 高 | 低门槛月付；不限时方案比对；节点倍率核实 |
| 9 | Firefly | firefly | `/reviews/firefly/` | **6,873** | historical | 高 | 历史入口去重；单一规范页审计；专线与多端接入 |
| 10 | 暮光加速 | muguang | `/reviews/muguang/` | **6,734** | historical | 高 | 开放订阅主力；中大流量月付；同价位微风对比 |
| 11 | 灵猫网络 | lingmao | `/reviews/lingmao/` | **6,714** | historical | 高 | 轻量级套餐；节点抗封锁与跨网抖动分析 |
| 12 | 全球云 | quanqiu | `/reviews/quanqiu/` | **6,681** | historical | 高 | 仅专属客户端；套餐结构与光速云雷同性深度比对 |
| 13 | SOGO 云 | sogo | `/reviews/sogo/` | **6,628** | historical | 高 | 多周期价格模型拆解；低单价年付锁资防坑指南 |
| 14 | 唯兔云 | weitu | `/reviews/weitu/` | **6,514** | historical | 高 | 专线网络实测对照；一翻云横向差异选型 |
| 15 | 闪跃 | shanyue | `/reviews/shanyue/` | **6,395** | historical | 高 | 高速直连中继；晚高峰 QoS 丢包特征排查 |
| 16 | 微风网络 | weifeng | `/reviews/weifeng/` | **6,308** | historical | 高 | 早期协议口径差审计；¥12月付起步档精算 |
| 17 | 浪网 | langwang | `/reviews/langwang/` | **6,280** | historical | 中 | 入门档「截150G」遮挡揭示；3档大额不限时包 |
| 18 | 一翻云 | yifan | `/reviews/yifan/` | **6,184** | historical | 高 | 纯开放订阅支持；唯兔云对比；中轻度用户首选 |
| 19 | 宇宙云 | yuzhou | `/reviews/yuzhou/` | **6,146** | historical | 基础 | 周期阶梯精算；冷门节点落地与流媒体解锁边界 |
| 20 | 云界线 | yunjiexian | `/reviews/yunjiexian/` | **6,128** | historical | 基础 | 极致性价比引流；年付折算月均陷阱拆解 |
| 21 | 榴莲云 | liulianyun | `/reviews/liulianyun/` | **6,069** | historical | 基础 | 超低价套餐结构剖析；真实每GB单价横向对照 |
| 22 | 大佬云 | dalaoyun | `/reviews/dalaoyun/` | **6,040** | historical | 高 | 超低价年付折算真相；链接与协议异常排查 |
| 23 | 环球梯 | huanqiuti | `/reviews/huanqiuti/` | **6,032** | historical | 基础 | 备用节点价值评估；多设备并发连接限制排查 |
| 24 | 梯子云 | tiziyun | `/reviews/tiziyun/` | **5,991** | historical | 中 | 历史扩展记录；中转线路晚高峰稳定性核实 |
| 25 | 神行加速 | shenxing | `/reviews/shenxing/` | **5,898** | historical | 基础 | 移动端一键接入；退款条款缺失风险提示 |
| 26 | U1S1 | u1s1 | `/reviews/u1s1/` | **5,879** | historical | 中 | 历史扩展档案；线路宣称与实测缺失警示 |
| 27 | 闪电鼠 | shandianshu | `/reviews/shandianshu/` | **5,865** | historical | 基础 | 入门级流量包；客服响应与工单维权排查 |
| 28 | 可信云 | kexin | `/reviews/kexin/` | **5,637** | historical | 高 | 标准 Clash 订阅导入；速界低门槛横向对比 |
| 29 | 速界 | sujie | `/reviews/sujie/` | **5,601** | historical | 高 | 低门槛月付；学生与轻量办公适配性裁决 |
| 30 | 极连云 | jilian | `/reviews/jilian/` | **5,583** | historical | 高 | 极简套餐设计；备用灾备线路选型指南 |
| 31 | 光年梯 | guangnian | `/reviews/guangnian/` | **5,565** | historical | 高 | 节点倍率与实际扣费核算；防偷跑实操建议 |
| **全库合计** | **31 家去重** | - | - | **211,745** | - | - | **篇均 6,830 汉字；100% 独立成篇** |
