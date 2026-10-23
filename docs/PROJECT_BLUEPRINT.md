# 升学指导协作体系 · 项目总览与可复现蓝图

> 适用对象：任何接手本项目的 AI / 开发人员
> 配套仓库：`/workspace/college-guidance`
> 写作原则：**所有事实均可追溯到仓库文件**；不存在的内容明确标注"未建"，不因模板而编造。
> 更新时间：2026-10-22

---

## 0. 快速身份卡（给新 AI 第一分钟阅读）

| 项 | 值 |
|---|---|
| 项目名 | 升学指导协作体系（college-guidance） |
| 客户 | 石家庄图德教育科技有限公司 · 升学指导中心 |
| 核心场景 | 23/8 节点升学流程状态机 + 三端 Web 原型（老师/家长/学生） + 钉钉 AI 表格读写 |
| 运行形态 | React Vite 前端 + Express 服务端代理 + 钉钉开放平台 AI 表格（notable） |
| 数据源 | mock 内置（默认） ↔ 钉钉真实数据（开关切换） |
| 当前阶段 | 原型 + 服务端代理骨架已就绪，**钉钉凭证待提供**，接入"待命" |
| 启动命令 | 前端：`npm run dev`；服务端：`npm run server` |
| 凭证开关 | `.env.development` 中 `VITE_USE_REAL_DATA=false`（改 `true` 即走钉钉） |

---

## 1. 技术栈与依赖（精确）

### 1.1 前端
- React 19.2.8 + React Router DOM 7.18.4
- Vite 8.3.0 + TypeScript 6.0.2
- Zustand 5.0.15（全局状态管理）
- Tailwind CSS 3.4.19 + shadcn/ui 风格基础组件（Card / Button / Badge / Progress…）
- Recharts 3.10.1（图表）
- lucide-react 1.58.0（图标）
- Radix UI 8 个（Dialog/Dropdown/Progress/ScrollArea/Select/Separator/Tabs/Tooltip）
- date-fns 4.4.0（日期工具）

### 1.2 服务端（Node + Express）
- Express 5.3.0 + cors 2.8.6 + dotenv 18.0.8
- 原生 `node:crypto.randomUUID` 做 clientToken 幂等
- ESM 模块（`"type": "module"`）

### 1.3 运行形态
- 前端 dev server 默认 5173，Vite 代理 `/api` → `localhost:8787`
- 服务端 Express 监听 PORT（默认 8787）
- 生产部署：前端 `vite build` + 服务端独立进程，或用 Nginx 把 `/api` 反向代理到服务端

---

## 2. 完整文件地图（按职责分组）

