import { useEffect, useState } from 'react'
import api from '../api'

function Skeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
    </div>
  )
}

function HolidayPanel({ holidays }) {
  if (!holidays || holidays.length === 0) {
    return <p className="text-xs text-gray-400">暂无数据</p>
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {holidays.map((h, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium
            ${h.isWorkday ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-600'}`}
        >
          {h.isWorkday && <span title="调休">🔄</span>}
          {h.date} {h.name}
          {h.region && <span className="opacity-60">({h.region})</span>}
        </span>
      ))}
    </div>
  )
}

function WeatherPanel({ weather }) {
  if (!weather || weather.length === 0) {
    return <p className="text-xs text-gray-400">暂无数据</p>
  }
  return (
    <div className="flex gap-2 flex-wrap">
      {weather.map((w, i) => (
        <div key={i} className="flex flex-col items-center bg-gray-50 border border-gray-100 rounded-xl px-2 py-1.5 min-w-[52px]">
          <span className="text-xs text-gray-500 font-medium">{w.date?.slice(5)}</span>
          <span className="text-xs font-semibold text-gray-800 mt-0.5">
            {w.tempHigh}°<span className="text-gray-400 font-normal">/{w.tempLow}°</span>
          </span>
          <span className={`text-xs mt-0.5 ${w.rainProb > 60 ? 'text-blue-500 font-semibold' : 'text-gray-400'}`}>
            {w.rainProb > 60 ? '💧' : ''}
            {w.rainProb}%
          </span>
        </div>
      ))}
    </div>
  )
}

function SchoolPanel({ schools }) {
  if (!schools || schools.length === 0) {
    return <p className="text-xs text-gray-400">暂无数据</p>
  }
  return (
    <div className="space-y-2">
      {schools.map((s, i) => (
        <div key={i} className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-gray-800">{s.schoolName}</p>
            <p className="text-xs text-gray-500">{s.holidayName} · {s.startDate}</p>
          </div>
          <span className={`text-xs whitespace-nowrap font-medium px-1.5 py-0.5 rounded-full
            ${s.daysFromNow <= 7 ? 'bg-red-100 text-red-600' : s.daysFromNow <= 30 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
            {s.daysFromNow >= 0 ? `距今 ${s.daysFromNow} 天` : `已过 ${Math.abs(s.daysFromNow)} 天`}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function ScheduleContextBar({ storeId, startDate, endDate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!startDate || !endDate) return
    setLoading(true)
    const params = new URLSearchParams({ startDate, endDate })
    if (storeId != null) params.set('storeId', storeId)
    api.get(`/schedule-context/info?${params}`)
      .then(r => setData(r.data || {}))
      .catch(() => setData({}))
      .finally(() => setLoading(false))
  }, [storeId, startDate, endDate])

  const sections = [
    {
      title: '节假日 & 调休',
      subtitle: '未来 14 天 · CN & GB',
      content: loading ? <Skeleton /> : <HolidayPanel holidays={data?.holidays} />,
    },
    {
      title: '天气预警',
      subtitle: '未来 7 天',
      content: loading ? <Skeleton /> : <WeatherPanel weather={data?.weather} />,
    },
    {
      title: '学校放假提醒',
      subtitle: '附近大学',
      content: loading ? <Skeleton /> : <SchoolPanel schools={data?.schools} />,
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {sections.map(({ title, subtitle, content }) => (
        <div key={title} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
            <p className="text-xs text-gray-400">{subtitle}</p>
          </div>
          {content}
        </div>
      ))}
    </div>
  )
}
