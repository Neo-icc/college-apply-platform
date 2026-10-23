# 升学指导协作体系 · 钉钉真实数据对接落地包

> 适用对象：石家庄图德教育科技有限公司 · 升学指导中心
> 配套系统：`college-guidance`（React Web 原型，已建成）
> 版本：v1.0（2026-10-17）
> 本包用途：先厘清"字段 + 流程 + 接口"三件事，再把 Web 原型接上真实钉钉数据。

---

## 目录

1. 目标与范围
2. 总体架构与数据通路
3. 环境与连通性实测
4. 钉钉开放平台接口基线（已核实）
5. 凭证与权限清单
6. 16 张表字段映射
7. 26 条流程 → 钉钉集成自动化 映射
8. 服务端代理设计（Phase 2 代码蓝图）
9. 前端接入方案（mock ↔ 真实 可切换）
10. 分阶段落地步骤
11. 风险与注意事项
12. 附录：待确认清单

---

## 1. 目标与范围

### 1.1 目标

让 `college-guidance` Web 原型**真读真写**钉钉侧的真实数据，形成读写闭环：

- 读：工单、节点、学生档案、材料、文书、方案、变更、规则库、口径库、院校、专业、关键日期、约谈、录取、问答 等数据来自真实多维表格；
- 写：节点状态流转、家长按钮确认、问答答复、材料核验、变更审批等动作回写多维表格。

### 1.2 明确不做（本轮）

- 不替换、不重建钉钉侧已有的 26 条自动化流程（原系统已运行、已实测通过）；
- 不在浏览器端暴露 `AppSecret`；
- 不改造钉钉 Base 的既有表结构（本包只做**映射与对接**，如需增删字段会单独列出）。

### 1.3 名词对齐（重要）

| 常见叫法 | 钉钉当前官方叫法 | 说明 |
|---|---|---|
| 多维表格 / Base | **AI 表格**（OpenAPI 路径仍为 `notable`） | 产品已改名，接口路径未变 |
| 集成自动化 | **集成自动化 / 连接器** | 钉钉工作流引擎，26 流程的载体 |
| AppKey / AppSecret | **Client ID / Client Secret** | 企业内部应用凭证 |
| 表 | **数据表（sheet）** | 一张数据表 = 原方案一张表 |

---

## 2. 总体架构与数据通路

### 2.1 架构图

```
┌──────────────────────────────────────────────────────────────┐
│                     浏览器（钉钉内 / PC）                       │
│  React 前端 college-guidance（老师端 / 家长端 / 学生端）           │
│    · 只调用自家后端 /api/*，绝不持有 AppSecret                    │
└───────────────▲──────────────────────────────┬────────────────┘
                │ ①HTTPS(JSON)                  │ ②HTTPS(JSON)
                │                                ▼
┌───────────────┴────────────────────────────────────────────────┐
│                服务端代理 server/（Node + Express）               │
│    · 缓存 access_token（2h，提前刷新）                            │
│    · 封装 AI表格 读写（notable）                                  │
│    · 统一错误码 / 重试 / 幂等（clientToken）                       │
└───────────────┬──────────────────────────────┬────────────────┘
                │ ③x-acs-dingtalk-access-token   │ ④Webhook/回调
                ▼                                ▲
┌──────────────────────────────────────┐  ┌──────────────────────┐
│      钉钉开放平台 api.dingtalk.com      │  │  钉钉集成自动化        │
│   · /v1.0/oauth2/accessToken          │  │  （26 条流程，钉钉侧）  │
│   · /v1.0/notable/bases/{baseId}/...   │  │  触发→条件→动作        │
└───────────────┬──────────────────────┘  └──────────▲───────────┘
                │ ⑤读写                                │
                ▼                                      │
         ┌──────────────────────────────────────────────┴───┐
         │            钉钉 AI 表格（原多维表格）                    │
         │   16 张数据表 · 一生一档 · 状态机留痕                    │
         └───────────────────────────────────────────────────┘
```

### 2.2 三条数据通路

| 通路 | 方向 | 承载内容 | 实现方式 |
|---|---|---|---|
| ① 前端 → 后端 | 浏览器 → server | 页面取数、状态提交 | 自家 REST `/api/*` |
| ② 后端 → 钉钉 | server → 开放平台 | token、表格读写 | `x-acs-dingtalk-access-token` |
| ③ 钉钉侧自动化 | 集成自动化 → 通知/回调 | 26 条提醒、确认、SLA | 钉钉侧既有流程（不改） |

### 2.3 为什么必须服务端代理（三条硬约束）

1. **密钥安全**：`Client Secret` 一旦进浏览器即等于泄露；钉钉要求"保管好 Client Secret"。
2. **CORS**：浏览器直连 `api.dingtalk.com` 会被跨域拦截，且钉钉不提供前端直连方案。
3. **token 生命周期**：`access_token` 有效期 7200 秒，需服务端缓存与续期，浏览器无法安全托管。

