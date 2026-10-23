import { create } from 'zustand'
import type {
  Role, WorkOrder, WorkOrderNode, Student, MaterialItem, EssayMaterial,
  PlanVersion, ChangeRecord, RuleCard, CaliberItem, University, Major,
  KeyDate, InterviewRecord, AdmissionResult, QAThread, Notification,
} from '../types'
import {
  MOCK_STUDENTS, MOCK_WORK_ORDERS, getWorkOrderNodes, MOCK_MATERIALS,
  MOCK_ESSAY_MATERIALS, MOCK_PLAN_VERSIONS, MOCK_CHANGES, MOCK_RULE_CARDS,
  MOCK_CALIBERS, MOCK_UNIVERSITIES, MOCK_MAJORS, MOCK_KEY_DATES,
  MOCK_INTERVIEWS, MOCK_ADMISSIONS, MOCK_QA, MOCK_NOTIFICATIONS,
} from '../data/mockData'
import { loadAll as fetchAll, USE_REAL } from '../services/dataSource'
import { dgApi } from '../services/dingtalkApi'

interface AppState {
  // 角色
  role: Role
  currentUserId: string
  setRole: (r: Role) => void

  // 数据
  students: Student[]
  workOrders: WorkOrder[]
  workOrderNodes: Record<string, WorkOrderNode[]>
  materials: MaterialItem[]
  essayMaterials: EssayMaterial[]
  planVersions: PlanVersion[]
  changes: ChangeRecord[]
  ruleCards: RuleCard[]
  calibers: CaliberItem[]
  universities: University[]
  majors: Major[]
  keyDates: KeyDate[]
  interviews: InterviewRecord[]
  admissions: AdmissionResult[]
  qaThreads: QAThread[]
  notifications: Notification[]

  // 真实数据加载
  loaded: boolean
  loadAll: () => Promise<void>

