/**
 * 升学指导协作体系 · 服务端代理入口
 *
 * 职责：
 *  1. 保管钉钉凭证（绝不下发浏览器）
 *  2. 转发 AI 表格读写，规避 CORS，统一错误码
 *  3. 只读聚合 + 写回闭环两类端点
 *
 * 启动：node server/index.js   （需先在 .env 填真实凭证）
 */
import './env.js' // 必须第一个导入：先加载 server/.env，再初始化读取环境变量的模块
import express from 'express'
import cors from 'cors'

import { healthCheck, listSheets, getSheet, DingtalkError } from './dingtalk.js'
import { asyncHandler } from './repo.js'
import { workordersRouter } from './routes/workorders.js'
import { studentsRouter } from './routes/students.js'
import { libraryRouter } from './routes/library.js'
import { qaRouter } from './routes/qa.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

// ---- 连通性 / token 自检 ----
app.get(
  '/api/health',
  asyncHandler(async (_req, res) => {
    res.json(await healthCheck())
  })
)

// ---- 调表工具（P4 字段名校准用）：列出全部数据表 / 查看单表字段 ----
app.get(
  '/api/sheets',
  asyncHandler(async (_req, res) => {
    res.json(await listSheets())
  })
)
app.get(
  '/api/sheets/:idOrName',
  asyncHandler(async (req, res) => {
    res.json(await getSheet(req.params.idOrName))
  })
)

// ---- 业务端点 ----
app.use('/api', workordersRouter)
app.use('/api', studentsRouter)
app.use('/api', libraryRouter)
app.use('/api', qaRouter)

// ---- 统一错误处理 ----
app.use((err, _req, res, _next) => {
  const status = err instanceof DingtalkError ? err.status || 500 : err.status || 500
  const payload = { error: err.message || '服务器内部错误' }
  if (err.code) payload.code = err.code
  if (status >= 500) console.error('[server]', err)
  res.status(status).json(payload)
})

const port = Number(process.env.PORT) || 8787
app.listen(port, () => {
  console.log(`[server] 升学指导协作体系 · 钉钉代理已启动: http://localhost:${port}`)
  console.log(`[server] 凭证自检: curl http://localhost:${port}/api/health`)
})