> 结论：**无论如何都要有一个服务端**。这也是本包 Phase 2 的代码交付物。

---

## 3. 环境与连通性实测

在开发沙箱内实测（已通过系统代理 `HTTP_PROXY` 出网）：

| 目标 | 命令 | 结果 |
|---|---|---|
| 钉钉旧版网关 | `curl -m12 https://oapi.dingtalk.com/gettoken` | **HTTP 200**（端点可达） |
| 钉钉新版网关 | `curl -m12 https://api.dingtalk.com/v1.0/contact/users/me` | **HTTP 400**（端点可达，因未带 token 故鉴权失败） |

结论：**沙箱可直连钉钉开放平台**，Phase 2 可实际联调（需真实凭证）。

---

## 4. 钉钉开放平台接口基线（已核实）

> 以下接口路径与参数字段均经官方文档核对，非推测。

### 4.1 获取 access_token

| 项 | 值 |
|---|---|
| URL | `POST https://api.dingtalk.com/v1.0/oauth2/accessToken` |
| 请求体 | `{ "appKey": "<Client ID>", "appSecret": "<Client Secret>" }` |
| 响应 | `{ "accessToken": "xxx", "expireIn": 7200 }` |
| 应用类型 | 企业内部应用 |
| 注意 | 有效期内重复获取返回相同值并自动续期；**务必自行缓存**，否则会被限流 |

同时兼容旧版：`GET https://oapi.dingtalk.com/gettoken?appkey=<>&appsecret=<>`（返回 `access_token` + `expires_in`）。**推荐用新版**。

### 4.2 AI 表格（多维表格）记录接口

所有 AI 表格接口统一前缀：`https://api.dingtalk.com/v1.0/notable/bases/{baseId}/sheets/{sheetIdOrName}`

| 操作 | Method | 路径 | 权限 |
|---|---|---|---|
| 列出多行记录 | `POST` | `/records/list?operatorId={unionId}` | AI 表格应用**读**权限 |
| 新增记录 | `POST` | `/records?operatorId={unionId}` | AI 表格应用**写**权限 |
| 更新多行记录 | `PUT` | `/records?operatorId={unionId}` | AI 表格应用**写**权限 |
| 获取所有数据表 | `GET` | 上级 `.../sheets` | AI 表格应用读权限 |
| 获取数据表 | `GET` | `.../sheets/{sheetIdOrName}` | AI 表格应用读权限 |
| 更新字段 | `PUT` | `.../fields/{fieldIdOrName}` | AI 表格应用写权限 |

**统一请求头**：`x-acs-dingtalk-access-token: <accessToken>`，`Content-Type: application/json`

**列出记录 请求体**：

```json
{
  "maxResults": 100,
  "nextToken": "",
  "filter": {
    "combination": "and",
    "conditions": [
      { "field": "状态", "operator": "equal", "value": ["进行中"] }
    ]
  }
}
```

- `maxResults` 默认 100，最大 100 → **分页必须循环 nextToken 直到 `hasMore=false`**
- `operator` 可选：`equal | notEqual | greater | greaterEqual | less | lessEqual | contain | notContain | empty | notEmpty`

**列出记录 响应体**：

```json
{
  "hasMore": true,
  "nextToken": "xxx",
  "records": [
    {
      "id": "qkexxx",
      "fields": { "字段名": "值" },
      "createdBy": { "unionId": "xxx" },
      "lastModifiedBy": { "unionId": "xxx" },
      "createdTime": 1728644688000,
      "lastModifiedTime": 1728644688000
    }
  ]
}
```

**新增记录 请求体**：

```json
{
  "records": [
    { "fields": { "学生ID": "S001", "节点名称": "建档与基线评估" } }
  ]
}
```

- `fields` 是 `Map<String, Any>`：key = **字段名（中文）**，value = 按字段类型传入的对应格式
- `clientToken`（查询参数，可选）= UUID v4，用于幂等，重复请求不重复执行 → **写回操作强烈建议携带**

### 4.3 operatorId（关键约束）

**所有 AI 表格接口都必须带 `operatorId`，值为操作人的 `unionId`**。

- 用途：钉钉用它做权限校验（该 unionId 必须对这份表格有权限）
- 获取途径：
  - 调 `查询用户详情` 接口拿 unionId
  - 或 `通过免登码获取用户信息` 拿 unionId
- **落地建议**：用一个固定的"系统操作人"（如企业管理员李胜）的 unionId 作为 `operatorId`，在 `.env` 里配置为 `DINGTALK_OPERATOR_ID`，避免每次调用都要查人。

### 4.4 错误码（排障速查）

