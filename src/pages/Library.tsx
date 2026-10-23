import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { BookOpen, GraduationCap, Search } from 'lucide-react'

type Tab = 'rules' | 'calibers' | 'universities' | 'majors'

export default function LibraryPage() {
  const { ruleCards, calibers, universities, majors } = useStore()
  const [tab, setTab] = useState<Tab>('rules')
  const [search, setSearch] = useState('')

  const tabs = [
    { k: 'rules' as Tab, label: `申请要求清单 (${ruleCards.length})`, icon: BookOpen },
    { k: 'calibers' as Tab, label: `标准答复库 (${calibers.length})`, icon: BookOpen },
    { k: 'universities' as Tab, label: `重点院校 (${universities.length})`, icon: GraduationCap },
    { k: 'majors' as Tab, label: `专业库 (${majors.length})`, icon: BookOpen },
  ]

  const filteredUni = universities.filter(u => u.name.includes(search) || u.nameEn.toLowerCase().includes(search.toLowerCase()))
  const filteredMajor = majors.filter(m => m.name.includes(search) || m.category.includes(search))

  const confidenceVariant = { high: 'success', medium: 'warning', low: 'danger' } as const
  const confidenceLabel = { high: '高', medium: '中', low: '低' }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-gray-800">知识库</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索院校/专业..."
            className="h-9 w-56 pl-9 pr-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-ding-400"
          />
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              tab === t.k ? 'bg-ding-50 text-ding-700 font-medium' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* 核对卡 */}
      {tab === 'rules' && (
        <div className="grid md:grid-cols-2 gap-4">
          {ruleCards.map(r => (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: '#3366ff' }}>
                    {r.schoolName[0]}
                  </div>
                  {r.schoolName} · {r.major}
                  <Badge variant="muted" className="ml-auto">{r.region}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {r.requirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-gray-50">
                      <span className="text-gray-500 w-20 shrink-0">{req.item}</span>
                      <span className="font-medium text-gray-800 flex-1">{req.value}</span>
                      <Badge variant={confidenceVariant[req.confidence]}>可信度 {confidenceLabel[req.confidence]}</Badge>
                      <span className="text-xs text-gray-400 shrink-0">以官网为准</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  已多方核实 · 核实于 {r.verifiedAt} · {r.verifiedBy}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 口径库 */}
      {tab === 'calibers' && (
        <Card>
          <CardHeader>
            <CardTitle>标准答复库（答复请引用编号）</CardTitle>
            <Badge variant="muted" className="ml-auto">结论性答复引用编号</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {calibers.map(c => (
              <div key={c.id} className="p-4 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default">{c.code}</Badge>
                  <Badge variant="muted">{c.category}</Badge>
                  <span className="text-xs text-gray-400 ml-auto">更新于 {c.updatedAt}</span>
                </div>
                <div className="font-medium text-gray-800 mb-1">{c.question}</div>
                <p className="text-sm text-gray-600 leading-relaxed">{c.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 重点院校 */}
      {tab === 'universities' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {filteredUni.map(u => (
            <Card key={u.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="h-12 w-12 rounded-full mx-auto flex items-center justify-center text-white font-bold text-lg mb-2" style={{ background: u.logoColor }}>
                  {u.name[0]}
                </div>
                <div className="font-medium text-gray-800 text-sm">{u.name}</div>
                <div className="text-xs text-gray-400 mb-1">{u.nameEn}</div>
                <div className="flex items-center justify-center gap-1.5">
                  <Badge variant="muted">{u.region}</Badge>
                  {u.qsRank && <Badge variant="info">QS {u.qsRank}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 专业库 */}
      {tab === 'majors' && (
        <Card>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {filteredMajor.map(m => (
                <div key={m.id} className="p-2.5 rounded-lg border border-gray-100 hover:border-ding-200">
                  <div className="text-sm font-medium text-gray-800">{m.name}</div>
                  <div className="text-xs text-gray-400">{m.nameEn}</div>
                  <div className="flex gap-1 mt-1">
                    <Badge variant="muted">{m.category}</Badge>
                    <Badge variant="default">{m.region}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
