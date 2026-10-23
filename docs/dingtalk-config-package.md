# 钉钉对接 · 配置包（P0 交付物）

> 适用对象：石家庄图德教育科技有限公司 · 升学指导中心
> 用途：**你先填写/核对本包 → 凭证到位 → 再开启代码接入**
> 版本：v1.0（2026-10-17）
> 配套：`docs/dingtalk-integration-plan.md`（落地包 · 规范依据）、`server/.env.example`（配置模板）

---

## 使用说明（3 步）

1. **填写** 本包第 1、2 章（凭证、数据表登记），把 §1.3 的敏感值**私发**给我或录入 `server/.env`；
2. **核对** 第 4 章 17 张表的"真实字段名"：一致就打 `✓`，不一致就填真实名（这决定代码能否读写成功）；
3. **确认** 第 5、6 章（26 流程载体、结构性事项），然后回复我"配置包已填"。

> 代码侧已按本包字段名写好（`server/fieldMap.js`）。**只要本包字段名与真实表一致，凭证一到位即可直连**；若不一致，只需按核对结果改 `fieldMap.js` 一列，业务代码不动。

---

## 1. 凭证登记表

### 1.1 应用凭证（钉钉开发者后台 → 应用详情 → 凭证与基础信息）

| # | 项 | 从哪里取 | 示例 | 你的值（待填） |
|---|---|---|---|---|
| 1 | Client ID（原 AppKey） | 开发者后台 → 凭证与基础信息 | `dingeqqpkv3xxxxxx` | |
| 2 | Client Secret（原 AppSecret） | 同上（**敏感**） | `GT-lsu-taDAxxxsTsxxxx` | |

### 1.2 表格与操作人

| # | 项 | 从哪里取 | 示例 | 你的值（待填） |
|---|---|---|---|---|
| 3 | AI 表格 `baseId` | 打开该多维表格 → URL 中的 `baseId` | `qnYxxxxxxxxxx` | |
| 4 | 系统操作人 `unionId`（operatorId） | 对表格有编辑权限的账号（建议李胜）；由"查询用户详情/免登码"获得 | `xxxxxxxxxxxxxxxxx` | |
| 5 | API 网关 | 默认即可 | `https://api.dingtalk.com` | 默认 |

> **为什么必须要有 operatorId**：钉钉 AI 表格所有接口都要求带 `operatorId`(=unionId)，用它做权限校验——该账号必须对这份表格有编辑权限，否则报 403。

### 1.3 敏感值交接方式

- Client Secret **只**填入 `server/.env`（该文件已在 `.gitignore` 中屏蔽，绝不进代码库、绝不下发浏览器）；
- 交接请**私发**（不进群、不贴公开文档）；凭证一律不回传前端、不进构建产物。

---

## 2. 数据表登记表

请核对"真实表名"是否与下表一致（填中文表名或 `sheetId` 均可）。**不一致时改 `server/.env` 对应项即可**。

| 环境变量 | 用途 | 默认表名 | 你的真实表名/sheetId |
|---|---|---|---|
| `SHEET_WORK_ORDER` | 工单 | `工单` | |
| `SHEET_NODE_TEMPLATE` | 节点模板 | `节点模板` | |
| `SHEET_NODE` | 工单节点 | `工单节点` | |
| `SHEET_STUDENT` | 学生档案 | `学生档案` | |
| `SHEET_MATERIAL` | 材料清单 | `材料清单` | |
| `SHEET_ESSAY` | 文书素材 | `文书素材` | |
| `SHEET_PLAN` | 方案版本 | `方案版本` | |
| `SHEET_CHANGE` | 变更记录 | `变更记录` | |
| `SHEET_RULE_CARD` | 规则库（核对卡） | `规则库` | |
| `SHEET_CALIBER` | 口径库 | `口径库` | |
| `SHEET_UNIVERSITY` | 重点院校清单 | `重点院校清单` | |
| `SHEET_MAJOR` | 专业库 | `专业库` | |
| `SHEET_KEY_DATE` | 关键日期 | `关键日期` | |
| `SHEET_INTERVIEW` | 约谈记录 | `约谈记录` | |
| `SHEET_ADMISSION` | 录取结果 | `录取结果` | |
| `SHEET_QA` | 家长问答 | `家长问答` | |
| `SHEET_NODE_HISTORY` | 节点留痕（**建议新增**，见 §6.1） | `节点留痕` | |

