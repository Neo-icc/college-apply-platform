import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { X } from 'lucide-react'
import { useStore } from '../../store/useStore'

interface AppLayoutProps {
  children: React.ReactNode
}

const roleHome: Record<string, string> = {
  teacher: '/dashboard',
  parent: '/parent-dashboard',
  student: '/student-dashboard',
}

// 各角色禁止访问的路径前缀（命中则跳回角色首页）
const forbiddenPrefix: Record<string, string[]> = {
  teacher: ['/parent-dashboard', '/student-dashboard'],
  parent: ['/dashboard', '/library'],
  student: ['/dashboard', '/workorders', '/students', '/library', '/admissions', '/parent-dashboard', '/confirm'],
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { role } = useStore()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const forbidden = forbiddenPrefix[role] || []
    if (forbidden.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))) {
      navigate(roleHome[role], { replace: true })
    }
  }, [role, location.pathname, navigate])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="relative bg-white h-full">
            <button
              className="absolute top-3 right-3 z-10"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  )
}