| HttpCode | 错误码 | 含义 | 处置 |
|---|---|---|---|
| 400 | `invalidRequest.inputArgs.invalid` | 参数不合法 | 检查字段名/值格式 |
| 400 | `invalidRequest.document.stillInitializing` | 文档初始化中 | 稍后重试 |
| 403 | `forbidden.operationIllegal` | 无权限 | 检查应用权限点 + operatorId 权限 |
| 403 | `invalidRequest.document.typeIllegal` | 文档类型不支持 | 检查 baseId 是否 AI 表格 |
| 404 | `invalidRequest.document.notFound` | baseId 不存在或无权访问 | 检查 baseId 与 operatorId |
| 404 | `invalidRequest.resource.notFound` | 资源不存在 | 记录/表已被删 |
| 409 | `invalidRequest.duplicateClientToken` | 幂等键重复 | 换新 clientToken |
| 500/504 | `internalError` / `service.timeout` | 系统/超时 | 指数退避重试 |

---

## 5. 凭证与权限清单

### 5.1 需要你提供的凭证（**Phase 2 前必须给到**）

| # | 凭证 | 从哪拿 | 用途 |
|---|---|---|---|
| 1 | `Client ID`（原 AppKey） | 钉钉开发者后台 → 应用详情 → 凭证与基础信息 | 换取 access_token |
| 2 | `Client Secret`（原 AppSecret） | 同上 | 换取 access_token |
| 3 | `AI 表格 baseId` | 打开该多维表格 → URL 中取 / 用接口获取 | 定位整份表格 |
| 4 | 各数据表 `sheetId`（或表名） | 调"获取所有数据表"接口 | 定位 16 张表 |
| 5 | `operatorId`（unionId） | 查询用户详情 / 免登码 | 表格 API 权限校验 |

### 5.2 开发者后台需开通的权限点

| 权限 | 用途 | 是否必须 |
|---|---|---|
| `AI 表格应用读权限` | 读取 16 表 | 必须 |
| `AI 表格应用写权限` | 状态回写、确认留痕 | 必须 |
| 通讯录 / 用户信息读取（查询用户详情） | 拿 unionId；家长手机号绑定时算 unionId | 建议 |
| 工作通知 / 企业消息（可选） | 若后端要直接推钉钉消息 | 可选 |
| 企业内部应用"调用企业 API 基本权限" | token 接口前置 | 必须 |

### 5.3 `.env` 配置模板（Phase 2 落地）

```dotenv
# ---- 钉钉应用凭证（企业内部应用）----
DINGTALK_CLIENT_ID=dingeqqpkv3xxxxxx
DINGTALK_CLIENT_SECRET=GT-lsu-taDAxxxsTsxxxx

# ---- AI 表格定位 ----
DINGTALK_BASE_ID=qnYxxxxxxxxxx        # 整份多维表格的 baseId

# ---- 系统操作人 unionId（表格接口必带）----
DINGTALK_OPERATOR_ID=xxxxxxxxxxxxxxxxx

# ---- 16 张表的 sheetId（或直接用中文表名）----
SHEET_WORK_ORDER=工单
SHEET_NODE_TEMPLATE=节点模板
SHEET_STUDENT=学生档案
SHEET_MATERIAL=材料清单
SHEET_ESSAY=文书素材
SHEET_PLAN_VERSION=方案版本
SHEET_CHANGE=变更记录
SHEET_RULE_CARD=规则库
SHEET_CALIBER=口径库
SHEET_UNIVERSITY=重点院校清单
SHEET_MAJOR=专业库
SHEET_KEY_DATE=关键日期
SHEET_INTERVIEW=约谈记录
SHEET_ADMISSION=录取结果
SHEET_QA=家长问答

# ---- 服务端 ----
PORT=8787
DINGTALK_API_BASE=https://api.dingtalk.com
```

> `Client Secret` 属于敏感信息：只写入**服务端** `.env`，并加入 `.gitignore`，**绝不进前端代码或构建产物**。

---

## 6. 16 张表字段映射

> 约定：钉钉字段类型以 AI 表格后台实际为准。`值格式` 指调用"新增/更新记录"时 `fields` 里应传的值形态。
> ⚠️ 标记表示：需与真实表格核对字段名是否完全一致（中文字段名是 API 的 key，**错一个字即失败**）。

### 6.1 工单（WorkOrder）

| 字段名 | 类型 | 钉钉字段类型 | 值格式 | 说明 |
|---|---|---|---|---|
| 工单ID | string | 单行文本 | `"WO001"` | 主键 |
| 学生ID | string | 单行文本 | `"S001"` | 关联学生档案 |
| 学生姓名 | string | 单行文本 | `"张子轩"` | |
| 年级 | string | 单选 | `"G11"` | G12/G11/G10 |
| 模板类型 | string | 单选 | `"full"` | full=23节点 / emergency=8节点 |
| 工单状态 | string | 单选 | `"active"` | active/frozen/closed |
| 创建时间 | string(ISO) | 日期 | 毫秒时间戳 | |
| 主顾问 | string | 单行文本/人员 | `"李胜"` | |
| 备顾问 | string | 单行文本/人员 | `"小雪"` | AB角 |
| 当前节点序号 | number | 数字 | `4` | |
| 进度 | number | 数字 | `18` | 0-100 |
| 最后更新 | string(ISO) | 日期 | 毫秒时间戳 | |
| 家长账号 | string | 单行文本 | unionId 或空 | 空=未绑定，走人工通道 |

