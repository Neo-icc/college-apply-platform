import type { NodeTemplate } from '../types'

// 23 节点完整模板（新高二/新高一）
export const FULL_NODES: NodeTemplate[] = [
  { id: 'f-01', index: 1, template: 'full', name: '建档与基线评估', description: '学生档案建立、基线成绩评估、目标地区确认', owner: 'advisor', durationDays: 3, requiresParentConfirm: false, category: 'planning', deliverable: '学生基线评估表' },
  { id: 'f-02', index: 2, template: 'full', name: '选校方案 V1', description: '院校清单初稿（冲刺/匹配/保底）', owner: 'advisor', durationDays: 7, requiresParentConfirm: true, category: 'planning', deliverable: '选校方案 V1' },
  { id: 'f-03', index: 3, template: 'full', name: '专业方向确认', description: '3-5 个目标专业确认，兴趣与就业匹配', owner: 'advisor', durationDays: 3, requiresParentConfirm: true, category: 'planning', deliverable: '专业确认单' },
  { id: 'f-04', index: 4, template: 'full', name: '关键日期核实', description: '各院校申请截止日、语言考试日期核实入库', owner: 'advisor', durationDays: 5, requiresParentConfirm: false, category: 'planning' },
  { id: 'f-05', index: 5, template: 'full', name: '素材问卷回收', description: '学生填写文书素材问卷（必办入口）', owner: 'student', durationDays: 7, requiresParentConfirm: false, category: 'materials', deliverable: '素材问卷' },
  { id: 'f-06', index: 6, template: 'full', name: '材料清单核验', description: '成绩单/在读证明/语言成绩逐项核验', owner: 'advisor', durationDays: 5, requiresParentConfirm: false, category: 'materials', deliverable: '材料核验表' },
  { id: 'f-07', index: 7, template: 'full', name: '文书素材整理', description: 'AI 整理素材，人工复核，不生成内容', owner: 'essay_teacher', durationDays: 5, requiresParentConfirm: false, category: 'essay' },
  { id: 'f-08', index: 8, template: 'full', name: '个人陈述初稿', description: 'PS 初稿撰写', owner: 'essay_teacher', durationDays: 7, requiresParentConfirm: false, category: 'essay', deliverable: 'PS 初稿' },
  { id: 'f-09', index: 9, template: 'full', name: '文书 V1 确认', description: '家长/学生确认文书 V1', owner: 'essay_teacher', durationDays: 3, requiresParentConfirm: true, category: 'essay' },
  { id: 'f-10', index: 10, template: 'full', name: '推荐信筹备', description: '推荐人确认、推荐信素材', owner: 'essay_teacher', durationDays: 7, requiresParentConfirm: false, category: 'essay' },
  { id: 'f-11', index: 11, template: 'full', name: '方案锁定', description: '选校方案锁定，锁定后变更走变更流程', owner: 'advisor', durationDays: 2, requiresParentConfirm: true, category: 'planning', deliverable: '方案确认书' },
  { id: 'f-12', index: 12, template: 'full', name: '申请系统注册', description: 'UCAS/Common App 等系统注册', owner: 'application_teacher', durationDays: 3, requiresParentConfirm: false, category: 'application' },
  { id: 'f-13', index: 13, template: 'full', name: '申请材料提交', description: '文书+材料上传各系统', owner: 'application_teacher', durationDays: 7, requiresParentConfirm: false, category: 'application', deliverable: '提交截图' },
  { id: 'f-14', index: 14, template: 'full', name: '递交确认', description: '家长确认递交，按钮记录', owner: 'application_teacher', durationDays: 2, requiresParentConfirm: true, category: 'application' },
  { id: 'f-15', index: 15, template: 'full', name: '面试辅导', description: '面试安排与模拟', owner: 'advisor', durationDays: 10, requiresParentConfirm: false, category: 'application' },
  { id: 'f-16', index: 16, template: 'full', name: '录取跟进', description: 'Offer 跟踪与确认', owner: 'application_teacher', durationDays: 30, requiresParentConfirm: false, category: 'followup' },
  { id: 'f-17', index: 17, template: 'full', name: '录取结果确认', description: '家长知悉录取结果，按钮记录', owner: 'application_teacher', durationDays: 2, requiresParentConfirm: true, category: 'followup' },
  { id: 'f-18', index: 18, template: 'full', name: '正式与备选院校确认', description: '确认入读与备选院校', owner: 'advisor', durationDays: 3, requiresParentConfirm: true, category: 'followup' },
  { id: 'f-19', index: 19, template: 'full', name: '签证材料准备', description: 'CAS/COE 获取，签证材料清单', owner: 'visa_teacher', durationDays: 7, requiresParentConfirm: false, category: 'visa', deliverable: '签证材料包' },
  { id: 'f-20', index: 20, template: 'full', name: '签证递交', description: '签证申请递交', owner: 'visa_teacher', durationDays: 3, requiresParentConfirm: true, category: 'visa' },
  { id: 'f-21', index: 21, template: 'full', name: '住宿与接机', description: '宿舍申请、接机安排', owner: 'advisor', durationDays: 10, requiresParentConfirm: false, category: 'followup' },
  { id: 'f-22', index: 22, template: 'full', name: '行前指导', description: '行前说明会、材料打包', owner: 'advisor', durationDays: 5, requiresParentConfirm: false, category: 'followup' },
  { id: 'f-23', index: 23, template: 'full', name: '结案归档', description: '全流程归档、满意度回访', owner: 'advisor', durationDays: 3, requiresParentConfirm: true, category: 'followup' },
]

