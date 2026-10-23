import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import {
  ArrowLeft, User, FileCheck, BookOpen, GitBranch, History,
  Snowflake,
} from 'lucide-react'
import { formatDateTime } from '../engine'

const materialStatusMap = {
  pending: { label: '待提交', variant: 'muted' as const },
  submitted: { label: '已提交', variant: 'info' as const },
  verified: { label: '已核验', variant: 'success' as const },
  rejected: { label: '需补正', variant: 'danger' as const },
}

const tierMap = { reach: '冲刺', match: '匹配', safety: '保底' }
const tierVariant = { reach: 'danger', match: 'info', safety: 'success' } as const

export function StudentList() {
  const { students } = useStore()
  const navigate = useNavigate()
  return (
    <div className="p-5 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">学生档案</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map(s => (
          <Card key={s.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/students/${s.id}`)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: s.avatarColor }}>
                  {s.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800">{s.name}</h3>
                  <p className="text-xs text-gray-400">{s.currentSchool} · {s.grade === 'G12' ? '高三' : s.grade === 'G11' ? '高二' : '高一'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {s.targetRegion.map(r => (
                  <Badge key={r} variant="muted">{r === 'UK' ? '英国' : r === 'HK' ? '香港' : r === 'AU' ? '澳洲' : '加拿大'}</Badge>
                ))}
                {s.tags.map(t => <Badge key={t} variant="default">{t}</Badge>)}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-400">GPA</span> <span className="font-medium">{s.gpa}</span></div>
                <div><span className="text-gray-400">顾问</span> <span className="font-medium">{s.advisorName}</span></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { students, materials, essayMaterials, planVersions, changes, interviews, submitMaterial, verifyMaterial, freezePlan, approveChange, role } = useStore()
  const s = students.find(x => x.id === id)
  const [tab, setTab] = useState<'info' | 'materials' | 'essay' | 'plan' | 'changes' | 'interviews'>('info')

  if (!s) return <div className="p-8 text-center text-gray-400">学生不存在</div>

  const stuMaterials = materials.filter(m => m.studentId === s.id)
  const stuEssay = essayMaterials.filter(e => e.studentId === s.id)
  const stuPlans = planVersions.filter(p => p.studentId === s.id)
  const stuChanges = changes.filter(c => c.studentId === s.id)
  const stuInterviews = interviews.filter(i => i.studentId === s.id)

  const tabs = [
    { k: 'info', label: '基本信息', icon: User },
    { k: 'materials', label: `材料清单 (${stuMaterials.length})`, icon: FileCheck },
    { k: 'essay', label: `文书素材 (${stuEssay.length})`, icon: BookOpen },
    { k: 'plan', label: `方案版本 (${stuPlans.length})`, icon: GitBranch },
    { k: 'changes', label: `变更记录 (${stuChanges.length})`, icon: History },
    { k: 'interviews', label: `约谈 (${stuInterviews.length})`, icon: User },
  ] as const

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/students')}><ArrowLeft className="h-4 w-4" /> 返回</Button>
        <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: s.avatarColor }}>
          {s.name[0]}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{s.name}</h1>
          <p className="text-xs text-gray-400">{s.currentSchool} · GPA {s.gpa} · 顾问 {s.advisorName}</p>
        </div>
      </div>

      {/* Tab 导航 */}
      <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-1">
        {tabs.map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              tab === t.k ? 'bg-ding-50 text-ding-700 font-medium' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      {tab === 'info' && (
        <Card>
          <CardContent className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="年级" value={s.grade === 'G12' ? '高三' : s.grade === 'G11' ? '高二' : '高一'} />
            <Field label="目标地区" value={s.targetRegion.map(r => r === 'UK' ? '英国' : r === 'HK' ? '香港' : r === 'AU' ? '澳洲' : '加拿大').join('、')} />
            <Field label="当前学校" value={s.currentSchool} />
            <Field label="GPA" value={s.gpa} />
            <Field label="家长" value={`${s.parentName}（${s.parentPhone}）`} />
            <Field label="家长钉钉" value={s.parentUserId || '未绑定'} />
            <Field label="入学时间" value={s.enrolledAt} />
            <Field label="语言成绩" value={s.languageScores.map(l => `${l.type} ${l.score}`).join('、')} />
            <Field label="标签" value={s.tags.join('、')} />
          </CardContent>
        </Card>
      )}

      {tab === 'materials' && (
        <Card>
          <CardHeader><CardTitle>材料清单核验</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stuMaterials.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200">
                  <Badge variant={materialStatusMap[m.status].variant}>{materialStatusMap[m.status].label}</Badge>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{m.name}</div>
                    <div className="text-xs text-gray-400">
                      {m.submittedAt && `提交：${formatDateTime(m.submittedAt)}`}
                      {m.verifiedAt && ` · 核验：${formatDateTime(m.verifiedAt)}`}
                    </div>
                  </div>
                  {role === 'teacher' && (
                    <div className="flex gap-1">
                      {m.status === 'pending' && <Button size="sm" variant="outline" onClick={() => submitMaterial(m.id)}>标记提交</Button>}
                      {m.status === 'submitted' && <Button size="sm" variant="primary" onClick={() => verifyMaterial(m.id)}>核验通过</Button>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'essay' && (
        <Card>
          <CardHeader>
            <CardTitle>文书素材</CardTitle>
            <Badge variant="warning" className="ml-auto">AI 仅协助整理，不代写</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {stuEssay.map(e => (
              <div key={e.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-800 text-sm">{e.type}</span>
                  <Badge variant={e.status === 'confirmed' ? 'success' : e.status === 'submitted' ? 'info' : 'pending'}>
                    {e.status === 'confirmed' ? '已确认' : e.status === 'submitted' ? '已提交' : '草稿'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{e.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === 'plan' && (
        <Card>
          <CardHeader>
            <CardTitle>选校方案版本</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stuPlans.map(p => (
              <div key={p.id} className="rounded-lg border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-semibold text-gray-800">{p.version}</span>
                  <Badge variant={p.status === 'frozen' ? 'success' : p.status === 'draft' ? 'warning' : 'muted'}>
                    {p.status === 'frozen' ? '已锁定' : p.status === 'draft' ? '草稿' : '已更新'}
                  </Badge>
                  {p.status === 'frozen' && <Snowflake className="h-4 w-4 text-emerald-500" />}
                  {p.status === 'draft' && role === 'teacher' && (
                    <Button size="sm" className="ml-auto" onClick={() => freezePlan(p.id)}>锁定方案</Button>
                  )}
                </div>
                <div className="grid gap-2">
                  {p.schools.map((sch, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Badge variant={tierVariant[sch.tier]}>{tierMap[sch.tier]}</Badge>
                      <span className="font-medium text-gray-800">{sch.name}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-500">{sch.major}</span>
                      <span className="text-gray-300 ml-auto">{sch.region}</span>
                    </div>
                  ))}
                </div>
                {p.note && <p className="text-xs text-gray-400 mt-2">{p.note}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === 'changes' && (
        <Card>
          <CardHeader>
            <CardTitle>变更记录</CardTitle>
            <Badge variant="muted" className="ml-auto">方案锁定后变更需审批+家长确认</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {stuChanges.map(c => (
              <div key={c.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={c.status === 'parent_confirmed' ? 'success' : c.status === 'approved' ? 'info' : c.status === 'rejected' ? 'danger' : 'warning'}>
                    {c.status === 'parent_confirmed' ? '家长已确认' : c.status === 'approved' ? '已审批' : c.status === 'rejected' ? '已驳回' : '待审批'}
                  </Badge>
                  <span className="font-medium text-gray-800 text-sm">{c.type}</span>
                  <span className="text-xs text-gray-400 ml-auto">{formatDateTime(c.createdAt)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="text-gray-400">从</span> {c.from} <span className="text-gray-400">→</span> <span className="text-ding-600">{c.to}</span>
                </div>
                <div className="text-xs text-amber-600 mt-1">连锁影响：{c.impact}</div>
                {role === 'teacher' && c.status === 'pending_approval' && (
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => approveChange(c.id, true)}>批准</Button>
                    <Button size="sm" variant="outline" onClick={() => approveChange(c.id, false)}>驳回</Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === 'interviews' && (
        <Card>
          <CardHeader><CardTitle>约谈记录</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {stuInterviews.map(iv => (
              <div key={iv.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-800 text-sm">{iv.topic}</span>
                  <Badge variant={iv.status === 'parent_confirmed' ? 'success' : iv.status === 'completed' ? 'info' : 'warning'}>
                    {iv.status === 'parent_confirmed' ? '家长已确认纪要' : iv.status === 'completed' ? '已完成' : '待约谈'}
                  </Badge>
                  <span className="text-xs text-gray-400 ml-auto">{formatDateTime(iv.date)}</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{iv.summary}</p>
                <p className="text-xs text-ding-600">决议：{iv.decisions.join('、')}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-800">{value || '—'}</div>
    </div>
  )
}
