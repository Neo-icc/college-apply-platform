/**
 * 数据仓储层：把 fieldMap 配置 + dingtalk 客户端 + mapper 组合成"以业务主键读写"的高层能力
 * 路由只用这里的方法，不直接触碰字段名。
 */
import { SHEETS } from './fieldMap.js'
import { fromDingtalkList, fromDingtalk, toDingtalk, equalsFilter } from './mapper.js'
import * as dt from './dingtalk.js'

/** 读取整张表 → 应用对象数组（含 _recordId） */
export async function readTable(tableKey) {
  const cfg = SHEETS[tableKey]
  return fromDingtalkList(tableKey, await dt.listAll(cfg.sheet))
}

/** 按业务字段等值查找多行 */
export async function findRows(tableKey, appKey, value) {
  const cfg = SHEETS[tableKey]
  const dtField = cfg.fields[appKey]
  if (!dtField) {
    const err = new Error(`表 ${tableKey} 未定义字段 ${appKey}`)
    err.status = 500
    throw err
  }
  const rows = await dt.listAll(cfg.sheet, equalsFilter(dtField, value))
  return fromDingtalkList(tableKey, rows)
}

/** 按业务字段等值查找单行（找不到返回 null） */
export async function findRow(tableKey, appKey, value) {
  const rows = await findRows(tableKey, appKey, value)
  return rows[0] || null
}

/** 按记录 id 更新（patch 为应用层字段） */
export async function updateRow(tableKey, recordId, patch) {
  const cfg = SHEETS[tableKey]
  return dt.updateRecordById(cfg.sheet, recordId, toDingtalk(tableKey, patch))
}

/** 新增一行（obj 为应用层字段） */
export async function addRow(tableKey, obj) {
  const cfg = SHEETS[tableKey]
  return dt.addRecord(cfg.sheet, toDingtalk(tableKey, obj))
}

/** 按业务字段定位并更新；返回更新后的应用对象（含 patch）；未找到抛 404 */
export async function updateByKey(tableKey, appKey, value, patch) {
  const row = await findRow(tableKey, appKey, value)
  if (!row) {
    const err = new Error('记录不存在')
    err.status = 404
    throw err
  }
  await updateRow(tableKey, row._recordId, patch)
  return { ...row, ...patch }
}

/** 异步路由包装：统一把异常交给 express 错误中间件 */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}
