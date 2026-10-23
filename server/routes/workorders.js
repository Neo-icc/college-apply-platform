import { Router } from 'express'
import crypto from 'node:crypto'
import { readTable, findRow, findRows, updateRow, addRow, asyncHandler } from '../repo.js'

export const workordersRouter = Router()

// ===== 归一化：补齐表格未存但前端类型要求的字段 =====

function normalizeWorkOrder(w) {
  return {
    id: w.id,
    studentId: w.studentId,
    studentName: w.studentName,
    grade: w.grade || 'G11',
    template: w.template || 'full',
    status: w.status || 'active',
    createdAt: w.createdAt || new Date().toISOString(),
    advisorId: w.advisorId || '',
    advisorName: w.advisorName || '',
    backupAdvisorId: w.backupAdvisorId || '',
    backupAdvisorName: w.backupAdvisorName || '',
    currentNodeIndex: w.currentNodeIndex ?? 0,
    progress: w.progress ?? 0,
    lastUpdatedAt: w.lastUpdatedAt || w.createdAt || new Date().toISOString(),
    parentUserId: w.parentUserId || undefined,
    _recordId: w._recordId,
  }
}

function normalizeNode(n) {
  return {
    id: n.id,
    workOrderId: n.workOrderId,
    templateNodeId: n.templateNodeId || n.id,
    index: n.index ?? 0,
    name: n.name || '',
    description: n.description || '',
    owner: n.owner || 'advisor',
    ownerName: n.ownerName || '',
    status: n.status || 'not_started',
    startedAt: n.startedAt,
    dueAt: n.dueAt,
    completedAt: n.completedAt,
    requiresParentConfirm: Boolean(n.requiresParentConfirm),
    confirmedByParent: Boolean(n.confirmedByParent),
    confirmedAt: n.confirmedAt,
    deliverable: n.deliverable,
    note: n.note,
    history: [], // 留痕存于独立"节点留痕"表，P2 先不回溯组装
    _recordId: n._recordId,
  }
}

/** 依据节点实时状态重算工单进度与当前节点序号并回写 */
async function refreshWorkOrder(workOrderId) {
  const wo = await findRow('workOrder', 'id', workOrderId)
  if (!wo) return
  const nodes = (await findRows('node', 'workOrderId', workOrderId)).map(normalizeNode).sort((a, b) => a.index - b.index)
  const done = nodes.filter((n) => n.status === 'completed').length
  const progress = nodes.length ? Math.round((done / nodes.length) * 100) : wo.progress || 0
  const firstOpen = nodes.findIndex((n) => n.status !== 'completed')
  const currentNodeIndex = firstOpen === -1 ? nodes.length : nodes[firstOpen].index
  await updateRow('workOrder', wo._recordId, { currentNodeIndex, progress, lastUpdatedAt: new Date().toISOString() })
}

// ===== GET /api/workorders：全量工单 + 节点 =====
workordersRouter.get(
  '/workorders',
  asyncHandler(async (_req, res) => {
    const [woRows, nodeRows] = await Promise.all([readTable('workOrder'), readTable('node')])
    const workOrders = woRows.map(normalizeWorkOrder)
    const workOrderNodes = {}
    for (const raw of nodeRows) {
      const node = normalizeNode(raw)
      if (!node.workOrderId) continue
      ;(workOrderNodes[node.workOrderId] ||= []).push(node)
    }
    for (const list of Object.values(workOrderNodes)) list.sort((a, b) => a.index - b.index)
    res.json({ workOrders, workOrderNodes })
  })
)

// ===== PATCH 节点状态（回写 + 留痕）=====
workordersRouter.patch(
  '/workorders/:id/nodes/:nodeId/status',
  asyncHandler(async (req, res) => {
    const { status, operator = '老师', note } = req.body || {}
    if (!status) return res.status(400).json({ error: '缺少 status' })

    const node = await findRow('node', 'id', req.params.nodeId)
    if (!node) return res.status(404).json({ error: '节点不存在' })

    const now = new Date().toISOString()
    const patch = { status }
    if (status === 'in_progress' && !node.startedAt) patch.startedAt = now
    if (status === 'completed') patch.completedAt = now

    await updateRow('node', node._recordId, patch)
    await addRow('nodeHistory', {
      id: crypto.randomUUID(),
      nodeId: node.id,
      at: now,
      action: `状态更新为「${status}」`,
      operator,
      note,
    })
    await refreshWorkOrder(req.params.id).catch((err) => {
      console.warn('[workorders] refreshWorkOrder failed after status update:', err.message)
    })

    res.json({ ok: true, node: { ...normalizeNode(node), ...patch } })
  })
)

// ===== POST 家长确认（回写 + 留痕）=====
workordersRouter.post(
  '/workorders/:id/nodes/:nodeId/confirm',
  asyncHandler(async (req, res) => {
    const node = await findRow('node', 'id', req.params.nodeId)
    if (!node) return res.status(404).json({ error: '节点不存在' })
    if (!node.requiresParentConfirm)
      return res.status(400).json({ error: '该节点无需家长确认' })
    if (node.confirmedByParent)
      return res.status(409).json({ error: '该节点已确认' })

    const now = new Date().toISOString()
    const patch = { confirmedByParent: true, confirmedAt: now, status: 'completed', completedAt: now }

    await updateRow('node', node._recordId, patch)
    await addRow('nodeHistory', {
      id: crypto.randomUUID(),
      nodeId: node.id,
      at: now,
      action: '家长点击确认（留痕）',
      operator: '家长',
    })
    await refreshWorkOrder(req.params.id).catch((err) => {
      // 工单回写失败不影响主操作
      console.warn('[workorders] refreshWorkOrder failed after confirm:', err.message)
    })

    res.json({ ok: true })
  })
)
