import { useEffect, useState } from 'react'
import api from '../api'

// ─── 入职核查 ──────────────────────────────────────────────────────────────
const CKSTATUS = {
  pending:   { label: '待提交', cls: 'bg-gray-100 text-gray-500' },
  submitted: { label: '已提交', cls: 'bg-blue-100 text-blue-600' },
  verified:  { label: '已核实', cls: 'bg-green-100 text-green-700' },
  rejected:  { label: '已拒绝', cls: 'bg-red-100 text-red-600' },
}

function ChecklistTab() {
  const [summary, setSummary] = useState([])
  const [stores, setStores] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [detail, setDetail] = useState({})
  const [filterStore, setFilterStore] = useState('')
  const [search, setSearch] = useState('')
  const [editingItem, setEditingItem] = useState(null) // {item, staffId}
  const [editItemForm, setEditItemForm] = useState({})
  const [savingItem, setSavingItem] = useState(false)

  useEffect(() => {
    api.get('/ops/checklist').then(r => setSummary(r.data || [])).catch(() => {})
    api.get('/ops/stores-list').then(r => setStores(r.data || [])).catch(() => {})
  }, [])

  const loadDetail = async (staffId, force = false) => {
    if (detail[staffId] && !force) return
    api.get(`/ops/checklist/${staffId}`).then(r =>
      setDetail(prev => ({ ...prev, [staffId]: r.data || [] }))
    ).catch(() => {})
  }

  const openEditItem = (item, staffId) => {
    setEditingItem({ item, staffId })
    setEditItemForm({ status: item.status, docUrl: item.docUrl || '', notes: item.notes || '' })
  }

  const saveItem = async () => {
    setSavingItem(true)
    try {
      await api.put(`/ops/checklist/item/${editingItem.item.id}`, editItemForm)
      await loadDetail(editingItem.staffId, true)
      setEditingItem(null)
    } catch (e) {}
    setSavingItem(false)
  }

  const toggle = (id) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id); loadDetail(id)
  }

  const filtered = summary.filter(s => {
    const matchStore = !filterStore || String(s.storeId) === filterStore
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase())
    return matchStore && matchSearch
  })

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="搜索员工..." className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-brand/30" />
        <select value={filterStore} onChange={e => setFilterStore(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
          <option value="">所有门店</option>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['姓名','门店','总项','完成','进度',''].map(h =>
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(s => {
              const done = s.verified ?? 0
              const total = s.total ?? 0
              const pct = total ? Math.round(done / total * 100) : 0
              return (
                <>
                  <tr key={s.staffId} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => toggle(s.staffId)}>
                    <td className="px-4 py-3 font-medium">{s.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{s.storeName || '未分配'}</td>
                    <td className="px-4 py-3 text-gray-500">{total}</td>
                    <td className="px-4 py-3 text-gray-500">{done}</td>
                    <td className="px-4 py-3 w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="bg-brand h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 w-8">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{expanded === s.staffId ? '▲' : '▼'}</td>
                  </tr>
                  {expanded === s.staffId && (
                    <tr key={`${s.staffId}-detail`}>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        {!detail[s.staffId] ? (
                          <div className="text-gray-400 text-sm">加载中...</div>
                        ) : detail[s.staffId].length === 0 ? (
                          <div className="text-gray-400 text-sm">暂无核查项</div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {detail[s.staffId].map(item => {
                              const st = CKSTATUS[item.status] || CKSTATUS.pending
                              return (
                                <div key={item.id} className="bg-white rounded-lg px-3 py-2 border border-gray-100 text-sm">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className={`px-2 py-0.5 rounded-full text-xs flex-shrink-0 ${st.cls}`}>{st.label}</span>
                                      <span className="text-gray-700 truncate">{item.itemName}</span>
                                    </div>
                                    <button onClick={() => openEditItem(item, s.staffId)}
                                      className="text-xs text-brand hover:underline flex-shrink-0">编辑</button>
                                  </div>
                                  {item.docUrl && (
                                    <a href={item.docUrl} target="_blank" rel="noreferrer"
                                      className="text-xs text-brand hover:underline mt-1 block truncate">📎 {item.docUrl}</a>
                                  )}
                                  {item.notes && <div className="text-xs text-gray-400 mt-0.5">{item.notes}</div>}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center text-gray-400 py-12">暂无数据</div>}
      </div>

      {/* 编辑核查项 Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-gray-900 mb-4">编辑核查项：{editingItem.item.itemName}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">状态</label>
                <select value={editItemForm.status} onChange={e => setEditItemForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
                  <option value="pending">待提交</option>
                  <option value="submitted">已提交</option>
                  <option value="verified">已核实 ✅</option>
                  <option value="rejected">已拒绝 ❌</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">文件链接（Google Drive / URL）</label>
                <input value={editItemForm.docUrl} onChange={e => setEditItemForm(p => ({ ...p, docUrl: e.target.value }))}
                  placeholder="https://drive.google.com/..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                {editItemForm.docUrl && (
                  <a href={editItemForm.docUrl} target="_blank" rel="noreferrer"
                    className="text-xs text-brand hover:underline mt-1 block">↗ 预览链接</a>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">备注</label>
                <textarea value={editItemForm.notes} onChange={e => setEditItemForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2} placeholder="可选"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditingItem(null)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm hover:bg-gray-50">取消</button>
              <button onClick={saveItem} disabled={savingItem}
                className="flex-1 bg-brand text-white rounded-xl py-2.5 text-sm hover:bg-brand-dark disabled:opacity-60">
                {savingItem ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 档案文件 ──────────────────────────────────────────────────────────────
function DriveTab() {
  const [staff, setStaff] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/ops/staff').then(r => setStaff((r.data || []).filter(s => s.driveFolderUrl))).catch(() => {})
  }, [])

  const filtered = staff.filter(s => !search || s.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="搜索员工..." className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-56 mb-6 focus:outline-none focus:ring-2 focus:ring-brand/30" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {filtered.map(s => (
          <a key={s.id} href={s.driveFolderUrl} target="_blank" rel="noreferrer"
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-brand/30 hover:shadow-md transition group">
            <div className="text-3xl mb-2">📁</div>
            <div className="font-medium text-sm text-gray-800 truncate">{s.name}</div>
            <div className="text-xs text-brand mt-1 group-hover:underline">打开 Drive →</div>
          </a>
        ))}
        {filtered.length === 0 && <div className="col-span-5 text-gray-400 text-center py-12">暂无档案文件夹</div>}
      </div>
    </div>
  )
}

// ─── 主页面 ────────────────────────────────────────────────────────────────
export default function Records() {
  const [tab, setTab] = useState('checklist')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">员工档案</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {[['checklist','✅ 入职核查'],['drive','📁 档案文件']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'checklist' ? <ChecklistTab /> : <DriveTab />}
    </div>
  )
}
