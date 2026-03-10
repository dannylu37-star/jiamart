import { useEffect, useState } from 'react'
import api from '../api'

export default function Drive() {
  const [staff, setStaff] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/ops/staff').then(r => setStaff((r.data || []).filter(s => s.driveFolderUrl)))
  }, [])

  const filtered = staff.filter(s => !search || s.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">员工档案文件夹</h1>
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="搜索员工..." className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-64 mb-6 focus:outline-none focus:ring-2 focus:ring-brand/30" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(s => (
          <a key={s.id} href={s.driveFolderUrl} target="_blank" rel="noreferrer"
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-brand/30 hover:shadow-md transition group">
            <div className="text-3xl mb-2">📁</div>
            <div className="font-medium text-sm text-gray-800 truncate">{s.name}</div>
            <div className="text-xs text-brand mt-1 group-hover:underline">打开文件夹 →</div>
          </a>
        ))}
        {filtered.length === 0 && <div className="col-span-4 text-gray-400 text-center py-12">暂无档案</div>}
      </div>
    </div>
  )
}
