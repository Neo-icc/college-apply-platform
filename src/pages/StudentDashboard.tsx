import { useStore } from '../store/useStore'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge, statusVariant } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { FileText, Calendar, MessageSquare } from 'lucide-react'
import { formatDateTime } from '../engine'

export default function StudentDashboard() {
  const { students, workOrders, workOrderNodes, interviews, notifications } = useStore()
  const navigate = useNavigate()
  const student = students[0]
  const wo = workOrders.find(w => w.studentId === student?.id)
  const nodes = wo ? (workOrderNodes[wo.id] || []) : []
  const myTasks = nodes.filter(n => n.owner === 'student' && n.status !== 'completed')
  const upcomingInterviews = interviews.filter(i => i.studentId === student?.id)

  return (
    <div className="p-5 space-y-4 max-w-3xl mx-auto">
      <Card className="bg-gradient-to-r from-violet-600 to-violet-700 text-white border-0">
        <CardContent className="p-5">
          <h1 className="text-xl font-bold">你好，{student?.name} 👋</h1>
          <p className="text-violet-100 text-sm mt-1">这是你当前的升学任务进度</p>
        </CardContent>
      </Card>

      {/* 待办任务 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-violet-600" /> 我的任务
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {myTasks.length === 0 && <div className="text-center text-gray-400 py-6">暂无任务，好好休息 🎉</div>}
          {myTasks.map(n => {
            return (
              <div key={n.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  n.status === 'completed' ? 'bg-emerald-500' : n.status === 'in_progress' ? 'bg-violet-500' : 'bg-gray-300'
                }`}>
                  {n.status === 'completed' ? '✓' : n.index}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 text-sm">{n.name}</div>
                  <div className="text-xs text-gray-400">{n.description}</div>
                </div>
                <Badge variant={statusVariant(n.status)}>
                  {n.status === 'completed' ? '已完成' : n.status === 'in_progress' ? '进行中' : n.status === 'pending_confirm' ? '待确认' : '未开始'}
                </Badge>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* 素材问卷入口 */}
      <Card className="border-violet-200 bg-violet-50/30">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-violet-600 flex items-center justify-center text-white">
              <FileText className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-800">文书素材问卷（必办）</div>
              <p className="text-xs text-gray-500">填写你的经历、兴趣、奖项，用于文书素材整理</p>
            </div>
            <Button size="sm" onClick={() => navigate(`/students/${student?.id}`)}>去填写</Button>
          </div>
        </CardContent>
      </Card>

      {/* 约谈提醒 */}
      {upcomingInterviews.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4 text-ding-600" /> 约谈安排</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {upcomingInterviews.map(iv => (
              <div key={iv.id} className="p-3 rounded-lg bg-ding-50/50">
                <div className="font-medium text-gray-800">{iv.topic}</div>
                <div className="text-xs text-gray-500 mt-0.5">{formatDateTime(iv.date)}</div>
                <div className="text-xs text-gray-400 mt-1">参与：{iv.participants.join('、')}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 消息 */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-ding-600" /> 消息</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {notifications.filter(n => n.to === 'student' || n.to === 'all').slice(0, 5).map(n => (
            <div key={n.id} className="p-2.5 rounded-lg bg-gray-50 text-sm">
              <div className="font-medium text-gray-800">{n.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">{n.content}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