> 注：表名即 API 里的 `sheetIdOrName`，错一个字即失败；拿不准就用「获取所有数据表」接口列出后核对。

---

## 3. 权限点开通清单（请钉钉管理员在开发者后台勾选）

| 权限 | 用途 | 是否必须 | 已开通 |
|---|---|---|---|
| AI 表格应用**读**权限 | 读取 17 张表 | **必须** | ☐ |
| AI 表格应用**写**权限 | 节点状态/确认/答复回写 | **必须** | ☐ |
| 企业内部应用"调用企业 API 基本权限" | 换取 access_token 前置 | **必须** | ☐ |
| 通讯录 / 用户信息读取 | 取 unionId；家长手机绑定算 unionId | 建议 | ☐ |
| 工作通知 / 企业消息 | 若后端要直接推钉钉消息 | 可选 | ☐ |

---

## 4. 字段名核对表（逐表）

**值格式速查**：文本=字符串；单选/多选=字符串 / 字符串数组；数字=number；复选框=`true/false`；日期=**写时传毫秒时间戳、读时返回毫秒**。

> 核对方式：把"真实字段名"一栏填上；与"建议字段名"一致就写 `✓`。不一致的字段，代码只需改 `server/fieldMap.js` 对应一行的值。

### 4.1 工单

| 应用字段 | 建议字段名 | 类型 | 真实字段名（核对） |
|---|---|---|---|
| id | 工单ID | 文本 | |
| studentId | 学生ID | 文本 | |
| studentName | 学生姓名 | 文本 | |
| grade | 年级 | 单选 | |
| template | 模板类型 | 单选（full/emergency） | |
| status | 工单状态 | 单选（active/frozen/closed） | |
| createdAt | 创建时间 | 日期 | |
| advisorName | 主顾问 | 文本 | |
| backupAdvisorName | 备顾问 | 文本 | |
| currentNodeIndex | 当前节点序号 | 数字 | |
| progress | 进度 | 数字（0-100） | |
| lastUpdatedAt | 最后更新 | 日期 | |
| parentUserId | 家长账号 | 文本（unionId 或空） | |

### 4.2 节点模板

| 应用字段 | 建议字段名 | 类型 | 真实字段名（核对） |
|---|---|---|---|
| id | 模板节点ID | 文本 | |
| index | 序号 | 数字 | |
| template | 模板类型 | 单选 | |
| name | 节点名称 | 文本 | |
| description | 节点说明 | 多行文本 | |
| owner | 负责角色 | 单选 | |
| durationDays | 时长(天) | 数字 | |
| requiresParentConfirm | 需家长确认 | 复选框 | |
| category | 分类 | 单选 | |
| deliverable | 交付物 | 文本 | |

### 4.3 工单节点（读写最频繁）

| 应用字段 | 建议字段名 | 类型 | 真实字段名（核对） |
|---|---|---|---|
| id | 节点ID | 文本 | |
| workOrderId | 工单ID | 文本 | |
| index | 序号 | 数字 | |
| name | 节点名称 | 文本 | |
| description | 节点说明 | 多行文本 | |
| owner | 负责角色 | 单选 | |
| ownerName | 负责人 | 文本 | |
| status | 节点状态 | 单选（not_started/in_progress/pending_confirm/completed/overdue/stalled） | |
| startedAt | 开始时间 | 日期 | |
| dueAt | 截止时间 | 日期 | |
| completedAt | 完成时间 | 日期 | |
| requiresParentConfirm | 需家长确认 | 复选框 | |
| confirmedByParent | 家长已确认 | 复选框 | |
| confirmedAt | 家长确认时间 | 日期 | |
| deliverable | 交付物 | 文本 | |

### 4.4 学生档案

| 应用字段 | 建议字段名 | 类型 | 真实字段名（核对） |
|---|---|---|---|
| id | 学生ID | 文本 | |
| name | 姓名 | 文本 | |
| grade | 年级 | 单选 | |
| targetRegion | 目标地区 | 多选 | |
| currentSchool | 当前学校 | 文本 | |
| gpa | GPA | 文本 | |
| languageScores | 语言成绩 | 多行文本 | |
| parentName | 家长姓名 | 文本 | |
| parentPhone | 家长手机 | 电话 | |
| parentUserId | 家长unionId | 文本 | |
| advisorName | 顾问 | 文本 | |
| enrolledAt | 入学时间 | 日期 | |
| tags | 标签 | 多选 | |

