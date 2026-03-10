import { useEffect, useState } from 'react'
import api from '../api'

const EMPTY_FORM = { name: '', address: '', mobile: '', status: true }

export default function Stores() {
  const [stores, setStores] = useState([])
  const [staff, setStaff] = useState([])
  const [modal, setModal] = useState(null) // null | 'create' | store-object
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = async () => {
    const [sr, stf] = await Promise.all([
      api.get('/stores').catch(() => ({ data: [] })),
      api.get('/ops/staff?status=all').catch(() => ({ data: [] })),
    ])
    setStores(sr.data || [])
    setStaff(stf.data || [])
  }

  useEffect(() => { load() }, [])

  const staffCount = id => staff.filter(s => s.storeId === id).length

  const openCreate = () => { setForm(EMPTY_FORM); setError(''); setModal('create') }
  const openEdit = s => { setForm({ name: s.name || '', address: s.address || '', mobile: s.mobile || '', status: s.status ?? true }); setError(''); setModal(s) }
  const closeModal = () => { setModal(null); setError('') }

  const save = async () => {
    if (!form.name.trim()) { setError('门店名称不能为空'); return }
    setSaving(true)
    try {
      if (modal === 'create') {
        await api.post('/stores', form)
      } else {
        await api.put(`/stores/${modal.id}`, form)
      }
      await load()
      closeModal()
    } catch (e) {
      setError(e?.message || '保存失败')
    } finally { setSaving(false) }
  }

  const doDelete = async (store) => {
    try {
      await api.delete(`/stores/${store.id}`)
      await load()
      setConfirmDelete(null)
    } catch (e) {}
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">门店管理</h1>
        <button onClick={openCreate}
          className="bg-brand text-white px-4 py-2 rounded-xl text-sm hover:bg-brand-dark transition-colors flex items-center gap-2">
          <span>＋</span> 新增门店
        </button>
      </div>

      {/* 门店卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map(s => (
          <div key={s.id} className={`bg-white rounded-2xl border shadow-sm p-6 transition-all ${s.status ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="text-2xl">🏪</div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {s.status ? '营业中' : '暂停'}
                </span>
                <button onClick={() => openEdit(s)}
                  className="text-xs text-brand hover:underline">编辑</button>
                <button onClick={() => setConfirmDelete(s)}
                  className="text-xs text-red-400 hover:underline">撤销</button>
              </div>
            </div>
            <div className="font-semibold text-gray-900 mb-1">{s.name}</div>
            {s.address && <div className="text-sm text-gray-500 mb-2">{s.address}</div>}
            {s.mobile && <div className="text-sm text-gray-400 mb-2">📞 {s.mobile}</div>}
            <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t border-gray-50">
              <span>👥</span><span>{staffCount(s.id)} 名员工</span>
            </div>
          </div>
        ))}
      </div>

      {/* 编辑/新增 Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              {modal === 'create' ? '新增门店' : `编辑：${modal.name}`}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">门店名称 *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Jiamart ..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
                <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="123 Example Street, London"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                <input value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                  placeholder="+44 ..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">状态</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.checked }))}
                    className="w-4 h-4 accent-brand" />
                  <span className="text-sm text-gray-600">{form.status ? '营业中' : '暂停'}</span>
                </label>
              </div>
              {error && <div className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</div>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={closeModal}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">取消</button>
              <button onClick={save} disabled={saving}
                className="flex-1 bg-brand text-white rounded-xl py-2.5 text-sm hover:bg-brand-dark transition-colors disabled:opacity-60">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 确认撤销 */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="text-3xl mb-3">⚠️</div>
            <h3 className="font-bold text-gray-900 mb-2">确认撤销？</h3>
            <p className="text-sm text-gray-500 mb-6">将关闭 <b>{confirmDelete.name}</b>，员工数据不会删除。</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm hover:bg-gray-50">取消</button>
              <button onClick={() => doDelete(confirmDelete)}
                className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm hover:bg-red-600">确认撤销</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
