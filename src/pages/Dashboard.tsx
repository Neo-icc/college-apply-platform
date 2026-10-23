import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, RadialBarChart, RadialBar, Legend,
} from 'recharts'
import {
  AlertTriangle, Clock, CheckCircle2, PauseCircle, Users, FileText,
  MessageSquare, CalendarDays, TrendingUp, Bell,
} from 'lucide-react'
import { generateMorningReport, getNodeState, formatDateTime } from '../engine'

const COLORS = {
  completed: '#10b981',
  in_progress: '#3b82f6',
  pending_confirm: '#8b5cf6',
  overdue: '#ef4444',
  stalled: '#f59e0b',
  not_started: '#9ca3af',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { workOrders, workOrderNodes, qaThreads, calibers, ruleCards, students, keyDates, universities, majors } = useStore()

  const stats = useMemo(() => {
    let completed = 0, inProgress = 0, pendingConfirm = 0, overdue = 0, stalled = 0, notStarted = 0
    Object.values(workOrderNodes).forEach(nodes => {
      nodes.forEach(n => {
        if (n.status === 'completed') completed++
        else if (n.status === 'in_progress') inProgress++
        else if (n.status === 'pending_confirm') pendingConfirm++
        else if (n.status === 'overdue') overdue++
        else if (n.status === 'stalled') stalled++
        else notStarted++
      })
    })
    return { completed, inProgress, pendingConfirm, overdue, stalled, notStarted }
  }, [workOrderNodes])

  // 图1：节点状态分布
  const statusPieData = [
    { name: '已完成', value: stats.completed, color: COLORS.completed },
    { name: '进行中', value: stats.inProgress, color: COLORS.in_progress },
    { name: '待确认', value: stats.pendingConfirm, color: COLORS.pending_confirm },
    { name: '已超时', value: stats.overdue, color: COLORS.overdue },
    { name: '无进展', value: stats.stalled, color: COLORS.stalled },
    { name: '未开始', value: stats.notStarted, color: COLORS.not_started },
  ].filter(d => d.value > 0)

  // 图2：各负责人节点负载
  const ownerLoad = useMemo(() => {
    const map: Record<string, { inProgress: number; overdue: number; total: number }> = {}
    Object.values(workOrderNodes).forEach(nodes => {
      nodes.forEach(n => {
        const key = n.ownerName
        if (!map[key]) map[key] = { inProgress: 0, overdue: 0, total: 0 }
        map[key].total++
        if (n.status === 'in_progress') map[key].inProgress++
        if (n.status === 'overdue') map[key].overdue++
      })
    })
    return Object.entries(map).map(([name, v]) => ({ name, ...v }))
  }, [workOrderNodes])

  // 图3：各学生进度
  const studentProgress = workOrders.map(w => {
    const nodes = workOrderNodes[w.id] || []
    const done = nodes.filter(n => n.status === 'completed').length
    return { name: w.studentName, progress: nodes.length ? Math.round((done / nodes.length) * 100) : 0 }
  })

  // 图4：SLA 状态
  const qaStats = useMemo(() => {
    const answered = qaThreads.filter(q => q.status === 'answered').length
    const pending = qaThreads.filter(q => q.status === 'pending').length
    const overdue = qaThreads.filter(q => q.status === 'overdue').length
    return { answered, pending, overdue }
  }, [qaThreads])

  // 晨报内容
  const morningReport = useMemo(() => {
    const woMeta = workOrders.map(w => ({ id: w.id, studentName: w.studentName }))
    return generateMorningReport(workOrderNodes, woMeta)
  }, [workOrderNodes, workOrders])

  // 预警清单
  const alerts = useMemo(() => {
    const list: { woId: string; student: string; node: string; type: 'overdue' | 'stalled' | 'pending'; days: number }[] = []
    workOrders.forEach(w => {
      const nodes = workOrderNodes[w.id] || []
      nodes.forEach(n => {
        const s = getNodeState(n)
        if (n.status === 'overdue' || s.isOverdue) list.push({ woId: w.id, student: w.studentName, node: n.name, type: 'overdue', days: Math.abs(s.daysLeft) })
        else if (n.status === 'stalled' || s.isStalled) list.push({ woId: w.id, student: w.studentName, node: n.name, type: 'stalled', days: 7 })
        else if (n.status === 'pending_confirm') list.push({ woId: w.id, student: w.studentName, node: n.name, type: 'pending', days: 0 })
      })
    })
    return list
  }, [workOrderNodes, workOrders])

  // 图5：近 7 天问答量趋势（mock）
  const qaTrend = [
    { day: '周一', count: 3 }, { day: '周二', count: 5 }, { day: '周三', count: 2 },
    { day: '周四', count: 4 }, { day: '周五', count: 6 }, { day: '周六', count: 1 }, { day: '周日', count: 2 },
  ]

  // 图6：地区分布
  const regionData = [
    { name: '英国', value: students.filter(s => s.targetRegion.includes('UK')).length, color: '#3366ff' },
    { name: '香港', value: students.filter(s => s.targetRegion.includes('HK')).length, color: '#ef4444' },
    { name: '澳洲', value: students.filter(s => s.targetRegion.includes('AU')).length, color: '#f59e0b' },
    { name: '加拿大', value: students.filter(s => s.targetRegion.includes('CA')).length, color: '#10b981' },
  ]

  const totalNodes = stats.completed + stats.inProgress + stats.pendingConfirm + stats.overdue + stats.stalled + stats.notStarted
  const completionRate = totalNodes ? Math.round((stats.completed / totalNodes) * 100) : 0

  return (
    <div className="p-5 space-y-5">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { icon: CheckCircle2, label: '已完成节点', value: stats.completed, color: 'text-emerald-600 bg-emerald-50', to: '/workorders' },
          { icon: Clock, label: '进行中', value: stats.inProgress, color: 'text-blue-600 bg-blue-50', to: '/workorders' },
          { icon: AlertTriangle, label: '已超时', value: stats.overdue, color: 'text-red-600 bg-red-50', to: '/workorders?filter=overdue' },
          { icon: PauseCircle, label: '无进展', value: stats.stalled, color: 'text-amber-600 bg-amber-50', to: '/workorders' },
          { icon: MessageSquare, label: '待答问答', value: qaStats.pending + qaStats.overdue, color: 'text-purple-600 bg-purple-50', to: '/qa' },
          { icon: Users, label: '在管学生', value: students.length, color: 'text-ding-600 bg-ding-50', to: '/students' },
        ].map(c => (
          <Card
            key={c.label}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(c.to)}
          >
            <CardContent className="p-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2 ${c.color}`}>
                <c.icon className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold text-gray-800">{c.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{c.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* 晨报 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-ding-600" /> 每日晨报
              <Badge variant="muted" className="ml-auto">{formatDateTime(new Date())}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans bg-ding-50/50 rounded-lg p-3">
              {morningReport}
            </pre>
            <div className="mt-3 space-y-1.5">
              {alerts.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Badge variant={a.type === 'overdue' ? 'danger' : a.type === 'stalled' ? 'warning' : 'pending'}>
                    {a.type === 'overdue' ? '已超时' : a.type === 'stalled' ? '无进展' : '待确认'}
                  </Badge>
                  <span className="text-gray-700">{a.student}·{a.node}</span>
                  {a.type === 'overdue' && <span className="text-red-500">{a.days}天</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 完成率环形图 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-ding-600" /> 全局完成率
              <Badge variant="success" className="ml-auto">{completionRate}%</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="60%" outerRadius="100%" data={[{ name: '完成率', value: completionRate, fill: '#3366ff' }]} startAngle={90} endAngle={-270}>
                    <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#eef2ff' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center space-y-2">
                {statusPieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                    <span className="text-sm text-gray-600 flex-1">{d.name}</span>
                    <span className="text-sm font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 第二行：饼图 + 柱状图 */}
      <div className="grid lg:grid-cols-3 gap-5">
        <Card>
          <CardHeader><CardTitle>节点状态分布</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={2}>
                    {statusPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>负责人负载</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ownerLoad} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="inProgress" stackId="a" fill="#3b82f6" name="进行中" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="overdue" stackId="a" fill="#ef4444" name="已超时" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>学生进度</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentProgress}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="progress" fill="#3366ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 第三行：问答趋势 + 地区分布 + 知识库 */}
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-ding-600" /> 问答响应时效
              <Badge variant={qaStats.overdue > 0 ? 'danger' : 'success'} className="ml-auto">
                {qaStats.overdue > 0 ? `${qaStats.overdue} 条已超时` : '响应正常'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={qaTrend}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#3366ff" fill="#bcd3ff" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center p-2 rounded-lg bg-emerald-50">
                <div className="text-lg font-bold text-emerald-600">{qaStats.answered}</div>
                <div className="text-xs text-gray-500">已答复</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-amber-50">
                <div className="text-lg font-bold text-amber-600">{qaStats.pending}</div>
                <div className="text-xs text-gray-500">待答复</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-red-50">
                <div className="text-lg font-bold text-red-600">{qaStats.overdue}</div>
                <div className="text-xs text-gray-500">已超时</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>目标地区分布</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={regionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, value }) => `${name} ${value}`}>
                    {regionData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 第四行：知识库概况 + 关键日期 */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/library')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-ding-600" /> 知识库
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-ding-50">
                <div className="text-2xl font-bold text-ding-600">{ruleCards.length}</div>
                <div className="text-xs text-gray-500">申请要求清单</div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50">
                <div className="text-2xl font-bold text-emerald-600">{calibers.length}</div>
                <div className="text-xs text-gray-500">标准答复条目</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-50">
                <div className="text-2xl font-bold text-amber-600">{universities.length}</div>
                <div className="text-xs text-gray-500">重点院校</div>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <div className="text-2xl font-bold text-purple-600">{majors.length}</div>
                <div className="text-xs text-gray-500">专业库</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-ding-600" /> 近期关键日期
              <Badge variant="muted" className="ml-auto">仅已核实触发</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {keyDates.slice(0, 5).map(d => (
                <div key={d.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className={`h-10 w-10 rounded-lg flex flex-col items-center justify-center text-white text-xs font-bold ${d.verified ? 'bg-ding-600' : 'bg-gray-300'}`}>
                    {new Date(d.date).getDate()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{d.title}</div>
                    <div className="text-xs text-gray-400">{new Date(d.date).toLocaleDateString('zh-CN')}</div>
                  </div>
                  <Badge variant={d.verified ? 'success' : 'muted'}>{d.verified ? '已核实' : '待核实'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 预警汇总 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> 今日需处理清单
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {alerts.length === 0 && <div className="text-center text-sm text-gray-400 py-6">🎉 今日无预警项</div>}
            {alerts.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-ding-200">
                <Badge variant={a.type === 'overdue' ? 'danger' : a.type === 'stalled' ? 'warning' : 'pending'}>
                  {a.type === 'overdue' ? '已超时' : a.type === 'stalled' ? '7天无进展' : '待家长确认'}
                </Badge>
                <span className="text-sm text-gray-800">{a.student}</span>
                <span className="text-sm text-gray-500">·</span>
                <span className="text-sm text-gray-600">{a.node}</span>
                <div className="ml-auto">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/workorders/${a.woId}`)}>处理</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