```
college-guidance/
├── docs/
│   ├── dingtalk-integration-plan.md        # 【核心规范】钉钉对接落地包（架构/接口基线/16表映射/26流程）
│   ├── dingtalk-config-package.md          # 【P0 交付物】配置包（凭证+字段核对+权限+结构事项）
│   └── dingtalk-go-live-runbook.md         # 钉钉侧上线操作手册（Runbook）
│
├── server/                                  # 【服务端代理】仅 Express + 钉钉客户端，无数据库
│   ├── index.js                             # 入口：health/sheets + 4 业务路由组 + 统一错误处理
│   ├── dingtalk.js                          # 钉钉客户端：token 缓存 + 并发去重 + notable 读写封装
│   ├── mapper.js                            # 字段序列化：前端对象 <↔ 钉钉 fields（json/date/bool/number/codec）
│   ├── fieldMap.js                          # 【唯一需按真实表微调的文件】17 表字段映射配置
│   ├── repo.js                              # 仓储层：按业务主键读写，路由不碰字段名
│   ├── .env.example                         # 凭证模板
│   └── routes/
│       ├── workorders.js                    # /api/workorders + 节点状态更新 + 家长确认 + 进度重算
│       ├── students.js                      # /api/students + 材料核验 + 方案冻结 + 变更审批
│       ├── library.js                       # /api/library + /api/dates + /api/interviews + /api/admissions
│       └── qa.js                            # /api/qa + 答复回写
│
├── src/
│   ├── main.tsx                             # 入口
│   ├── App.tsx                              # 路由 + useEffect → store.loadAll()
│   ├── index.css                            # Tailwind
│   ├── types/index.ts                       # 16 张表 TypeScript 类型（与钉钉字段映射一一对齐）
│   ├── engine/index.ts                      # 状态机/日期判定/SLA/提醒生成器/晨报生成
│   ├── data/
│   │   ├── nodeTemplates.ts                 # 23 节点完整模板 + 8 应急模板
│   │   └── mockData.ts                      # 全量 mock 数据（5 学生 / 5 工单 / 所有表）
│   ├── store/useStore.ts                    # Zustand 全局状态 + 操作方法 + 真实数据 loadAll + 写回推送
│   ├── services/
│   │   ├── http.ts                          # fetch 封装（BASE from VITE_API_BASE）
│   │   ├── dingtalkApi.ts                   # 调用自家后端 /api/*（只读 + 写回方法表）
│   │   └── dataSource.ts                    # mock ↔ 真实 数据源抽象（USE_REAL 开关 + 自动回退）
│   ├── components/
│   │   ├── layout/ (AppLayout / Header / Sidebar)
│   │   └── ui/ (Button / Badge / Card)
│   ├── pages/                               # 11 个页面
│   │   ├── Login.tsx                        # 角色切换（teacher / parent / student）
│   │   ├── Dashboard.tsx                    # 管理驾驶舱（10 图表 + 晨报 + 预警）
│   │   ├── WorkOrders.tsx                   # 工单列表 + 工单详情（23 节点时间线 + 状态流转 + 留痕）
│   │   ├── Students.tsx                     # 学生列表 + 学生详情（材料核验/文书/方案冻结/变更）
│   │   ├── QA.tsx                           # 家长问答（24h SLA + 口径库编号引用）
│   │   ├── KeyDates.tsx                     # 关键日期（14 天倒计时 + 前 1 天提醒 + 已核实机制）
│   │   ├── Library.tsx                      # 知识库（核对卡 + 口径库 + 院校 + 专业）
│   │   ├── Admissions.tsx                   # 录取结果
│   │   ├── ParentDashboard.tsx              # 家长端
│   │   ├── StudentDashboard.tsx             # 学生端
│   │   └── ConfirmationCenter.tsx           # 家长确认中心（节点/变更/录取 + 按钮留痕）
│   └── lib/utils.ts                         # cn() 类名合并
│
├── .env.development                         # 前端：VITE_USE_REAL_DATA=false（默认 mock）
├── vite.config.ts                           # /api 代理到 localhost:8787
├── tsconfig.app.json                        # TS 配置
├── tailwind.config.js                       # Tailwind
├── .gitignore                               # 屏蔽 server/.env 与 .env
└── package.json                             # dev / server / build / lint / preview
```

---

## 3. 开发全流程回溯（分阶段、按事实）

### Phase 0 · 原型构建（已完成）
| 步骤 | 动作 | 产物 |
|---|---|---|
| 0-1 | 立项：图德教育·升学指导中心，核心需求为 23 节点状态机 + 三端 + 钉钉 Base | 需求口头对齐 |
| 0-2 | 技术选型：Vite + React + TS + Tailwind + shadcn 风格 + Zustand + Recharts | 技术栈确定 |
| 0-3 | 类型层：`src/types/index.ts` 定义 16 张表 TS 类型 | 数据契约 |
| 0-4 | 节点模板：23 节点完整模板（full）+ 8 应急节点（emergency） | `nodeTemplates.ts` |
| 0-5 | mock 数据：5 学生 / 5 工单 / 所有表全覆盖 | `mockData.ts` |
| 0-6 | 核心引擎：状态机（6 状态）/ 日期判定 / SLA 24h / 提醒生成器 / 晨报生成 | `engine/index.ts` |
| 0-7 | Store：Zustand 统一管理 16 个数组 + 操作方法 | `useStore.ts` |
| 0-8 | 三端页面：登录角色切换、驾驶舱、工单、学生、问答、日期、知识库、录取、家长端、学生端、确认中心 | 11 页面 |
| 0-9 | 构建验证：`tsc -b && vite build` 通过；浏览器验证四页均渲染、零控制台错误 | 原型可用 |

