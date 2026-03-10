import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

function StatCard({ icon, label, value, sub, color = 'brand' }) {
  const colors = {
    brand:  'bg-brand/10 text-brand',
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  }
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-start gap-4">
      <div className={`text-2xl w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value ?? '—'}</div>
        <div className="text-sm font-medium text-gray-600">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - today.getDay() + 1)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    const fmt = d => d.toISOString().split('T')[0]

    Promise.allSettled([
      api.get('/ops/staff'),
      api.get('/ops/stores-list'),
      api.get(`/ops/shifts?start=${fmt(monday)}&end=${fmt(sunday)}`),
      api.get('/ops/checklist'),
    ]).then(([staff, stores, shifts, checklist]) => {
      setStats({
        staffCount: staff.value?.data?.length ?? 0,
        storeCount: stores.value?.data?.length ?? 0,
        shiftCount: shifts.value?.data?.length ?? 0,
        pendingChecklist: checklist.value?.data?.filter(s => s.pct < 100).length ?? 0,
      })
      setLoading(false)
    })
  }, [])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
        <p className="text-gray-500 text-sm mt-1">
          欢迎回来，{user?.username}！今天是{new Date().toLocaleDateString('zh-CN', { year:'numeric', month:'long', day:'numeric', weekday:'long' })}
        </p>
      </div>

      {loading ? (
        <div className="text-gray-400">加载中...</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon="👥" label="员工总数" value={stats.staffCount} sub="已激活员工" color="brand" />
          <StatCard icon="📅" label="本周排班" value={stats.shiftCount} sub="本周全部班次" color="blue" />
          <StatCard icon="✅" label="待完成核查" value={stats.pendingChecklist} sub="入职文件未完成" color="orange" />
          <StatCard icon="🏪" label="门店数量" value={stats.storeCount} sub="运营中门店" color="green" />
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-700 mb-4">快捷操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: '👥', label: '查看员工', path: '/staff' },
            { icon: '📅', label: '创建排班', path: '/shifts' },
            { icon: '✅', label: '入职核查', path: '/checklist' },
            { icon: '📁', label: '员工档案', path: '/drive' },
          ].map(a => (
            <a key={a.path} href={`/admin${a.path}`}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-brand/30 hover:bg-brand/5 transition-colors cursor-pointer">
              <span className="text-2xl">{a.icon}</span>
              <span className="text-sm text-gray-600">{a.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