> `语言成绩`：代码用 `类型 分数 日期; 类型 分数 日期` 的分号串自动互转（如 `IELTS 7.0; A-Level A*AA`），填表保持此约定即可。

### 4.5 材料清单

| 应用字段 | 建议字段名 | 类型 | 真实字段名（核对） |
|---|---|---|---|
| id | 材料ID | 文本 | |
| studentId | 学生ID | 文本 | |
| name | 材料名称 | 文本 | |
| category | 材料分类 | 单选（academic/language/personal/financial/other） | |
| status | 材料状态 | 单选（pending/submitted/verified/rejected） | |
| submittedAt | 提交时间 | 日期 | |
| verifiedAt | 核验时间 | 日期 | |
| note | 备注 | 多行文本 | |

### 4.6 文书素材

| 应用字段 | 建议字段名 | 类型 | 真实字段名（核对） |
|---|---|---|---|
| id | 素材ID | 文本 | |
| studentId | 学生ID | 文本 | |
| type | 素材类型 | 单选 | |
| content | 内容 | 多行文本 | |
| status | 状态 | 单选（draft/submitted/confirmed） | |
| submittedAt | 提交时间 | 日期 | |

### 4.7 方案版本

| 应用字段 | 建议字段名 | 类型 | 真实字段名（核对） |
|---|---|---|---|
| id | 方案ID | 文本 | |
| studentId | 学生ID | 文本 | |
| version | 版本号 | 文本 | |
| schools | 院校清单 | 多行文本（JSON） | |
| status | 方案状态 | 单选（draft/frozen/superseded） | |
| createdAt | 创建时间 | 日期 | |
| frozenAt | 冻结时间 | 日期 | |
| note | 备注 | 多行文本 | |

> `院校清单` 存 JSON：`[{name,region,major,tier}]`，代码自动 parse/stringify。

### 4.8 变更记录

| 应用字段 | 建议字段名 | 类型 | 真实字段名（核对） |
|---|---|---|---|
| id | 变更ID | 文本 | |
| studentId | 学生ID | 文本 | |
| workOrderId | 工单ID | 文本 | |
| type | 变更类型 | 单选 | |
| from | 变更前 | 文本 | |
| to | 变更后 | 文本 | |
| impact | 连锁影响 | 多行文本 | |
| status | 审批状态 | 单选（pending_approval/approved/rejected/parent_confirmed） | |
| approvedBy | 审批人 | 文本 | |
| parentConfirmedAt | 家长确认时间 | 日期 | |
| createdAt | 创建时间 | 日期 | |
| operator | 操作人 | 文本 | |

### 4.9 规则库（核对卡）

| 应用字段 | 建议字段名 | 类型 | 真实字段名（核对） |
|---|---|---|---|
| id | 核对卡ID | 文本 | |
| schoolName | 院校名称 | 文本 | |
| major | 专业 | 文本 | |
| region | 地区 | 单选 | |
| requirements | 要求明细 | 多行文本（JSON） | |
| verifiedAt | 核实时间 | 日期 | |
| verifiedBy | 核实人 | 文本 | |

> `要求明细` 存 JSON：`[{item,value,source,confidence}]`。

### 4.10 口径库

| 应用字段 | 建议字段名 | 类型 | 真实字段名（核对） |
|---|---|---|---|
| id | 口径ID | 文本 | |
| code | 口径编号 | 文本（如 K-001） | |
| category | 分类 | 单选 | |
| question | 问题 | 文本 | |
| answer | 答复 | 多行文本 | |
| updatedAt | 更新时间 | 日期 | |
| isActive | 是否生效 | 复选框 | |

### 4.11 重点院校清单

| 应用字段 | 建议字段名 | 类型 | 真实字段名（核对） |
|---|---|---|---|
| id | 院校ID | 文本 | |
| name | 院校名称 | 文本 | |
| nameEn | 英文名 | 文本 | |
| region | 地区 | 单选（UK/HK/AU/CA） | |
| qsRank | QS排名 | 数字 | |
| logoColor | 标识色 | 文本 | |

### 4.12 专业库

