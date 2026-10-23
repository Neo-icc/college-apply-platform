import { useNavigate } from 'react-router-dom'
import { Users, UserCircle, GraduationCap, ShieldCheck, ArrowRight } from 'lucide-react'
import { useStore } from '../store/useStore'
import type { Role } from '../types'

const roles: { role: Role; label: string; desc: string; icon: typeof Users; color: string; defaultPath: string }[] = [
  { role: 'teacher', label: '校内顾问', desc: '管理驾驶舱 · 工单 · 学生 · 问答', icon: Users, color: 'from-ding-500 to-ding-700', defaultPath: '/dashboard' },
  { role: 'parent', label: '家长', desc: '进度查看 · 确认 · 提问 · 录取', icon: UserCircle, color: 'from-emerald-500 to-emerald-700', defaultPath: '/parent-dashboard' },
  { role: 'student', label: '学生', desc: '任务 · 素材问卷 · 约谈提醒', icon: GraduationCap, color: 'from-violet-500 to-violet-700', defaultPath: '/student-dashboard' },
]

export default function Login() {
  const navigate = useNavigate()
  const { setRole } = useStore()

  const handleLogin = (role: Role, path: string) => {
    setRole(role)
    navigate(path)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-ding-50 via-white to-emerald-50">
      {/* Top bar */}
      <div className="h-14 flex items-center px-6 border-b border-gray-100 bg-white/70 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-ding-600 flex items-center justify-center text-white font-bold text-sm">
            升
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-gray-800">升学指导协作体系</div>
            <div className="text-[10px] text-gray-400">石家庄图德教育 · 钉钉系统</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          升学指导协作平台
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">选择身份进入系统</h1>
            <p className="text-gray-500">
              专业团队全程跟进 · 关键节点透明可视 · 重要决策由您确认
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {roles.map(r => (
              <button
                key={r.role}
                onClick={() => handleLogin(r.role, r.defaultPath)}
                className="group relative text-left rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:border-ding-300 transition-all hover:-translate-y-1"
              >
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white mb-4 shadow-md`}>
                  <r.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{r.label}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-5">{r.desc}</p>
                <div className="flex items-center text-sm text-ding-600 font-medium group-hover:gap-2 transition-all gap-1">
                  进入系统 <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { num: '17', label: '信息模块' },
              { num: '26', label: '服务流程' },
              { num: '23+8', label: '流程节点' },
              { num: '306', label: '专业目录' },
            ].map(s => (
              <div key={s.label} className="text-center rounded-xl bg-white border border-gray-100 py-4">
                <div className="text-2xl font-bold text-ding-600">{s.num}</div>
                <div className="text-xs text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
