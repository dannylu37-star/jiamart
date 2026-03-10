import { useEffect, useState, useCallback } from 'react'
import api from '../api'

const STORES = [
  { id: '', name: '全部门店' },
]

export default function Sales() {
  const [stores, setStores] = useState([{ id: '', name: '全部门店' }])
  const [storeFilter, setStoreFilter] = useState('')
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10)
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [totals, setTotals] = useState({})
  const [payBreakdown, setPayBreakdown] = useState([])
  const [dailyTrend, setDailyTrend] = useState([])
  const [topGoods, setTopGoods] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/ops/stores-list').then(r => {
      setStores([{ id: '', name: '全部门店' }, ...(r.data || [])])
    }).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      const r = await api.get('/orders/summary?' + params)
      const d = r.data || r
      setTotals(d.totals || {})
      setPayBreakdown(d.payBreakdown || [])
      setDailyTrend(d.dailyTrend || [])
    } catch (e) {}
    // top goods by sales
    try {
      const gr = await api.get('/goods?limit=10&status=on')
      const list = (gr.data?.[0] || gr.data || []).sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 10)
      setTopGoods(list)
    } catch (e) {}
    setLoading(false)
  }, [dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  const setPreset = (preset) => {
    const today = new Date()
    const fmt = d => d.toISOString().slice(0, 10)
    if (preset === 'today') { setDateFrom(fmt(today)); setDateTo(fmt(today)) }
    else if (preset === 'week') {
      const mon = new Date(today); mon.setDate(today.getDate() - today.getDay() + 1)
      setDateFrom(fmt(mon)); setDateTo(fmt(today))
    } else if (preset === 'month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1)
      setDateFrom(fmt(first)); setDateTo(fmt(today))
    }
  }

  const revenue = parseFloat(totals.totalRevenue || 0)
  const orderCount = parseInt(totals.orderCount || 0)
  const avgOrder = parseFloat(totals.avgOrder || 0)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">营业额统计</h1>
        {loading && <span className="text-sm text-gray-400">加载中...</span>}
      </div>

      {/* 筛选条 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">门店</label>
          <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">日期范围</label>
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            <span className="text-gray-400">至</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
          </div>
        </div>
        <div className="flex gap-2">
          {[['今日','today'],['本周','week'],['本月','month']].map(([l, v]) => (
            <button key={v} onClick={() => setPreset(v)}
              className="px-3 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50 transition-colors">{l}</button>
          ))}
          <button onClick={load}
            className="px-4 py-2 rounded-xl bg-brand text-white text-sm hover:bg-brand-dark transition-colors">查询</button>
        </div>
      </div>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: '💷', label: '净销售额', value: `£${revenue.toFixed(2)}`, sub: `已付款 ${orderCount} 单`, color: 'brand' },
          { icon: '📦', label: '订单数',   value: orderCount, sub: `共 ${orderCount} 条`, color: 'blue' },
          { icon: '🧾', label: '客单价',   value: `£${avgOrder.toFixed(2)}`, sub: '平均每单', color: 'green' },
          { icon: '💳', label: '支付方式', value: payBreakdown.length, sub: `${payBreakdown.map(p => p.payMethod).join(' / ') || '—'}`, color: 'orange' },
        ].map(({ icon, label, value, sub, color }) => {
          const cls = { brand:'bg-brand/10 text-brand', blue:'bg-blue-50 text-blue-600', green:'bg-green-50 text-green-600', orange:'bg-orange-50 text-orange-600' }[color]
          return (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
              <div className={`text-xl w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cls}`}>{icon}</div>
              <div className="min-w-0">
                <div className="text-2xl font-bold text-gray-900">{value ?? '—'}</div>
                <div className="text-sm font-medium text-gray-600">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5 truncate">{sub}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 每日趋势 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">📈 每日营业额趋势</h2>
          </div>
          <div className="overflow-auto max-h-72">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>{['日期','订单数','营业额'].map(h =>
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dailyTrend.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
                ) : dailyTrend.map((d, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-700">{d.date}</td>
                    <td className="px-4 py-2.5 text-gray-600">{d.orderCount}</td>
                    <td className="px-4 py-2.5 font-semibold text-gray-900">£{parseFloat(d.revenue || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 收款方式 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">💳 收款方式分布</h2>
          </div>
          <div className="p-5 space-y-3">
            {payBreakdown.length === 0 ? <div className="text-gray-400 text-sm text-center py-8">暂无数据</div> :
              payBreakdown.map((p, i) => {
                const totalPay = payBreakdown.reduce((s, x) => s + x.total, 0)
                const pct = totalPay ? Math.round(p.total / totalPay * 100) : 0
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{p.payMethod || '其他'}</span>
                      <span className="font-medium">£{parseFloat(p.total).toFixed(2)} <span className="text-gray-400 text-xs">({pct}%)</span></span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2">
                      <div className="bg-brand h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>

      {/* 畅销商品 Top 10 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">🏆 畅销商品 Top 10</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['#','商品名称','SKU','销量','售价','状态'].map(h =>
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {topGoods.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
            ) : topGoods.map((g, i) => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 font-mono">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{g.name || '—'}</div>
                  {g.enName && <div className="text-xs text-gray-400">{g.enName}</div>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{g.hideCode || '—'}</td>
                <td className="px-4 py-3 font-semibold text-brand">{g.sales || 0}</td>
                <td className="px-4 py-3 text-gray-700">£{parseFloat(g.sellPrice || 0).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${g.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {g.status ? '在售' : '下架'}
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