| 应用字段 | 建议字段名 | 类型 | 真实字段名（核对） |
|---|---|---|---|
| id | 专业ID | 文本 | |
| name | 专业名称 | 文本 | |
| nameEn | 英文名 | 文本 | |
| category | 分类 | 单选 | |
| region | 地区 | 单选 | |

### 4.13 关键日期

| 应用字段 | 建议字段名 | 类型 | 真实字段名（核对） |
|---|---|---|---|
| id | 日期ID | 文本 | |
| title | 标题 | 文本 | |
| date | 日期 | 日期 | |
| region | 地区 | 单选 | |
| type | 类型 | 单选（deadline/exam/event/maintenance） | |
| verified | 是否已核实 | 复选框（← 提醒开关） | |
| verifiedAt | 核实时间 | 日期 | |
| note | 备注 | 多行文本 | |

### 4.14 约谈记录

| 应用字段 | 建议字段名 | 类型 | 真实字段名（核对） |
|---|---|---|---|
| id | 约谈ID | 文本 | |
| studentId | 学生ID | 文本 | |
| date | 约谈时间 | 日期 | |
| participants | 参与人 | 多行文本 | |
| topic | 主题 | 文本 | |
| summary | 纪要 | 多行文本 | |
| decisions | 决议 | 多行文本（JSON） | |
| status | 状态 | 单选（scheduled/completed/parent_confirmed） | |
| parentConfirmedAt | 家长确认时间 | 日期 | |

### 4.15 录取结果

| 应用字段 | 建议字段名 | 类型 | 真实字段名（核对） |
|---|---|---|---|
| id | 录取ID | 文本 | |
| studentId | 学生ID | 文本 | |
| studentName | 学生姓名 | 文本 | |
| schoolName | 院校名称 | 文本 | |
| major | 专业 | 文本 | |
| region | 地区 | 单选 | |
| result | 录取结果 | 单选（offer/rejected/waiting/pending） | |
| scholarship | 奖学金 | 文本 | |
| receivedAt | 收到时间 | 日期 | |
| parentKnown | 家长已知悉 | 复选框 | |
| parentKnownAt | 知悉时间 | 日期 | |

### 4.16 家长问答

| 应用字段 | 建议字段名 | 类型 | 真实字段名（核对） |
|---|---|---|---|
| id | 问答ID | 文本 | |
| studentId | 学生ID | 文本 | |
| studentName | 学生姓名 | 文本（必填） | |
| question | 问题 | 多行文本（必填） | |
| askedAt | 提问时间 | 日期 | |
| askedBy | 提问人 | 文本（必填） | |
| status | 状态 | 单选（pending/answered/overdue） | |
| answer | 答复 | 多行文本 | |
| answeredAt | 答复时间 | 日期 | |
| answeredBy | 答复人 | 文本 | |
| caliberCode | 引用口径编号 | 文本 | |
| slaHours | SLA(小时) | 数字（如 24） | |

> 家长端隐藏：`状态/答复/答复时间/答复人` 四个内部字段（沿用原方案设置）。

### 4.17 节点留痕（建议新增，见 §6.1）

| 应用字段 | 建议字段名 | 类型 | 真实字段名（核对） |
|---|---|---|---|
| id | 留痕ID | 文本 | |
| nodeId | 节点ID | 文本 | |
| at | 时间 | 日期 | |
| action | 动作 | 文本 | |
| operator | 操作人 | 文本 | |
| note | 备注 | 多行文本 | |

---

## 5. 26 条流程核对清单（钉钉侧载体，确认"有"即可，不改动）

