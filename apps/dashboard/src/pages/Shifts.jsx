import { useEffect, useState } from 'react'
import api from '../api'

function getMondayOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff); d.setHours(0,0,0,0)
  return d
}

const DAYS_CN = ['周一','周二','周三','周四','周五','周六','周日']

export default function Shifts() {
  const [weekStart, setWeekStart] = useState(getMondayOfWeek(new Date()))
  const [shifts, setShifts] = useState([])
  const [staff, setStaff] = useState([])
  const [stores, setStores] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ staffId: '', storeId: '', date: '', startTime: '09:00', endTime: '17:00', notes: '' })
  const [saving, setSaving] = useState(false)

  const fmt = d => d.toISOString().split('T')[0]
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6)

  const loadShifts = () => {
    api.get(`/ops/shifts?start=${fmt(weekStart)}&end=${fmt(weekEnd)}`).then(r => setShifts(r.data || []))
  }

  useEffect(() => {
    api.get('/ops/staff').then(r => setStaff(r.data || []))
    api.get('/ops/stores-list').then(r => setStores(r.data || []))
  }, [])

  useEffect(() => { loadShifts() }, [weekStart])

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i)
    return d
  })

  const shiftsForDay = (date) => {
    const dateStr = fmt(date)
    return shifts.filter(s => s.startTime?.startsWith(dateStr) || s.date === dateStr)
  }

  const staffMap = Object.fromEntries(staff.map(s => [s.id, s.name]))
  const storeMap = Object.fromEntries(stores.map(s => [s.id, s.name]))
  const STORE_COLORS = ['bg-blue-100 text-blue-700','bg-purple-100 text-purple-700','bg-green-100 text-green-700','bg-orange-100 text-orange-700','bg-pink-100 text-pink-700']

  const createShift = async () => {
    setSaving(true)
    try {
      const start = new Date(`${form.date}T${form.startTime}`)
      const end = new Date(`${form.date}T${form.endTime}`)
      await api.post('/ops/shifts', {
        staffId: +form.staffId, storeId: +form.storeId,
        startTime: start.toISOString(), endTime: end.toISOString(), notes: form.notes
      })
      setShowCreate(false)
      loadShifts()
    } finally { setSaving(false) }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">排班管理</h1>
        <button onClick={() => setShowCreate(true)} className="bg-brand text-white text-sm px-4 py-2 rounded-xl hover:bg-brand-dark">
          + 新建排班
        </button>
      </div>

      {/* Week nav */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(d.getDate()-7); return n })}
          className="p-2 rounded-xl border hover:bg-gray-50">◀</button>
        <span className="font-medium text-gray-700">
          {weekStart.toLocaleDateString('zh-CN', { month:'long', day:'numeric' })} —{' '}
          {weekEnd.toLocaleDateString('zh-CN', { month:'long', day:'numeric' })}
        </span>
        <button onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(d.getDate()+7); return n })}
          className="p-2 rounded-xl border hover:bg-gray-50">▶</button>
        <button onClick={() => setWeekStart(getMondayOfWeek(new Date()))}
          className="text-sm text-brand hover:underline ml-2">本周</button>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {days.map((d, i) => (
            <div key={i} className="px-3 py-3 text-center border-r last:border-r-0">
              <div className="text-xs font-semibold text-gray-500 uppercase">{DAYS_CN[i]}</div>
              <div className={`text-lg font-bold mt-0.5 ${fmt(d) === fmt(new Date()) ? 'text-brand' : 'text-gray-800'}`}>
                {d.getDate()}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 min-h-48">
          {days.map((d, i) => {
            const dayShifts = shiftsForDay(d)
            return (
              <div key={i} className="border-r last:border-r-0 p-2 space-y-1">
                {dayShifts.map((s, j) => (
                  <div key={s.id} className={`text-xs p-1.5 rounded-lg ${STORE_COLORS[s.storeId % STORE_COLORS.length]}`}>
                    <div className="font-medium truncate">{staffMap[s.staffId] || '—'}</div>
                    <div className="opacity-70">{s.startTime?.substring(11,16)}–{s.endTime?.substring(11,16)}</div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold mb-4">创建排班</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">员工</label>
                <select value={form.staffId} onChange={e => setForm(p => ({...p, staffId: e.target.value}))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
                  <option value="">选择员工</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">门店</label>
                <select value={form.storeId} onChange={e => setForm(p => ({...p, storeId: e.target.value}))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
                  <option value="">选择门店</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-xs text-gray-500 mb-1 block">日期</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))}
                    className="w-full border rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">开始</label>
                  <input type="time" value={form.startTime} onChange={e => setForm(p => ({...p, startTime: e.target.value}))}
                    className="w-full border rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">结束</label>
                  <input type="time" value={form.endTime} onChange={e => setForm(p => ({...p, endTime: e.target.value}))}
                    className="w-full border rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">备注（可选）</label>
                <input value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">取消</button>
              <button onClick={createShift} disabled={saving || !form.staffId || !form.date}
                className="px-4 py-2 text-sm bg-brand text-white rounded-xl hover:bg-brand-dark disabled:opacity-60">
                {saving ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