### 6.2 节点模板（NodeTemplate）

| 字段名 | 类型 | 钉钉字段类型 | 值格式 |
|---|---|---|---|
| 模板节点ID | string | 单行文本 | `"f-01"` |
| 序号 | number | 数字 | `1` |
| 模板类型 | string | 单选 | `full`/`emergency` |
| 节点名称 | string | 单行文本 | `"建档与基线评估"` |
| 节点说明 | string | 多行文本 | |
| 负责角色 | string | 单选 | advisor/essay_teacher/application_teacher/visa_teacher/parent/student |
| 时长(天) | number | 数字 | `3` |
| 需家长确认 | boolean | 复选框 | `false` |
| 分类 | string | 单选 | planning/materials/essay/application/visa/followup |
| 交付物 | string | 单行文本 | `"学生基线评估表"` |

### 6.3 工单节点（WorkOrderNode）— **最核心，读写最频繁**

| 字段名 | 类型 | 钉钉字段类型 | 值格式 |
|---|---|---|---|
| 节点ID | string | 单行文本 | `"WO001-N01"` |
| 工单ID | string | 单行文本 | 关联工单 |
| 序号 | number | 数字 | |
| 节点名称 | string | 单行文本 | |
| 节点说明 | string | 多行文本 | |
| 负责角色 | string | 单选 | |
| 负责人 | string | 单行文本 | |
| 节点状态 | string | 单选 | not_started/in_progress/pending_confirm/completed/overdue/stalled |
| 开始时间 | string(ISO) | 日期 | 毫秒时间戳 |
| 截止时间 | string(ISO) | 日期 | 毫秒时间戳 |
| 完成时间 | string(ISO) | 日期 | |
| 需家长确认 | boolean | 复选框 | |
| 家长已确认 | boolean | 复选框 | |
| 家长确认时间 | string(ISO) | 日期 | |
| 交付物 | string | 单行文本 | |
| 操作留痕 | string | 多行文本 | JSON 字符串数组（或独立"节点留痕"表） |

> ⚠️ **留痕建议**：`history[]` 若是数组，钉钉字段不好直接存。建议**另建一张"节点留痕"表**（字段：节点ID / 时间 / 动作 / 操作人 / 备注），读写更规范。本包 6.17 给出该表。

### 6.4 学生档案（Student）

| 字段名 | 类型 | 钉钉字段类型 | 值格式 |
|---|---|---|---|
| 学生ID | string | 单行文本 | `"S001"` |
| 姓名 | string | 单行文本 | |
| 年级 | string | 单选 | |
| 目标地区 | string[] | 多选 | `["UK","HK"]` |
| 当前学校 | string | 单行文本 | |
| GPA | string | 单行文本 | `"3.8/4.0"` |
| 语言成绩 | string | 多行文本 | `"IELTS 7.0; A-Level A*AA"` |
| 家长姓名 | string | 单行文本 | |
| 家长手机 | string | 电话 | `"138****6688"` |
| 家长unionId | string | 单行文本 | |
| 顾问 | string | 单行文本 | |
| 入学时间 | string(ISO) | 日期 | |
| 标签 | string[] | 多选 | `["理科强","竞赛"]` |

### 6.5 材料清单（MaterialItem）

| 字段名 | 类型 | 钉钉字段类型 |
|---|---|---|
| 材料ID | string | 单行文本 |
| 学生ID | string | 单行文本 |
| 材料名称 | string | 单行文本 |
| 材料分类 | string | 单选（academic/language/personal/financial/other） |
| 材料状态 | string | 单选（pending/submitted/verified/rejected） |
| 提交时间 | string(ISO) | 日期 |
| 核验时间 | string(ISO) | 日期 |
| 备注 | string | 多行文本 |

### 6.6 文书素材（EssayMaterial）

| 字段名 | 类型 | 钉钉字段类型 |
|---|---|---|
| 素材ID | string | 单行文本 |
| 学生ID | string | 单行文本 |
| 素材类型 | string | 单选（个人陈述素材/活动列表/推荐信…） |
| 内容 | string | 多行文本 |
| 状态 | string | 单选（draft/submitted/confirmed） |
| 提交时间 | string(ISO) | 日期 |

### 6.7 方案版本（PlanVersion）

| 字段名 | 类型 | 钉钉字段类型 |
|---|---|---|
| 方案ID | string | 单行文本 |
| 学生ID | string | 单行文本 |
| 版本号 | string | 单行文本 |
| 院校清单 | string | 多行文本（JSON，含 name/region/major/tier） |
| 方案状态 | string | 单选（draft/frozen/superseded） |
| 创建时间 | string(ISO) | 日期 |
| 冻结时间 | string(ISO) | 日期 |
| 备注 | string | 多行文本 |