| 组 | 流程 | 钉钉侧触发 | 确认存在 |
|---|---|---|---|
| 进度透明 | 节点完成接力通知 | 记录更新（状态=已完成） | ☐ |
| 进度透明 | 到期自动标记逾期并预警 | 定时 每日 08:00 | ☐ |
| 进度透明 | 临期提前 3 天提醒 | 定时 每日 08:00 | ☐ |
| 进度透明 | 节点停滞 7 天预警 | 定时 每日 08:00 | ☐ |
| 进度透明 | 周五进度周报 | 定时 周五 17:00 | ☐ |
| 家长确认 | 节点确认请求 | 记录更新（状态=待家长确认） | ☐ |
| 家长确认 | 变更批准后家长书面确认 | 记录更新（审批状态=approved） | ☐ |
| 家长确认 | 约谈纪要确认 | 记录更新（约谈状态=completed） | ☐ |
| 家长确认 | 录取结果知悉确认 | 记录新增（录取结果=offer） | ☐ |
| 日期周期 | 关键日期 14 天倒计时 | 定时 每日 08:00 | ☐ |
| 日期周期 | 前 1 天提醒 | 定时 每日 08:00 | ☐ |
| 日期周期 | 每月维护提醒 | 定时 每月首个工作日 | ☐ |
| 通道闭环 | 家长问答：提问即时通知 | 记录新增（问答表） | ☐ |
| 通道闭环 | 家长问答：答复推送 | 记录更新（状态=answered） | ☐ |
| 通道闭环 | 素材问卷提交回执 | 记录新增（文书素材） | ☐ |
| 通道闭环 | 材料补正提醒 | 记录更新（材料状态=rejected） | ☐ |
| 通道闭环 | 规则入库提醒 | 记录新增（规则库） | ☐ |
| 通道闭环 | 政策变更影响面预警 | 定时 / 规则库变更 | ☐ |
| 建档初始化 | 新生 23 节点自动生成 | 记录新增（学生档案 G11/G10） | ☐ |
| 建档初始化 | 高三 8 节点自动生成 | 记录新增（学生档案 G12） | ☐ |
| 驾驶舱 | 每日 08:30 晨报 | 定时 每日 08:30 | ☐ |

> 上表为 26 条的收敛核对版；钉钉侧以现有实际配置为准，本表用于**交叉验证是否遗漏**。

---

## 6. 结构性事项确认（需你拍板）

### 6.1 节点留痕是否独立成表？
- 背景：原方案的 `history[]` 是数组，钉钉字段不好直接存；
- **建议**：新增 `节点留痕` 表（§4.17，6 字段）；
- 你的决定：☐ 同意新增　☐ 已有类似表（表名：______）　☐ 暂不建

### 6.2 通知通道
- 通知是否**全部**走钉钉集成自动化推送？（决定前端"通知中心"是读接口聚合还是读表）
- 你的确认：☐ 走钉钉推送　☐ 需后端另建/读聚合接口

### 6.3 家长端行级权限
- 家长访问时，后端是否按 `家长unionId ↔ 学生ID` 过滤，避免看到他人数据？
- 你的确认：☐ 需要（当前 baseId 未做行级过滤）　☐ 暂不需要

### 6.4 部署方式
- 服务端部署在哪？是否需要 HTTPS？
- 你的确认：本机 / 内网服务器 / 云服务器：__________

---

## 7. 到位后的验收清单（凭证齐全后按序执行）

| 阶段 | 动作 | 通过标准 |
|---|---|---|
| P1 | `curl :8787/api/health` | 返回 `ok:true`，token 换取成功 |
| P1 | `curl :8787/api/sheets` | 列出所有真实数据表，核对 §2 表名 |
| P2 | `curl :8787/api/workorders` | 读到真实工单与节点（只读打通） |
| P4 | 逐表核对 §4 字段名 | 读写无 `invalidRequest.inputArgs.invalid` |
| P3 | 前端 `.env` 开 `VITE_USE_REAL_DATA=true` | 节点状态/家长确认/问答答复能回写成功 |
| P5 | 通知中心接聚合结果 | 无假数据残留 |

---

## 附：一键复制配置（凭证到位后填入 `server/.env`）

```dotenv
DINGTALK_CLIENT_ID=
DINGTALK_CLIENT_SECRET=
DINGTALK_BASE_ID=
DINGTALK_OPERATOR_ID=

SHEET_WORK_ORDER=工单
SHEET_NODE_TEMPLATE=节点模板
SHEET_NODE=工单节点
SHEET_STUDENT=学生档案
SHEET_MATERIAL=材料清单
SHEET_ESSAY=文书素材
SHEET_PLAN=方案版本
SHEET_CHANGE=变更记录
SHEET_RULE_CARD=规则库
SHEET_CALIBER=口径库
SHEET_UNIVERSITY=重点院校清单
SHEET_MAJOR=专业库
SHEET_KEY_DATE=关键日期
SHEET_INTERVIEW=约谈记录
SHEET_ADMISSION=录取结果
SHEET_QA=家长问答
SHEET_NODE_HISTORY=节点留痕

PORT=8787
DINGTALK_API_BASE=https://api.dingtalk.com
```
