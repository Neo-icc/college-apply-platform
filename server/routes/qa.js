import { Router } from 'express'
import { readTable, updateByKey, asyncHandler } from '../repo.js'

export const qaRouter = Router()

// ===== GET /api/qa：家长问答 =====
qaRouter.get(
  '/qa',
  asyncHandler(async (_req, res) => {
    res.json({ qaThreads: await readTable('qa') })
  })
)

// ===== POST 答复问答（回写 + 口径编号）=====
qaRouter.post(
  '/qa/:id/answer',
  asyncHandler(async (req, res) => {
    const { answer, caliberCode, answeredBy = '李胜' } = req.body || {}
    if (!answer) return res.status(400).json({ error: '缺少 answer' })
    const now = new Date().toISOString()
    const updated = await updateByKey('qa', 'id', req.params.id, {
      answer,
      answeredAt: now,
      answeredBy,
      caliberCode,
      status: 'answered',
    })
    res.json({ ok: true, qa: updated })
  })
)
