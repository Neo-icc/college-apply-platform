import type {
  Student, WorkOrder, WorkOrderNode, MaterialItem, EssayMaterial,
  PlanVersion, ChangeRecord, RuleCard, CaliberItem, University, Major,
  KeyDate, InterviewRecord, AdmissionResult, QAThread, Notification, NodeHistoryItem,
} from '../types'
import { getNodesByTemplate } from './nodeTemplates'

// 工具：生成相对日期
function dateOffset(days: number, hour = 9, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

// ===== 学生档案 =====
export const MOCK_STUDENTS: Student[] = [
  {
    id: 'S001', name: '张子轩', grade: 'G11', targetRegion: ['UK', 'HK'],
    currentSchool: '石家庄二中', gpa: '3.8/4.0',
    languageScores: [{ type: 'IELTS', score: '7.0' }, { type: 'A-Level', score: 'A*AA' }],
    parentName: '张建国', parentPhone: '138****6688', parentUserId: 'ding_user_zhang',
    advisorName: '李胜', enrolledAt: '2025-09-01', tags: ['理科强', '竞赛'], avatarColor: '#3366ff',
  },
  {
    id: 'S002', name: '李思颖', grade: 'G11', targetRegion: ['UK'],
    currentSchool: '石家庄一中', gpa: '3.7/4.0',
    languageScores: [{ type: 'IELTS', score: '6.5' }, { type: 'A-Level', score: 'AAA' }],
    parentName: '李国庆', parentPhone: '139****2233', parentUserId: 'ding_user_li',
    advisorName: '小雪', enrolledAt: '2025-09-01', tags: ['文科', '写作'], avatarColor: '#10b981',
  },
  {
    id: 'S003', name: '王浩然', grade: 'G12', targetRegion: ['UK', 'AU'],
    currentSchool: '衡水中学', gpa: '3.9/4.0',
    languageScores: [{ type: 'IELTS', score: '7.5' }, { type: 'A-Level', score: 'A*A*A' }],
    parentName: '王建军', parentPhone: '137****9911', parentUserId: undefined,
    advisorName: '李胜', enrolledAt: '2024-09-01', tags: ['学霸', '医学方向'], avatarColor: '#f59e0b',
  },
  {
    id: 'S004', name: '陈雨桐', grade: 'G11', targetRegion: ['HK', 'CA'],
    currentSchool: '石家庄外国语', gpa: '3.6/4.0',
    languageScores: [{ type: 'IELTS', score: '6.5' }],
    parentName: '陈志远', parentPhone: '135****7744', parentUserId: 'ding_user_chen',
    advisorName: '小雪', enrolledAt: '2025-09-01', tags: ['商科'], avatarColor: '#8b5cf6',
  },
  {
    id: 'S005', name: '刘梓涵', grade: 'G12', targetRegion: ['UK'],
    currentSchool: '正定中学', gpa: '3.5/4.0',
    languageScores: [{ type: 'IELTS', score: '6.0' }, { type: 'A-Level', score: 'ABB' }],
    parentName: '刘国强', parentPhone: '136****5522', parentUserId: 'ding_user_liu',
    advisorName: '李胜', enrolledAt: '2024-09-01', tags: ['艺术', '作品集'], avatarColor: '#ec4899',
  },
]

// ===== 口径库（7 条）=====
export const MOCK_CALIBERS: CaliberItem[] = [
  { id: 'C001', code: 'K-001', category: '选校', question: 'G5 院校申请需要什么条件？', answer: 'G5 院校（牛剑/IC/LSE/UCL）通常要求 A-Level A*AA 及以上，IELTS 7.0-7.5，部分专业需笔试面试。建议至少 2 门 A*。', updatedAt: '2026-10-10', isActive: true },
  { id: 'C002', code: 'K-002', category: '时间', question: '英国 UCAS 截止时间是什么时候？', answer: '牛津剑桥及医学类专业 10 月 15 日截止；其余专业 1 月 31 日常规截止。建议提前 1 个月完成递交。', updatedAt: '2026-10-12', isActive: true },
  { id: 'C003', code: 'K-003', category: '文书', question: 'PS 字数要求是多少？', answer: 'UCAS PS 限制 4000 字符/47 行，建议 3500-3900 字符。内容聚焦学术兴趣与专业相关经历，不写无关个人故事。', updatedAt: '2026-10-08', isActive: true },
  { id: 'C004', code: 'K-004', category: '签证', question: '英国学生签证资金要求？', answer: '需覆盖第一年学费+生活费（伦敦 1334 英镑/月×9，非伦敦 1023 英镑/月×9），存满 28 天后开具存款证明。', updatedAt: '2026-10-11', isActive: true },
  { id: 'C005', code: 'K-005', category: '录取', question: 'Offer 多久能收到？', answer: '英国院校通常 4-8 周出结果，牛津剑桥 1 月面试后 1 月下旬出。具体以各院校官网为准，不承诺具体时间。', updatedAt: '2026-10-13', isActive: true },
  { id: 'C006', code: 'K-006', category: '费用', question: '英国留学一年总费用？', answer: '学费约 2-3.5 万英镑/年，生活费约 1.2-1.5 万英镑/年，合计约 30-45 万人民币/年（视地区与专业）。', updatedAt: '2026-10-09', isActive: true },
  { id: 'C007', code: 'K-007', category: '专业', question: '计算机科学推荐哪些英国大学？', answer: '第一梯队：牛津、剑桥、IC、UCL、爱丁堡；第二梯队：曼大、KCL、布里斯托、华威、格拉斯哥。需结合成绩匹配。', updatedAt: '2026-10-14', isActive: true },
]

// ===== 重点院校 30 所 =====
export const MOCK_UNIVERSITIES: University[] = [
  // UK 15
  { id: 'U01', name: '牛津大学', nameEn: 'University of Oxford', region: 'UK', qsRank: 3, logoColor: '#002147' },
  { id: 'U02', name: '剑桥大学', nameEn: 'University of Cambridge', region: 'UK', qsRank: 2, logoColor: '#006400' },
  { id: 'U03', name: '帝国理工学院', nameEn: 'Imperial College London', region: 'UK', qsRank: 6, logoColor: '#003E74' },
  { id: 'U04', name: '伦敦大学学院', nameEn: 'UCL', region: 'UK', qsRank: 9, logoColor: '#5C2D91' },
  { id: 'U05', name: '伦敦政治经济学院', nameEn: 'LSE', region: 'UK', qsRank: 46, logoColor: '#B30B2C' },
  { id: 'U06', name: '爱丁堡大学', nameEn: 'University of Edinburgh', region: 'UK', qsRank: 27, logoColor: '#0D3B66' },
  { id: 'U07', name: '曼彻斯特大学', nameEn: 'University of Manchester', region: 'UK', qsRank: 34, logoColor: '#6E0B2D' },
  { id: 'U08', name: '伦敦国王学院', nameEn: 'KCL', region: 'UK', qsRank: 40, logoColor: '#41117D' },
  { id: 'U09', name: '布里斯托大学', nameEn: 'University of Bristol', region: 'UK', qsRank: 55, logoColor: '#C8102E' },
  { id: 'U10', name: '华威大学', nameEn: 'University of Warwick', region: 'UK', qsRank: 67, logoColor: '#8B1A1A' },
  { id: 'U11', name: '格拉斯哥大学', nameEn: 'University of Glasgow', region: 'UK', qsRank: 76, logoColor: '#003865' },
  { id: 'U12', name: '杜伦大学', nameEn: 'Durham University', region: 'UK', qsRank: 78, logoColor: '#5E0B15' },
  { id: 'U13', name: '伯明翰大学', nameEn: 'University of Birmingham', region: 'UK', qsRank: 84, logoColor: '#C8102E' },
  { id: 'U14', name: '利兹大学', nameEn: 'University of Leeds', region: 'UK', qsRank: 85, logoColor: '#9D1F2D' },
  { id: 'U15', name: '南安普顿大学', nameEn: 'University of Southampton', region: 'UK', qsRank: 80, logoColor: '#003366' },
  // HK 6
  { id: 'U16', name: '香港大学', nameEn: 'HKU', region: 'HK', qsRank: 17, logoColor: '#0F4C81' },
  { id: 'U17', name: '香港中文大学', nameEn: 'CUHK', region: 'HK', qsRank: 36, logoColor: '#7C0A02' },
  { id: 'U18', name: '香港科技大学', nameEn: 'HKUST', region: 'HK', qsRank: 47, logoColor: '#0066B2' },
  { id: 'U19', name: '香港城市大学', nameEn: 'CityU', region: 'HK', qsRank: 62, logoColor: '#9C1F1F' },
  { id: 'U20', name: '香港理工大学', nameEn: 'PolyU', region: 'HK', qsRank: 57, logoColor: '#0E1C4A' },
  { id: 'U21', name: '香港浸会大学', nameEn: 'HKBU', region: 'HK', qsRank: 295, logoColor: '#007B3E' },
  // AU 6
  { id: 'U22', name: '墨尔本大学', nameEn: 'University of Melbourne', region: 'AU', qsRank: 14, logoColor: '#003D7C' },
  { id: 'U23', name: '悉尼大学', nameEn: 'University of Sydney', region: 'AU', qsRank: 19, logoColor: '#003C71' },
  { id: 'U24', name: '澳国立大学', nameEn: 'ANU', region: 'AU', qsRank: 34, logoColor: '#154734' },
  { id: 'U25', name: '昆士兰大学', nameEn: 'UQ', region: 'AU', qsRank: 43, logoColor: '#4F1313' },
  { id: 'U26', name: '莫纳什大学', nameEn: 'Monash', region: 'AU', qsRank: 42, logoColor: '#003A70' },
  { id: 'U27', name: '新南威尔士大学', nameEn: 'UNSW', region: 'AU', qsRank: 19, logoColor: '#FFCC00' },
  // CA 3
  { id: 'U28', name: '多伦多大学', nameEn: 'University of Toronto', region: 'CA', qsRank: 25, logoColor: '#002A5C' },
  { id: 'U29', name: '麦吉尔大学', nameEn: 'McGill', region: 'CA', qsRank: 30, logoColor: '#D4145A' },
  { id: 'U30', name: 'UBC', nameEn: 'University of British Columbia', region: 'CA', qsRank: 34, logoColor: '#0F2D52' },
]

// ===== 专业库（示例 50 个，覆盖四地）=====
const MAJOR_NAMES = [
  ['计算机科学', 'Computer Science', '理工科'],
  ['人工智能', 'Artificial Intelligence', '理工科'],
  ['数据科学', 'Data Science', '理工科'],
  ['电子工程', 'Electronic Engineering', '理工科'],
  ['机械工程', 'Mechanical Engineering', '理工科'],
  ['土木工程', 'Civil Engineering', '理工科'],
  ['化学工程', 'Chemical Engineering', '理工科'],
  ['生物医学工程', 'Biomedical Engineering', '理工科'],
  ['数学', 'Mathematics', '理工科'],
  ['物理', 'Physics', '理工科'],
  ['化学', 'Chemistry', '理工科'],
  ['生物学', 'Biology', '理工科'],
  ['医学', 'Medicine', '医学'],
  ['药学', 'Pharmacy', '医学'],
  ['金融学', 'Finance', '商科'],
  ['会计学', 'Accounting', '商科'],
  ['经济学', 'Economics', '商科'],
  ['管理学', 'Management', '商科'],
  ['市场营销', 'Marketing', '商科'],
  ['商业分析', 'Business Analytics', '商科'],
  ['法学', 'Law', '法学'],
  ['国际关系', 'International Relations', '社科'],
  ['心理学', 'Psychology', '社科'],
  ['教育学', 'Education', '社科'],
  ['传媒', 'Media & Communication', '艺术'],
  ['建筑学', 'Architecture', '艺术'],
  ['平面设计', 'Graphic Design', '艺术'],
  ['时尚设计', 'Fashion Design', '艺术'],
  ['音乐', 'Music', '艺术'],
  ['电影制作', 'Film Production', '艺术'],
]

export const MOCK_MAJORS: Major[] = MAJOR_NAMES.map((m, i) => ({
  id: `M${String(i + 1).padStart(3, '0')}`,
  name: m[0], nameEn: m[1], category: m[2],
  region: (['UK', 'HK', 'AU', 'CA'] as const)[i % 4],
}))

// ===== 规则库核对卡（5 张在库）=====
export const MOCK_RULE_CARDS: RuleCard[] = [
  {
    id: 'R001', schoolName: '牛津大学', major: '计算机科学', region: 'UK',
    requirements: [
      { item: 'A-Level', value: 'A*AA（数学必为 A*）', source: 'ox.ac.uk', confidence: 'high' },
      { item: 'IELTS', value: '7.5（单项不低于 7.0）', source: 'ox.ac.uk', confidence: 'high' },
      { item: '笔试', value: 'MAT 必考', source: 'ox.ac.uk', confidence: 'high' },
      { item: '面试', value: '12 月学院面试', source: 'ox.ac.uk', confidence: 'medium' },
    ],
    verifiedAt: '2026-10-05', verifiedBy: '李胜',
  },
  {
    id: 'R002', schoolName: '帝国理工学院', major: '计算机科学', region: 'UK',
    requirements: [
      { item: 'A-Level', value: 'A*A*A（数学+进阶数学）', source: 'imperial.ac.uk', confidence: 'high' },
      { item: 'IELTS', value: '7.0（单项 6.5）', source: 'imperial.ac.uk', confidence: 'high' },
      { item: '笔试', value: '不要求', source: 'imperial.ac.uk', confidence: 'medium' },
    ],
    verifiedAt: '2026-10-06', verifiedBy: '小雪',
  },
  {
    id: 'R003', schoolName: '香港大学', major: '金融学', region: 'HK',
    requirements: [
      { item: 'A-Level', value: 'A*AA', source: 'hku.hk', confidence: 'high' },
      { item: 'IELTS', value: '6.5（单项 6.0）', source: 'hku.hk', confidence: 'high' },
      { item: '面试', value: '部分专业需面试', source: 'hku.hk', confidence: 'medium' },
    ],
    verifiedAt: '2026-10-07', verifiedBy: '李胜',
  },
  {
    id: 'R004', schoolName: '墨尔本大学', major: '商科', region: 'AU',
    requirements: [
      { item: 'A-Level', value: 'AAA', source: 'unimelb.edu.au', confidence: 'high' },
      { item: 'IELTS', value: '6.5（单项 6.0）', source: 'unimelb.edu.au', confidence: 'high' },
      { item: 'ATAR', value: '95+', source: 'unimelb.edu.au', confidence: 'medium' },
    ],
    verifiedAt: '2026-10-08', verifiedBy: '小雪',
  },
  {
    id: 'R005', schoolName: '多伦多大学', major: '计算机科学', region: 'CA',
    requirements: [
      { item: 'A-Level', value: 'AAA', source: 'utoronto.ca', confidence: 'high' },
      { item: 'IELTS', value: '6.5（单项 6.0）', source: 'utoronto.ca', confidence: 'high' },
      { item: '补充文书', value: '个人陈述+补充问答', source: 'utoronto.ca', confidence: 'medium' },
    ],
    verifiedAt: '2026-10-09', verifiedBy: '李胜',
  },
]

// ===== 关键日期 =====
export const MOCK_KEY_DATES: KeyDate[] = [
  { id: 'D001', title: '牛津/剑桥申请截止', date: dateOffset(-2), region: 'UK', type: 'deadline', verified: true, verifiedAt: '2026-10-01' },
  { id: 'D002', title: 'UCAS 常规截止', date: dateOffset(106), region: 'UK', type: 'deadline', verified: true, verifiedAt: '2026-10-01' },
  { id: 'D003', title: 'IELTS 11 月考试', date: dateOffset(18), region: 'UK', type: 'exam', verified: true, verifiedAt: '2026-10-10' },
  { id: 'D004', title: '香港大学早申截止', date: dateOffset(45), region: 'HK', type: 'deadline', verified: false },
  { id: 'D005', title: '墨尔本大学申请截止', date: dateOffset(60), region: 'AU', type: 'deadline', verified: true, verifiedAt: '2026-10-12' },
  { id: 'D006', title: '申请要求月度更新', date: dateOffset(14), type: 'maintenance', verified: true, verifiedAt: '2026-10-01' },
]

// ===== 工单节点生成 =====
function buildNodes(workOrderId: string, template: 'full' | 'emergency', startOffset: number): WorkOrderNode[] {
  const templates = getNodesByTemplate(template)
  const ownerNames: Record<string, string> = {
    advisor: '李胜', essay_teacher: '王文书', application_teacher: '赵申请', visa_teacher: '孙签证', parent: '家长', student: '学生',
  }
  let cursor = startOffset
  return templates.map((t, i) => {
    const startedAt = dateOffset(cursor)
    const dueAt = dateOffset(cursor + t.durationDays)
    cursor += t.durationDays
    // 让前几个节点有不同状态以演示
    let status: WorkOrderNode['status'] = 'not_started'
    if (i === 0) status = 'completed'
    else if (i === 1) status = 'completed'
    else if (i === 2) status = 'pending_confirm'
    else if (i === 3) status = 'in_progress'
    else if (i === 4) status = 'in_progress'
    else if (i === 5) status = 'overdue'
    else if (i === 6) status = 'stalled'

    const history: NodeHistoryItem[] = [
      { at: startedAt, action: '节点创建', operator: '系统' },
    ]
    if (status === 'completed') {
      history.push({ at: dueAt, action: '节点完成', operator: ownerNames[t.owner], note: t.deliverable ? `交付：${t.deliverable}` : undefined })
    }
    if (status === 'in_progress') {
      history.push({ at: startedAt, action: '开始执行', operator: ownerNames[t.owner] })
    }
    if (status === 'overdue') {
      history.push({ at: dateOffset(cursor - t.durationDays), action: '节点超时预警', operator: '系统' })
    }

    return {
      id: `${workOrderId}-N${String(i + 1).padStart(2, '0')}`,
      workOrderId, templateNodeId: t.id, index: t.index,
      name: t.name, description: t.description,
      owner: t.owner, ownerName: ownerNames[t.owner],
      status, startedAt: status !== 'not_started' ? startedAt : undefined,
      dueAt, completedAt: status === 'completed' ? dueAt : undefined,
      requiresParentConfirm: t.requiresParentConfirm,
      confirmedByParent: status === 'completed' && t.requiresParentConfirm,
      confirmedAt: status === 'completed' && t.requiresParentConfirm ? dueAt : undefined,
      deliverable: t.deliverable, history,
    }
  })
}

// ===== 工单 =====
export const MOCK_WORK_ORDERS: WorkOrder[] = [
  { id: 'WO001', studentId: 'S001', studentName: '张子轩', grade: 'G11', template: 'full', status: 'active', createdAt: dateOffset(-30), advisorId: 'A01', advisorName: '李胜', backupAdvisorId: 'A02', backupAdvisorName: '小雪', currentNodeIndex: 4, progress: 18, lastUpdatedAt: dateOffset(-1), parentUserId: 'ding_user_zhang' },
  { id: 'WO002', studentId: 'S002', studentName: '李思颖', grade: 'G11', template: 'full', status: 'active', createdAt: dateOffset(-28), advisorId: 'A02', advisorName: '小雪', backupAdvisorId: 'A01', backupAdvisorName: '李胜', currentNodeIndex: 5, progress: 22, lastUpdatedAt: dateOffset(-2), parentUserId: 'ding_user_li' },
  { id: 'WO003', studentId: 'S003', studentName: '王浩然', grade: 'G12', template: 'emergency', status: 'active', createdAt: dateOffset(-10), advisorId: 'A01', advisorName: '李胜', backupAdvisorId: 'A02', backupAdvisorName: '小雪', currentNodeIndex: 3, progress: 38, lastUpdatedAt: dateOffset(0), parentUserId: undefined },
  { id: 'WO004', studentId: 'S004', studentName: '陈雨桐', grade: 'G11', template: 'full', status: 'active', createdAt: dateOffset(-25), advisorId: 'A02', advisorName: '小雪', backupAdvisorId: 'A01', backupAdvisorName: '李胜', currentNodeIndex: 3, progress: 14, lastUpdatedAt: dateOffset(-3), parentUserId: 'ding_user_chen' },
  { id: 'WO005', studentId: 'S005', studentName: '刘梓涵', grade: 'G12', template: 'emergency', status: 'active', createdAt: dateOffset(-12), advisorId: 'A01', advisorName: '李胜', backupAdvisorId: 'A02', backupAdvisorName: '小雪', currentNodeIndex: 2, progress: 25, lastUpdatedAt: dateOffset(-1), parentUserId: 'ding_user_liu' },
]

export function getWorkOrderNodes(workOrderId: string, template: 'full' | 'emergency'): WorkOrderNode[] {
  const wo = MOCK_WORK_ORDERS.find(w => w.id === workOrderId)
  const startOffset = wo ? Math.floor((new Date(wo.createdAt).getTime() - Date.now()) / 86400000) : -30
  return buildNodes(workOrderId, template, startOffset)
}

// ===== 材料清单 =====
export const MOCK_MATERIALS: MaterialItem[] = [
  { id: 'MAT001', studentId: 'S001', name: '高中成绩单', category: 'academic', status: 'verified', submittedAt: dateOffset(-25), verifiedAt: dateOffset(-20) },
  { id: 'MAT002', studentId: 'S001', name: '在读证明', category: 'academic', status: 'verified', submittedAt: dateOffset(-24), verifiedAt: dateOffset(-20) },
  { id: 'MAT003', studentId: 'S001', name: 'IELTS 成绩单', category: 'language', status: 'verified', submittedAt: dateOffset(-22), verifiedAt: dateOffset(-20) },
  { id: 'MAT004', studentId: 'S001', name: '个人陈述', category: 'personal', status: 'submitted', submittedAt: dateOffset(-2) },
  { id: 'MAT005', studentId: 'S001', name: '推荐信', category: 'personal', status: 'pending' },
  { id: 'MAT006', studentId: 'S001', name: '存款证明', category: 'financial', status: 'pending' },
  { id: 'MAT007', studentId: 'S002', name: '高中成绩单', category: 'academic', status: 'verified', submittedAt: dateOffset(-26), verifiedAt: dateOffset(-22) },
  { id: 'MAT008', studentId: 'S002', name: 'IELTS 成绩单', category: 'language', status: 'submitted', submittedAt: dateOffset(-5) },
  { id: 'MAT009', studentId: 'S002', name: '个人陈述', category: 'personal', status: 'pending' },
  { id: 'MAT010', studentId: 'S003', name: '高中成绩单', category: 'academic', status: 'verified', submittedAt: dateOffset(-8), verifiedAt: dateOffset(-7) },
  { id: 'MAT011', studentId: 'S003', name: 'IELTS 成绩单', category: 'language', status: 'verified', submittedAt: dateOffset(-9), verifiedAt: dateOffset(-7) },
  { id: 'MAT012', studentId: 'S003', name: '个人陈述', category: 'personal', status: 'verified', submittedAt: dateOffset(-6), verifiedAt: dateOffset(-5) },
]

// ===== 文书素材 =====
export const MOCK_ESSAY_MATERIALS: EssayMaterial[] = [
  { id: 'ES001', studentId: 'S001', type: '个人陈述素材', content: '张子轩同学从小对计算机编程感兴趣，初中自学 Python，高中参加信息学竞赛获省一等奖。对人工智能伦理有深入思考，希望未来研究 AI 与社会的关系。', status: 'confirmed', submittedAt: dateOffset(-15) },
  { id: 'ES002', studentId: 'S001', type: '活动列表', content: '1. 信息学竞赛省一等奖（2025）\n2. 校编程社社长（2024-2026）\n3. 社区编程支教志愿者（2025 暑假）', status: 'confirmed', submittedAt: dateOffset(-14) },
  { id: 'ES003', studentId: 'S002', type: '个人陈述素材', content: '李思颖热爱英国文学，高二翻译过一部短篇集。对女性主义文学批评有兴趣，希望在大学深造英国文学。', status: 'submitted', submittedAt: dateOffset(-10) },
]

// ===== 方案版本 =====
export const MOCK_PLAN_VERSIONS: PlanVersion[] = [
  {
    id: 'PV001', studentId: 'S001', version: 'V1.0',
    schools: [
      { name: '牛津大学', region: 'UK', major: '计算机科学', tier: 'reach' },
      { name: '帝国理工学院', region: 'UK', major: '计算机科学', tier: 'reach' },
      { name: '爱丁堡大学', region: 'UK', major: '计算机科学', tier: 'match' },
      { name: '曼彻斯特大学', region: 'UK', major: '计算机科学', tier: 'match' },
      { name: '布里斯托大学', region: 'UK', major: '计算机科学', tier: 'safety' },
    ],
    status: 'frozen', createdAt: dateOffset(-20), frozenAt: dateOffset(-10), note: '家长确认锁定',
  },
  {
    id: 'PV002', studentId: 'S002', version: 'V1.0',
    schools: [
      { name: 'UCL', region: 'UK', major: '英语文学', tier: 'reach' },
      { name: '爱丁堡大学', region: 'UK', major: '英语文学', tier: 'match' },
      { name: '杜伦大学', region: 'UK', major: '英语文学', tier: 'match' },
      { name: '利兹大学', region: 'UK', major: '英语文学', tier: 'safety' },
    ],
    status: 'draft', createdAt: dateOffset(-15),
  },
]

// ===== 变更记录 =====
export const MOCK_CHANGES: ChangeRecord[] = [
  { id: 'CH001', studentId: 'S001', workOrderId: 'WO001', type: '选校变更', from: '华威大学（计算机）', to: '布里斯托大学（计算机）', impact: '需补充布里斯托 PS 针对性内容，预计 3 天', status: 'parent_confirmed', approvedBy: '李胜', parentConfirmedAt: dateOffset(-8), createdAt: dateOffset(-10), operator: '李胜' },
  { id: 'CH002', studentId: 'S003', workOrderId: 'WO003', type: '紧急加申', from: '无', to: '加申南安普顿大学', impact: '需 2 天内完成 PS 调整与递交', status: 'pending_approval', createdAt: dateOffset(-1), operator: '李胜' },
]

// ===== 约谈记录 =====
export const MOCK_INTERVIEWS: InterviewRecord[] = [
  { id: 'IV001', studentId: 'S001', date: dateOffset(-15), participants: ['张子轩', '张建国', '李胜', '王文书'], topic: '选校方案确认', summary: '确认 5 所院校清单，牛津为冲刺目标，需重点准备 MAT 笔试。', decisions: ['锁定选校方案 V1.0', '10 月底前完成 MAT 辅导'], status: 'parent_confirmed', parentConfirmedAt: dateOffset(-14) },
  { id: 'IV002', studentId: 'S003', date: dateOffset(5), participants: ['王浩然', '王建军', '李胜'], topic: '快速申请方案', summary: '讨论加申南安普顿的可行性与时间安排。', decisions: ['待审批'], status: 'scheduled' },
]

// ===== 录取结果 =====
export const MOCK_ADMISSIONS: AdmissionResult[] = [
  { id: 'AD001', studentId: 'S003', studentName: '王浩然', schoolName: '爱丁堡大学', major: '计算机科学', region: 'UK', result: 'offer', scholarship: '£2,000/年', receivedAt: dateOffset(-3), parentKnown: true, parentKnownAt: dateOffset(-2) },
  { id: 'AD002', studentId: 'S003', studentName: '王浩然', schoolName: '曼彻斯特大学', major: '计算机科学', region: 'UK', result: 'offer', receivedAt: dateOffset(-1), parentKnown: false },
  { id: 'AD003', studentId: 'S005', studentName: '刘梓涵', schoolName: '利兹大学', major: '传媒', region: 'UK', result: 'pending', receivedAt: dateOffset(0), parentKnown: false },
]

// ===== 家长问答 =====
export const MOCK_QA: QAThread[] = [
  { id: 'QA001', studentId: 'S001', studentName: '张子轩', question: '牛津的 MAT 笔试具体考什么内容？需要专门准备吗？', askedAt: dateOffset(-1, 10), askedBy: '张建国', status: 'answered', answer: 'MAT（Mathematics Admissions Test）主要考察高中数学知识的灵活应用，包括代数、微积分、几何等。建议至少提前 2 个月刷历年真题。参考标准 K-001。', answeredAt: dateOffset(-1, 14), answeredBy: '李胜', caliberCode: 'K-001', slaHours: 24 },
  { id: 'QA002', studentId: 'S002', studentName: '李思颖', question: 'UCL 的英语文学专业对写作能力有特别要求吗？', askedAt: dateOffset(0, 9), askedBy: '李国庆', status: 'pending', slaHours: 24 },
  { id: 'QA003', studentId: 'S001', studentName: '张子轩', question: '如果牛津没录取，爱丁堡的截止时间会不会已经过了？', askedAt: dateOffset(-2, 16), askedBy: '张建国', status: 'answered', answer: '爱丁堡大学没有明确早申截止，1 月 31 日前递交均可。牛津 10 月 15 日截止不影响其他院校。参考标准 K-002。', answeredAt: dateOffset(-2, 17), answeredBy: '李胜', caliberCode: 'K-002', slaHours: 24 },
  { id: 'QA004', studentId: 'S003', studentName: '王浩然', question: '加申南安普顿还来得及吗？', askedAt: dateOffset(-2, 11), askedBy: '王建军', status: 'overdue', slaHours: 24 },
]

// ===== 通知（模拟系统自动生成）=====
export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'N001', to: 'teacher', type: 'morning_report', title: '📋 10月17日 晨报', content: '超时节点 2 条、待家长确认 3 条，请优先处理。', read: false, createdAt: dateOffset(0, 8, 30), priority: 'high' },
  { id: 'N002', to: 'teacher', type: 'node_overdue', title: '⚠️ 节点已超时：张子轩 材料清单', content: '张子轩的「材料清单」节点已超时 2 天，请尽快更新状态。', read: false, createdAt: dateOffset(-1, 8), priority: 'high' },
  { id: 'N003', to: 'parent', toUserId: 'ding_user_zhang', type: 'parent_confirm', title: '✋ 请确认：张子轩 选校方案 V1.0', content: '选校方案已锁定，请点击确认。如未确认次日会再次提醒。', read: false, createdAt: dateOffset(0, 9), actionLabel: '确认方案', actionLink: '/confirm', priority: 'high' },
  { id: 'N004', to: 'parent', toUserId: 'ding_user_li', type: 'parent_confirm', title: '✋ 请确认：李思颖 专业方向', content: '请确认目标专业：英语文学。', read: true, createdAt: dateOffset(-1, 10), actionLabel: '去确认', actionLink: '/confirm', priority: 'medium' },
  { id: 'N005', to: 'teacher', type: 'qa_reply', title: '💬 新提问：UCL 英语文学写作要求', content: '李国庆（李思颖家长）提问，请及时答复。', read: false, createdAt: dateOffset(0, 9), priority: 'medium' },
  { id: 'N006', to: 'teacher', type: 'node_stalled', title: '⏸️ 节点 7 天无进展：张子轩 文书素材', content: '张子轩的「文书素材」已 7 天无进展，请跟进。', read: false, createdAt: dateOffset(0, 8), priority: 'medium' },
  { id: 'N007', to: 'all', type: 'key_date', title: '📅 关键日期提醒', content: 'IELTS 11 月考试还有 18 天，请已报名学生做好准备。', read: true, createdAt: dateOffset(-1, 9), priority: 'low' },
  { id: 'N008', to: 'parent', toUserId: 'ding_user_zhang', type: 'node_due_soon', title: '⏰ 节点即将到期：张子轩 个人陈述初稿', content: '「个人陈述初稿」将在 3 天后到期。', read: false, createdAt: dateOffset(0, 10), priority: 'medium' },
]
