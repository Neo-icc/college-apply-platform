/**
 * 字段序列化 / 反序列化（配置驱动）
 *
 * 前端对象 <appKey> <──> 钉钉记录 fields<中文字段名>
 * 转换规则全部来自 fieldMap.js：json / date / bool / number / codec
 * 业务代码不感知具体字段名与格式。
 */
import { tableConfig } from './fieldMap.js'

function isEmpty(v) {
  return v === undefined || v === null || v === ''
}

function encodeValue(v, cfg, appKey) {
  const codec = cfg.codec?.[appKey]
  if (codec?.encode) return codec.encode(v)
  if (cfg.json?.includes(appKey)) return JSON.stringify(v)
  if (cfg.date?.includes(appKey)) {
    const ms = typeof v === 'number' ? v : new Date(v).getTime()
    return Number.isNaN(ms) ? undefined : ms
  }
  if (cfg.bool?.includes(appKey)) return Boolean(v)
  if (cfg.number?.includes(appKey)) return Number(v)
  return v
}

function decodeValue(v, cfg, appKey) {
  const codec = cfg.codec?.[appKey]
  if (codec?.decode) return codec.decode(v)
  if (cfg.json?.includes(appKey)) {
    if (Array.isArray(v) || (v && typeof v === 'object')) return v
    try {
      return JSON.parse(v)
    } catch {
      return v
    }
  }
  if (cfg.date?.includes(appKey)) {
    if (v === undefined || v === null || v === '') return undefined
    const ms = typeof v === 'number' ? v : new Date(v).getTime()
    return Number.isNaN(ms) ? undefined : new Date(ms).toISOString()
  }
  if (cfg.bool?.includes(appKey)) return Boolean(v)
  if (cfg.number?.includes(appKey)) return v === undefined || v === null || v === '' ? undefined : Number(v)
  return v
}

/** 应用对象 → 钉钉 fields（只映射已定义且非空的字段） */
export function toDingtalk(tableKey, obj) {
  const cfg = tableConfig(tableKey)
  const fields = {}
  for (const [appKey, dtName] of Object.entries(cfg.fields)) {
    if (!(appKey in obj)) continue
    const raw = obj[appKey]
    // 布尔字段的 false 也要写入；其余空值跳过
    if (!cfg.bool?.includes(appKey) && isEmpty(raw)) continue
    const encoded = encodeValue(raw, cfg, appKey)
    if (encoded !== undefined) fields[dtName] = encoded
  }
  return fields
}

/** 钉钉记录 → 应用对象（附 _recordId 供写回定位） */
export function fromDingtalk(tableKey, record) {
  const cfg = tableConfig(tableKey)
  const out = { _recordId: record.id }
  for (const [appKey, dtName] of Object.entries(cfg.fields)) {
    if (dtName in (record.fields || {})) {
      out[appKey] = decodeValue(record.fields[dtName], cfg, appKey)
    }
  }
  return out
}

export function fromDingtalkList(tableKey, records) {
  return (records || []).map((r) => fromDingtalk(tableKey, r))
}

/** 构造"字段等于某值"的过滤条件 */
export function equalsFilter(dtFieldName, value) {
  return { combination: 'and', conditions: [{ field: dtFieldName, operator: 'equal', value: [String(value)] }] }
}