### Phase 1 · 钉钉对接规划（已完成）
| 步骤 | 动作 | 产物 |
|---|---|---|
| 1-1 | 用户提出"对接钉钉真实数据" | 需求升级 |
| 1-2 | 环境连通性实测：curl 验证沙箱可直连 `api.dingtalk.com` | 技术可行性确认 |
| 1-3 | 钉钉官方文档抓取与核对：accessToken 接口、notable 记录接口、错误码、operatorId 约束 | 接口基线核实 |
| 1-4 | 用户选择"两者都要，先文档后代码" | 实施路径决策 |
| 1-5 | 产出完整落地包：`docs/dingtalk-integration-plan.md` | 16 表字段映射 / 26 流程映射 / 架构 / 风险 |
| 1-6 | 产出字段映射配置：`server/fieldMap.js`（唯一需按真实表调整的文件） | 配置驱动基础 |

### Phase 2 · 服务端代理骨架（已完成、待命）
| 步骤 | 动作 | 产物 |
|---|---|---|
| 2-1 | 新增依赖：express / cors / dotenv | 服务端可用 |
| 2-2 | 钉钉客户端：`dingtalk.js`（token 缓存 + 并发去重 + 分页 + 幂等 + 重试） | 核心 SDK |
| 2-3 | 字段序列化：`mapper.js` + `repo.js`（配置驱动） | 业务代码不碰字段名 |
| 2-4 | REST 路由：4 组路由（workorders / students / library / qa），含节点状态回写、家长确认、问答答复、材料核验、方案冻结、变更审批等所有闭环动作 | `/api/*` 端点 |
| 2-5 | 前端数据源层：`services/http.ts` + `dingtalkApi.ts` + `dataSource.ts`（mock ↔ 真实一键切换，失败自动回退） | 切换开关就位 |
| 2-6 | Store 改造：新增 `loadAll()` + 写回乐观更新 + 失败重同步 | 数据通路对齐 |
| 2-7 | Vite 代理 / .env 配置 / .gitignore 屏蔽敏感值 / npm run server | 启动脚本就绪 |
| 2-8 | 构建验证：前后端语法全部通过、前端 build 通过、无凭证时服务端优雅报错 | 骨架就绪 |

### Phase 3 · 配置包与 Runbook（已完成）
| 步骤 | 动作 | 产物 |
|---|---|---|
| 3-1 | 配置包：`docs/dingtalk-config-package.md`（凭证登记表 + 17 表逐字段核对表 + 权限清单 + 26 流程核对 + 结构事项确认） | P0 交付物 |
| 3-2 | Runbook：`docs/dingtalk-go-live-runbook.md`（钉钉侧上线 8 步，标注"管理员 vs 我"分工） | 操作手册 |
| 3-3 | 用户确认："配置包先给，凭证到位后再接代码" | 分阶段策略 |

### Phase 4 · 接入钉钉真实数据（**当前卡点**）
- 阻塞：**钉钉 Client Secret / baseId / operatorId 凭证尚未提供**
- 下一步：按 Runbook 钉钉侧 2~6 章由管理员完成建应用/开权限/字段核对 → 提供凭证 → 我执行第 7 章 P1→P2→P3

---

## 4. 互动关键节点（用户的每次选择 + 我做的决策 + 硬约束）