// 8 节点精简模板（本届高三快速跟进）
export const EMERGENCY_NODES: NodeTemplate[] = [
  { id: 'e-01', index: 1, template: 'emergency', name: '快速建档', description: '快速建档、确认已有材料与成绩', owner: 'advisor', durationDays: 1, requiresParentConfirm: false, category: 'planning' },
  { id: 'e-02', index: 2, template: 'emergency', name: '选校方案确认', description: '快速确认选校清单', owner: 'advisor', durationDays: 2, requiresParentConfirm: true, category: 'planning', deliverable: '选校方案' },
  { id: 'e-03', index: 3, template: 'emergency', name: '文书定稿', description: 'PS 与推荐信最终定稿', owner: 'essay_teacher', durationDays: 3, requiresParentConfirm: true, category: 'essay', deliverable: '文书定稿' },
  { id: 'e-04', index: 4, template: 'emergency', name: '材料补齐', description: '缺失材料快速补齐核验', owner: 'advisor', durationDays: 2, requiresParentConfirm: false, category: 'materials' },
  { id: 'e-05', index: 5, template: 'emergency', name: '申请递交', description: '系统注册+材料上传+递交确认', owner: 'application_teacher', durationDays: 2, requiresParentConfirm: true, category: 'application', deliverable: '递交截图' },
  { id: 'e-06', index: 6, template: 'emergency', name: '面试辅导', description: '紧急面试安排', owner: 'advisor', durationDays: 5, requiresParentConfirm: false, category: 'application' },
  { id: 'e-07', index: 7, template: 'emergency', name: '录取跟进', description: 'Offer 跟踪与确认', owner: 'application_teacher', durationDays: 30, requiresParentConfirm: false, category: 'followup' },
  { id: 'e-08', index: 8, template: 'emergency', name: '签证与行前', description: '签证办理+行前安排', owner: 'visa_teacher', durationDays: 10, requiresParentConfirm: true, category: 'visa' },
]

export function getNodesByTemplate(template: 'full' | 'emergency'): NodeTemplate[] {
  return template === 'full' ? FULL_NODES : EMERGENCY_NODES
}

export const OWNER_LABELS: Record<string, string> = {
  advisor: '校内顾问',
  essay_teacher: '文书老师',
  application_teacher: '申请老师',
  visa_teacher: '签证老师',
  parent: '家长',
  student: '学生',
}

export const STATUS_LABELS: Record<string, string> = {
  not_started: '未开始',
  in_progress: '进行中',
  pending_confirm: '待家长确认',
  completed: '已完成',
  overdue: '已超时',
  stalled: '无进展',
}
