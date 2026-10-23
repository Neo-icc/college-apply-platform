# 钉钉多维表格导入模板

> 单一事实来源：字段表头来自 `server/fieldMap.js`，枚举取值对齐 `src/types/index.ts` 与 `src/data/mockData.ts`。
> 字段有变动时执行 `npm run templates`，两套模板会一起重新生成。

## 怎么导入（推荐）

直接使用 `templates/import/` 目录下的 CSV（每个文件只有「中文表头 + 1 行示例数据」）：
1. 钉钉 AI 表格（多维表格）中新建数据表 → 右上角 `导入` → `CSV 文件`
2. 拖入对应的 CSV，首行自动识别为字段名
3. 在导入预览里确认字段类型（日期/数字/复选框），完成导入
4. 导入后删除那条示例记录，再录入真实数据

> `templates/*.csv`（根目录）是「对照版」：4 行分别是 表头 / 应用字段名 / 必填与类型说明 / 示例数据，**仅供查阅，不要直接导入**。

## 模板清单（17 张表）

| 导入文件 | 表名 | 字段数 | 必填字段数 |
|---|---|---|---|
| import/workOrder.csv | 工单 | 13 | 11 |
| import/nodeTemplate.csv | 节点模板 | 10 | 8 |
| import/node.csv | 工单节点 | 15 | 9 |
| import/student.csv | 学生档案 | 13 | 9 |
| import/material.csv | 材料清单 | 8 | 5 |
| import/essay.csv | 文书素材 | 6 | 5 |
| import/plan.csv | 方案版本 | 8 | 6 |
| import/change.csv | 变更记录 | 12 | 9 |
| import/ruleCard.csv | 规则库 | 7 | 7 |
| import/caliber.csv | 口径库 | 7 | 7 |
| import/university.csv | 重点院校清单 | 6 | 4 |
| import/major.csv | 专业库 | 5 | 5 |
| import/keyDate.csv | 关键日期 | 8 | 5 |
| import/interview.csv | 约谈记录 | 9 | 8 |
| import/admission.csv | 录取结果 | 11 | 9 |
| import/qa.csv | 家长问答 | 12 | 8 |
| import/nodeHistory.csv | 节点留痕 | 6 | 5 |

## 数据格式（通用）

| 类型 | 格式 | 示例 |
|---|---|---|
| 日期 | `YYYY-MM-DD` | `2026-10-20` |
| 日期时间 | `YYYY-MM-DD HH:mm`（留痕到秒） | `2026-10-20 14:30` |
| 布尔 | `true` / `false`（钉钉复选框） | `true` |
| 数字 | 纯数字，不带单位 | `24`、`18` |
| JSON | 单行合法 JSON（外层加双引号转义） | `["冻结方案 V1.0","完成 MAT 辅导"]` |
| 多值 | 英文分号 `;` 分隔，存为多行文本 | `UK; HK` |
| 关联ID | 必须精确匹配关联表主键 | `S001`、`WO001` |

## 枚举值（必须使用以下取值）

| 字段 | 可选值 |
|---|---|
| 模板类型 template | `full`（23 节点完整流程）/ `emergency`（8 节点应急） |
| 工单状态 status | `active` / `frozen` / `closed` |
| 节点状态 status | `not_started` / `in_progress` / `pending_confirm` / `completed` / `overdue` / `stalled` |
| 负责角色 owner | `advisor` / `essay_teacher` / `application_teacher` / `visa_teacher` / `parent` / `student` |
| 节点分类 category | `planning` / `materials` / `essay` / `application` / `visa` / `followup` |
| 材料分类 category | `academic` / `language` / `personal` / `financial` / `other` |
| 材料状态 status | `pending` / `submitted` / `verified` / `rejected` |
| 文书状态 status | `draft` / `submitted` / `confirmed` |
| 方案状态 status | `draft` / `frozen` / `superseded` |
| 变更审批 status | `pending_approval` / `approved` / `rejected` / `parent_confirmed` |
| 约谈状态 status | `scheduled` / `completed` / `parent_confirmed` |
| 问答状态 status | `pending` / `answered` / `overdue` |
| 录取结果 result | `offer` / `rejected` / `waiting` / `pending` |
| 关键日期类型 type | `deadline` / `exam` / `event` / `maintenance` |
| 地区 region | `UK`（英国）/ `HK`（香港）/ `AU`（澳洲）/ `CA`（加拿大） |
| 方案档位 tier | `reach` / `match` / `safety` |
| 规则置信度 confidence | `high` / `medium` / `low` |

## 表间依赖（按顺序导入）

1. **基础字典**：节点模板、规则库、口径库、重点院校、专业库、关键日期
2. **主体**：学生档案 → 工单
3. **明细**：工单节点（依赖工单 + 节点模板）→ 材料清单 / 文书素材 / 方案版本 / 变更记录
4. **流程记录**：约谈记录、录取结果、家长问答
5. **留痕**：节点留痕（最后导入）

## 注意

- 关联 ID（学生ID、工单ID、节点ID）必须先在主表存在，否则前端关联查询会拿不到数据
- 导入时钉钉会自动建字段，但字段类型建议在预览页确认：日期、数字、复选框三类别选错
- 与真实钉钉表字段名不一致时：只改 `server/fieldMap.js` 对应值，再执行 `npm run templates`，不要手改 CSV
- 前端多值字段（目标地区、标签、参与人、语言成绩）在表内用分号分隔，服务端会自动转成数组
