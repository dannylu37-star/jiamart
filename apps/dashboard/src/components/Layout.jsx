import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/',           icon: '📊', label: '仪表盘',   roles: ['employee','manager','admin','superadmin'] },
  { to: '/staff',      icon: '👥', label: '员工管理', roles: ['manager','admin','superadmin'] },
  { to: '/shifts',     icon: '📅', label: '排班管理', roles: ['manager','admin','superadmin'] },
  { to: '/records',    icon: '📋', label: '员工档案', roles: ['manager','admin','superadmin'] },
  { to: '/attendance', icon: '🕐', label: '考勤记录', roles: ['manager','admin','superadmin'] },
  { to: '/payroll',    icon: '💰', label: '薪资管理', roles: ['admin','superadmin'] },
  { to: '/stores',     icon: '🏪', label: '门店管理', roles: ['admin','superadmin'] },
  { to: '/sales',      icon: '💹', label: '营业额',   roles: ['admin','superadmin'] },
  { to: '/goods',      icon: '🛒', label: '商品管理', roles: ['admin','superadmin'] },
]

const ROLE_BADGE = {
  superadmin: { label: '超管', cls: 'bg-purple-100 text-purple-700' },
  admin:      { label: '管理员', cls: 'bg-brand/10 text-brand' },
  manager:    { label: '店长', cls: 'bg-blue-100 text-blue-700' },
  employee:   { label: '员工', cls: 'bg-gray-100 text-gray-600' },
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const allowed = NAV.filter(n => n.roles.includes(user?.role || 'employee'))
  const badge = ROLE_BADGE[user?.role] || ROLE_BADGE.employee

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-sidebar flex flex-col text-white flex-shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <div className="text-brand font-bold text-lg">Jiamart</div>
          <div className="text-white/50 text-xs">后台管理系统</div>
        </div>

        {/* User */}
        <div className="p-4 border-b border-white/10">
          <div className="text-sm font-medium truncate">{user?.username}</div>
          <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {allowed.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-brand text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <span>🚪</span><span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
