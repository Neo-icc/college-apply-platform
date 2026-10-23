import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Users, MessageSquare, Calendar, BookOpen, GraduationCap, Bell, CheckCircle2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { cn } from '../../lib/utils'

const teacherNav = [
  { to: '/dashboard', label: '管理驾驶舱', icon: LayoutDashboard },
  { to: '/workorders', label: '工单管理', icon: ClipboardList },
  { to: '/students', label: '学生档案', icon: Users },
  { to: '/qa', label: '家长问答', icon: MessageSquare },
  { to: '/dates', label: '关键日期', icon: Calendar },
  { to: '/library', label: '知识库', icon: BookOpen },
  { to: '/admissions', label: '录取结果', icon: GraduationCap },
]

const parentNav = [
  { to: '/parent-dashboard', label: '我的进度', icon: LayoutDashboard },
  { to: '/confirm', label: '待我确认', icon: CheckCircle2 },
  { to: '/qa', label: '我的提问', icon: MessageSquare },
  { to: '/dates', label: '关键日期', icon: Calendar },
]

const studentNav = [
  { to: '/student-dashboard', label: '我的任务', icon: LayoutDashboard },
  { to: '/qa', label: '问答', icon: MessageSquare },
  { to: '/dates', label: '关键日期', icon: Calendar },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { role } = useStore()
  const navigate = useNavigate()
  const nav = role === 'teacher' ? teacherNav : role === 'parent' ? parentNav : studentNav

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-white flex flex-col h-full">
      <div className="h-14 flex items-center gap-2 px-4 border-b border-gray-100">
        <div className="h-8 w-8 rounded-lg bg-ding-600 flex items-center justify-center text-white font-bold text-sm">
          升
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-gray-800">升学指导中心</div>
          <div className="text-[10px] text-gray-400">图德教育 · 钉钉系统</div>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-ding-50 text-ding-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={() => navigate('/login')}
          className="w-full text-xs text-gray-400 hover:text-ding-600 flex items-center gap-1"
        >
          <Bell className="h-3 w-3" /> 切换角色
        </button>
      </div>
    </aside>
  )
}