  // 操作
  updateNodeStatus: (workOrderId: string, nodeId: string, status: WorkOrderNode['status']) => void
  confirmByParent: (workOrderId: string, nodeId: string) => void
  answerQA: (qaId: string, answer: string, caliberCode?: string) => void
  approveChange: (changeId: string, approve: boolean) => void
  confirmChangeByParent: (changeId: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  parentConfirmAdmission: (admissionId: string) => void
  freezePlan: (planId: string) => void
  submitMaterial: (materialId: string) => void
  verifyMaterial: (materialId: string) => void
}

const operatorLabel = (role: Role) => (role === 'parent' ? '家长' : role === 'student' ? '学生' : '老师')

export const useStore = create<AppState>((set, get) => {
  // 写回钉钉；mock 模式不发起请求；失败则拉取远端纠正本地乐观状态
  const push = (call: () => Promise<unknown>) => {
    if (!USE_REAL) return
    call().catch((err) => {
      console.warn('[store] 写回钉钉失败，正在重新同步：', err)
      get().loadAll()
    })
  }

  return {
    role: 'teacher',
    currentUserId: 'teacher_li',

    students: MOCK_STUDENTS,
    workOrders: MOCK_WORK_ORDERS,
    workOrderNodes: Object.fromEntries(
      MOCK_WORK_ORDERS.map(w => [w.id, getWorkOrderNodes(w.id, w.template)])
    ),
    materials: MOCK_MATERIALS,
    essayMaterials: MOCK_ESSAY_MATERIALS,
    planVersions: MOCK_PLAN_VERSIONS,
    changes: MOCK_CHANGES,
    ruleCards: MOCK_RULE_CARDS,
    calibers: MOCK_CALIBERS,
    universities: MOCK_UNIVERSITIES,
    majors: MOCK_MAJORS,
    keyDates: MOCK_KEY_DATES,
    interviews: MOCK_INTERVIEWS,
    admissions: MOCK_ADMISSIONS,
    qaThreads: MOCK_QA,
    notifications: MOCK_NOTIFICATIONS,

    loaded: false,
    loadAll: async () => {
      const data = await fetchAll()
      set(state => ({ ...state, ...data, loaded: true }))
    },

    setRole: (r) => set({ role: r }),

    updateNodeStatus: (workOrderId, nodeId, status) => {
      set(state => ({
        workOrderNodes: {
          ...state.workOrderNodes,
          [workOrderId]: state.workOrderNodes[workOrderId].map(n =>
            n.id === nodeId
              ? {
                  ...n,
                  status,
                  startedAt: status === 'in_progress' ? new Date().toISOString() : n.startedAt,
                  completedAt: status === 'completed' ? new Date().toISOString() : n.completedAt,
                  history: [
                    ...n.history,
                    { at: new Date().toISOString(), action: `状态更新为「${status}」`, operator: operatorLabel(state.role) },
                  ],
                }
              : n
          ),
        },
      }))
      push(() => dgApi.updateNodeStatus(workOrderId, nodeId, status, operatorLabel(get().role)))
    },

    confirmByParent: (workOrderId, nodeId) => {
      set(state => {
        const nodes = state.workOrderNodes[workOrderId] || []
        const idx = nodes.findIndex(n => n.id === nodeId)
        const nextIdx = idx + 1
        return {
          workOrderNodes: {
            ...state.workOrderNodes,
            [workOrderId]: nodes.map((n, i) => {
              if (n.id === nodeId) {
                return {
                  ...n,
                  confirmedByParent: true,
                  confirmedAt: new Date().toISOString(),
                  status: 'completed',
                  completedAt: new Date().toISOString(),
                  history: [...n.history, { at: new Date().toISOString(), action: '家长点击确认', operator: '家长' }],
                }
              }
              // 自动激活下一个未开始节点
              if (i === nextIdx && n.status === 'not_started') {
                return { ...n, status: 'in_progress', startedAt: new Date().toISOString() }
              }
              return n
            }),
          },
          workOrders: state.workOrders.map(w =>
            w.id === workOrderId ? { ...w, currentNodeIndex: nextIdx, lastUpdatedAt: new Date().toISOString() } : w
          ),
        }
      })
      push(() => dgApi.confirmNode(workOrderId, nodeId))
    },

    answerQA: (qaId, answer, caliberCode) => {
      set(state => ({
        qaThreads: state.qaThreads.map(q =>
          q.id === qaId
            ? { ...q, answer, answeredAt: new Date().toISOString(), answeredBy: '李胜', caliberCode, status: 'answered' }
            : q
        ),
      }))
      push(() => dgApi.answerQA(qaId, answer, caliberCode))
    },

    approveChange: (changeId, approve) => {
      set(state => ({
        changes: state.changes.map(c =>
          c.id === changeId
            ? { ...c, status: approve ? 'approved' : 'rejected', approvedBy: '李胜' }
            : c
        ),
      }))
      push(() => dgApi.approveChange(changeId, approve))
    },

    confirmChangeByParent: (changeId) => {
      set(state => ({
        changes: state.changes.map(c =>
          c.id === changeId
            ? { ...c, status: 'parent_confirmed', parentConfirmedAt: new Date().toISOString() }
            : c
        ),
      }))
      push(() => dgApi.parentConfirmChange(changeId))
    },

    markNotificationRead: (id) =>
      set(state => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
      })),

    markAllNotificationsRead: () =>
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
      })),

    parentConfirmAdmission: (admissionId) => {
      set(state => ({
        admissions: state.admissions.map(a =>
          a.id === admissionId ? { ...a, parentKnown: true, parentKnownAt: new Date().toISOString() } : a
        ),
      }))
      push(() => dgApi.confirmAdmission(admissionId))
    },

    freezePlan: (planId) => {
      set(state => ({
        planVersions: state.planVersions.map(p =>
          p.id === planId ? { ...p, status: 'frozen', frozenAt: new Date().toISOString() } : p
        ),
      }))
      push(() => dgApi.freezePlan(planId))
    },

    submitMaterial: (materialId) => {
      set(state => ({
        materials: state.materials.map(m =>
          m.id === materialId ? { ...m, status: 'submitted', submittedAt: new Date().toISOString() } : m
        ),
      }))
      push(() => dgApi.submitMaterial(materialId))
    },

    verifyMaterial: (materialId) => {
      set(state => ({
        materials: state.materials.map(m =>
          m.id === materialId ? { ...m, status: 'verified', verifiedAt: new Date().toISOString() } : m
        ),
      }))
      push(() => dgApi.verifyMaterial(materialId))
    },
  }
})
