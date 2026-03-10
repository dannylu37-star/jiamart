import { useEffect, useState } from 'react'
import api from '../api'

const STORES = [
  { suffix: 's1', name: 'Burleigh Street (Cambridge)' },
  // 其他门店数据导入后在此添加
]

const DAYS_OPTIONS = [
  { value: 30,  label: '近30天' },
  { value: 90,  label: '近90天' },
  { value: 180, label: '近180天' },
  { value: 365, label: '近一年' },
]

export default function Analytics() {
  const [suffix, setSuffix] = useState('s1')
  const [days, setDays]     = useState(90)
  const [daily, setDaily]   = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [paymentMix, setPaymentMix]   = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadAll() }, [suffix, days])

  const loadAll = async () => {
    setLoading(true)
    const q = `storeSuffix=${suffix}&days=${days}`
    try {
      const [d, p, pm] = await Promise.all([
        api.get(`/ai-forecast/analytics/daily?${q}`).then(r => r.data?.data || []),
        api.get(`/ai-forecast/analytics/top-products?${q}&limit=15`).then(r => r.data?.data || []),
        api.get(`/ai-forecast/analytics/payment-mix?${q}`).then(r => r.data?.data || {}),
      ])
      setDaily(d)
      setTopProducts(p)
      setPaymentMix(pm)
    } finally {
      setLoading(false)
    }
  }

  const totalRevenue  = daily.reduce((s, d) => s + parseFloat(d.sales || 0), 0)
  const avgDailyRev   = daily.length ? totalRevenue / daily.length : 0
  const maxDay        = daily.reduce((a, b) => parseFloat(b.sales) > parseFloat(a.sales) ? b : a, { sales: 0, data_day: '-' })
  const pmTotal       = parseFloat(paymentMix.total || 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">销售分析</h1>
          <p className="text-sm text-gray-500 mt-1">历史数据洞察 · Burleigh Street</p>
        </div>
        <div className="flex gap-3">
          <select value={suffix} onChange={e => setSuffix(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {STORES.map(s => <option key={s.suffix} value={s.suffix}>{s.name}</option>)}
          </select>
          <select value={days} onChange={e => setDays(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {DAYS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <>
          {/* KPI 卡片 */}
          <div className="grid grid-cols-4 gap-4">
            <KpiCard label="总收入" value={`£${(totalRevenue).toLocaleString('en-GB', {maximumFractionDigits:0})}`} sub={`${daily.length} 天`} color="orange" />
            <KpiCard label="日均营业额" value={`£${avgDailyRev.toFixed(0)}`} sub="按营业日" color="blue" />
            <KpiCard label="最高单日" value={`£${parseFloat(maxDay.sales||0).toFixed(0)}`} sub={maxDay.data_day} color="green" />
            <KpiCard label="订单总量" value={topProducts.reduce((s,p)=>s+parseInt(p.total_qty||0),0).toLocaleString()} sub="件商品售出" color="purple" />
          </div>

          {/* 日报趋势图 */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-base font-semibold text-gray-700 mb-4">每日营业额趋势</h3>
            <SalesBarChart data={daily} />
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* 畅销商品 */}
            <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-base font-semibold text-gray-700 mb-4">
                畅销商品 TOP 15 · 近{days}天
              </h3>
              {topProducts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">暂无数据</p>
              ) : (
                <div className="space-y-2">
                  {topProducts.map((p, i) => {
                    const maxQty = topProducts[0]?.total_qty || 1
                    const pct = Math.round((p.total_qty / maxQty) * 100)
                    return (
                      <div key={p.product_id} className="flex items-center gap-3">
                        <span className="w-6 text-xs text-gray-400 text-right">{i+1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-sm font-medium text-gray-800 truncate">
                              {p.chinese_name || p.english_name}
                            </span>
                            <span className="text-xs text-gray-500 ml-2 shrink-0">
                              {parseInt(p.total_qty)} 件 · £{parseFloat(p.total_revenue||0).toFixed(0)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <span className="w-16 text-xs text-gray-400 text-right shrink-0">
                          {parseFloat(p.daily_avg||0).toFixed(1)}/天
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 支付方式 */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-base font-semibold text-gray-700 mb-4">支付方式构成</h3>
              {pmTotal === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">暂无数据</p>
              ) : (
                <div className="space-y-3">
                  {[
                    { key: 'card',    label: '银行卡',   color: 'bg-blue-400' },
                    { key: 'cash',    label: '现金',     color: 'bg-green-400' },
                    { key: 'wechat',  label: '微信/支付宝', color: 'bg-orange-400' },
                    { key: 'justEat', label: 'JustEat',  color: 'bg-purple-400' },
                  ].map(({ key, label, color }) => {
                    const val = parseFloat(paymentMix[key] || 0)
                    const pct = pmTotal > 0 ? Math.round(val / pmTotal * 100) : 0
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{label}</span>
                          <span className="font-medium text-gray-800">
                            £{val.toLocaleString('en-GB', {maximumFractionDigits:0})} · {pct}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                  <div className="pt-2 border-t mt-2">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-gray-700">合计</span>
                      <span className="text-gray-900">£{pmTotal.toLocaleString('en-GB', {maximumFractionDigits:0})}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── KPI 卡片 ──────────────────────────────────────────────────
function KpiCard({ label, value, sub, color }) {
  const colors = {
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    blue:   'bg-blue-50 border-blue-200 text-blue-600',
    green:  'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs opacity-60 mt-0.5">{sub}</p>
    </div>
  )
}

// ─── 简单条形图（纯 CSS，不依赖图表库）───────────────────────────
function SalesBarChart({ data }) {
  if (!data.length) return <p className="text-sm text-gray-400 text-center py-8">暂无数据</p>

  // 每7天聚合一次（超过60天时），避免太密
  let chartData = data
  if (data.length > 60) {
    const weeks = {}
    data.forEach(d => {
      const dt = new Date(d.data_day)
      const weekKey = new Date(dt.setDate(dt.getDate() - dt.getDay())).toISOString().split('T')[0]
      if (!weeks[weekKey]) weeks[weekKey] = { data_day: weekKey, sales: 0 }
      weeks[weekKey].sales += parseFloat(d.sales || 0)
    })
    chartData = Object.values(weeks)
  }

  const maxSales = Math.max(...chartData.map(d => parseFloat(d.sales || 0)), 1)

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-0.5 h-40 min-w-max pb-6 relative">
        {chartData.map((d, i) => {
          const h = Math.max(2, Math.round((parseFloat(d.sales) / maxSales) * 100))
          const isWeekend = new Date(d.data_day).getDay() % 6 === 0
          return (
            <div key={i} className="relative group flex flex-col items-center" style={{ width: data.length > 60 ? '14px' : '8px' }}>
              <div
                className={`w-full rounded-t transition-all ${isWeekend ? 'bg-orange-400' : 'bg-orange-200'} hover:bg-orange-500`}
                style={{ height: `${h}%` }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden group-hover:block whitespace-nowrap z-10">
                {d.data_day}: £{parseFloat(d.sales).toFixed(0)}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{chartData[0]?.data_day}</span>
        <span className="text-orange-500">▪ 周末 &nbsp; ▪ 工作日</span>
        <span>{chartData[chartData.length-1]?.data_day}</span>
      </div>
    </div>
  )
}
