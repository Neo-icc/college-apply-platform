import { Router } from 'express'
import crypto from 'node:crypto'
import { readTable, updateRow, updateByKey, addRow, asyncHandler } from '../repo.js'

export const studentsRouter = Router()

const PALETTE = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function normalizeStudent(s, idx) {
  return {
    id: s.id,
    name: s.name,
    grade: s.grade || 'G11',
    targetRegion: toArray(s.targetRegion),
    currentSchool: s.currentSchool || '',
    gpa: s.gpa || '',
    languageScores: Array.isArray(s.languageScores) ? s.languageScores : [],
    parentName: s.parentName || '',
    parentPhone: s.parentPhone || '',
    parentUserId: s.parentUserId || undefined,
    advisorName: s.advisorName || '',
    enrolledAt: s.enrolledAt || new Date().toISOString(),
    tags: toArray(s.tags),
    avatarColor: PALETTE[idx % PALETTE.length],
    _recordId: s._recordId,
  }
}

function toArray(v) {
  if (Array.isArray(v)) return v
  if (v === undefined || v === null || v === '') return []
  return String(v)
    .split(/[;,、]/)
    .map((x) => x.trim())
    .filter(Boolean)
}

// ===== GET /api/students：学生 + 材料 + 文书 + 方案 + 变更 =====
studentsRouter.get(
  '/students',
  asyncHandler(async (_req, res) => {
    const [studentRows, materials, essayMaterials, plans, changes] = await Promise.all([
      readTable('student'),
      readTable('material'),
      readTable('essay'),
      readTable('plan'),
      readTable('change'),
    ])
    res.json({
      students: studentRows.map((s, idx) => normalizeStudent(s, idx)),
      materials,
      essayMaterials,
      planVersions: plans,
      changes,
    })
  })
)

// ===== POST 材料核验（回写）=====
studentsRouter.post(
  '/materials/:id/verify',
  asyncHandler(async (req, res) => {
    const now = new Date().toISOString()
    const updated = await updateByKey('material', 'id', req.params.id, { status: 'verified', verifiedAt: now })
    res.json({ ok: true, material: updated })
  })
)

// ===== POST 学生提交材料（回写）=====
studentsRouter.post(
  '/materials/:id/submit',
  asyncHandler(async (req, res) => {
    const now = new Date().toISOString()
    const updated = await updateByKey('material', 'id', req.params.id, { status: 'submitted', submittedAt: now })
    res.json({ ok: true, material: updated })
  })
)

// ===== POST 方案冻结（回写）=====
studentsRouter.post(
  '/plans/:id/freeze',
  asyncHandler(async (req, res) => {
    const now = new Date().toISOString()
    const updated = await updateByKey('plan', 'id', req.params.id, { status: 'frozen', frozenAt: now })
    res.json({ ok: true, planVersion: updated })
  })
)

// ===== POST 变更审批（回写）=====
studentsRouter.post(
  '/changes/:id/approve',
  asyncHandler(async (req, res) => {
    const { approve = true, approvedBy = '李胜' } = req.body || {}
    const updated = await updateByKey('change', 'id', req.params.id, {
      status: approve ? 'approved' : 'rejected',
      approvedBy,
    })
    res.json({ ok: true, change: updated })
  })
)

// ===== POST 家长确认变更（回写 + 留痕）=====
studentsRouter.post(
  '/changes/:id/parent-confirm',
  asyncHandler(async (req, res) => {
    const now = new Date().toISOString()
    const updated = await updateByKey('change', 'id', req.params.id, { status: 'parent_confirmed', parentConfirmedAt: now })
    await addRow('nodeHistory', {
      id: crypto.randomUUID(),
      nodeId: req.params.id,
      at: now,
      action: '家长确认变更（留痕）',
      operator: '家长',
    })
    res.json({ ok: true, change: updated })
  })
)