| # | 用户输入 | 我的决策 | 背后的硬约束 / 为什么 |
|---|---|---|---|
| 1 | "对接钉钉真实数据" | 先核实接口基线再动手 | 钉钉 OpenAPI 路径/权限点经常被误传，必须官方文档核对 |
| 2 | "用哪种方式对接？" | 列出两条路径：钉钉集成自动化 vs 读写闭环 | 两者分工明确：钉钉侧自动化做定时/触发，Web 侧做界面 + 写回 |
| 3 | "先文档后代码" | 先出落地包再搭骨架 | 字段名错字即读写失败；没有规范就没有实现 |
| 4 | "两者都要" | 服务端代理必选 | 三条硬约束：密钥安全 + 浏览器 CORS 不允许直连 + token 生命周期需托管 |
| 5 | 字段名映射 | 配置驱动（`fieldMap.js` 唯一需改） | 中文字段名易错，业务代码不能感知 |
| 6 | 留痕 | 建议独立"节点留痕"表 | 钉钉数组字段难维护，独立表读写更规范 |
| 7 | mock vs 真实 | 数据源抽象 + 开关 + 自动回退 | 演示不受影响、真实接口故障不炸页面 |
| 8 | 家长端权限 | 后端按 unionId 过滤（方案） | baseId 未做行级过滤，必须后端控 |
| 9 | operatorId | 固定 unionId 进 .env | 所有 AI 表格接口必带，每次查人多一次请求 |
| 10 | 写回并发 | clientToken 幂等 + 读-改-写 | 钉钉 409 duplicateClientToken；避免"待确认被误标逾期" |

---

## 5. 痛点清单与解法（钉钉对接的所有坑）

### 5.1 技术硬约束
| 痛点 | 解法 | 落地位置 |
|---|---|---|
| 浏览器不能暴露 Client Secret | 服务端代理架构 | `server/dingtalk.js` |
| 浏览器 CORS 不能直连 api.dingtalk.com | 全部请求经 Express 转发 | `server/index.js` + `vite.config.ts` 代理 |
| operatorId（unionId）是必填 | `.env` 固定值，对表格有编辑权 | `.env.example` |
| access_token 7200s + 限流 | 缓存 + 并发去重 + 提前 60s 刷新 | `getAccessToken()` |
| 分页 maxResults=100，必须循环 nextToken | `listAll()` 循环拉全量 | `server/dingtalk.js` |
| 日期：钉钉传毫秒时间戳，前端 ISO 字符串 | `mapper.js` 自动互转 | `server/mapper.js` |
| 数组/对象字段（院校清单、要求明细） | JSON 字符串存储，codec 自动 parse/stringify | `fieldMap.js` codec + `mapper.js` |
| 语言成绩是多行文本，前端是对象数组 | codec 互转：`"IELTS 7.0; A-Level A*AA"` ↔ `[{type,score}]` | `fieldMap.js` student.languageScores.codec |

### 5.2 业务硬约束
| 痛点 | 解法 | 落地位置 |
|---|---|---|
| 节点状态机 6 状态、单向流转 | 状态转换表 + canTransition 校验 | `engine/index.ts` NODE_TRANSITIONS |
| 26 条自动化流程不能改（钉钉侧已运行） | Web 只消费结果，不重建 | `docs/dingtalk-integration-plan.md` §7 |
| 家长端隐藏问答内部 4 字段 | 钉钉侧已设隐藏，Web 端不渲染 | `types/index.ts` QAThread 注释 |
| 节点完成后自动推进下一节点 | 服务端 refreshWorkOrder() 重算进度 | `server/routes/workorders.js` |
| 写回幂等缺失导致重复记录 | 所有写操作带 `crypto.randomUUID()` clientToken | `dingtalk.js addRecords` |
| 本地乐观更新失败需回滚 | push() 失败后自动 loadAll() 同步远端 | `store/useStore.ts` push() |

### 5.3 安全与部署
| 痛点 | 解法 | 落地位置 |
|---|---|---|
| Client Secret 泄露 | .gitignore 屏蔽 server/.env，前端零凭证 | `.gitignore` |
| 真实接口挂了页面白屏 | dataSource 自动回退 mock | `services/dataSource.ts` catch |
| 联调与演示两套环境 | VITE_USE_REAL_DATA 开关 | `.env.development` |

