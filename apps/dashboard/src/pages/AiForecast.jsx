import { useEffect, useState } from 'react'
import api from '../api'

const TABS = [
  { key: 'staffing', label: '排班建议' },
  { key: 'sales', label: '销售预测' },
  { key: 'inventory', label: '库存采购' },
]

const DOW_CN = { Monday:'周一', Tuesday:'周二', Wednesday:'周三', Thursday:'周四', Friday:'周五', Saturday:'周六', Sunday:'周日' }

export default function AiForecast() {
  const [tab, setTab] = useState('staffing')
  const [storeId, setStoreId] = useState('')
  const [stores, setStores] = useState([])
  const [generating, setGenerating] = useState(false)
  const [lastGenTime, setLastGenTime] = useState(null)

  // 各模块数据
  const [staffingData, setStaffingData] = useState([])
  const [sales7d, setSales7d] = useState([])
  const [sales30d, setSales30d] = useState([])
  const [purchaseDrafts, setPurchaseDrafts] = useState([])
  const [scheduleDrafts, setScheduleDrafts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/ops/stores').then(r => setStores([{ id: '', name: '全部门店' }, ...(r.data || [])]))
    loadLatest()
  }, [storeId])

  const loadLatest = async () => {
    setLoading(true)
    const q = storeId ? `?storeId=${storeId}` : ''
    try {
      const [sf, s7, s30, pd, sd] = await Promise.all([
        api.get(`/ai-forecast/latest/staffing${q}`).then(r => r.data?.result_data || []).catch(() => []),
        api.get(`/ai-forecast/latest/sales_7d${q}`).then(r => r.data?.result_data || []).catch(() => []),
        api.get(`/ai-forecast/latest/sales_30d${q}`).then(r => r.data?.result_data || []).catch(() => []),
        api.get(`/ai-forecast/purchase-drafts${q}`).then(r => r.data || []).catch(() => []),
        api.get(`/ai-forecast/schedule-drafts${q}`).then(r => r.data || []).catch(() => []),
      ])
      setStaffingData(sf)
      setSales7d(s7)
      setSales30d(s30)
      setPurchaseDrafts(pd)
      setScheduleDrafts(sd)
    } finally {
      setLoading(false)
    }
  }

  const generate = async () => {
    setGenerating(true)
    const q = storeId ? `?storeId=${storeId}` : ''
    await api.post(`/ai-forecast/generate${q}`).catch(() => {})
    setLastGenTime(new Date().toLocaleTimeString())
    await loadLatest()
    setGenerating(false)
  }

  const confirmDraft = async (type, id) => {
    await api.patch(`/ai-forecast/${type}-drafts/${id}/confirm`)
    if (type === 'schedule') setScheduleDrafts(d => d.map(x => x.id === id ? { ...x, status: 'confirmed' } : x))
    else setPurchaseDrafts(d => d.map(x => x.id === id ? { ...x, status: 'confirmed' } : x))
  }

  const rejectDraft = async (type, id) => {
    await api.patch(`/ai-forecast/${type}-drafts/${id}/reject`)
    if (type === 'schedule') setScheduleDrafts(d => d.filter(x => x.id !== id))
    else setPurchaseDrafts(d => d.filter(x => x.id !== id))
  }

  const updatePurchaseQty = (id, qty) => {
    setPurchaseDrafts(d => d.map(x => x.id === id ? { ...x, suggested_qty: qty } : x))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">智能建议</h1>
          <p className="text-sm text-gray-500 mt-1">基于历史数据的排班、销售、库存预测</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={storeId}
            onChange={e => setStoreId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button
            onClick={generate}
            disabled={generating}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {generating ? (
              <><span className="animate-spin">⟳</span> 生成中...</>
            ) : (
              <><span>✨</span> 重新生成</>
            )}
          </button>
          {lastGenTime && <span className="text-xs text-gray-400">最后更新 {lastGenTime}</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {tab === 'staffing' && (
            <StaffingTab
              staffingData={staffingData}
              scheduleDrafts={scheduleDrafts}
              onConfirm={id => confirmDraft('schedule', id)}
              onReject={id => rejectDraft('schedule', id)}
            />
          )}
          {tab === 'sales' && (
            <SalesTab sales7d={sales7d} sales30d={sales30d} />
          )}
          {tab === 'inventory' && (
            <InventoryTab
              drafts={purchaseDrafts}
              onConfirm={id => confirmDraft('purchase', id)}
              onReject={id => rejectDraft('purchase', id)}
              onQtyChange={updatePurchaseQty}
            />
          )}
        </>
      )}
    </div>
  )
}