### 6.8 变更记录（ChangeRecord）

| 字段名 | 类型 | 钉钉字段类型 |
|---|---|---|
| 变更ID | string | 单行文本 |
| 学生ID | string | 单行文本 |
| 工单ID | string | 单行文本 |
| 变更类型 | string | 单选 |
| 变更前 | string | 单行文本 |
| 变更后 | string | 单行文本 |
| 连锁影响 | string | 多行文本 |
| 审批状态 | string | 单选（pending_approval/approved/rejected/parent_confirmed） |
| 审批人 | string | 单行文本 |
| 家长确认时间 | string(ISO) | 日期 |
| 创建时间 | string(ISO) | 日期 |
| 操作人 | string | 单行文本 |

### 6.9 规则库 / 核对卡（RuleCard）

| 字段名 | 类型 | 钉钉字段类型 |
|---|---|---|
| 核对卡ID | string | 单行文本 |
| 院校名称 | string | 单行文本 |
| 专业 | string | 单行文本 |
| 地区 | string | 单选 |
| 要求明细 | string | 多行文本（JSON：item/value/source/confidence） |
| 核实时间 | string(ISO) | 日期 |
| 核实人 | string | 单行文本 |

### 6.10 口径库（CaliberItem）

| 字段名 | 类型 | 钉钉字段类型 |
|---|---|---|
| 口径ID | string | 单行文本 |
| 口径编号 | string | 单行文本 | `"K-001"` |
| 分类 | string | 单选 |
| 问题 | string | 单行文本 |
| 答复 | string | 多行文本 |
| 更新时间 | string(ISO) | 日期 |
| 是否生效 | boolean | 复选框 |

### 6.11 重点院校清单（University）

| 字段名 | 类型 | 钉钉字段类型 |
|---|---|---|
| 院校ID | string | 单行文本 |
| 院校名称 | string | 单行文本 |
| 英文名 | string | 单行文本 |
| 地区 | string | 单选（UK/HK/AU/CA） |
| QS排名 | number | 数字 |
| 标识色 | string | 单行文本 |

### 6.12 专业库（Major）

| 字段名 | 类型 | 钉钉字段类型 |
|---|---|---|
| 专业ID | string | 单行文本 |
| 专业名称 | string | 单行文本 |
| 英文名 | string | 单行文本 |
| 分类 | string | 单选（理工科/商科/社科/艺术/医学/法学） |
| 地区 | string | 单选 |

### 6.13 关键日期（KeyDate）

| 字段名 | 类型 | 钉钉字段类型 |
|---|---|---|
| 日期ID | string | 单行文本 |
| 标题 | string | 单行文本 |
| 日期 | string(ISO) | 日期 |
| 地区 | string | 单选 |
| 类型 | string | 单选（deadline/exam/event/maintenance） |
| 是否已核实 | boolean | 复选框 | ← 提醒开关 |
| 核实时间 | string(ISO) | 日期 |
| 备注 | string | 多行文本 |

### 6.14 约谈记录（InterviewRecord）

| 字段名 | 类型 | 钉钉字段类型 |
|---|---|---|
| 约谈ID | string | 单行文本 |
| 学生ID | string | 单行文本 |
| 约谈时间 | string(ISO) | 日期 |
| 参与人 | string | 多行文本 |
| 主题 | string | 单行文本 |
| 纪要 | string | 多行文本 |
| 决议 | string | 多行文本 |
| 状态 | string | 单选（scheduled/completed/parent_confirmed） |
| 家长确认时间 | string(ISO) | 日期 |

### 6.15 录取结果（AdmissionResult）

| 字段名 | 类型 | 钉钉字段类型 |
|---|---|---|
| 录取ID | string | 单行文本 |
| 学生ID | string | 单行文本 |
| 学生姓名 | string | 单行文本 |
| 院校名称 | string | 单行文本 |
| 专业 | string | 单行文本 |
| 地区 | string | 单选 |
| 录取结果 | string | 单选（offer/rejected/waiting/pending） |
| 奖学金 | string | 单行文本 |
| 收到时间 | string(ISO) | 日期 |
| 家长已知悉 | boolean | 复选框 |
| 知悉时间 | string(ISO) | 日期 |

### 6.16 家长问答（QAThread）

| 字段名 | 类型 | 钉钉字段类型 |
|---|---|---|
| 问答ID | string | 单行文本 |
| 学生ID | string | 单行文本 |
| 学生姓名 | string | 单行文本 |
| 问题 | string | 多行文本（必填） |
| 提问时间 | string(ISO) | 日期 |
| 提问人 | string | 单行文本（必填） |
| 状态 | string | 单选（pending/answered/overdue） | ← 家长端**隐藏**此字段 |
| 答复 | string | 多行文本 | ← 家长端**隐藏** |
| 答复时间 | string(ISO) | 日期 | ← 家长端**隐藏** |
| 答复人 | string | 单行文本 | ← 家长端**隐藏** |
| 引用口径编号 | string | 单行文本 | |
| SLA(小时) | number | 数字 | `24` |