---

## 6. 蓝图级索引

### 6.1 页面路由（前端）
```
/login                        角色切换页
/ → 重定向 /dashboard
/dashboard                    管理驾驶舱（10 图表 + 晨报 + 预警）
/workorders                   工单列表
/workorders/:id               工单详情（23 节点时间线 + 状态流转）
/students                     学生列表
/students/:id                 学生详情
/qa                           家长问答（三端共用）
/dates                        关键日期
/library                      知识库
/admissions                   录取结果
/parent-dashboard             家长端首页
/student-dashboard            学生端首页
/confirm                      家长确认中心
```

### 6.2 后端 API（/api/*）
| 端点 | Method | 作用 | 关键实现 |
|---|---|---|---|
| `/api/health` | GET | token 自检 + 连通性 | 强制清缓存 + 换 token |
| `/api/sheets` | GET | 列出所有数据表 | 用于字段名校准 |
| `/api/sheets/:idOrName` | GET | 查看单表字段定义 | 用于字段名校准 |
| `/api/workorders` | GET | 工单列表 + 节点全量（按工单分组） | 聚合 workOrder + node 两张表 |
| `/api/workorders/:id/nodes/:nodeId/status` | PATCH | 更新节点状态 | 回写 + 留痕表写 + 重算工单进度 |
| `/api/workorders/:id/nodes/:nodeId/confirm` | POST | 家长确认 | 回写 confirmedByParent + 留痕 + 重算进度 |
| `/api/students` | GET | 学生 + 材料 + 文书 + 方案 + 变更 | 5 表并行拉取 |
| `/api/materials/:id/verify` | POST | 材料核验 | 单表按业务主键 patch |
| `/api/materials/:id/submit` | POST | 学生提交材料 | 单表按业务主键 patch |
| `/api/plans/:id/freeze` | POST | 方案冻结 | 单表按业务主键 patch |
| `/api/changes/:id/approve` | POST | 变更审批 | 单表按业务主键 patch |
| `/api/changes/:id/parent-confirm` | POST | 家长确认变更 | 单表 patch + 留痕表写 |
| `/api/library` | GET | 规则库 + 口径库 + 院校 + 专业 | 4 表并行 |
| `/api/dates` | GET | 关键日期 | 单表 |
| `/api/interviews` | GET | 约谈记录 | 单表（只读） |
| `/api/admissions` | GET | 录取结果 | 单表 |
| `/api/admissions/:id/confirm` | POST | 家长知悉录取结果 | 单表 patch |
| `/api/qa` | GET | 问答列表 | 单表 |
| `/api/qa/:id/answer` | POST | 答复问答 | 回写 + 口径编号 |

### 6.3 钉钉 AI 表格 17 张（全部在 `fieldMap.js` 定义）
`workOrder · nodeTemplate · node · student · material · essay · plan · change · ruleCard · caliber · university · major · keyDate · interview · admission · qa · nodeHistory`

### 6.4 钉钉 OpenAPI 接口基线（已核实）
- `POST /v1.0/oauth2/accessToken` → 换 token
- `POST /v1.0/notable/bases/{baseId}/sheets/{sheet}/records/list?operatorId=xx` → 分页列表
- `POST /v1.0/notable/bases/{baseId}/sheets/{sheet}/records?operatorId=xx&clientToken=uuid` → 新增（幂等）
- `PUT /v1.0/notable/bases/{baseId}/sheets/{sheet}/records?operatorId=xx` → 更新多行
- `GET /v1.0/notable/bases/{baseId}/sheets?operatorId=xx` → 列出所有数据表

### 6.5 环境变量（服务端）
```dotenv
DINGTALK_CLIENT_ID=       # 钉钉开发者后台 → 凭证与基础信息
DINGTALK_CLIENT_SECRET=  # 同上（敏感，.gitignore）
DINGTALK_BASE_ID=         # AI 表格 URL 中的 baseId
DINGTALK_OPERATOR_ID=     # 系统操作人 unionId（有表格编辑权）
SHEET_* = ...             # 17 张表的真实表名/sheetId
PORT=8787
DINGTALK_API_BASE=https://api.dingtalk.com
```

