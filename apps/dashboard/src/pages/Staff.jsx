import { useEffect, useState } from 'react'
import api from '../api'

const STATUS_BADGE = {
  active:   'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  default:  'bg-yellow-100 text-yellow-700',
}
const ROLE_BADGE = {
  admin:      'bg-red-100 text-red-700',
  superadmin: 'bg-purple-100 text-purple-700',
  manager:    'bg-blue-100 text-blue-700',
  employee:   'bg-gray-100 text-gray-600',
}

export default function Staff() {
  const [staff, setStaff] = useState([])
  const [stores, setStores] = useState([])
  const [roles, setRoles] = useState([])
  const [search, setSearch] = useState('')
  const [filterStore, setFilterStore] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('active')
  const [selected, setSelected] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/ops/staff?status=all').then(r => setStaff(r.data || []))
    api.get('/ops/stores-list').then(r => setStores(r.data || []))
    api.get('/ops/roles').then(r => setRoles(r.data || r || []))
  }, [])

  const filtered = staff.filter(s => {
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase())
    const matchStore = !filterStore || String(s.storeId) === filterStore
    const matchRole = !filterRole || s.role === filterRole
    const matchStatus = !filterStatus || filterStatus === 'all' || s.status === filterStatus
    return matchSearch && matchStore && matchRole && matchStatus
  })

  const openDetail = s => { setSelected(s); setEditForm({ name: s.name || '', email: s.email || '', mobile: s.mobile || '', status: s.status || 'active', role: s.role, storeId: s.storeId }) }

  const saveEdit = async () => {
    setSaving(true)
    try {
      await api.put(`/ops/staff/${selected.id}`, editForm)
      setStaff(prev => prev.map(s => s.id === selected.id ? { ...s, ...editForm } : s))
      setSelected(null)
    } finally { setSaving(false) }
  }

  const storeMap = Object.fromEntries(stores.map(s => [s.id, s.name]))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">员工管理</h1>
        <span className="text-sm text-gray-400">{filtered.length} / {staff.length} 人</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="搜索姓名或邮箱..."
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        <select value={filterStore} onChange={e => setFilterStore(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
          <option value="">所有门店</option>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
          <option value="">所有角色</option>
          {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
          <option value="active">在职</option>
          <option value="inactive">离职</option>
          <option value="all">全部</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['姓名','门店','职位','角色','邮箱','状态',''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium">{s.name || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{storeMap[s.storeId] || '未分配'}</td>
                <td className="px-4 py-3 text-gray-500">{s.position || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[s.role] || ROLE_BADGE.employee}`}>
                    {roles.find(r => r.value === s.role)?.label || s.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{s.email || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_BADGE[s.status] || STATUS_BADGE.default}`}>
                    {s.status === 'active' ? '在职' : s.status === 'inactive' ? '离职' : s.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => openDetail(s)} className="text-brand text-xs hover:underline">详情</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center text-gray-400 py-12">无匹配结果</div>}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="space-y-3 text-sm">
              {/* 基本信息 — 可编辑 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">姓名</label>
                  <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">状态</label>
                  <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
                    <option value="active">在职</option>
                    <option value="inactive">离职</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">邮箱</label>
                  <input value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">手机</label>
                  <input value={editForm.mobile} onChange={e => setEditForm(p => ({ ...p, mobile: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">角色</label>
                  <select value={editForm.role || ''} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
                    {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">门店</label>
                  <select value={editForm.storeId || ''} onChange={e => setEditForm(p => ({ ...p, storeId: +e.target.value || null }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
                    <option value="">未分配</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="text-xs text-gray-400 flex gap-4">
                {selected.hireDate && <span>入职：{selected.hireDate}</span>}
                {selected.deputyId && <span>Deputy ID：{selected.deputyId}</span>}
              </div>
              {selected.driveFolderUrl && (
                <a href={selected.driveFolderUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-brand hover:underline text-sm">
                  📁 打开 Drive 文件夹
                </a>
              )}
              <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                <button onClick={() => setSelected(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">取消</button>
                <button onClick={saveEdit} disabled={saving} className="px-4 py-2 text-sm bg-brand text-white rounded-xl hover:bg-brand-dark disabled:opacity-60">
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