> 注：原方案 7 章补已记录"问答表四个内部字段（状态/答复内容/答复人/答复时间）已隐藏，姓名与问题内容设为必填"——本表沿用该设置。

### 6.17 【建议新增】节点留痕表（NodeHistory）

原方案的 `history[]` 数组在钉钉表格里不好维护，建议独立成表：

| 字段名 | 类型 | 钉钉字段类型 |
|---|---|---|
| 留痕ID | string | 单行文本 |
| 节点ID | string | 单行文本 |
| 时间 | string(ISO) | 日期 |
| 动作 | string | 单行文本 |
| 操作人 | string | 单行文本 |
| 备注 | string | 多行文本 |

> 另：通知（Notification）不需要建表——由钉钉侧"集成自动化 + 工作通知"直接推送，前端通知中心改为读**接口聚合结果**即可。

---

## 7. 26 条流程 → 钉钉集成自动化 映射

> 原则：**钉钉侧既有流程不动**。本节是"核对清单"——确保原方案 26 条流程在钉钉侧都有对应载体；Web 端只消费其结果。

| 组 | 流程 | 钉钉侧触发方式 | 条件 | 动作 |
|---|---|---|---|---|
| 进度透明 | 节点完成接力通知 | 数据表记录更新（节点状态=已完成） | 状态由非完成→已完成 | 通知下一节点负责人 |
| 进度透明 | 到期自动标记逾期并预警 | 定时（每日 08:00） | 截止时间<今天 且 状态∈{未开始,进行中} | 更新状态=已逾期 + 通知负责人 |
| 进度透明 | 临期提前 3 天提醒 | 定时（每日 08:00） | 截止时间-今天=3 | 通知负责人 |
| 进度透明 | 节点停滞 7 天预警 | 定时（每日 08:00） | 开始时间距今≥7 且 状态=进行中 | 通知负责人 |
| 进度透明 | 周五进度周报 | 定时（周五 17:00） | 无（无进展也发） | 汇总推送 |
| 家长确认 | 节点确认请求 | 记录更新（状态=待家长确认） | 需家长确认=true | 直达家长卡片（有账号）/转负责人（无账号） |
| 家长确认 | 变更批准后家长书面确认 | 记录更新（审批状态=approved） | — | 家长确认卡片 |
| 家长确认 | 约谈纪要确认 | 记录更新（约谈状态=completed） | — | 推送纪要 + 确认按钮 |
| 家长确认 | 录取结果知悉确认 | 记录新增（录取结果=offer） | — | 直达双发 + 知悉按钮 |
| 日期周期 | 关键日期 14 天倒计时 | 定时（每日 08:00） | 是否已核实=true 且 距今≤14 | 推送 |
| 日期周期 | 前 1 天提醒 | 定时（每日 08:00） | 是否已核实=true 且 距今=1 | 推送 |
| 日期周期 | 每月维护提醒 | 定时（每月首个工作日） | — | 通知行政岗 |
| 通道闭环 | 家长问答：提问即时通知 | 记录新增（问答表） | — | 通知顾问（24h SLA 起算） |
| 通道闭环 | 家长问答：答复推送 | 记录更新（状态=answered） | — | 推送家长 + 提示登记口径编号 |
| 通道闭环 | 素材问卷提交回执 | 记录新增（文书素材/问卷） | — | 回执学生 |
| 通道闭环 | 材料补正提醒 | 记录更新（材料状态=rejected） | — | 通知学生/家长 |
| 通道闭环 | 规则入库提醒 | 记录新增（规则库） | — | 通知复核人 |
| 通道闭环 | 政策变更影响面预警 | 定时/规则库变更 | 核对卡超 30 天 | 降置信度 + 预警 |
| 建档初始化 | 新生 23 节点自动生成 | 记录新增（学生档案，年级=G11/G10） | — | 按 full 模板批量生成节点 |
| 建档初始化 | 高三 8 节点自动生成 | 记录新增（学生档案，年级=G12） | — | 按 emergency 模板生成 |
| 驾驶舱 | 每日 08:30 晨报 | 定时（每日 08:30） | — | 逐条推送逾期 + 待确认 |

> 说明：上表为原方案 26 条的收敛核对版（部分细条目合并展示）。**钉钉侧配置以现有实际为准**，本表用于交叉验证是否有遗漏。

---

## 8. 服务端代理设计（Phase 2 代码蓝图）

### 8.1 目录结构

