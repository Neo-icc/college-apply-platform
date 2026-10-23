import type { WorkOrderNode, NodeStatus, Notification, QAThread } from '../types'
import { format, differenceInDays, differenceInHours, differenceInMinutes, addDays, isBefore, isAfter } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// ===== 状态机 =====
export const NODE_TRANSITIONS: Record<NodeStatus, NodeStatus[]> = {
  not_started: ['in_progress'],
  in_progress: ['completed', 'pending_confirm', 'stalled', 'overdue'],
  pending_confirm: ['completed', 'stalled'],
  completed: [],
  overdue: ['in_progress', 'completed'],
  stalled: ['in_progress', 'completed'],
}

export function canTransition(from: NodeStatus, to: NodeStatus): boolean {
  return NODE_TRANSITIONS[from]?.includes(to) ?? false
}

// 推进节点：完成当前节点，自动激活下一个
export function advanceNode(nodes: WorkOrderNode[], currentIndex: number): WorkOrderNode[] {
  return nodes.map((n, i) => {
    if (i === currentIndex) {
      return { ...n, status: 'completed' as NodeStatus, completedAt: new Date().toISOString() }
    }
    if (i === currentIndex + 1 && n.status === 'not_started') {
      return { ...n, status: 'in_progress' as NodeStatus, startedAt: new Date().toISOString() }
    }
    return n
  })
}

// ===== 日期与状态判定 =====
export function getNodeState(node: WorkOrderNode): {
  isOverdue: boolean
  isDueSoon: boolean
  isStalled: boolean
  daysLeft: number
  hoursLeft: number
} {
  const now = new Date()
  const due = new Date(node.dueAt)
  const started = node.startedAt ? new Date(node.startedAt) : null
  const daysLeft = differenceInDays(due, now)
  const hoursLeft = differenceInHours(due, now)

  const isOverdue =
    (node.status === 'in_progress' || node.status === 'not_started') &&
    isBefore(due, now)

  const isDueSoon =
    (node.status === 'in_progress' || node.status === 'not_started') &&
    daysLeft >= 0 && daysLeft <= 3

  const isStalled =
    node.status === 'in_progress' &&
    started !== null &&
    differenceInDays(now, started) >= 7

  return { isOverdue, isDueSoon, isStalled, daysLeft, hoursLeft }
}

// 计算工单整体进度
export function calcProgress(nodes: WorkOrderNode[]): number {
  if (nodes.length === 0) return 0
  const completed = nodes.filter(n => n.status === 'completed').length
  return Math.round((completed / nodes.length) * 100)
}

// ===== SLA 判定（问答）=====
export function getQaSlaState(qa: QAThread): {
  hoursElapsed: number
  hoursLeft: number
  isOverdue: boolean
  isDueSoon: boolean
} {
  const now = new Date()
  const asked = new Date(qa.askedAt)
  const hoursElapsed = differenceInMinutes(now, asked) / 60
  const hoursLeft = qa.slaHours - hoursElapsed
  return {
    hoursElapsed,
    hoursLeft,
    isOverdue: qa.status === 'pending' && hoursLeft <= 0,
    isDueSoon: qa.status === 'pending' && hoursLeft > 0 && hoursLeft <= 6,
  }
}

// ===== 提醒生成器（26 条流程中的自动提醒）=====
export function generateNotifications(nodes: WorkOrderNode[], workOrderId: string, studentName: string): Notification[] {
  const notifs: Notification[] = []
  const now = new Date()

  nodes.forEach(node => {
    const state = getNodeState(node)

    // 逾期预警
    if (state.isOverdue && node.status !== 'overdue') {
      notifs.push({
        id: `${workOrderId}-${node.id}-overdue`,
        to: 'teacher',
        type: 'node_overdue',
        title: `⚠️ 节点已超时：${studentName} ${node.name}`,
        content: `该节点已超时 ${Math.abs(state.daysLeft)} 天，请尽快处理。`,
        read: false,
        createdAt: now.toISOString(),
        priority: 'high',
      })
    }

    // 临期 3 天提醒
    if (state.isDueSoon && !state.isOverdue) {
      notifs.push({
        id: `${workOrderId}-${node.id}-due-soon`,
        to: node.owner === 'student' ? 'student' : node.owner === 'parent' ? 'parent' : 'teacher',
        type: 'node_due_soon',
        title: `⏰ 节点即将到期：${studentName} ${node.name}`,
        content: `节点将在 ${state.daysLeft} 天后到期。`,
        read: false,
        createdAt: now.toISOString(),
        priority: 'medium',
      })
    }

    // 停滞 7 天预警
    if (state.isStalled) {
      notifs.push({
        id: `${workOrderId}-${node.id}-stalled`,
        to: 'teacher',
        type: 'node_stalled',
        title: `⏸️ 节点 7 天无进展：${studentName} ${node.name}`,
        content: `该节点已 7 天无进展，请跟进处理。`,
        read: false,
        createdAt: now.toISOString(),
        priority: 'medium',
      })
    }

    // 待家长确认卡片
    if (node.status === 'pending_confirm' && node.requiresParentConfirm && !node.confirmedByParent) {
      notifs.push({
        id: `${workOrderId}-${node.id}-confirm`,
        to: 'parent',
        type: 'parent_confirm',
        title: `✋ 请确认：${studentName} ${node.name}`,
        content: `请点击确认，如未确认次日会再次提醒。`,
        read: false,
        createdAt: now.toISOString(),
        actionLabel: '确认',
        actionLink: `/workorders/${workOrderId}`,
        priority: 'high',
      })
    }
  })

  return notifs
}

// ===== 晨报生成 =====
export function generateMorningReport(nodesByWo: Record<string, WorkOrderNode[]>, workOrders: { id: string; studentName: string }[]): string {
  const overdue: string[] = []
  const pendingConfirm: string[] = []
  const stalled: string[] = []

  workOrders.forEach(wo => {
    const nodes = nodesByWo[wo.id] || []
    nodes.forEach(n => {
      const s = getNodeState(n)
      if (s.isOverdue || n.status === 'overdue') overdue.push(`${wo.studentName}·${n.name}`)
      if (n.status === 'pending_confirm') pendingConfirm.push(`${wo.studentName}·${n.name}`)
      if (s.isStalled || n.status === 'stalled') stalled.push(`${wo.studentName}·${n.name}`)
    })
  })

  return [
    `📋 ${format(new Date(), 'M月d日', { locale: zhCN })} 晨报`,
    `超时节点 ${overdue.length} 条${overdue.length ? '：' + overdue.join('、') : ''}`,
    `7 天无进展节点 ${stalled.length} 条${stalled.length ? '：' + stalled.join('、') : ''}`,
    `待家长确认 ${pendingConfirm.length} 条${pendingConfirm.length ? '：' + pendingConfirm.join('、') : ''}`,
  ].join('\n')
}

// ===== 工具函数 =====
export function formatDate(d: string | Date, fmt = 'MM-dd'): string {
  return format(new Date(d), fmt, { locale: zhCN })
}

export function formatDateTime(d: string | Date): string {
  return format(new Date(d), 'MM-dd HH:mm', { locale: zhCN })
}

export function daysFromNow(d: string | Date): number {
  return differenceInDays(new Date(d), new Date())
}

export function isWithinDays(d: string | Date, days: number): boolean {
  const diff = daysFromNow(d)
  return diff >= 0 && diff <= days
}

export function addDaysStr(d: string | Date, days: number): string {
  return addDays(new Date(d), days).toISOString()
}

export { isBefore, isAfter }
