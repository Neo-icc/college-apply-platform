// 调用自家后端 /api/*（后端再转发钉钉，浏览器不持有任何凭证）
import { http } from './http'

export const dgApi = {
  // ---- 只读 ----
  health: () => http.get('/api/health'),
  workorders: () => http.get<{ workOrders: unknown[]; workOrderNodes: Record<string, unknown[]> }>('/api/workorders'),
  students: () => http.get<Record<string, unknown[]>>('/api/students'),
  library: () => http.get<Record<string, unknown[]>>('/api/library'),
  dates: () => http.get<{ keyDates: unknown[] }>('/api/dates'),
  interviews: () => http.get<{ interviews: unknown[] }>('/api/interviews'),
  admissions: () => http.get<{ admissions: unknown[] }>('/api/admissions'),
  qa: () => http.get<{ qaThreads: unknown[] }>('/api/qa'),

  // ---- 写回 ----
  updateNodeStatus: (workOrderId: string, nodeId: string, status: string, operator: string) =>
    http.patch(`/api/workorders/${workOrderId}/nodes/${nodeId}/status`, { status, operator }),
  confirmNode: (workOrderId: string, nodeId: string) =>
    http.post(`/api/workorders/${workOrderId}/nodes/${nodeId}/confirm`, {}),
  answerQA: (id: string, answer: string, caliberCode?: string) => http.post(`/api/qa/${id}/answer`, { answer, caliberCode }),
  approveChange: (id: string, approve: boolean) => http.post(`/api/changes/${id}/approve`, { approve }),
  parentConfirmChange: (id: string) => http.post(`/api/changes/${id}/parent-confirm`, {}),
  freezePlan: (id: string) => http.post(`/api/plans/${id}/freeze`, {}),
  verifyMaterial: (id: string) => http.post(`/api/materials/${id}/verify`, {}),
  submitMaterial: (id: string) => http.post(`/api/materials/${id}/submit`, {}),
  confirmAdmission: (id: string) => http.post(`/api/admissions/${id}/confirm`, {}),
}
