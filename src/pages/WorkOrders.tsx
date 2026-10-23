import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge, statusVariant } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import {
  ArrowLeft, CheckCircle2, Clock, AlertTriangle, User,
  Calendar, Eye, History,
} from 'lucide-react'
import { getNodeState, formatDateTime, formatDate } from '../engine'
import { OWNER_LABELS } from '../data/nodeTemplates'
import type { WorkOrderNode } from '../types'

// ===== 工单列表 =====
export function WorkOrderList() {
  const { workOrders, workOrderNodes } = useStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialFilter = searchParams.get('filter') === 'overdue' ? 'overdue' : searchParams.get('filter') === 'pending' ? 'pending' : 'all'
  const [filter, setFilter] = useState<'all' | 'overdue' | 'pending'>(initialFilter)

  useEffect(() => {
    const f = searchParams.get('filter')
    if (f === 'overdue' || f === 'pending') setFilter(f)
  }, [searchParams])

  const list = useMemo(() => {
    return workOrders.map(w => {
      const nodes = workOrderNodes[w.id] || []
      const done = nodes.filter(n => n.status === 'completed').length
      const hasOverdue = nodes.some(n => getNodeState(n).isOverdue || n.status === 'overdue')
      const hasPending = nodes.some(n => n.status === 'pending_confirm')
      return { ...w, progress: nodes.length ? Math.round((done / nodes.length) * 100) : 0, hasOverdue, hasPending, total: nodes.length, done }
    }).filter(w => {
      if (filter === 'overdue') return w.hasOverdue
      if (filter === 'pending') return w.hasPending
      return true
    })
  }, [workOrders, workOrderNodes, filter])

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">工单管理</h1>
        <div className="flex gap-2">
          {([
            { k: 'all', label: '全部' },
            { k: 'overdue', label: '已超时' },
            { k: 'pending', label: '待确认' },
          ] as const).map(f => (
            <Button
              key={f.k}
              size="sm"
              variant={filter === f.k ? 'primary' : 'outline'}
              onClick={() => setFilter(f.k)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {list.map(w => (
          <Card
            key={w.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/workorders/${w.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{w.studentName}</h3>
                    <Badge variant={w.template === 'full' ? 'default' : 'warning'}>
                      {w.template === 'full' ? '23节点' : '精简8'}
                    </Badge>
                    <Badge variant="muted">{w.grade === 'G12' ? '高三' : w.grade === 'G11' ? '高二' : '高一'}</Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">顾问：{w.advisorName}（备：{w.backupAdvisorName}）</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-ding-600">{w.progress}%</div>
                  <div className="text-xs text-gray-400">{w.done}/{w.total} 节点</div>
                </div>
              </div>

              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-ding-500 rounded-full transition-all" style={{ width: `${w.progress}%` }} />
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500">
                {w.hasOverdue && <span className="flex items-center gap-1 text-red-500"><AlertTriangle className="h-3 w-3" />有超时</span>}
                {w.hasPending && <span className="flex items-center gap-1 text-purple-500"><Clock className="h-3 w-3" />待确认</span>}
                <span className="ml-auto">更新于 {formatDateTime(w.lastUpdatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ===== 工单详情（节点时间线）=====
export function WorkOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { workOrders, workOrderNodes, updateNodeStatus, confirmByParent, role } = useStore()
  const wo = workOrders.find(w => w.id === id)
  const nodes = wo ? (workOrderNodes[wo.id] || []) : []
  const [activeNode, setActiveNode] = useState<WorkOrderNode | null>(null)

  if (!wo) return <div className="p-8 text-center text-gray-400">工单不存在</div>

  const handleStatusChange = (nodeId: string, status: WorkOrderNode['status']) => {
    updateNodeStatus(wo.id, nodeId, status)
    setActiveNode(null)
  }

  const handleParentConfirm = (nodeId: string) => {
    confirmByParent(wo.id, nodeId)
    setActiveNode(null)
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/workorders')}>
          <ArrowLeft className="h-4 w-4" /> 返回
        </Button>
        <h1 className="text-xl font-bold text-gray-800">{wo.studentName} · 升学规划工单</h1>
        <Badge variant={wo.template === 'full' ? 'default' : 'warning'}>
          {wo.template === 'full' ? '完整 23 节点' : '精简 8 节点'}
        </Badge>
      </div>

      {/* 头部信息 */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-400">主顾问</div>
              <div className="font-medium text-gray-800">{wo.advisorName}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">备顾问（协助跟进）</div>
              <div className="font-medium text-gray-800">{wo.backupAdvisorName}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">家长账号</div>
              <div className="font-medium">
                {wo.parentUserId ? <Badge variant="success">已绑定（可直接推送）</Badge> : <Badge variant="warning">未绑定（转顾问处理）</Badge>}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">创建时间</div>
              <div className="font-medium text-gray-800">{formatDate(wo.createdAt, 'yyyy-MM-dd')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 进度条 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">整体进度</span>
            <span className="text-sm font-bold text-ding-600">{Math.round((nodes.filter(n => n.status === 'completed').length / nodes.length) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-ding-400 to-ding-600 rounded-full transition-all"
              style={{ width: `${(nodes.filter(n => n.status === 'completed').length / nodes.length) * 100}%` }} />
          </div>
        </CardContent>
      </Card>

      {/* 节点时间线 */}
      <Card>
        <CardHeader>
          <CardTitle>节点时间线（{wo.template === 'full' ? '23 节点' : '8 节点'}）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {nodes.map((node, idx) => {
              const state = getNodeState(node)
              const isActive = idx === wo.currentNodeIndex
              return (
                <div key={node.id} className="flex gap-3 pb-5 last:pb-0 group">
                  {/* 左侧时间线 */}
                  <div className="flex flex-col items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                      node.status === 'completed' ? 'bg-emerald-500' :
                      node.status === 'pending_confirm' ? 'bg-purple-500 animate-pulse-soft' :
                      node.status === 'overdue' || state.isOverdue ? 'bg-red-500' :
                      node.status === 'stalled' || state.isStalled ? 'bg-amber-500' :
                      node.status === 'in_progress' ? 'bg-ding-500' :
                      'bg-gray-300'
                    }`}>
                      {node.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                    </div>
                    {idx < nodes.length - 1 && (
                      <div className={`w-0.5 flex-1 mt-1 ${node.status === 'completed' ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                    )}
                  </div>

                  {/* 右侧内容 */}
                  <div className={`flex-1 min-w-0 rounded-lg border p-3 transition-colors ${
                    isActive ? 'border-ding-300 bg-ding-50/40' : 'border-gray-100 hover:border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-gray-800">{node.name}</h4>
                          <Badge variant={statusVariant(node.status)} dot>{STATUS_LABEL(node.status)}</Badge>
                          {state.isDueSoon && !state.isOverdue && node.status !== 'completed' && (
                            <Badge variant="warning">{state.daysLeft} 天后到期</Badge>
                          )}
                          {(state.isOverdue || node.status === 'overdue') && (
                            <Badge variant="danger">已超时 {Math.abs(state.daysLeft)}天</Badge>
                          )}
                          {(state.isStalled || node.status === 'stalled') && (
                            <Badge variant="warning">7天无进展</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{node.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveNode(activeNode?.id === node.id ? null : node)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{node.ownerName}（{OWNER_LABELS[node.owner]}）</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />截止 {formatDate(node.dueAt)}</span>
                      {node.deliverable && <span className="text-ding-600">📦 {node.deliverable}</span>}
                      {node.requiresParentConfirm && <Badge variant="pending">需家长确认</Badge>}
                    </div>

                    {/* 展开详情 */}
                    {activeNode?.id === node.id && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-3 animate-fade-in">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-gray-400">开始：</span>{node.startedAt ? formatDateTime(node.startedAt) : '—'}</div>
                          <div><span className="text-gray-400">完成：</span>{node.completedAt ? formatDateTime(node.completedAt) : '—'}</div>
                          <div><span className="text-gray-400">家长确认：</span>{node.confirmedByParent ? `✓ ${node.confirmedAt ? formatDateTime(node.confirmedAt) : ''}` : '未确认'}</div>
                        </div>

                        {/* 操作按钮 */}
                        {role === 'teacher' && node.status !== 'completed' && (
                          <div className="flex flex-wrap gap-1.5">
                            {node.status === 'not_started' && (
                              <Button size="sm" onClick={() => handleStatusChange(node.id, 'in_progress')}>开始执行</Button>
                            )}
                            {node.status === 'in_progress' && (
                              <>
                                <Button size="sm" variant="success" onClick={() => handleStatusChange(node.id, node.requiresParentConfirm ? 'pending_confirm' : 'completed')}>
                                  {node.requiresParentConfirm ? '提交家长确认' : '标记完成'}
                                </Button>
                              </>
                            )}
                            {node.status === 'pending_confirm' && (
                              <Button size="sm" variant="outline" onClick={() => handleStatusChange(node.id, 'in_progress')}>撤回重改</Button>
                            )}
                          </div>
                        )}

                        {role === 'parent' && node.status === 'pending_confirm' && node.requiresParentConfirm && (
                          <div className="rounded-lg bg-purple-50 p-3">
                            <p className="text-sm text-purple-700 mb-2">
                              ⚠️ 请确认此节点。点击确认后将记录在案并推进流程。
                            </p>
                            <Button size="sm" variant="primary" onClick={() => handleParentConfirm(node.id)}>
                              确认并推进
                            </Button>
                          </div>
                        )}

                        {/* 操作记录 */}
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                            <History className="h-3 w-3" /> 操作记录
                          </div>
                          <div className="space-y-1">
                            {node.history.map((h, i) => (
                              <div key={i} className="text-xs text-gray-500 flex gap-2">
                                <span className="text-gray-300">{formatDateTime(h.at)}</span>
                                <span>{h.operator}</span>
                                <span className="text-gray-700">{h.action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function STATUS_LABEL(status: string): string {
  const map: Record<string, string> = {
    not_started: '未开始', in_progress: '进行中', pending_confirm: '待家长确认',
    completed: '已完成', overdue: '已超时', stalled: '无进展',
  }
  return map[status] || status
}
