import { useEffect, useState } from 'react'
import api from '../api'

export default function Vendors() {
  const [vendors, setVendors] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)  // 当前查看的供应商
  const [tab, setTab] = useState('products')       // products | forms
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(false)

  // 表单
  const [vendorForm, setVendorForm] = useState({ name: '', contact_name: '', contact_email: '', contact_phone: '', payment_terms: '', notes: '' })
  const [productForm, setProductForm] = useState({ product_name: '', unit: '', unit_price: '', shelf_life_days: '', lead_time_days: '' })
  const [savingProduct, setSavingProduct] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(null) // form id being parsed

  useEffect(() => { loadVendors() }, [page])

  const loadVendors = () => {
    setLoading(true)
    api.get(`/vendors?page=${page}&limit=20`)
      .then(r => { setVendors(r.data?.data || []); setTotal(r.data?.total || 0) })
      .finally(() => setLoading(false))
  }

  const loadVendor = id => {
    api.get(`/vendors/${id}`).then(r => setSelected(r.data))
  }

  const createVendor = async () => {
    await api.post('/vendors', vendorForm)
    setShowCreate(false)
    setVendorForm({ name: '', contact_name: '', contact_email: '', contact_phone: '', payment_terms: '', notes: '' })
    loadVendors()
  }

  const addProduct = async () => {
    if (!selected) return
    setSavingProduct(true)
    await api.post(`/vendors/${selected.id}/products`, {
      ...productForm,
      unit_price: parseFloat(productForm.unit_price) || 0,
      shelf_life_days: parseInt(productForm.shelf_life_days) || null,
      lead_time_days: parseInt(productForm.lead_time_days) || null,
    }).finally(() => setSavingProduct(false))
    setProductForm({ product_name: '', unit: '', unit_price: '', shelf_life_days: '', lead_time_days: '' })
    loadVendor(selected.id)
  }

  const uploadForm = async () => {
    if (!uploadFile || !selected) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', uploadFile)
    await api.post(`/vendors/${selected.id}/forms/upload`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).finally(() => setUploading(false))
    setUploadFile(null)
    loadVendor(selected.id)
  }

  const parseForm = async formId => {
    setParsing(formId)
    await api.post(`/vendors/forms/${formId}/parse`).finally(() => setParsing(null))
    loadVendor(selected.id)
  }

  const approveForm = async formId => {
    await api.post(`/vendors/forms/${formId}/approve`)
    loadVendor(selected.id)
  }

  const statusBadge = status => {
    const map = {
      pending: 'bg-yellow-100 text-yellow-700',
      parsed: 'bg-blue-100 text-blue-700',
      reviewed: 'bg-green-100 text-green-700',
      error: 'bg-red-100 text-red-700',
    }
    return <span className={`text-xs px-2 py-0.5 rounded-full ${map[status] || ''}`}>{status}</span>
  }

  return (
    <div className="p-6 flex gap-6 h-full">
      {/* 左侧列表 */}
      <div className="w-72 flex-shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">供应商</h2>
          <button onClick={() => setShowCreate(true)}
            className="text-sm bg-orange-500 text-white px-3 py-1.5 rounded-lg">
            + 新增
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />)}</div>
        ) : vendors.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">暂无供应商</p>
        ) : (
          <div className="space-y-2">
            {vendors.map(v => (
              <div key={v.id}
                onClick={() => { loadVendor(v.id); setTab('products') }}
                className={`p-3 rounded-xl border cursor-pointer transition-colors ${selected?.id === v.id ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
              >
                <div className="font-medium text-gray-900 text-sm">{v.name}</div>
                {v.contact_name && <div className="text-xs text-gray-400 mt-0.5">{v.contact_name}</div>}
                {v.payment_terms && <div className="text-xs text-gray-400 truncate">{v.payment_terms}</div>}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 text-xs text-gray-400 items-center">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 border rounded disabled:opacity-40">‹</button>
          <span>共 {total} 家</span>
          <button disabled={vendors.length < 20} onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded disabled:opacity-40">›</button>
        </div>
      </div>

      {/* 右侧详情 */}
      <div className="flex-1 min-w-0">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center"><div className="text-4xl mb-2">🏭</div><p className="text-sm">选择一家供应商查看详情</p></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 供应商信息头 */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-xl font-bold text-gray-900">{selected.name}</h3>
              <div className="grid grid-cols-3 gap-3 mt-3 text-sm text-gray-600">
                {selected.contact_name && <div><span className="text-gray-400">联系人</span><br />{selected.contact_name}</div>}
                {selected.contact_email && <div><span className="text-gray-400">邮箱</span><br />{selected.contact_email}</div>}
                {selected.contact_phone && <div><span className="text-gray-400">电话</span><br />{selected.contact_phone}</div>}
                {selected.payment_terms && <div><span className="text-gray-400">账期</span><br />{selected.payment_terms}</div>}
              </div>
              {selected.notes && <p className="text-sm text-gray-500 mt-2 border-t pt-2">{selected.notes}</p>}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b">
              {['products', 'forms'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`pb-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500'}`}>
                  {t === 'products' ? `商品列表 (${selected.products?.length || 0})` : `表单历史 (${selected.forms?.length || 0})`}
                </button>
              ))}
            </div>

            {/* 商品列表 */}
            {tab === 'products' && (
              <div className="space-y-3">
                {/* 新增商品 */}
                <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-6 gap-2 items-end">
                  <input value={productForm.product_name} onChange={e => setProductForm(f => ({...f, product_name: e.target.value}))}
                    placeholder="商品名" className="col-span-2 border rounded px-2 py-1.5 text-sm" />
                  <input value={productForm.unit} onChange={e => setProductForm(f => ({...f, unit: e.target.value}))}
                    placeholder="单位" className="border rounded px-2 py-1.5 text-sm" />
                  <input value={productForm.unit_price} onChange={e => setProductForm(f => ({...f, unit_price: e.target.value}))}
                    placeholder="单价 £" type="number" className="border rounded px-2 py-1.5 text-sm" />
                  <input value={productForm.lead_time_days} onChange={e => setProductForm(f => ({...f, lead_time_days: e.target.value}))}
                    placeholder="配送天" type="number" className="border rounded px-2 py-1.5 text-sm" />
                  <button onClick={addProduct} disabled={savingProduct || !productForm.product_name}
                    className="bg-orange-500 text-white rounded px-3 py-1.5 text-sm disabled:opacity-50">
                    {savingProduct ? '...' : '添加'}
                  </button>
                </div>

                {/* 商品表 */}
                {!selected.products?.length ? (
                  <p className="text-sm text-gray-400 py-6 text-center">暂无商品，可手动添加或通过表单导入</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 border-b">
                      <th className="text-left px-3 py-2 text-gray-500 font-medium">商品名</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium">SKU</th>
                      <th className="text-right px-3 py-2 text-gray-500 font-medium">单价</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium">单位</th>
                      <th className="text-right px-3 py-2 text-gray-500 font-medium">保质期</th>
                      <th className="text-right px-3 py-2 text-gray-500 font-medium">配送天</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {selected.products.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-900">{p.product_name}</td>
                          <td className="px-3 py-2 text-gray-500">{p.sku_code || '—'}</td>
                          <td className="px-3 py-2 text-right font-medium">£{parseFloat(p.unit_price).toFixed(2)}</td>
                          <td className="px-3 py-2 text-gray-500">{p.unit}</td>
                          <td className="px-3 py-2 text-right text-gray-500">{p.shelf_life_days ? `${p.shelf_life_days}天` : '—'}</td>
                          <td className="px-3 py-2 text-right text-gray-500">{p.lead_time_days ?? 3}天</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* 表单历史 */}
            {tab === 'forms' && (
              <div className="space-y-3">
                {/* 上传 */}
                <div className="flex gap-3 items-center bg-gray-50 rounded-xl p-3">
                  <input type="file" accept=".xlsx,.xls,.pdf"
                    onChange={e => setUploadFile(e.target.files[0])}
                    className="text-sm text-gray-600 flex-1" />
                  <button onClick={uploadForm} disabled={!uploadFile || uploading}
                    className="bg-orange-500 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50">
                    {uploading ? '上传中...' : '上传表单'}
                  </button>
                </div>

                {!selected.forms?.length ? (
                  <p className="text-sm text-gray-400 py-6 text-center">暂无表单记录</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 border-b">
                      <th className="text-left px-3 py-2 text-gray-500 font-medium">文件名</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium">状态</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium">解析结果</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium">上传时间</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium">操作</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {selected.forms.map(f => (
                        <tr key={f.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-900 max-w-xs truncate">{f.original_filename}</td>
                          <td className="px-3 py-2">{statusBadge(f.status)}</td>
                          <td className="px-3 py-2 text-gray-500">
                            {f.parsed_data ? `${f.parsed_data.length} 条商品` : '—'}
                          </td>
                          <td className="px-3 py-2 text-gray-400">{new Date(f.uploaded_at).toLocaleDateString()}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              {f.status === 'pending' && (
                                <button onClick={() => parseForm(f.id)} disabled={parsing === f.id}
                                  className="px-2 py-1 bg-blue-500 text-white rounded text-xs">
                                  {parsing === f.id ? '解析中...' : '解析'}
                                </button>
                              )}
                              {f.status === 'parsed' && (
                                <button onClick={() => approveForm(f.id)}
                                  className="px-2 py-1 bg-green-500 text-white rounded text-xs">
                                  导入商品
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 新增供应商弹窗 */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl p-6 w-96 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">新增供应商</h3>
            {[
              ['name', '供应商名称 *'],
              ['contact_name', '联系人'],
              ['contact_email', '邮箱'],
              ['contact_phone', '电话'],
              ['payment_terms', '账期（如：月结30天）'],
            ].map(([field, label]) => (
              <div key={field}>
                <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                <input value={vendorForm[field]} onChange={e => setVendorForm(f => ({...f, [field]: e.target.value}))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">备注</label>
              <textarea value={vendorForm.notes} onChange={e => setVendorForm(f => ({...f, notes: e.target.value}))}
                rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-500 border rounded-lg">取消</button>
              <button onClick={createVendor} disabled={!vendorForm.name}
                className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg disabled:opacity-50">创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
