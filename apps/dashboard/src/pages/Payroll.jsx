import { useEffect, useState } from 'react'
import api from '../api'

const STATUS = { pending: '待审批', approved: '已审批', paid: '已发放' }
const STATUS_CLS = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-600', paid: 'bg-green-100 text-green-700' }

export default function Payroll() {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const [start, setStart] = useState(firstDay)
  const [end, setEnd] = useState(today.toISOString().split('T')[0])
  const [records, setRecords] = useState([])

  const load = () => api.get(`/ops/payroll?start=${start}&end=${end}`).then(r => setRecords(r.data || []))
  useEffect(() => { load() }, [start, end])

  const approve = async (id) => { await api.put(`/ops/payroll/${id}/approve`); load() }
  const markPaid = async (id) => { await api.put(`/ops/payroll/${id}/paid`); load() }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">薪资管理</h1>
      <div className="flex gap-3 mb-6">
        <input type="date" value={start} onChange={e => setStart(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
        <span className="text-gray-400 self-center">—</span>
        <input type="date" value={end} onChange={e => setEnd(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['员工','门店','底薪','状态','操作'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {records.map(r => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium">{r.staff?.name || r.staffId}</td>
                <td className="px-4 py-3 text-gray-500">{r.storeName || '—'}</td>
                <td className="px-4 py-3">£{r.baseSalary || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_CLS[r.status] || STATUS_CLS.pending}`}>
                    {STATUS[r.status] || r.status}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  {r.status === 'pending' && <button onClick={() => approve(r.id)} className="text-xs text-blue-600 hover:underline">审批</button>}
                  {r.status === 'approved' && <button onClick={() => markPaid(r.id)} className="text-xs text-green-600 hover:underline">标记已付</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && <div className="text-center text-gray-400 py-12">暂无薪资记录</div>}
      </div>
    </div>
  )
}