### 6.6 环境变量（前端）
```dotenv
VITE_USE_REAL_DATA=false  # false=mock, true=走钉钉
VITE_API_BASE=            # 留空则用 Vite proxy 同源 /api
```

---

## 7. 给新 AI 的接手指南

### 7.1 快速上手命令
```bash
cd /workspace/college-guidance
npm install
npm run dev                   # 前端（mock 数据，立即可见）
npm run server                # 服务端（需凭证，无凭证时优雅报错）
npm run build                 # 构建验证
```

### 7.2 凭证到位后开启接入
```bash
# 1. 复制模板填真实值
cp server/.env.example server/.env   # 然后编辑填入 Client ID/Secret/baseId/operatorId
cp .env.development .env.production  # 或直接改 .env.development

# 2. 自检
npm run server &
curl http://localhost:8787/api/health        # 应返回 ok:true
curl http://localhost:8787/api/sheets        # 列出真实数据表
curl http://localhost:8787/api/workorders    # 只读打通

# 3. 开前端开关
# 把 .env.development 里 VITE_USE_REAL_DATA=true

# 4. 字段校准时发现不一致？
# → 只改 server/fieldMap.js 对应行，业务代码不动
```

### 7.3 新建表/新增字段时
1. `fieldMap.js` 里给 `SHEETS.{表key}` 加一项 `fields` 映射；
2. 在 `src/types/index.ts` 补前端类型；
3. 若有复合字段（JSON/数组/格式化文本），在 `codec` 里加 `encode/decode`；
4. 服务端路由用 `repo.js` 的 `readTable/findRow/updateRow` 读写即可。

### 7.4 故障排查清单
| 现象 | 先查 |
|---|---|
| `/api/health` 报 config.missing | server/.env 是否存在、四个值是否都填了 |
| 所有接口报 403 forbidden | operatorId 对表格是否有编辑权限 |
| `invalidRequest.inputArgs.invalid` | 字段名/值格式是否与真实表一致（用 `/api/sheets/:idOrName` 查真实字段） |
| 前端改了开关还是 mock | `.env` 是否改对文件（development / production）、是否重启 dev server |
| 只读到前 100 条 | 代码已循环 nextToken，应该不会；若出现检查 `dingtalk.js listAll` |

---

## 8. 下一步（按优先级）

1. **用户侧**：在钉钉开发者后台完成建应用/开权限/发布（Runbook 第 2~6 章）
2. **我侧**：收到凭证 → 填 `.env` → P1 健康检查 → P2 只读打通 → 核对字段 → P3 开写回
3. **联调**：先老师端只读 → 再开放家长确认写回 → 通知中心接聚合结果
4. **灰度**：先内测几个学生 → 逐步放开

---

## 附录：关键文件快速定位

| 你想做什么 | 打开哪个文件 |
|---|---|
| 看钉钉对接规范 | `docs/dingtalk-integration-plan.md` |
| 填凭证 / 核对字段 | `docs/dingtalk-config-package.md` |
| 钉钉侧操作步骤 | `docs/dingtalk-go-live-runbook.md` |
| 改字段映射（**唯一需按真实表改的**） | `server/fieldMap.js` |
| 看钉钉 API 封装 | `server/dingtalk.js` |
| 看读写路由 | `server/routes/*.js` |
| 写回新接口 | `server/routes/` 里加方法 → `server/index.js` 挂路由 |
| 前端新页面 | `src/pages/` 新建 → `App.tsx` 加路由 |
| 新增 mock 数据 | `src/data/mockData.ts` |
| 改数据源开关 | `.env.development` 的 `VITE_USE_REAL_DATA` |
| 状态流转逻辑 | `src/engine/index.ts` |
| 全局操作方法 | `src/store/useStore.ts` |
