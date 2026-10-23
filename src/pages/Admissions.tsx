import { useStore } from '../store/useStore'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Trophy, XCircle, Clock, CheckCircle2 } from 'lucide-react'
import { formatDateTime } from '../engine'

const resultMap = {
  offer: { label: '录取 Offer', variant: 'success' as const, icon: Trophy },
  rejected: { label: '拒绝', variant: 'danger' as const, icon: XCircle },
  waiting: { label: '等待中', variant: 'warning' as const, icon: Clock },
  pending: { label: '待审核', variant: 'info' as const, icon: Clock },
}

export default function AdmissionsPage() {
  const { admissions, parentConfirmAdmission, role } = useStore()

  const stats = {
    offer: admissions.filter(a => a.result === 'offer').length,
    rejected: admissions.filter(a => a.result === 'rejected').length,
    waiting: admissions.filter(a => a.result === 'waiting').length,
    pending: admissions.filter(a => a.result === 'pending').length,
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">录取结果</h1>
        <Badge variant="muted">录取信息以学校官方为准</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Offer', value: stats.offer, color: 'text-emerald-600 bg-emerald-50', icon: Trophy },
          { label: '等待中', value: stats.waiting, color: 'text-amber-600 bg-amber-50', icon: Clock },
          { label: '待审核', value: stats.pending, color: 'text-blue-600 bg-blue-50', icon: Clock },
          { label: '拒绝', value: stats.rejected, color: 'text-red-600 bg-red-50', icon: XCircle },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-gray-400">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>录取结果列表</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {admissions.map(a => {
              const r = resultMap[a.result]
              return (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${a.result === 'offer' ? 'bg-emerald-50 text-emerald-600' : a.result === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                    <r.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{a.schoolName}</span>
                      <Badge variant={r.variant}>{r.label}</Badge>
                      <span className="text-gray-300">·</span>
                      <span className="text-sm text-gray-500">{a.major}</span>
                      <Badge variant="muted">{a.region}</Badge>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {a.studentName} · 收到于 {formatDateTime(a.receivedAt)}
                      {a.scholarship && ` · 奖学金 ${a.scholarship}`}
                    </div>
                  </div>
                  <div>
                    {a.parentKnown ? (
                      <Badge variant="success"><CheckCircle2 className="h-3 w-3" /> 家长已知悉</Badge>
                    ) : (role === 'parent' && a.result === 'offer') ? (
                      <Button size="sm" onClick={() => parentConfirmAdmission(a.id)}>
                        确认知悉
                      </Button>
                    ) : (
                      <Badge variant="warning">待家长知悉</Badge>
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
