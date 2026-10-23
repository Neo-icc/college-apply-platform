import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, Menu, ChevronRight } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { cn } from '../../lib/utils'
import { formatDateTime } from '../../engine'

const roleLabels = { teacher: '校内顾问', parent: '家长', student: '学生' }

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { role, students, workOrders, notifications, markNotificationRead, markAllNotificationsRead } = useStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const unread = notifications.filter(n => !n.read).length

  // 搜索建议：学生 + 工单
  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    const stu = students.filter(s => s.name.toLowerCase().includes(q) || s.currentSchool.toLowerCase().includes(q))
      .slice(0, 4).map(s => ({ type: 'student' as const, id: s.id, label: `${s.name} · 学生档案`, sub: s.currentSchool }))
    const wo = workOrders.filter(w => w.studentName.toLowerCase().includes(q) || w.id.toLowerCase().includes(q))
      .slice(0, 4).map(w => ({ type: 'workorder' as const, id: w.id, label: `${w.studentName} · 工单`, sub: w.id }))
    return [...stu, ...wo].slice(0, 6)
  }, [search, students, workOrders])

  const handleSearchSelect = (type: 'student' | 'workorder', id: string) => {
    navigate(type === 'student' ? `/students/${id}` : `/workorders/${id}`)
    setSearch('')
  }

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-3 shrink-0">
      <button className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5 text-gray-600" />
      </button>
      <div className="flex-1 flex items-center gap-2">
        <div className="relative max-w-md flex-1 hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索学生、工单、院校..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-ding-400 focus:bg-white"
          />
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-10 bg-white rounded-lg border border-gray-200 shadow-lg z-50 overflow-hidden">
              {suggestions.map(s => (
                <button
                  key={`${s.type}-${s.id}`}
                  onClick={() => handleSearchSelect(s.type, s.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-ding-50 text-left"
                >
                  <span className="text-gray-800">{s.label}</span>
                  <span className="text-xs text-gray-400 ml-auto">{s.sub}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500">
          <span className="px-2 py-0.5 rounded-full bg-ding-50 text-ding-700 font-medium">
            {roleLabels[role]}
          </span>
        </div>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="relative h-9 w-9 rounded-lg hover:bg-gray-100 flex items-center justify-center"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-12 w-[85vw] max-w-80 max-h-[70vh] overflow-y-auto scrollbar-thin rounded-xl border border-gray-200 bg-white shadow-xl z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold">通知中心</span>
                <button
                  onClick={markAllNotificationsRead}
                  className="text-xs text-ding-600 hover:underline"
                >
                  全部已读
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {notifications.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">暂无通知</div>
                )}
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markNotificationRead(n.id)
                      setOpen(false)
                      if (n.actionLink) navigate(n.actionLink)
                    }}
                    className={cn(
                      'px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors',
                      !n.read && 'bg-ding-50/40'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-gray-800 flex-1">{n.title}</span>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-ding-500 mt-1.5 shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.content}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-gray-400">{formatDateTime(n.createdAt)}</span>
                      {n.actionLabel && (
                        <span className="text-[11px] text-ding-600 font-medium">{n.actionLabel} <ChevronRight className="inline h-3 w-3" /></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-ding-600 text-white flex items-center justify-center text-sm font-medium">
            {role === 'teacher' ? '李' : role === 'parent' ? '张' : '子'}
          </div>
          <span className="hidden sm:block text-sm text-gray-700">
            {role === 'teacher' ? '李胜' : role === 'parent' ? '张建国' : '张子轩'}
          </span>
        </div>
      </div>
    </header>
  )
}
