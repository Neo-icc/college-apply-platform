import { useStore } from '../store/useStore'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge, statusVariant } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, FileCheck, GraduationCap, Trophy, XCircle } from 'lucide-react'
import { getNodeState, formatDateTime } from '../engine'

export default function ParentDashboard() {
  const { students, workOrders, workOrderNodes, admissions, notifications, confirmByParent, role } = useStore()
  const navigate = useNavigate()
  // 家长视角：展示第一个学生的进度
  const student = students[0]
  const wo = workOrders.find(w => w.studentId === student?.id)
  const nodes = wo ? (workOrderNodes[wo.id] || []) : []
  const progress = nodes.length ? Math.round((nodes.filter(n => n.status === 'completed').length / nodes.length) * 100) : 0
  const pendingNodes = nodes.filter(n => n.status === 'pending_confirm')
  const studentAdmissions = admissions.filter(a => a.studentId === student?.id)
  const myNotifs = notifications.filter(n => n.to === 'parent' || n.to === 'all')

  return (
    <div className="p-5 space-y-4 max-w-4xl mx-auto">
      {/* 欢迎 */}
      <Card className="bg-gradient-to-r from-ding-600 to-ding-700 text-white border-0">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
              {student?.name[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold">您好，{student?.parentName}</h1>
              <p className="text-ding-100 text-sm">{student?.name} 的升学进度 · {wo?.template === 'full' ? '完整 23 节点' : '精简 8 节点'}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>整体进度</span>
              <span className="font-bold">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 待我确认 */}
      {pendingNodes.length > 0 && (
        <Card className="border-purple-200">
          <CardHeader className="bg-purple-50/50">
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <FileCheck className="h-5 w-5" /> 待我确认（{pendingNodes.length}）
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingNodes.map(n => (
              <div key={n.id} className="flex items-center gap-3 p-3 rounded-lg border border-purple-100 bg-purple-50/30">
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{n.name}</div>
                  <div className="text-xs text-gray-500">{n.description}</div>
                </div>
                {role === 'parent' && (
                  <Button size="sm" onClick={() => { confirmByParent(wo!.id, n.id) }}>
                    <CheckCircle2 className="h-4 w-4" /> 确认
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 进度概览 */}
      <div className="grid md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-emerald-500">{nodes.filter(n => n.status === 'completed').length}</div>
            <div className="text-xs text-gray-400 mt-1">已完成节点</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-ding-500">{nodes.filter(n => n.status === 'in_progress').length}</div>
            <div className="text-xs text-gray-400 mt-1">进行中</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-500">{pendingNodes.length}</div>
            <div className="text-xs text-gray-400 mt-1">待我确认</div>
          </CardContent>
        </Card>
      </div>

      {/* 节点进度列表 */}
      <Card>
        <CardHeader><CardTitle>当前进度</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1">
            {nodes.slice(0, 8).map(n => {
              const state = getNodeState(n)
              return (
                <div key={n.id} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                    n.status === 'completed' ? 'bg-emerald-500' :
                    n.status === 'pending_confirm' ? 'bg-purple-500' :
                    n.status === 'overdue' || state.isOverdue ? 'bg-red-500' :
                    n.status === 'in_progress' ? 'bg-ding-500' : 'bg-gray-300'
                  }`}>
                    {n.status === 'completed' ? '✓' : n.index}
                  </div>
                  <span className="text-sm text-gray-700 flex-1">{n.name}</span>
                  <Badge variant={statusVariant(n.status)}>{n.status === 'completed' ? '已完成' : n.status === 'in_progress' ? '进行中' : n.status === 'pending_confirm' ? '待确认' : '未开始'}</Badge>
                </div>
              )
            })}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => navigate(`/workorders/${wo?.id}`)}>
            查看完整进度
          </Button>
        </CardContent>
      </Card>

      {/* 录取结果 */}
      {studentAdmissions.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /> 录取结果</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {studentAdmissions.map(a => (
              <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                <TrophyOrReject result={a.result} />
                <div className="flex-1">
                  <span className="font-medium text-gray-800">{a.schoolName}</span>
                  <span className="text-gray-400 mx-1">·</span>
                  <span className="text-sm text-gray-500">{a.major}</span>
                </div>
                {a.scholarship && <Badge variant="success">{a.scholarship}</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 通知 */}
      <Card>
        <CardHeader><CardTitle>通知消息</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {myNotifs.slice(0, 5).map(n => (
            <div key={n.id} className="p-2.5 rounded-lg bg-gray-50 text-sm">
              <div className="font-medium text-gray-800">{n.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">{n.content}</div>
              <div className="text-[10px] text-gray-400 mt-1">{formatDateTime(n.createdAt)}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function TrophyOrReject({ result }: { result: string }) {
  if (result === 'offer') return <Trophy className="h-5 w-5 text-emerald-500" />
  if (result === 'rejected') return <XCircle className="h-5 w-5 text-red-500" />
  return <Clock className="h-5 w-5 text-gray-400" />
}