```
college-guidance/
├── server/                       # 新增：服务端代理
│   ├── index.js                  # Express 入口
│   ├── dingtalk.js               # 钉钉客户端（token 缓存 + notable 读写）
│   ├── routes/
│   │   ├── workorders.js         # 工单 + 节点
│   │   ├── students.js           # 学生 + 材料 + 文书 + 方案 + 变更
│   │   ├── library.js            # 规则库 + 口径库 + 院校 + 专业
│   │   ├── qa.js                 # 家长问答
│   │   ├── dates.js              # 关键日期
│   │   └── admissions.js         # 录取结果
│   └── .env.example
├── src/services/                 # 新增：前端数据源
│   ├── http.js                   # fetch 封装
│   ├── dataSource.js             # mock ↔ 真实 数据源抽象
│   └── dingtalkApi.js            # 调用自家后端 /api/*
└── .env                          # （服务端）真实凭证，gitignore
```

### 8.2 dingtalk.js 关键实现要点

```js
// 伪代码要点（Phase 2 落地）
let cache = { token: null, expireAt: 0 }

async function getAccessToken() {
  if (cache.token && Date.now() < cache.expireAt - 60_000) return cache.token
  const r = await fetch('https://api.dingtalk.com/v1.0/oauth2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appKey: process.env.DINGTALK_CLIENT_ID,
      appSecret: process.env.DINGTALK_CLIENT_SECRET,
    }),
  })
  const { accessToken, expireIn } = await r.json()
  cache = { token: accessToken, expireAt: Date.now() + expireIn * 1000 }
  return accessToken
}

function headers(token) {
  return { 'x-acs-dingtalk-access-token': token, 'Content-Type': 'application/json' }
}

const base = (sheet) =>
  `${process.env.DINGTALK_API_BASE}/v1.0/notable/bases/${process.env.DINGTALK_BASE_ID}/sheets/${encodeURIComponent(sheet)}`

// 分页拉全量
async function listAll(sheet, filter) {
  const token = await getAccessToken()
  let nextToken = '', out = []
  do {
    const r = await fetch(`${base(sheet)}/records/list?operatorId=${process.env.DINGTALK_OPERATOR_ID}`, {
      method: 'POST', headers: headers(token),
      body: JSON.stringify({ maxResults: 100, nextToken, filter }),
    })
    const d = await r.json()
    out.push(...(d.records || []))
    nextToken = d.hasMore ? d.nextToken : ''
  } while (nextToken)
  return out
}

// 新增（幂等）
async function addRecord(sheet, fields) {
  const token = await getAccessToken()
  const clientToken = crypto.randomUUID()
  const r = await fetch(
    `${base(sheet)}/records?operatorId=${process.env.DINGTALK_OPERATOR_ID}&clientToken=${clientToken}`,
    { method: 'POST', headers: headers(token), body: JSON.stringify({ records: [{ fields }] }) }
  )
  return r.json()
}

// 更新多行
async function updateRecords(sheet, records) {
  const token = await getAccessToken()
  const r = await fetch(`${base(sheet)}/records?operatorId=${process.env.DINGTALK_OPERATOR_ID}`,
    { method: 'PUT', headers: headers(token), body: JSON.stringify({ records }) })
  return r.json()
}
```

### 8.3 后端端点清单（前端只需这些）

| 端点 | Method | 作用 |
|---|---|---|
| `/api/health` | GET | 连通性 + token 自检 |
| `/api/workorders` | GET | 全部工单 + 节点 |
| `/api/workorders/:id/nodes/:nodeId/status` | PATCH | 更新节点状态（回写） |
| `/api/workorders/:id/nodes/:nodeId/confirm` | POST | 家长确认（回写 + 留痕） |
| `/api/students` | GET | 学生 + 材料 + 文书 + 方案 + 变更 |
| `/api/materials/:id/verify` | POST | 材料核验（回写） |
| `/api/plans/:id/freeze` | POST | 方案冻结（回写） |
| `/api/changes/:id/approve` | POST | 变更审批（回写） |
| `/api/qa` | GET | 问答列表 |
| `/api/qa/:id/answer` | POST | 答复（回写 + 口径编号） |
| `/api/dates` / `/api/library` / `/api/admissions` | GET | 只读 |

### 8.4 写回幂等与并发

- 所有**写操作**携带 `clientToken`（UUID v4）防重复；
- 节点状态更新前先 `GET` 校验当前状态，避免"待家长确认"被误标逾期（对应原方案 7 章补的 WF2/WF5 修复）；
- 家长确认采用"读-改-写"，成功后写 `家长已确认=true` + `家长确认时间` + 追加留痕表记录。

---

## 9. 前端接入方案（mock ↔ 真实 可切换）

### 9.1 数据源抽象

当前 `src/store/useStore.ts` 里 16 个数组全部来自 `MOCK_*`。改造方式：

```js
// src/services/dataSource.js
import { MOCK_STUDENTS, MOCK_WORK_ORDERS, /* ... */ } from '../data/mockData'

const USE_REAL = import.meta.env.VITE_USE_REAL_DATA === 'true'

export async function loadAll() {
  if (!USE_REAL) return { students: MOCK_STUDENTS, workOrders: MOCK_WORK_ORDERS, /* ... */ }
  const [students, workorders, library, qa, dates, admissions] = await Promise.all([
    http.get('/api/students'),
    http.get('/api/workorders'),
    http.get('/api/library'),
    http.get('/api/qa'),
    http.get('/api/dates'),
    http.get('/api/admissions'),
  ])
  return { students, workOrders: workorders, /* ... */ }
}
```