// ─── 排班建议 Tab ──────────────────────────────────────────────
function StaffingTab({ staffingData, scheduleDrafts, onConfirm, onReject }) {
  const [view, setView] = useState('forecast') // forecast | drafts

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setView('forecast')}
          className={`px-3 py-1.5 rounded-lg text-sm ${view === 'forecast' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
          14天预测
        </button>
        <button onClick={() => setView('drafts')}
          className={`px-3 py-1.5 rounded-lg text-sm ${view === 'drafts' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
          班次草稿 {scheduleDrafts.length > 0 && <span className="ml-1 bg-orange-500 text-white text-xs px-1.5 rounded-full">{scheduleDrafts.length}</span>}
        </button>
      </div>

      {view === 'forecast' && (
        staffingData.length === 0
          ? <EmptyState text="暂无排班预测，点击「重新生成」" />
          : <div className="grid grid-cols-7 gap-2">
              {staffingData.map(day => (
                <div key={day.date} className={`rounded-xl border p-3 ${day.isHoliday ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
                  <div className="text-xs text-gray-400">{DOW_CN[day.dayOfWeek] || day.dayOfWeek}</div>
                  <div className="text-xs font-medium text-gray-600 mt-0.5">{day.date?.slice(5)}</div>
                  {day.isHoliday && <div className="text-xs text-red-500 mt-1 truncate">{day.holidayName}</div>}
                  {day.weatherWarning && <div className="text-xs text-blue-500 mt-1">💧 降雨</div>}
                  <div className="mt-2 text-2xl font-bold text-gray-900">{day.suggestedHeadcount}</div>
                  <div className="text-xs text-gray-400">建议人数</div>
                  <div className="mt-2 space-y-1">
                    {(day.shifts || []).map((s, i) => (
                      <div key={i} className="text-xs text-gray-500">
                        {s.role}: {s.staffCount}人
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
      )}

      {view === 'drafts' && (
        scheduleDrafts.length === 0
          ? <EmptyState text="暂无班次草稿" />
          : <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-4 py-2 text-gray-500 font-medium">日期</th>
                    <th className="text-left px-4 py-2 text-gray-500 font-medium">员工ID</th>
                    <th className="text-left px-4 py-2 text-gray-500 font-medium">班次</th>
                    <th className="text-left px-4 py-2 text-gray-500 font-medium">时间</th>
                    <th className="text-left px-4 py-2 text-gray-500 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {scheduleDrafts.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{d.shift_date}</td>
                      <td className="px-4 py-2">#{d.staff_id}</td>
                      <td className="px-4 py-2">{d.role}</td>
                      <td className="px-4 py-2">{d.shift_start} – {d.shift_end}</td>
                      <td className="px-4 py-2 flex gap-2">
                        <button onClick={() => onConfirm(d.id)}
                          className="px-2 py-1 bg-green-500 text-white rounded text-xs">确认</button>
                        <button onClick={() => onReject(d.id)}
                          className="px-2 py-1 bg-red-400 text-white rounded text-xs">拒绝</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      )}
    </div>
  )
}

// ─── 销售预测 Tab ──────────────────────────────────────────────
function SalesTab({ sales7d, sales30d }) {
  const max7 = Math.max(...sales7d.map(d => d.predictedRevenue || 0), 1)

  return (
    <div className="space-y-6">
      {/* 7天 */}
      <div>
        <h3 className="text-base font-semibold text-gray-700 mb-3">未来7天日级预测</h3>
        {sales7d.length === 0
          ? <EmptyState text="暂无7天预测数据" />
          : <div className="grid grid-cols-7 gap-3">
              {sales7d.map(day => (
                <div key={day.date} className="bg-white border border-gray-200 rounded-xl p-3">
                  <div className="text-xs text-gray-400">{DOW_CN[day.dayOfWeek] || day.dayOfWeek}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{day.date?.slice(5)}</div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                      <div className="bg-orange-400 h-1.5 rounded-full"
                        style={{ width: `${Math.round((day.predictedRevenue / max7) * 100)}%` }} />
                    </div>
                    <div className="text-lg font-bold text-gray-900">£{day.predictedRevenue?.toFixed(0)}</div>
                    <div className="text-xs text-gray-400">{day.predictedOrders} 单</div>
                    <div className={`text-xs mt-1 ${day.confidence === 'high' ? 'text-green-500' : day.confidence === 'medium' ? 'text-yellow-500' : 'text-gray-400'}`}>
                      {day.confidence === 'high' ? '高置信' : day.confidence === 'medium' ? '中置信' : '低置信'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>

      {/* 30天周级 */}
      <div>
        <h3 className="text-base font-semibold text-gray-700 mb-3">未来4周预测</h3>
        {sales30d.length === 0
          ? <EmptyState text="暂无月级预测数据" />
          : <div className="grid grid-cols-4 gap-4">
              {sales30d.map((week, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="text-xs text-gray-400">第 {i+1} 周</div>
                  <div className="text-xs text-gray-500 mt-0.5">{week.weekStart} ~ {week.weekEnd?.slice(5)}</div>
                  <div className="mt-3 text-2xl font-bold text-gray-900">£{week.predictedRevenue?.toFixed(0)}</div>
                  <div className="text-sm text-gray-500 mt-1">{week.predictedOrders} 单预计</div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  )
}

// ─── 库存采购 Tab ──────────────────────────────────────────────
function InventoryTab({ drafts, onConfirm, onReject, onQtyChange }) {
  const needsOrder = drafts.filter(d => d.suggested_qty > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">共 <span className="font-semibold text-gray-900">{needsOrder.length}</span> 个 SKU 建议补货</p>
        <button
          onClick={() => needsOrder.forEach(d => onConfirm(d.id))}
          className="text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg"
        >
          全部确认
        </button>
      </div>

      {drafts.length === 0
        ? <EmptyState text="暂无采购建议，点击「重新生成」" />
        : <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-2 text-gray-500 font-medium">商品</th>
                  <th className="text-left px-4 py-2 text-gray-500 font-medium">SKU</th>
                  <th className="text-right px-4 py-2 text-gray-500 font-medium">当前库存</th>
                  <th className="text-right px-4 py-2 text-gray-500 font-medium">建议补货量</th>
                  <th className="text-right px-4 py-2 text-gray-500 font-medium">配送时间</th>
                  <th className="text-left px-4 py-2 text-gray-500 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drafts.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{d.product_name}</td>
                    <td className="px-4 py-2 text-gray-500">{d.sku_code || '-'}</td>
                    <td className="px-4 py-2 text-right text-gray-600">
                      {d.current_stock ?? '—'} {d.unit}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        value={d.suggested_qty}
                        onChange={e => onQtyChange(d.id, parseFloat(e.target.value))}
                        className="w-20 text-right border border-gray-300 rounded px-2 py-1 text-sm"
                        min="0"
                      />
                      <span className="ml-1 text-gray-400">{d.unit}</span>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-500">{d.lead_time_days ?? 3} 天</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button onClick={() => onConfirm(d.id)}
                          className="px-2 py-1 bg-green-500 text-white rounded text-xs">确认</button>
                        <button onClick={() => onReject(d.id)}
                          className="px-2 py-1 bg-red-400 text-white rounded text-xs">拒绝</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      }
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <div className="text-4xl mb-3">📊</div>
      <p className="text-sm">{text}</p>
    </div>
  )
}
