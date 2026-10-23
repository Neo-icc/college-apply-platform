/**
 * 钉钉开放平台客户端
 * - access_token 缓存（2h，提前 60s 刷新）与并发去重
 * - AI 表格（notable）记录读写封装：分页拉全量 / 新增 / 更新
 * - 统一错误码与指数退避重试
 *
 * 接口基线均来自官方文档，见 docs/dingtalk-integration-plan.md 第 4 章。
 */

const DEFAULT_API_BASE = 'https://api.dingtalk.com'
const TOKEN_EARLY_REFRESH_MS = 60_000
const MAX_RETRY = 3

export class DingtalkError extends Error {
  constructor(message, { status, code, retryable } = {}) {
    super(message)
    this.name = 'DingtalkError'
    this.status = status
    this.code = code
    this.retryable = retryable ?? [500, 502, 503, 504].includes(status)
  }
}

function apiBase() {
  return (process.env.DINGTALK_API_BASE || DEFAULT_API_BASE).replace(/\/$/, '')
}

function requireConfig() {
  const { DINGTALK_CLIENT_ID, DINGTALK_CLIENT_SECRET, DINGTALK_BASE_ID, DINGTALK_OPERATOR_ID } = process.env
  const missing = []
  if (!DINGTALK_CLIENT_ID) missing.push('DINGTALK_CLIENT_ID')
  if (!DINGTALK_CLIENT_SECRET) missing.push('DINGTALK_CLIENT_SECRET')
  if (!DINGTALK_BASE_ID) missing.push('DINGTALK_BASE_ID')
  if (!DINGTALK_OPERATOR_ID) missing.push('DINGTALK_OPERATOR_ID')
  if (missing.length) {
    throw new DingtalkError(`缺少环境变量: ${missing.join(', ')}`, { status: 500, code: 'config.missing' })
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** 带指数退避的 fetch + JSON 解析；非 2xx 抛 DingtalkError */
async function request(url, options = {}) {
  let lastErr
  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    try {
      const res = await fetch(url, options)
      const text = await res.text()
      let body
      try {
        body = text ? JSON.parse(text) : {}
      } catch {
        throw new DingtalkError(`响应非 JSON: ${text.slice(0, 200)}`, { status: res.status, code: 'response.notJson' })
      }
      if (!res.ok) {
        const code = body.code || body.errorCode || `http.${res.status}`
        throw new DingtalkError(body.message || body.errorMessage || `钉钉接口失败(${res.status})`, {
          status: res.status,
          code,
        })
      }
      return body
    } catch (err) {
      lastErr = err
      const retryable = err instanceof DingtalkError ? err.retryable : true // 网络类错误可重试
      if (!retryable || attempt === MAX_RETRY - 1) throw err
      await sleep(300 * 2 ** attempt)
    }
  }
  throw lastErr
}

// ===== access_token =====

let tokenCache = { token: null, expireAt: 0 }
let tokenInflight = null

async function fetchAccessToken() {
  const body = await request(`${apiBase()}/v1.0/oauth2/accessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appKey: process.env.DINGTALK_CLIENT_ID,
      appSecret: process.env.DINGTALK_CLIENT_SECRET,
    }),
  })
  if (!body.accessToken) {
    throw new DingtalkError('返回体缺少 accessToken', { status: 500, code: 'token.missing' })
  }
  const expireIn = Number(body.expireIn) || 7200
  tokenCache = { token: body.accessToken, expireAt: Date.now() + expireIn * 1000 }
  return body.accessToken
}

export async function getAccessToken() {
  requireConfig()
  if (tokenCache.token && Date.now() < tokenCache.expireAt - TOKEN_EARLY_REFRESH_MS) {
    return tokenCache.token
  }
  // 并发去重：多个请求同时触发时只换取一次
  if (!tokenInflight) {
    tokenInflight = fetchAccessToken().finally(() => {
      tokenInflight = null
    })
  }
  return tokenInflight
}

/** 供 /api/health 使用：强制体检 token，返回过期时间信息 */
export async function healthCheck() {
  requireConfig()
  tokenCache = { token: null, expireAt: 0 }
  const start = Date.now()
  await getAccessToken()
  return { ok: true, tokenCached: true, expireAt: new Date(tokenCache.expireAt).toISOString(), tookMs: Date.now() - start }
}

// ===== AI 表格（notable）=====

function sheetBase(sheet) {
  const baseId = process.env.DINGTALK_BASE_ID
  return `${apiBase()}/v1.0/notable/bases/${baseId}/sheets/${encodeURIComponent(sheet)}`
}

function authHeaders(token) {
  return { 'x-acs-dingtalk-access-token': token, 'Content-Type': 'application/json' }
}

function operatorQuery(extra = {}) {
  const params = new URLSearchParams({ operatorId: process.env.DINGTALK_OPERATOR_ID, ...extra })
  return params.toString()
}

/** 列出记录（单页） */
export async function listRecordsPage(sheet, { maxResults = 100, nextToken = '', filter } = {}) {
  const token = await getAccessToken()
  const body = { maxResults }
  if (nextToken) body.nextToken = nextToken
  if (filter) body.filter = filter
  return request(`${sheetBase(sheet)}/records/list?${operatorQuery()}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
}

/** 循环 nextToken 拉全量记录 */
export async function listAll(sheet, filter) {
  const out = []
  let nextToken = ''
  do {
    const page = await listRecordsPage(sheet, { maxResults: 100, nextToken, filter })
    out.push(...(page.records || []))
    nextToken = page.hasMore ? page.nextToken || '' : ''
  } while (nextToken)
  return out
}

/** 新增记录（幂等 clientToken） */
export async function addRecords(sheet, fieldsList) {
  const token = await getAccessToken()
  const records = fieldsList.map((fields) => ({ fields }))
  const clientToken = crypto.randomUUID()
  return request(`${sheetBase(sheet)}/records?${operatorQuery({ clientToken })}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ records }),
  })
}

/** 新增单条 */
export async function addRecord(sheet, fields) {
  const res = await addRecords(sheet, [fields])
  return res.records?.[0] || res
}

/** 更新多行（records: [{ id, fields }]） */
export async function updateRecords(sheet, records) {
  const token = await getAccessToken()
  return request(`${sheetBase(sheet)}/records?${operatorQuery()}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ records }),
  })
}

/** 更新单条（按记录 id） */
export async function updateRecordById(sheet, recordId, fields) {
  return updateRecords(sheet, [{ id: recordId, fields }])
}

/** 获取所有数据表 */
export async function listSheets() {
  const token = await getAccessToken()
  return request(`${apiBase()}/v1.0/notable/bases/${process.env.DINGTALK_BASE_ID}/sheets?${operatorQuery()}`, {
    method: 'GET',
    headers: authHeaders(token),
  })
}

/** 获取单个数据表（含字段定义，用于字段名校准） */
export async function getSheet(sheetIdOrName) {
  const token = await getAccessToken()
  return request(`${sheetBase(sheetIdOrName)}?${operatorQuery()}`, {
    method: 'GET',
    headers: authHeaders(token),
  })
}