### 9.2 useStore 改造

给 store 增加一个 `loadAll()` action，在 `App` 挂载时调用一次：

```js
loadAll: async () => {
  const data = await loadAll()
  set(state => ({ ...state, ...data, loaded: true }))
}
```

- 开关：`.env.development` 里 `VITE_USE_REAL_DATA=false`（默认 mock，演示不受影响）；`.env.production` 或对接环境设为 `true`。
- **演示兜底**：真实接口失败时自动回退 mock，保证页面永远可用。

### 9.3 前端写操作改造

`updateNodeStatus` / `confirmByParent` / `answerQA` / `verifyMaterial` / `freezePlan` / `approveChange` 等方法内部：

1. 先乐观更新本地 state（保持现有交互手感）；
2. 再 `POST/PATCH` 到后端；
3. 失败则回滚并提示。

---

## 10. 分阶段落地步骤

| 阶段 | 动作 | 交付物 | 前置 |
|---|---|---|---|
| **P0** | 提供凭证（Client ID/Secret、baseId、operatorId、sheetId） | 填好的 `.env` | 你 |
| **P1** | 搭 `server/`，实现 `/api/health` + token 自检 | 可连通钉钉 | P0 |
| **P2** | 实现"列出记录"全表拉取，替换前端 mock | 只读打通 | P1 |
| **P3** | 实现写回（状态/确认/答复/材料/方案/变更） | 读写闭环 | P2 |
| **P4** | 字段名逐表比对校准（中文字段名易错） | 校准报告 | P2 |
| **P5** | 联调 26 流程结果消费（通知中心接聚合接口） | 通知真实化 | P3 |
| **P6** | 灰度：先老师端只读 → 再开放家长确认写回 | 上线 | P3 |

**建议先做 P0→P2**（只读打通），风险最低、见效最快；确认无误后再做 P3 写回。

---

## 11. 风险与注意事项

| 风险 | 影响 | 应对 |
|---|---|---|
| 中文字段名不匹配 | 读写全部失败 | P4 逐表比对；或后端统一做"字段名容错映射" |
| operatorId 权限不足 | 403 无权限 | 用管理员 unionId；确认该账号对表格有编辑权 |
| access_token 频繁获取被限流 | 429/失败 | 服务端缓存 + 提前 60s 刷新 |
| 写回幂等缺失导致重复 | 重复记录 | 全部写操作带 clientToken |
| 家长 unionId 缺失 | 无法直达推送 | 原方案已设计"双通道"：无账号转负责人 |
| 分页未循环 | 只读到前 100 条 | listAll 必须循环 nextToken |
| 浏览器暴露密钥 | 安全事故 | 密钥只进服务端 .env，前端零凭证 |
| 表结构与原方案偏差 | 映射不准 | P4 校准，必要时补字段 |
| 家长行级权限 | 越权可见他人数据 | baseId 当前未做行级过滤，需在**后端**按 unionId 过滤（见附录） |

---

## 12. 附录：待确认清单（Phase 2 开工前）

请提供 / 确认以下信息：

1. **应用凭证**：Client ID、Client Secret（敏感，可私发）
2. **表格定位**：AI 表格 baseId；16 张表的 sheetId 或中文表名
3. **系统操作人**：一个对表格有编辑权限的账号 unionId（建议李胜）
4. **字段名核对**：真实表格的中文字段名是否与本文档第 6 章完全一致（逐表）
5. **表结构确认**：
   - 工单节点是否已有独立"留痕表"？若无，是否同意新增 6.17 表？
   - 通知是否走钉钉集成自动化推送？（决定前端通知中心是读接口还是读表）
6. **行级权限**：家长端访问时，后端是否按 `家长unionId ↔ 学生ID` 过滤？
7. **部署**：服务端部署在哪里（本机/服务器/内网）？是否需要 HTTPS？

---

## 附：已核实的官方文档链接

- 获取企业内部应用 accessToken：https://open.dingtalk.com/document/development/obtain-the-access-token-of-an-internal-app
- 新增记录：https://open.dingtalk.com/document/development/api-notable-insertrecords
- 列出多行记录：https://open.dingtalk.com/document/orgapp/api-notable-listrecords
- 更新多行记录：https://open.dingtalk.com/document/orgapp/api-noatable-updaterecords
- 更新字段：https://open.dingtalk.com/document/development/api-noatable-updatefield
- 数据结构（记录值格式）：https://open.dingtalk.com/document/development/data-structure
- 连接器（多维表动作，用于集成自动化）：https://open.dingtalk.com/document/connection/overview-6
