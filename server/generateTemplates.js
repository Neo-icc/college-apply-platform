/**
 * 批量生成钉钉多维表格导入模板（CSV）
 * - 字段表头与 server/fieldMap.js 完全同步（单一事实来源）
 * - 枚举取值与 src/types/index.ts、src/data/mockData.ts 保持一致
 * - 输出两套文件：
 *   server/templates/*.csv        带字段说明的对照版（4 行：表头/字段名/说明/示例），仅供查阅
 *   server/templates/import/*.csv 可直接导入版（表头 + 1 行示例数据）
 *
 * 运行：npm run templates
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { SHEETS } from './fieldMap.js'

const OUT = path.resolve('server/templates')
const IMPORT_OUT = path.join(OUT, 'import')
for (const dir of [OUT, IMPORT_OUT]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

/** 字段说明：r = 是否必填，h = 中文说明（枚举值必须与前端类型一致） */
const TIPS = {
  workOrder: {
    id: { r: true, h: '工单唯一ID，如 WO001' },
    studentId: { r: true, h: '关联「学生档案」的学生ID，如 S001' },
    studentName: { r: true, h: '学生姓名（冗余字段，便于列表展示）' },
    grade: { r: true, h: 'G10 / G11 / G12' },
    template: { r: true, h: 'full=23节点完整流程 / emergency=8节点应急' },
    status: { r: true, h: 'active 进行中 / frozen 冻结 / closed 关闭' },
    createdAt: { r: true, h: '创建日期' },
    advisorName: { r: true, h: '主顾问姓名' },
    backupAdvisorName: { r: false, h: '备顾问姓名' },
    currentNodeIndex: { r: true, h: '当前节点序号（整数，从 1 开始）' },
    progress: { r: true, h: '整体进度 0-100 的整数' },
    lastUpdatedAt: { r: true, h: '最后更新日期' },
    parentUserId: { r: false, h: '家长钉钉 unionId（消息推送用）' },
  },
  nodeTemplate: {
    id: { r: true, h: '模板节点ID，如 f-01' },
    index: { r: true, h: '节点序号（整数，从 1 开始）' },
    template: { r: true, h: 'full / emergency' },
    name: { r: true, h: '节点名称，如 建档与基线评估' },
    description: { r: false, h: '节点说明（一句话）' },
    owner: { r: true, h: 'advisor / essay_teacher / application_teacher / visa_teacher / parent / student' },
    durationDays: { r: true, h: '标准时长（天，整数）' },
    requiresParentConfirm: { r: true, h: '是否需要家长确认' },
    category: { r: true, h: 'planning / materials / essay / application / visa / followup' },
    deliverable: { r: false, h: '交付物名称' },
  },
  node: {
    id: { r: true, h: '节点唯一ID，建议「工单ID-序号」，如 N-WO001-01' },
    workOrderId: { r: true, h: '关联「工单」的工单ID' },
    index: { r: true, h: '节点序号（整数）' },
    name: { r: true, h: '节点名称（与节点模板一致）' },
    description: { r: false, h: '节点说明' },
    owner: { r: true, h: 'advisor / essay_teacher / application_teacher / visa_teacher / parent / student' },
    ownerName: { r: true, h: '实际负责人姓名' },
    status: { r: true, h: 'not_started / in_progress / pending_confirm / completed / overdue / stalled' },
    startedAt: { r: false, h: '开始日期（未开始可空）' },
    dueAt: { r: true, h: '截止日期' },
    completedAt: { r: false, h: '完成日期（未完成可空）' },
    requiresParentConfirm: { r: true, h: '是否需要家长确认' },
    confirmedByParent: { r: false, h: '家长是否已确认' },
    confirmedAt: { r: false, h: '家长确认时间' },
    deliverable: { r: false, h: '实际交付物名称' },
  },
  student: {
    id: { r: true, h: '学生唯一ID，如 S001' },
    name: { r: true, h: '学生姓名' },
    grade: { r: true, h: 'G10 / G11 / G12' },
    targetRegion: { r: true, h: '多值用 ; 分隔，取值 UK / HK / AU / CA，如 UK; HK' },
    currentSchool: { r: true, h: '当前就读学校' },
    gpa: { r: false, h: 'GPA 文本，如 3.8/4.0' },
    languageScores: { r: false, h: '多值用 ; 分隔，每条「类型 分数 [日期]」，如 IELTS 7.0 2026-06-10; A-Level A*AA' },
    parentName: { r: true, h: '家长姓名' },
    parentPhone: { r: true, h: '家长手机号' },
    parentUserId: { r: false, h: '家长钉钉 unionId（消息推送用）' },
    advisorName: { r: true, h: '负责顾问姓名' },
    enrolledAt: { r: true, h: '入学/建档日期' },
    tags: { r: false, h: '多值用 ; 分隔，如 高GPA; 信息学竞赛' },
  },
  material: {
    id: { r: true, h: '材料唯一ID，如 MAT001' },
    studentId: { r: true, h: '关联「学生档案」的学生ID' },
    name: { r: true, h: '材料名称，如 高中成绩单' },
    category: { r: true, h: 'academic 学术 / language 语言 / personal 个人 / financial 资金 / other 其他' },
    status: { r: true, h: 'pending 待提交 / submitted 已提交 / verified 已核验 / rejected 退回' },
    submittedAt: { r: false, h: '提交日期（未提交可空）' },
    verifiedAt: { r: false, h: '核验日期（未核验可空）' },
    note: { r: false, h: '备注' },
  },
  essay: {
    id: { r: true, h: '素材唯一ID，如 ES001' },
    studentId: { r: true, h: '关联「学生档案」的学生ID' },
    type: { r: true, h: '自由文本：个人陈述素材 / 活动列表 / 推荐信 / 奖项' },
    content: { r: true, h: '素材内容（多行文本）' },
    status: { r: true, h: 'draft 草稿 / submitted 已提交 / confirmed 已确认' },
    submittedAt: { r: false, h: '提交日期' },
  },
  plan: {
    id: { r: true, h: '方案唯一ID，如 PV001' },
    studentId: { r: true, h: '关联「学生档案」的学生ID' },
    version: { r: true, h: '版本号，如 V1.0' },
    schools: { r: true, h: 'JSON数组：[{"name":"曼彻斯特大学","region":"UK","major":"计算机科学","tier":"match"}]；tier=reach/match/safety' },
    status: { r: true, h: 'draft 草稿 / frozen 已冻结 / superseded 已替代' },
    createdAt: { r: true, h: '创建日期' },
    frozenAt: { r: false, h: '冻结日期（未冻结可空）' },
    note: { r: false, h: '备注' },
  },
  change: {
    id: { r: true, h: '变更唯一ID，如 CH001' },
    studentId: { r: true, h: '关联「学生档案」的学生ID' },
    workOrderId: { r: false, h: '关联「工单」的工单ID' },
    type: { r: true, h: '自由文本：选校变更 / 紧急加申 / 专业变更 / 截止日延期' },
    from: { r: true, h: '变更前内容' },
    to: { r: true, h: '变更后内容' },
    impact: { r: true, h: '连锁影响说明（需同步的节点/文书）' },
    status: { r: true, h: 'pending_approval 待审批 / approved 已通过 / rejected 已驳回 / parent_confirmed 家长已确认' },
    approvedBy: { r: false, h: '审批人姓名' },
    parentConfirmedAt: { r: false, h: '家长确认时间' },
    createdAt: { r: true, h: '创建日期' },
    operator: { r: true, h: '操作人姓名' },
  },
  ruleCard: {
    id: { r: true, h: '核对卡唯一ID，如 RC001' },
    schoolName: { r: true, h: '院校名称' },
    major: { r: true, h: '专业名称' },
    region: { r: true, h: 'UK / HK / AU / CA' },
    requirements: { r: true, h: 'JSON数组：[{"item":"A-Level","value":"A*AA","source":"官网","confidence":"high"}]；confidence=high/medium/low' },
    verifiedAt: { r: true, h: '核实日期' },
    verifiedBy: { r: true, h: '核实人姓名' },
  },
  caliber: {
    id: { r: true, h: '口径唯一ID，如 C001' },
    code: { r: true, h: '口径编号，如 K-001' },
    category: { r: true, h: '选校 / 时间 / 文书 / 签证 / 录取 / 费用 / 专业' },
    question: { r: true, h: '家长常见问题' },
    answer: { r: true, h: '标准答复（对外统一口径）' },
    updatedAt: { r: true, h: '更新日期' },
    isActive: { r: true, h: '是否生效' },
  },
  university: {
    id: { r: true, h: '院校唯一ID，如 U001' },
    name: { r: true, h: '院校中文名' },
    nameEn: { r: true, h: '院校英文名' },
    region: { r: true, h: 'UK / HK / AU / CA' },
    qsRank: { r: false, h: 'QS 排名（整数）' },
    logoColor: { r: false, h: '标识色 #RRGGBB' },
  },
  major: {
    id: { r: true, h: '专业唯一ID，如 MJ001' },
    name: { r: true, h: '专业中文名' },
    nameEn: { r: true, h: '专业英文名' },
    category: { r: true, h: '自由文本：STEM / 商科 / 人文 / 艺术 / 社科' },
    region: { r: true, h: 'UK / HK / AU / CA' },
  },
  keyDate: {
    id: { r: true, h: '关键日期唯一ID，如 D001' },
    title: { r: true, h: '标题，如 UCAS 常规截止' },
    date: { r: true, h: '日期' },
    region: { r: false, h: 'UK / HK / AU / CA（全局事项可空）' },
    type: { r: true, h: 'deadline 截止 / exam 考试 / event 活动 / maintenance 巡检' },
    verified: { r: true, h: '是否已核实' },
    verifiedAt: { r: false, h: '核实日期' },
    note: { r: false, h: '备注' },
  },
  interview: {
    id: { r: true, h: '约谈唯一ID，如 IV001' },
    studentId: { r: true, h: '关联「学生档案」的学生ID' },
    date: { r: true, h: '约谈时间' },
    participants: { r: true, h: '多值用 ; 分隔，如 张子轩; 张建国; 李胜' },
    topic: { r: true, h: '约谈主题' },
    summary: { r: true, h: '约谈纪要' },
    decisions: { r: true, h: 'JSON字符串数组，如 ["冻结选校方案 V1.0","10 月底前完成 MAT 辅导"]' },
    status: { r: true, h: 'scheduled 已安排 / completed 已完成 / parent_confirmed 家长已确认' },
    parentConfirmedAt: { r: false, h: '家长确认时间' },
  },
  admission: {
    id: { r: true, h: '录取唯一ID，如 AD001' },
    studentId: { r: true, h: '关联「学生档案」的学生ID' },
    studentName: { r: true, h: '学生姓名（冗余字段）' },
    schoolName: { r: true, h: '录取院校名称' },
    major: { r: true, h: '录取专业' },
    region: { r: true, h: 'UK / HK / AU / CA' },
    result: { r: true, h: 'offer 录取 / rejected 拒录 / waiting 候补 / pending 待定' },
    scholarship: { r: false, h: '奖学金说明' },
    receivedAt: { r: true, h: '收到日期' },
    parentKnown: { r: true, h: '家长是否已知悉' },
    parentKnownAt: { r: false, h: '家长知悉时间' },
  },
  qa: {
    id: { r: true, h: '问答唯一ID，如 QA001' },
    studentId: { r: true, h: '关联「学生档案」的学生ID' },
    studentName: { r: true, h: '学生姓名（冗余字段）' },
    question: { r: true, h: '家长提问内容' },
    askedAt: { r: true, h: '提问时间' },
    askedBy: { r: true, h: '提问人（家长姓名）' },
    status: { r: true, h: 'pending 待答复 / answered 已答复 / overdue 超时' },
    answer: { r: false, h: '答复内容' },
    answeredAt: { r: false, h: '答复时间' },
    answeredBy: { r: false, h: '答复人姓名' },
    caliberCode: { r: false, h: '引用口径编号，如 K-003' },
    slaHours: { r: true, h: 'SLA 时长（小时，整数，通常 24）' },
  },
  nodeHistory: {
    id: { r: true, h: '留痕唯一ID（建议 UUID）' },
    nodeId: { r: true, h: '关联「工单节点」的节点ID' },
    at: { r: true, h: '发生时间' },
    action: { r: true, h: '动作描述，如 状态更新为「已完成」' },
    operator: { r: true, h: '操作人姓名' },
    note: { r: false, h: '备注' },
  },
}

