// 数据源抽象：mock ↔ 真实（钉钉）一键切换
// 开关：.env.development / .env.production 中的 VITE_USE_REAL_DATA
import type {
  Student, WorkOrder, WorkOrderNode, MaterialItem, EssayMaterial,
  PlanVersion, ChangeRecord, RuleCard, CaliberItem, University, Major,
  KeyDate, InterviewRecord, AdmissionResult, QAThread, Notification,
} from '../types'
import {
  MOCK_STUDENTS, MOCK_WORK_ORDERS, getWorkOrderNodes, MOCK_MATERIALS,
  MOCK_ESSAY_MATERIALS, MOCK_PLAN_VERSIONS, MOCK_CHANGES, MOCK_RULE_CARDS,
  MOCK_CALIBERS, MOCK_UNIVERSITIES, MOCK_MAJORS, MOCK_KEY_DATES,
  MOCK_INTERVIEWS, MOCK_ADMISSIONS, MOCK_QA, MOCK_NOTIFICATIONS,
} from '../data/mockData'
import { generateNotifications } from '../engine'
import { dgApi } from './dingtalkApi'

export const USE_REAL = import.meta.env.VITE_USE_REAL_DATA === 'true'

export interface LoadedData {
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
}

/** 拉取全量数据，返回与 store 一致的切片；真实模式失败自动回退 mock */
export async function loadAll(): Promise<LoadedData> {
  if (!USE_REAL) return mockAll()
  try {
    const [wo, st, lib, dates, interviews, adm, qa] = await Promise.all([
      dgApi.workorders(),
      dgApi.students(),
      dgApi.library(),
      dgApi.dates(),
      dgApi.interviews(),
      dgApi.admissions(),
      dgApi.qa(),
    ])
    const workOrders = (wo.workOrders || []) as WorkOrder[]
    const workOrderNodes = (wo.workOrderNodes || {}) as Record<string, WorkOrderNode[]>
    // 通知中心：由引擎基于真实节点实时聚合，不再依赖假数据
    const notifications = workOrders.flatMap((w) =>
      generateNotifications(workOrderNodes[w.id] || [], w.id, w.studentName)
    )
    return {
      workOrders,
      workOrderNodes,
      students: (st.students || []) as Student[],
      materials: (st.materials || []) as MaterialItem[],
      essayMaterials: (st.essayMaterials || []) as EssayMaterial[],
      planVersions: (st.planVersions || []) as PlanVersion[],
      changes: (st.changes || []) as ChangeRecord[],
      ruleCards: (lib.ruleCards || []) as RuleCard[],
      calibers: (lib.calibers || []) as CaliberItem[],
      universities: (lib.universities || []) as University[],
      majors: (lib.majors || []) as Major[],
      keyDates: ((dates.keyDates || []) as KeyDate[]),
      interviews: (interviews.interviews || []) as InterviewRecord[],
      admissions: (adm.admissions || []) as AdmissionResult[],
      qaThreads: (qa.qaThreads || []) as QAThread[],
      notifications,
    }
  } catch (err) {
    console.warn('[dataSource] 真实数据加载失败，已回退 mock 数据：', err)
    return mockAll()
  }
}

function mockAll(): LoadedData {
  return {
    students: MOCK_STUDENTS,
    workOrders: MOCK_WORK_ORDERS,
    workOrderNodes: Object.fromEntries(MOCK_WORK_ORDERS.map((w) => [w.id, getWorkOrderNodes(w.id, w.template)])),
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
  }
}
