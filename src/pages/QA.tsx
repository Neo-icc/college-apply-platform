import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { MessageSquare, Clock, Send } from 'lucide-react'
import { getQaSlaState, formatDateTime } from '../engine'

export default function QAPage() {
  const { qaThreads, calibers, students, answerQA, role } = useStore()
  const [selected, setSelected] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [caliberCode, setCaliberCode] = useState('')

  // 家长视角只看自己孩子的提问
  const myStudentId = role === 'parent' ? students[0]?.id : undefined
  const visibleQA = role === 'parent' && myStudentId
    ? qaThreads.filter(q => q.studentId === myStudentId)
    : qaThreads

  const selectedQA = visibleQA.find(q => q.id === selected)

  const handleSubmit = () => {
    if (selectedQA && answer.trim()) {
      answerQA(selectedQA.id, answer, caliberCode || undefined)
      setAnswer('')
      setCaliberCode('')
    }
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">家长问答</h1>
        <Badge variant="info">24 小时内答复 · 结论性答复请引用标准编号</Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* 问答列表 */}
        <Card>
          <CardHeader><CardTitle>提问列表</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {visibleQA.map(q => {
              const sla = getQaSlaState(q)
              return (
                <div
                  key={q.id}
                  onClick={() => setSelected(q.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selected === q.id ? 'border-ding-300 bg-ding-50/40' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={q.status === 'answered' ? 'success' : q.status === 'overdue' || sla.isOverdue ? 'danger' : 'warning'}>
                      {q.status === 'answered' ? '已答复' : sla.isOverdue ? '已超时' : `${Math.ceil(sla.hoursLeft)}h`}
                    </Badge>
                    <span className="text-sm font-medium text-gray-800">{q.studentName}家长</span>
                    <span className="text-xs text-gray-400 ml-auto">{formatDateTime(q.askedAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{q.question}</p>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* 问答详情 */}
        <Card>
          <CardHeader>
            <CardTitle>问答详情</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedQA ? (
              <div className="text-center text-gray-400 py-12">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                选择左侧问题查看详情
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-800">{selectedQA.studentName} 家长提问</span>
                    <span className="text-xs text-gray-400">{formatDateTime(selectedQA.askedAt)}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                    {selectedQA.question}
                  </div>
                </div>

                {selectedQA.answer ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-800">{selectedQA.answeredBy} 答复</span>
                      <span className="text-xs text-gray-400">{selectedQA.answeredAt && formatDateTime(selectedQA.answeredAt)}</span>
                      {selectedQA.caliberCode && (
                        <Badge variant="default" className="ml-auto">标准 {selectedQA.caliberCode}</Badge>
                      )}
                    </div>
                    <div className="bg-ding-50 rounded-lg p-3 text-sm text-gray-700">
                      {selectedQA.answer}
                    </div>
                  </div>
                ) : role === 'teacher' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">答复内容（结论性内容请引用标准编号）</label>
                      <textarea
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        rows={4}
                        className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:outline-none focus:border-ding-400"
                        placeholder="输入答复..."
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">引用标准编号（可选）</label>
                      <select
                        value={caliberCode}
                        onChange={e => setCaliberCode(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:outline-none focus:border-ding-400"
                      >
                        <option value="">不引用</option>
                        {calibers.map(c => (
                          <option key={c.id} value={c.code}>{c.code} - {c.question}</option>
                        ))}
                      </select>
                    </div>
                    <Button onClick={handleSubmit} disabled={!answer.trim()}>
                      <Send className="h-4 w-4" /> 提交答复
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 bg-amber-50 p-3 rounded-lg">
                    <Clock className="h-4 w-4 inline mr-1" />
                    顾问将在 24 小时内答复...
                  </div>
                )}

                {/* SLA 状态 */}
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-400">响应时效：{selectedQA.slaHours} 小时内答复</span>
                  {selectedQA.status !== 'answered' && (
                    <>
                      <span className="text-gray-400">· 已用 {getQaSlaState(selectedQA).hoursElapsed.toFixed(1)}h</span>
                      {getQaSlaState(selectedQA).isOverdue ? (
                        <Badge variant="danger">已超时</Badge>
                      ) : (
                        <Badge variant={getQaSlaState(selectedQA).isDueSoon ? 'warning' : 'success'}>
                          剩余 {Math.ceil(getQaSlaState(selectedQA).hoursLeft)}h
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 口径库参考 */}
      {role === 'teacher' && (
        <Card>
          <CardHeader><CardTitle>标准答复库（答复时引用编号）</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-2">
              {calibers.map(c => (
                <div key={c.id} className="p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="default">{c.code}</Badge>
                    <span className="text-xs text-gray-400">{c.category}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-800">{c.question}</div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