/** 需要显示到时分秒的日期时间字段（其余日期字段只到天） */
const DATETIME = {
  interview: ['date'],
  qa: ['askedAt', 'answeredAt'],
  nodeHistory: ['at'],
}

/** 示例数据：取值口径与 src/data/mockData.ts 保持一致 */
const SAMPLES = {
  workOrder: {
    id: 'WO001',
    studentId: 'S001',
    studentName: '张子轩',
    grade: 'G11',
    template: 'full',
    status: 'active',
    createdAt: '2026-09-21',
    advisorName: '李胜',
    backupAdvisorName: '小雪',
    currentNodeIndex: 4,
    progress: 18,
    lastUpdatedAt: '2026-10-21',
    parentUserId: 'ding_user_zhang',
  },
  nodeTemplate: {
    id: 'f-01',
    index: 1,
    template: 'full',
    name: '建档与基线评估',
    description: '学生档案建立、基线成绩评估、目标地区确认',
    owner: 'advisor',
    durationDays: 3,
    requiresParentConfirm: false,
    category: 'planning',
    deliverable: '学生基线评估表',
  },
  node: {
    id: 'N-WO001-01',
    workOrderId: 'WO001',
    index: 1,
    name: '建档与基线评估',
    description: '学生档案建立、基线成绩评估、目标地区确认',
    owner: 'advisor',
    ownerName: '李胜',
    status: 'completed',
    startedAt: '2026-09-21',
    dueAt: '2026-09-24',
    completedAt: '2026-09-23',
    requiresParentConfirm: false,
    confirmedByParent: false,
    confirmedAt: '',
    deliverable: '学生基线评估表',
  },
  student: {
    id: 'S001',
    name: '张子轩',
    grade: 'G11',
    targetRegion: 'UK; HK',
    currentSchool: '石家庄二中',
    gpa: '3.8/4.0',
    languageScores: 'IELTS 7.0 2026-06-10; A-Level A*AA',
    parentName: '张建国',
    parentPhone: '13800138000',
    parentUserId: 'ding_user_zhang',
    advisorName: '李胜',
    enrolledAt: '2026-09-01',
    tags: '高GPA; 信息学竞赛',
  },
  material: {
    id: 'MAT001',
    studentId: 'S001',
    name: '高中成绩单',
    category: 'academic',
    status: 'verified',
    submittedAt: '2026-09-27',
    verifiedAt: '2026-10-02',
    note: '学校盖章原件',
  },
  essay: {
    id: 'ES001',
    studentId: 'S001',
    type: '个人陈述素材',
    content: '从小对计算机编程感兴趣，初中自学 Python，高中参加信息学竞赛获省一等奖。',
    status: 'confirmed',
    submittedAt: '2026-10-07',
  },
  plan: {
    id: 'PV001',
    studentId: 'S001',
    version: 'V1.0',
    schools:
      '[{"name":"牛津大学","region":"UK","major":"计算机科学","tier":"reach"},{"name":"曼彻斯特大学","region":"UK","major":"计算机科学","tier":"match"}]',
    status: 'frozen',
    createdAt: '2026-10-02',
    frozenAt: '2026-10-08',
    note: '家长确认后冻结',
  },
  change: {
    id: 'CH001',
    studentId: 'S001',
    workOrderId: 'WO001',
    type: '选校变更',
    from: '华威大学（计算机）',
    to: '布里斯托大学（计算机）',
    impact: '需补充布里斯托 PS 针对性内容，预计 3 天',
    status: 'parent_confirmed',
    approvedBy: '李胜',
    parentConfirmedAt: '2026-10-14',
    createdAt: '2026-10-12',
    operator: '李胜',
  },
  ruleCard: {
    id: 'RC001',
    schoolName: '曼彻斯特大学',
    major: '计算机科学',
    region: 'UK',
    requirements:
      '[{"item":"A-Level","value":"A*AA","source":"官网 2026 招生页","confidence":"high"},{"item":"IELTS","value":"6.5（单项 6.0）","source":"官网","confidence":"high"}]',
    verifiedAt: '2026-10-01',
    verifiedBy: '李胜',
  },
  caliber: {
    id: 'C001',
    code: 'K-001',
    category: '选校',
    question: 'G5 院校申请需要什么条件？',
    answer: '通常要求 A-Level A*AA 及以上、IELTS 7.0-7.5，部分专业需笔试面试。',
    updatedAt: '2026-10-10',
    isActive: true,
  },
  university: {
    id: 'U001',
    name: '曼彻斯特大学',
    nameEn: 'University of Manchester',
    region: 'UK',
    qsRank: 34,
    logoColor: '#006837',
  },
  major: {
    id: 'MJ001',
    name: '计算机科学',
    nameEn: 'Computer Science',
    category: 'STEM',
    region: 'UK',
  },
  keyDate: {
    id: 'D001',
    title: '牛津/剑桥申请截止',
    date: '2026-10-15',
    region: 'UK',
    type: 'deadline',
    verified: true,
    verifiedAt: '2026-10-01',
    note: '医学、兽医、牙医专业同步截止',
  },
  interview: {
    id: 'IV001',
    studentId: 'S001',
    date: '2026-10-07 14:00',
    participants: '张子轩; 张建国; 李胜',
    topic: '选校方案确认',
    summary: '确认 5 所院校清单，牛津为冲刺目标，需重点准备 MAT 笔试。',
    decisions: '["冻结选校方案 V1.0","10 月底前完成 MAT 辅导"]',
    status: 'parent_confirmed',
    parentConfirmedAt: '2026-10-08',
  },
  admission: {
    id: 'AD001',
    studentId: 'S003',
    studentName: '王浩然',
    schoolName: '爱丁堡大学',
    major: '计算机科学',
    region: 'UK',
    result: 'offer',
    scholarship: '£2,000/年',
    receivedAt: '2026-10-19',
    parentKnown: true,
    parentKnownAt: '2026-10-20',
  },
  qa: {
    id: 'QA001',
    studentId: 'S001',
    studentName: '张子轩',
    question: 'UCAS PS 字数限制是多少？',
    askedAt: '2026-10-17 10:30',
    askedBy: '张建国',
    status: 'answered',
    answer: '4000 字符/47 行，建议控制在 3500-3900 字符。参考口径 K-003。',
    answeredAt: '2026-10-17 11:10',
    answeredBy: '李胜',
    caliberCode: 'K-003',
    slaHours: 24,
  },
  nodeHistory: {
    id: 'NH001',
    nodeId: 'N-WO001-01',
    at: '2026-10-12 15:30:00',
    action: '状态更新为「已完成」',
    operator: '李胜',
    note: '首次建档完成',
  },
}

