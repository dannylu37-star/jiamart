import { useEffect, useState, useCallback } from 'react'
import api from '../api'

const STATUS_BADGE = {
  normal: 'bg-green-100 text-green-700',
  late:   'bg-yellow-100 text-yellow-700',
  absent: 'bg-red-100 text-red-600',
  early:  'bg-blue-100 text-blue-600',
}
const STATUS_LABEL = { normal: '正常', late: '迟到', absent: '缺勤', early: '早退' }

export default function Attendance() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [staffId, setStaffId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [records, setRecords] = useState([])
  const [staff, setStaff] = useState([])
  const [stores, setStores] = useState([])
  const [storeFilter, setStoreFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/ops/staff?status=active').then(r => setStaff(r.data || [])).catch(() => {})
    api.get('/ops/stores-list').then(r => setStores(r.data || [])).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (date) params.set('date', date)
      if (staffId) params.set('staffId', staffId)
      const r = await api.get('/ops/attendance?' + params)
      setRecords(r.data || [])
    } catch (e) {}
    setLoading(false)
  }, [date, staffId])

  useEffect(() => { load() }, [load])

  const duration = (r) => {
    if (r.workedMinutes) {
      const h = Math.floor(r.workedMinutes / 60)
      const m = r.workedMinutes % 60
      return h > 0 ? `${h}h ${m}m` : `${m}m`
    }
    if (!r.clockIn || !r.clockOut) return '—'
    const diff = Math.round((new Date(r.clockOut) - new Date(r.clockIn)) / 60000)
    const h = Math.floor(diff / 60); const m = diff % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const fmt = dt => dt ? new Date(dt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '—'

  // Client-side filter by store / status / name search
  const filtered = records.filter(r => {
    const name = r.staffName || r.staff?.name || ''
    const storeName = r.storeName || r.staff?.storeName || ''
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase())
    const matchStore = !storeFilter || storeName.includes(stores.find(s => s.id === +storeFilter)?.name || '__')
    const matchStatus = !statusFilter || r.status === statusFilter
    return matchSearch && matchStore && matchStatus
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">考勤记录</h1>
        <span className="text-sm text-gray-400">{filtered.length} 条记录</span>
      </div>

      {/* 筛选 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">日期</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">员工</label>
          <select value={staffId} onChange={e => setStaffId(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 w-44">
            <option value="">全部员工</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">门店</label>
          <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
            <option value="">所有门店</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">状态</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
            <option value="">全部状态</option>
            <option value="normal">正常</option>
            <option value="late">迟到</option>
            <option value="absent">缺勤</option>
            <option value="early">早退</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">搜索</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="员工姓名..."
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-brand/30" />
        </div>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['员工姓名','门店','日期','上班','下班','时长','状态'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">加载中...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">暂无考勤记录</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{r.staffName || r.staff?.name || `员工 #${r.staffId}`}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{r.storeName || r.staff?.storeName || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{r.clockIn ? new Date(r.clockIn).toLocaleDateString('zh-CN') : '—'}</td>
                <td className="px-4 py-3 text-gray-600">{fmt(r.clockIn)}</td>
                <td className="px-4 py-3 text-gray-600">{fmt(r.clockOut)}</td>
                <td className="px-4 py-3 font-medium">{duration(r)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_BADGE[r.status] || 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABEL[r.status] || r.status || '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
