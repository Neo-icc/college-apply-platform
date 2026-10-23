import { Router } from 'express'
import { readTable, updateByKey, asyncHandler } from '../repo.js'

export const libraryRouter = Router()

// ===== GET /api/library：规则库 + 口径库 + 院校 + 专业 =====
libraryRouter.get(
  '/library',
  asyncHandler(async (_req, res) => {
    const [ruleCards, calibers, universities, majors] = await Promise.all([
      readTable('ruleCard'),
      readTable('caliber'),
      readTable('university'),
      readTable('major'),
    ])
    res.json({ ruleCards, calibers, universities, majors })
  })
)

// ===== GET /api/dates：关键日期 =====
libraryRouter.get(
  '/dates',
  asyncHandler(async (_req, res) => {
    res.json({ keyDates: await readTable('keyDate') })
  })
)

// ===== GET /api/interviews：约谈记录（只读）=====
libraryRouter.get(
  '/interviews',
  asyncHandler(async (_req, res) => {
    res.json({ interviews: await readTable('interview') })
  })
)

// ===== GET /api/admissions：录取结果 =====
libraryRouter.get(
  '/admissions',
  asyncHandler(async (_req, res) => {
    res.json({ admissions: await readTable('admission') })
  })
)

// ===== POST 家长知悉录取结果（回写）=====
libraryRouter.post(
  '/admissions/:id/confirm',
  asyncHandler(async (req, res) => {
    const now = new Date().toISOString()
    const updated = await updateByKey('admission', 'id', req.params.id, { parentKnown: true, parentKnownAt: now })
    res.json({ ok: true, admission: updated })
  })
)