function tipOf(tableKey, appKey) {
  return TIPS[tableKey]?.[appKey] || { r: false, h: '（可空）' }
}

function typeTag(tableKey, appKey, cfg) {
  if (DATETIME[tableKey]?.includes(appKey)) return '【日期时间 YYYY-MM-DD HH:mm】'
  if (cfg.date?.includes(appKey)) return '【日期 YYYY-MM-DD】'
  if (cfg.number?.includes(appKey)) return '【数字】'
  if (cfg.bool?.includes(appKey)) return '【布尔 true/false】'
  if (cfg.json?.includes(appKey)) return '【JSON 字符串】'
  return ''
}

function csvEscape(v) {
  if (v === undefined || v === null) return ''
  const s = String(v)
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function headersOf(cfg) {
  return Object.values(cfg.fields)
}

/** 对照版：表头 / 字段名 / 说明 / 示例 */
function generateAnnotated(tableKey, cfg) {
  const keys = Object.keys(cfg.fields)
  const headLine = headersOf(cfg).map(csvEscape).join(',')
  const keyLine = keys.map(csvEscape).join(',')
  const hintLine = keys
    .map((k) => {
      const t = tipOf(tableKey, k)
      return `${t.r ? '★必填 ' : '选填 '}${typeTag(tableKey, k, cfg)}${t.h}`
    })
    .map(csvEscape)
    .join(',')
  const sampleLine = keys.map((k) => csvEscape(SAMPLES[tableKey]?.[k] ?? '')).join(',')
  return [headLine, keyLine, hintLine, sampleLine].join('\n') + '\n'
}

/** 导入版：表头 + 1 行示例数据（钉钉可直接识别字段类型） */
function generateImport(tableKey, cfg) {
  const keys = Object.keys(cfg.fields)
  const headLine = headersOf(cfg).map(csvEscape).join(',')
  const sampleLine = keys.map((k) => csvEscape(SAMPLES[tableKey]?.[k] ?? '')).join(',')
  return [headLine, sampleLine].join('\n') + '\n'
}

function generateReadme() {
  const b = '`'
  const rows = Object.entries(SHEETS)
  let md =
    '# 钉钉多维表格导入模板\n\n' +
    '> 单一事实来源：字段表头来自 ' + b + 'server/fieldMap.js' + b + '，枚举取值对齐 ' + b + 'src/types/index.ts' + b + ' 与 ' + b + 'src/data/mockData.ts' + b + '。\n' +
    '> 字段有变动时执行 ' + b + 'npm run templates' + b + '，两套模板会一起重新生成。\n\n' +
    '## 怎么导入（推荐）\n\n' +
    '直接使用 ' + b + 'templates/import/' + b + ' 目录下的 CSV（每个文件只有「中文表头 + 1 行示例数据」）：\n' +
    '1. 钉钉 AI 表格（多维表格）中新建数据表 → 右上角 ' + b + '导入' + b + ' → ' + b + 'CSV 文件' + b + '\n' +
    '2. 拖入对应的 CSV，首行自动识别为字段名\n' +
    '3. 在导入预览里确认字段类型（日期/数字/复选框），完成导入\n' +
    '4. 导入后删除那条示例记录，再录入真实数据\n\n' +
    '> ' + b + 'templates/*.csv' + b + '（根目录）是「对照版」：4 行分别是 表头 / 应用字段名 / 必填与类型说明 / 示例数据，**仅供查阅，不要直接导入**。\n\n' +
    '## 模板清单（17 张表）\n\n' +
    '| 导入文件 | 表名 | 字段数 | 必填字段数 |\n' +
    '|---|---|---|---|\n'
  for (const [key, cfg] of rows) {
    const keys = Object.keys(cfg.fields)
    const required = keys.filter((k) => tipOf(key, k).r).length
    md += '| import/' + key + '.csv | ' + cfg.sheet + ' | ' + keys.length + ' | ' + required + ' |\n'
  }

  md +=
    '\n## 数据格式（通用）\n\n' +
    '| 类型 | 格式 | 示例 |\n' +
    '|---|---|---|\n' +
    '| 日期 | ' + b + 'YYYY-MM-DD' + b + ' | ' + b + '2026-10-20' + b + ' |\n' +
    '| 日期时间 | ' + b + 'YYYY-MM-DD HH:mm' + b + '（留痕到秒） | ' + b + '2026-10-20 14:30' + b + ' |\n' +
    '| 布尔 | ' + b + 'true' + b + ' / ' + b + 'false' + b + '（钉钉复选框） | ' + b + 'true' + b + ' |\n' +
    '| 数字 | 纯数字，不带单位 | ' + b + '24' + b + '、' + b + '18' + b + ' |\n' +
    '| JSON | 单行合法 JSON（外层加双引号转义） | ' + b + '["冻结方案 V1.0","完成 MAT 辅导"]' + b + ' |\n' +
    '| 多值 | 英文分号 ' + b + ';' + b + ' 分隔，存为多行文本 | ' + b + 'UK; HK' + b + ' |\n' +
    '| 关联ID | 必须精确匹配关联表主键 | ' + b + 'S001' + b + '、' + b + 'WO001' + b + ' |\n\n' +
    '## 枚举值（必须使用以下取值）\n\n' +
    '| 字段 | 可选值 |\n' +
    '|---|---|\n' +
    '| 模板类型 template | ' + b + 'full' + b + '（23 节点完整流程）/ ' + b + 'emergency' + b + '（8 节点应急） |\n' +
    '| 工单状态 status | ' + b + 'active' + b + ' / ' + b + 'frozen' + b + ' / ' + b + 'closed' + b + ' |\n' +
    '| 节点状态 status | ' + b + 'not_started' + b + ' / ' + b + 'in_progress' + b + ' / ' + b + 'pending_confirm' + b + ' / ' + b + 'completed' + b + ' / ' + b + 'overdue' + b + ' / ' + b + 'stalled' + b + ' |\n' +
    '| 负责角色 owner | ' + b + 'advisor' + b + ' / ' + b + 'essay_teacher' + b + ' / ' + b + 'application_teacher' + b + ' / ' + b + 'visa_teacher' + b + ' / ' + b + 'parent' + b + ' / ' + b + 'student' + b + ' |\n' +
    '| 节点分类 category | ' + b + 'planning' + b + ' / ' + b + 'materials' + b + ' / ' + b + 'essay' + b + ' / ' + b + 'application' + b + ' / ' + b + 'visa' + b + ' / ' + b + 'followup' + b + ' |\n' +
    '| 材料分类 category | ' + b + 'academic' + b + ' / ' + b + 'language' + b + ' / ' + b + 'personal' + b + ' / ' + b + 'financial' + b + ' / ' + b + 'other' + b + ' |\n' +
    '| 材料状态 status | ' + b + 'pending' + b + ' / ' + b + 'submitted' + b + ' / ' + b + 'verified' + b + ' / ' + b + 'rejected' + b + ' |\n' +
    '| 文书状态 status | ' + b + 'draft' + b + ' / ' + b + 'submitted' + b + ' / ' + b + 'confirmed' + b + ' |\n' +
    '| 方案状态 status | ' + b + 'draft' + b + ' / ' + b + 'frozen' + b + ' / ' + b + 'superseded' + b + ' |\n' +
    '| 变更审批 status | ' + b + 'pending_approval' + b + ' / ' + b + 'approved' + b + ' / ' + b + 'rejected' + b + ' / ' + b + 'parent_confirmed' + b + ' |\n' +
    '| 约谈状态 status | ' + b + 'scheduled' + b + ' / ' + b + 'completed' + b + ' / ' + b + 'parent_confirmed' + b + ' |\n' +
    '| 问答状态 status | ' + b + 'pending' + b + ' / ' + b + 'answered' + b + ' / ' + b + 'overdue' + b + ' |\n' +
    '| 录取结果 result | ' + b + 'offer' + b + ' / ' + b + 'rejected' + b + ' / ' + b + 'waiting' + b + ' / ' + b + 'pending' + b + ' |\n' +
    '| 关键日期类型 type | ' + b + 'deadline' + b + ' / ' + b + 'exam' + b + ' / ' + b + 'event' + b + ' / ' + b + 'maintenance' + b + ' |\n' +
    '| 地区 region | ' + b + 'UK' + b + '（英国）/ ' + b + 'HK' + b + '（香港）/ ' + b + 'AU' + b + '（澳洲）/ ' + b + 'CA' + b + '（加拿大） |\n' +
    '| 方案档位 tier | ' + b + 'reach' + b + ' / ' + b + 'match' + b + ' / ' + b + 'safety' + b + ' |\n' +
    '| 规则置信度 confidence | ' + b + 'high' + b + ' / ' + b + 'medium' + b + ' / ' + b + 'low' + b + ' |\n\n' +
    '## 表间依赖（按顺序导入）\n\n' +
    '1. **基础字典**：节点模板、规则库、口径库、重点院校、专业库、关键日期\n' +
    '2. **主体**：学生档案 → 工单\n' +
    '3. **明细**：工单节点（依赖工单 + 节点模板）→ 材料清单 / 文书素材 / 方案版本 / 变更记录\n' +
    '4. **流程记录**：约谈记录、录取结果、家长问答\n' +
    '5. **留痕**：节点留痕（最后导入）\n\n' +
    '## 注意\n\n' +
    '- 关联 ID（学生ID、工单ID、节点ID）必须先在主表存在，否则前端关联查询会拿不到数据\n' +
    '- 导入时钉钉会自动建字段，但字段类型建议在预览页确认：日期、数字、复选框三类别选错\n' +
    '- 与真实钉钉表字段名不一致时：只改 ' + b + 'server/fieldMap.js' + b + ' 对应值，再执行 ' + b + 'npm run templates' + b + '，不要手改 CSV\n' +
    '- 前端多值字段（目标地区、标签、参与人、语言成绩）在表内用分号分隔，服务端会自动转成数组\n'
  return md
}

for (const [key, cfg] of Object.entries(SHEETS)) {
  writeFileSync(path.join(OUT, `${key}.csv`), generateAnnotated(key, cfg), 'utf-8')
  writeFileSync(path.join(IMPORT_OUT, `${key}.csv`), generateImport(key, cfg), 'utf-8')
  console.log(`✓ ${key}.csv  (${Object.keys(cfg.fields).length} 字段)`)
}

writeFileSync(path.join(OUT, 'README.md'), generateReadme(), 'utf-8')
console.log('\n✓ README.md 已生成')
console.log(`\n共 ${Object.keys(SHEETS).length} 张表 → ${OUT}`)
console.log(`可直接导入的文件 → ${IMPORT_OUT}`)
