import { useEffect, useState, useCallback } from 'react'
import api from '../api'

const LINES = [
  { value: 'all', label: '全部业务' },
  { value: 'Grocery', label: '超市 Grocery' },
  { value: 'MilkTea', label: '奶茶 MilkTea' },
  { value: 'Ramen', label: '拉面 Ramen' },
]

const STATUS_OPTS = [
  { value: 'all', label: '全部状态' },
  { value: 'on', label: '在售' },
  { value: 'off', label: '下架' },
]

function PicCell({ url }) {
  if (!url) return <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-lg">🛒</div>
  const src = url.startsWith('http') ? url : `https://jiamart.co.uk${url}`
  return <img src={src} alt="" className="w-10 h-10 object-cover rounded-lg bg-gray-100" onError={e => { e.target.style.display='none' }} />
}

export default function Goods() {
  const [goods, setGoods] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [line, setLine] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 100 })
      if (query) params.set('search', query)
      if (line !== 'all') params.set('businessLine', line)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const r = await api.get('/goods?' + params)
      const [list, count] = Array.isArray(r.data) ? r.data : [r.data || [], 0]
      setGoods(list)
      setTotal(count)
    } catch (e) {}
    setLoading(false)
  }, [page, query, line, statusFilter])

  useEffect(() => { load() }, [load])

  const handleSearch = e => { e.preventDefault(); setQuery(search); setPage(1) }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">商品管理</h1>
        <span className="text-sm text-gray-400">共 {total} 件商品</span>
      </div>

      {/* 筛选 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">业务线</label>
          <select value={line} onChange={e => { setLine(e.target.value); setPage(1) }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
            {LINES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">状态</label>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
            {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">关键词</label>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="商品名/SKU..."
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-brand/30" />
          </div>
          <div className="flex gap-2 items-end">
            <button type="submit" className="px-4 py-2 rounded-xl bg-brand text-white text-sm hover:bg-brand-dark transition-colors">查询</button>
            {query && <button type="button" onClick={() => { setSearch(''); setQuery(''); setPage(1) }}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">清除</button>}
          </div>
        </form>
      </div>

      {/* 商品表格 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['商品','分类','售价','库存/销量','状态'].map(h =>
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">加载中...</td></tr>
            ) : goods.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">无匹配商品</td></tr>
            ) : goods.map(g => (
              <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <PicCell url={g.picurl} />
                    <div>
                      <div className="font-semibold text-gray-800">{g.name || '—'}</div>
                      {g.enName && <div className="text-xs text-gray-400">{g.enName}</div>}
                      {g.hideCode && <div className="text-xs text-gray-300 font-mono">{g.hideCode}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{g.category?.name || '—'}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">£{parseFloat(g.sellPrice || 0).toFixed(2)}</div>
                  {g.costPrice > 0 && <div className="text-xs text-gray-400">成本 £{parseFloat(g.costPrice || 0).toFixed(2)}</div>}
                </td>
                <td className="px-4 py-3 text-gray-600">{g.stock ?? '—'} / {g.sales ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${g.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {g.status ? '在售' : '下架'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > 100 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>共 {total} 条，第 {page} 页</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">上一页</button>
              <button disabled={page * 100 >= total} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">下一页</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
