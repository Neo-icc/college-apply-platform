/**
 * 字段映射配置（唯一需要按真实钉钉表格调整的文件）
 *
 * 结构：SHEETS[表key] = {
 *   sheet:    钉钉数据表名称或 sheetId
 *   fields:   { 应用字段名(appKey): '钉钉表格中文字段名' }
 *   json:     值为 JSON 字符串的字段（对象/数组类），读写时自动 parse/stringify
 *   date:     ISO 字符串 <-> 钉钉毫秒时间戳 自动互转
 *   bool:     复选框字段（true/false）
 *   number:   数字字段
 * }
 *
 * 说明：字段名必须与钉钉 AI 表格中的字段名逐字一致（含空格/标点）。
 *      若真实表字段名不同，只需修改本文件对应值即可，业务代码不用动。
 */

export const SHEETS = {
  // ===== 1. 工单 =====
  workOrder: {
    sheet: process.env.SHEET_WORK_ORDER || '工单',
    fields: {
      id: '工单ID',
      studentId: '学生ID',
      studentName: '学生姓名',
      grade: '年级',
      template: '模板类型',
      status: '工单状态',
      createdAt: '创建时间',
      advisorName: '主顾问',
      backupAdvisorName: '备顾问',
      currentNodeIndex: '当前节点序号',
      progress: '进度',
      lastUpdatedAt: '最后更新',
      parentUserId: '家长账号',
    },
    date: ['createdAt', 'lastUpdatedAt'],
    number: ['currentNodeIndex', 'progress'],
  },

  // ===== 2. 节点模板 =====
  nodeTemplate: {
    sheet: process.env.SHEET_NODE_TEMPLATE || '节点模板',
    fields: {
      id: '模板节点ID',
      index: '序号',
      template: '模板类型',
      name: '节点名称',
      description: '节点说明',
      owner: '负责角色',
      durationDays: '时长(天)',
      requiresParentConfirm: '需家长确认',
      category: '分类',
      deliverable: '交付物',
    },
    number: ['index', 'durationDays'],
    bool: ['requiresParentConfirm'],
  },

  // ===== 3. 工单节点 =====
  node: {
    sheet: process.env.SHEET_NODE || '工单节点',
    fields: {
      id: '节点ID',
      workOrderId: '工单ID',
      index: '序号',
      name: '节点名称',
      description: '节点说明',
      owner: '负责角色',
      ownerName: '负责人',
      status: '节点状态',
      startedAt: '开始时间',
      dueAt: '截止时间',
      completedAt: '完成时间',
      requiresParentConfirm: '需家长确认',
      confirmedByParent: '家长已确认',
      confirmedAt: '家长确认时间',
      deliverable: '交付物',
    },
    date: ['startedAt', 'dueAt', 'completedAt', 'confirmedAt'],
    bool: ['requiresParentConfirm', 'confirmedByParent'],
    number: ['index'],
  },

  // ===== 4. 学生档案 =====
  student: {
    sheet: process.env.SHEET_STUDENT || '学生档案',
    fields: {
      id: '学生ID',
      name: '姓名',
      grade: '年级',
      targetRegion: '目标地区',
      currentSchool: '当前学校',
      gpa: 'GPA',
      languageScores: '语言成绩',
      parentName: '家长姓名',
      parentPhone: '家长手机',
      parentUserId: '家长unionId',
      advisorName: '顾问',
      enrolledAt: '入学时间',
      tags: '标签',
    },
    date: ['enrolledAt'],
    // 语言成绩在钉钉为多行文本，前端是 {type,score,date}[]，用 codec 互转
    codec: {
      languageScores: {
        encode: (arr) =>
          Array.isArray(arr)
            ? arr.map((s) => [s.type, s.score, s.date].filter(Boolean).join(' ')).join('; ')
            : arr,
        decode: (text) =>
          String(text || '')
            .split(/[;；]/)
            .map((s) => s.trim())
            .filter(Boolean)
            .map((seg) => {
              const [type, score, date] = seg.split(/\s+/)
              return { type: type || seg, score: score || '', date: date || undefined }
            }),
      },
      // 多值文本 <-> 字符串数组
      targetRegion: {
        encode: (arr) => (Array.isArray(arr) ? arr.join('; ') : arr),
        decode: (text) =>
          String(text || '')
            .split(/[;；]/)
            .map((s) => s.trim())
            .filter(Boolean),
      },
      tags: {
        encode: (arr) => (Array.isArray(arr) ? arr.join('; ') : arr),
        decode: (text) =>
          String(text || '')
            .split(/[;；]/)
            .map((s) => s.trim())
            .filter(Boolean),
      },
    },
  },

  // ===== 5. 材料清单 =====
  material: {
    sheet: process.env.SHEET_MATERIAL || '材料清单',
    fields: {
      id: '材料ID',
      studentId: '学生ID',
      name: '材料名称',
      category: '材料分类',
      status: '材料状态',
      submittedAt: '提交时间',
      verifiedAt: '核验时间',
      note: '备注',
    },
    date: ['submittedAt', 'verifiedAt'],
  },

  // ===== 6. 文书素材 =====
  essay: {
    sheet: process.env.SHEET_ESSAY || '文书素材',
    fields: {
      id: '素材ID',
      studentId: '学生ID',
      type: '素材类型',
      content: '内容',
      status: '状态',
      submittedAt: '提交时间',
    },
    date: ['submittedAt'],
  },

  // ===== 7. 方案版本 =====
  plan: {
    sheet: process.env.SHEET_PLAN || '方案版本',
    fields: {
      id: '方案ID',
      studentId: '学生ID',
      version: '版本号',
      schools: '院校清单',
      status: '方案状态',
      createdAt: '创建时间',
      frozenAt: '冻结时间',
      note: '备注',
    },
    json: ['schools'],
    date: ['createdAt', 'frozenAt'],
  },

  // ===== 8. 变更记录 =====
  change: {
    sheet: process.env.SHEET_CHANGE || '变更记录',
    fields: {
      id: '变更ID',
      studentId: '学生ID',
      workOrderId: '工单ID',
      type: '变更类型',
      from: '变更前',
      to: '变更后',
      impact: '连锁影响',
      status: '审批状态',
      approvedBy: '审批人',
      parentConfirmedAt: '家长确认时间',
      createdAt: '创建时间',
      operator: '操作人',
    },
    date: ['parentConfirmedAt', 'createdAt'],
  },

  // ===== 9. 规则库核对卡 =====
  ruleCard: {
    sheet: process.env.SHEET_RULE_CARD || '规则库',
    fields: {
      id: '核对卡ID',
      schoolName: '院校名称',
      major: '专业',
      region: '地区',
      requirements: '要求明细',
      verifiedAt: '核实时间',
      verifiedBy: '核实人',
    },
    json: ['requirements'],
    date: ['verifiedAt'],
  },

  // ===== 10. 口径库 =====
  caliber: {
    sheet: process.env.SHEET_CALIBER || '口径库',
    fields: {
      id: '口径ID',
      code: '口径编号',
      category: '分类',
      question: '问题',
      answer: '答复',
      updatedAt: '更新时间',
      isActive: '是否生效',
    },
    date: ['updatedAt'],
    bool: ['isActive'],
  },

  // ===== 11. 重点院校 =====
  university: {
    sheet: process.env.SHEET_UNIVERSITY || '重点院校清单',
    fields: {
      id: '院校ID',
      name: '院校名称',
      nameEn: '英文名',
      region: '地区',
      qsRank: 'QS排名',
      logoColor: '标识色',
    },
    number: ['qsRank'],
  },

  // ===== 12. 专业库 =====
  major: {
    sheet: process.env.SHEET_MAJOR || '专业库',
    fields: {
      id: '专业ID',
      name: '专业名称',
      nameEn: '英文名',
      category: '分类',
      region: '地区',
    },
  },

  // ===== 13. 关键日期 =====
  keyDate: {
    sheet: process.env.SHEET_KEY_DATE || '关键日期',
    fields: {
      id: '日期ID',
      title: '标题',
      date: '日期',
      region: '地区',
      type: '类型',
      verified: '是否已核实',
      verifiedAt: '核实时间',
      note: '备注',
    },
    date: ['date', 'verifiedAt'],
    bool: ['verified'],
  },

  // ===== 14. 约谈记录 =====
  interview: {
    sheet: process.env.SHEET_INTERVIEW || '约谈记录',
    fields: {
      id: '约谈ID',
      studentId: '学生ID',
      date: '约谈时间',
      participants: '参与人',
      topic: '主题',
      summary: '纪要',
      decisions: '决议',
      status: '状态',
      parentConfirmedAt: '家长确认时间',
    },
    json: ['decisions'],
    date: ['date', 'parentConfirmedAt'],
    codec: {
      participants: {
        encode: (arr) => (Array.isArray(arr) ? arr.join('; ') : arr),
        decode: (text) =>
          String(text || '')
            .split(/[;；、,，]/)
            .map((s) => s.trim())
            .filter(Boolean),
      },
    },
  },

  // ===== 15. 录取结果 =====
  admission: {
    sheet: process.env.SHEET_ADMISSION || '录取结果',
    fields: {
      id: '录取ID',
      studentId: '学生ID',
      studentName: '学生姓名',
      schoolName: '院校名称',
      major: '专业',
      region: '地区',
      result: '录取结果',
      scholarship: '奖学金',
      receivedAt: '收到时间',
      parentKnown: '家长已知悉',
      parentKnownAt: '知悉时间',
    },
    date: ['receivedAt', 'parentKnownAt'],
    bool: ['parentKnown'],
  },

  // ===== 16. 家长问答 =====
  qa: {
    sheet: process.env.SHEET_QA || '家长问答',
    fields: {
      id: '问答ID',
      studentId: '学生ID',
      studentName: '学生姓名',
      question: '问题',
      askedAt: '提问时间',
      askedBy: '提问人',
      status: '状态',
      answer: '答复',
      answeredAt: '答复时间',
      answeredBy: '答复人',
      caliberCode: '引用口径编号',
      slaHours: 'SLA(小时)',
    },
    date: ['askedAt', 'answeredAt'],
    number: ['slaHours'],
  },

  // ===== 17.（建议新增）节点留痕 =====
  nodeHistory: {
    sheet: process.env.SHEET_NODE_HISTORY || '节点留痕',
    fields: {
      id: '留痕ID',
      nodeId: '节点ID',
      at: '时间',
      action: '动作',
      operator: '操作人',
      note: '备注',
    },
    date: ['at'],
  },
}

/** 便捷取配置；表不存在则抛错，便于快速发现拼写问题 */
export function tableConfig(key) {
  const cfg = SHEETS[key]
  if (!cfg) throw new Error(`[fieldMap] 未定义的表: ${key}`)
  return cfg
}
