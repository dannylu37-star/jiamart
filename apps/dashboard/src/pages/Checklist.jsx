import { useEffect, useState } from 'react'
import api from '../api'

const STATUS = {
  pending:   { label: '待提交', cls: 'bg-gray-100 text-gray-500' },
  submitted: { label: '已提交', cls: 'bg-blue-100 text-blue-600' },
  verified:  { label: '已核实', cls: 'bg-green-100 text-green-700' },
  rejected:  { label: '已拒绝', cls: 'bg-red-100 text-red-600' },
}

export default function Checklist() {
  const [summary, setSummary] = useState([])
  const [stores, setStores] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [detail, setDetail] = useState({})
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [filterStore, setFilterStore] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/ops/checklist').then(r => setSummary(r.data || []))
    api.get('/ops/stores-list').then(r => setStores(r.data || []))
  }, [])

  const loadDetail = async (staffId) => {
    if (detail[staffId]) return
    const r = await api.get(`/ops/checklist/${staffId}`)
    setDetail(prev => ({ ...prev, [staffId]: r.data || [] }))
  }

  const toggleRow = (staffId) => {
    if (expanded === staffId) { setExpanded(null); return }
    setExpanded(staffId)
    loadDetail(staffId)
  }

  const openEdit = (staffId, item) => {
    setEditing({ staffId, item: item.key })
    setEditForm({ status: item.status, notes: item.notes || '', docUrl: item.docUrl || '' })
  }

  const saveEdit = async () => {
    const { staffId, item } = editing
    await api.put(`/ops/checklist/${staffId}/${item}`, editForm)
    setDetail(prev => ({
      ...prev,
      [staffId]: (prev[staffId] || []).map(i => i.key === item ? { ...i, ...editForm } : i),
    }))
    setSummary(prev => prev.map(s => {
      if (s.staffId !== staffId) return s
      const newVerified = editForm.status === 'verified' ? s.verified + (editForm.status !== 'verified' ? 0 : 1) : s.verified
      return { ...s, pct: Math.min(100, s.pct) }
    }))
    setEditing(null)
  }

  const storeMap = Object.fromEntries(stores.map(s => [s.id, s.name]))

  const filtered = summary.filter(s => {
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase())
    const matchStore = !filterStore || String(s.storeId) === filterStore
    return matchSearch && matchStore
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">入职核查</h1>
        <span className="text-sm text-gray-400">{summary.filter(s => s.complete).length}/{summary.length} 已完成</span>
      </div>

      <div className="flex gap-3 mb-6">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="搜索员工..." className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand/30" />
        <select value={filterStore} onChange={e => setFilterStore(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
          <option value="">所有门店</option>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">姓名</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">门店</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">完成进度</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <>
                <tr key={s.staffId} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => toggleRow(s.staffId)}>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{storeMap[s.storeId] || '未分配'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="bg-brand rounded-full h-2 transition-all" style={{ width: `${s.pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-12">{s.verified}/{s.total}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-gray-400 text-xs">{expanded === s.staffId ? '▲' : '▼'}</span>
                  </td>
                </tr>
                {expanded === s.staffId && (
                  <tr key={`${s.staffId}-detail`}>
                    <td colSpan={4} className="px-4 pb-4 bg-gray-50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3">
                        {(detail[s.staffId] || []).map(item => (
                          <button key={item.key} onClick={() => openEdit(s.staffId, item)}
                            className="flex items-start gap-2 p-3 rounded-xl border bg-white hover:border-brand/30 text-left transition">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium mt-0.5 ${STATUS[item.status]?.cls || STATUS.pending.cls}`}>
                              {STATUS[item.status]?.label}
                            </span>
                            <div>
                              <div className="text-xs font-medium text-gray-700">{item.label}</div>
                              <div className="text-xs text-gray-400">{item.labelCn}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold mb-4">更新核查状态</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">状态</label>
                <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
                  {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">文件链接（可选）</label>
                <input value={editForm.docUrl} onChange={e => setEditForm(p => ({ ...p, docUrl: e.target.value }))}
                  placeholder="Google Drive 或其他链接..."
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">备注</label>
                <textarea value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2} className="w-full border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">取消</button>
              <button onClick={saveEdit} className="px-4 py-2 text-sm bg-brand text-white rounded-xl hover:bg-brand-dark">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
