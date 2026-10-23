import { useStore } from '../store/useStore'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { daysFromNow, formatDate } from '../engine'

export default function KeyDatesPage() {
  const { keyDates } = useStore()

  const sorted = [...keyDates].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">关键日期</h1>
        <Badge variant="muted">仅"已核实"日期触发提醒</Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {[
          { label: '14天内倒计时', count: sorted.filter(d => d.verified && daysFromNow(d.date) >= 0 && daysFromNow(d.date) <= 14).length, color: 'text-red-600', icon: AlertCircle },
          { label: '已核实日期', count: sorted.filter(d => d.verified).length, color: 'text-emerald-600', icon: CheckCircle2 },
          { label: '待核实', count: sorted.filter(d => !d.verified).length, color: 'text-amber-600', icon: Clock },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{s.count}</div>
                <div className="text-xs text-gray-400">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>日期列表</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sorted.map(d => {
              const days = daysFromNow(d.date)
              return (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200">
                  <div className={`h-14 w-14 rounded-xl flex flex-col items-center justify-center text-white shrink-0 ${
                    d.verified ? (days >= 0 && days <= 14 ? 'bg-red-500' : 'bg-ding-600') : 'bg-gray-300'
                  }`}>
                    <span className="text-lg font-bold leading-none">{new Date(d.date).getDate()}</span>
                    <span className="text-[10px]">{new Date(d.date).toLocaleDateString('zh-CN', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{d.title}</span>
                      {d.region && <Badge variant="muted">{d.region}</Badge>}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {formatDate(d.date, 'yyyy-MM-dd')} · {d.type === 'deadline' ? '申请截止' : d.type === 'exam' ? '考试' : d.type === 'event' ? '事件' : '信息更新'}
                    </div>
                  </div>
                  <div className="text-right">
                    {d.verified ? (
                      days < 0 ? <Badge variant="muted">已过</Badge> :
                      days === 0 ? <Badge variant="danger">今天</Badge> :
                      days <= 14 ? <Badge variant="danger">{days}天</Badge> :
                      days <= 30 ? <Badge variant="warning">{days}天</Badge> :
                      <Badge variant="info">{days}天</Badge>
                    ) : (
                      <Badge variant="warning">待核实</Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-gray-400 bg-amber-50 p-3 rounded-lg border border-amber-100">
        📌 规则：每月首个工作日检查关键日期与申请要求是否过期；未核实日期不触发提醒，避免打扰家长。
      </div>
    </div>
  )
}
