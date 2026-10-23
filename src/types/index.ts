// ===== 升学指导协作体系 · 数据类型定义（对应钉钉 Base 16 张表）=====

export type Role = 'teacher' | 'parent' | 'student'

export type NodeStatus =
  | 'not_started' // 未开始
  | 'in_progress' // 进行中
  | 'pending_confirm' // 待家长确认
  | 'completed' // 已完成
  | 'overdue' // 已逾期
  | 'stalled' // 停滞

export type NodeOwner = 'advisor' | 'essay_teacher' | 'application_teacher' | 'visa_teacher' | 'parent' | 'student'

export type Grade = 'G12' | 'G11' | 'G10'

export type Region = 'UK' | 'HK' | 'AU' | 'CA'

// 1. 工单
export interface WorkOrder {
  id: string
  studentId: string
  studentName: string
  grade: Grade
  template: 'full' | 'emergency' // 23节点 / 8应急节点
  status: 'active' | 'frozen' | 'closed'
  createdAt: string
  advisorId: string
  advisorName: string
  backupAdvisorId: string
  backupAdvisorName: string
  currentNodeIndex: number
  progress: number // 0-100
  lastUpdatedAt: string
  parentUserId?: string
}

// 2. 节点模板
export interface NodeTemplate {
  id: string
  index: number
  template: 'full' | 'emergency'
  name: string
  description: string
  owner: NodeOwner
  durationDays: number
  requiresParentConfirm: boolean
  category:
    | 'planning'
    | 'materials'
    | 'essay'
    | 'application'
    | 'visa'
    | 'followup'
  deliverable?: string
}

// 工单节点实例
export interface WorkOrderNode {
  id: string
  workOrderId: string
  templateNodeId: string
  index: number
  name: string
  description: string
  owner: NodeOwner
  ownerName: string
  status: NodeStatus
  startedAt?: string
  dueAt: string
  completedAt?: string
  requiresParentConfirm: boolean
  confirmedByParent?: boolean
  confirmedAt?: string
  deliverable?: string
  note?: string
  history: NodeHistoryItem[]
}

export interface NodeHistoryItem {
  at: string
  action: string
  operator: string
  note?: string
}

// 3. 学生档案
export interface Student {
  id: string
  name: string
  grade: Grade
  targetRegion: Region[]
  currentSchool: string
  gpa: string
  languageScores: { type: string; score: string; date?: string }[]
  parentName: string
  parentPhone: string
  parentUserId?: string
  advisorName: string
  enrolledAt: string
  tags: string[]
  avatarColor: string
}

// 4. 材料清单
export interface MaterialItem {
  id: string
  studentId: string
  name: string
  category: 'academic' | 'language' | 'personal' | 'financial' | 'other'
  status: 'pending' | 'submitted' | 'verified' | 'rejected'
  submittedAt?: string
  verifiedAt?: string
  note?: string
}

// 5. 文书素材
export interface EssayMaterial {
  id: string
  studentId: string
  type: string // 个人陈述 / 推荐信 / 活动列表 / 奖项
  content: string
  status: 'draft' | 'submitted' | 'confirmed'
  submittedAt?: string
}

// 6. 方案版本
export interface PlanVersion {
  id: string
  studentId: string
  version: string
  schools: { name: string; region: Region; major: string; tier: 'reach' | 'match' | 'safety' }[]
  status: 'draft' | 'frozen' | 'superseded'
  createdAt: string
  frozenAt?: string
  note?: string
}

// 7. 变更记录
export interface ChangeRecord {
  id: string
  studentId: string
  workOrderId?: string
  type: string
  from: string
  to: string
  impact: string
  status: 'pending_approval' | 'approved' | 'rejected' | 'parent_confirmed'
  approvedBy?: string
  parentConfirmedAt?: string
  createdAt: string
  operator: string
}

// 8. 规则库（核对卡）
export interface RuleCard {
  id: string
  schoolName: string
  major: string
  region: Region
  requirements: { item: string; value: string; source: string; confidence: 'high' | 'medium' | 'low' }[]
  verifiedAt: string
  verifiedBy: string
}

// 9. 口径库
export interface CaliberItem {
  id: string
  code: string // 编号 如 K-001
  category: string
  question: string
  answer: string
  updatedAt: string
  isActive: boolean
}

// 10. 重点院校
export interface University {
  id: string
  name: string
  nameEn: string
  region: Region
  qsRank?: number
  logoColor: string
}

// 11. 专业库
export interface Major {
  id: string
  name: string
  nameEn: string
  category: string
  region: Region
}

// 12. 关键日期
export interface KeyDate {
  id: string
  title: string
  date: string
  region?: Region
  schoolId?: string
  type: 'deadline' | 'exam' | 'event' | 'maintenance'
  verified: boolean
  verifiedAt?: string
  note?: string
}

// 13. 约谈记录
export interface InterviewRecord {
  id: string
  studentId: string
  date: string
  participants: string[]
  topic: string
  summary: string
  decisions: string[]
  status: 'scheduled' | 'completed' | 'parent_confirmed'
  parentConfirmedAt?: string
}

// 14. 录取结果
export interface AdmissionResult {
  id: string
  studentId: string
  studentName: string
  schoolName: string
  major: string
  region: Region
  result: 'offer' | 'rejected' | 'waiting' | 'pending'
  scholarship?: string
  receivedAt: string
  parentKnown: boolean
  parentKnownAt?: string
}

// 15. 家长问答
export interface QAThread {
  id: string
  studentId: string
  studentName: string
  question: string
  askedAt: string
  askedBy: string
  status: 'pending' | 'answered' | 'overdue'
  answer?: string
  answeredAt?: string
  answeredBy?: string
  caliberCode?: string
  slaHours: number
}

// 16. 提醒 / 通知
export interface Notification {
  id: string
  to: Role | 'all'
  toUserId?: string
  type:
    | 'node_overdue'
    | 'node_due_soon'
    | 'node_stalled'
    | 'parent_confirm'
    | 'qa_reply'
    | 'key_date'
    | 'admission'
    | 'interview'
    | 'change'
    | 'morning_report'
    | 'weekly_report'
    | 'material'
    | 'policy'
  title: string
  content: string
  read: boolean
  createdAt: string
  actionLabel?: string
  actionLink?: string
  priority: 'low' | 'medium' | 'high'
}
