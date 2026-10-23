import { useStore } from '../store/useStore'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { CheckCircle2, FileCheck, MessageSquare, GraduationCap, Hand } from 'lucide-react'
import { formatDateTime } from '../engine'

export default function ConfirmationCenter() {
  const { workOrders, workOrderNodes, confirmByParent, admissions, parentConfirmAdmission, changes, confirmChangeByParent } = useStore()

  // 所有待家长确认的节点
  const pendingNodes = Object.entries(workOrderNodes).flatMap(([woId, nodes]) =>
    nodes.filter(n => n.status === 'pending_confirm' && n.requiresParentConfirm && !n.confirmedByParent)
      .map(n => ({ ...n, woId, studentName: workOrders.find(w => w.id === woId)?.studentName || '' }))
  )

  // 待家长知悉的录取
  const pendingAdmissions = admissions.filter(a => !a.parentKnown && a.result === 'offer')

  // 待家长确认的变更
  const pendingChanges = changes.filter(c => c.status === 'approved')

  return (
    <div className="p-5 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <Hand className="h-6 w-6 text-purple-600" />
        <h1 className="text-xl font-bold text-gray-800">待我确认</h1>
        <Badge variant="pending" className="ml-2">{pendingNodes.length + pendingAdmissions.length + pendingChanges.length} 项</Badge>
      </div>

      <div className="text-xs text-gray-400 bg-purple-50 p-3 rounded-lg border border-purple-100">
        💡 重要决策由您确认，确认后留有记录，并自动推进流程。
      </div>

      {/* 节点确认 */}
      {pendingNodes.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileCheck className="h-4 w-4 text-purple-600" /> 节点确认（{pendingNodes.length}）</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pendingNodes.map(n => (
              <div key={n.id} className="p-4 rounded-lg border border-purple-100 bg-purple-50/30">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="pending">节点确认</Badge>
                  <span className="text-sm text-gray-500">{n.studentName}</span>
                </div>
                <div className="font-medium text-gray-800 mb-1">{n.name}</div>
                <p className="text-sm text-gray-600 mb-3">{n.description}</p>
                {n.deliverable && (
                  <div className="text-xs text-ding-600 mb-3">📦 交付物：{n.deliverable}</div>
                )}
                <Button onClick={() => confirmByParent(n.woId, n.id)}>
                  <CheckCircle2 className="h-4 w-4" /> 确认并推进
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 录取知悉 */}
      {pendingAdmissions.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-emerald-600" /> 录取结果知悉（{pendingAdmissions.length}）</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pendingAdmissions.map(a => (
              <div key={a.id} className="p-4 rounded-lg border border-emerald-100 bg-emerald-50/30">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="success">录取 Offer</Badge>
                  <span className="text-sm text-gray-500">{a.studentName}</span>
                </div>
                <div className="font-medium text-gray-800">{a.schoolName} · {a.major}</div>
                {a.scholarship && <div className="text-sm text-emerald-600 mt-1">奖学金：{a.scholarship}</div>}
                <Button className="mt-3" onClick={() => parentConfirmAdmission(a.id)}>
                  <CheckCircle2 className="h-4 w-4" /> 我已知悉
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 变更确认 */}
      {pendingChanges.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-amber-600" /> 变更确认（{pendingChanges.length}）</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pendingChanges.map(c => (
              <div key={c.id} className="p-4 rounded-lg border border-amber-100 bg-amber-50/30">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="warning">变更申请</Badge>
                  <span className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</span>
                </div>
                <div className="font-medium text-gray-800 mb-1">{c.type}</div>
                <div className="text-sm text-gray-600">
                  <span className="text-gray-400">从</span> {c.from} → <span className="text-ding-600">{c.to}</span>
                </div>
                <div className="text-xs text-amber-600 mt-2">连锁影响：{c.impact}</div>
                <div className="text-xs text-gray-500 mt-1">审批人：{c.approvedBy}</div>
                <Button className="mt-3" onClick={() => confirmChangeByParent(c.id)}>
                  <CheckCircle2 className="h-4 w-4" /> 书面确认变更
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {pendingNodes.length === 0 && pendingAdmissions.length === 0 && pendingChanges.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-400 mb-3" />
            <div className="text-gray-500">暂无待确认事项</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
