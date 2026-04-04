import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

export default function SignalCharts({ signals, cursorTime }) {
  if (!signals || !signals.timestamps) return null

  const data = signals.timestamps.map((t, i) => ({
    time: t,
    timeLabel: `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`,
    speed: signals.speed[i],
    accel: signals.accel_magnitude[i],
    audio: signals.audio_db[i],
  }))

  const charts = [
    { key: 'speed', label: 'Speed (km/h)', color: '#276EF1', domain: [0, 80] },
    { key: 'accel', label: 'Accel Magnitude (g)', color: '#E11900', domain: [0, 8] },
    { key: 'audio', label: 'Audio (dB)', color: '#FF6937', domain: [30, 100] },
  ]

  return (
    <div className="space-y-4">
      {charts.map(({ key, label, color, domain }) => (
        <div key={key} className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-white/5">
          <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-3">{label}</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
              <XAxis
                dataKey="timeLabel"
                tick={{ fontSize: 10, fill: '#64748b' }}
                interval={Math.floor(data.length / 8)}
              />
              <YAxis domain={domain} tick={{ fontSize: 10, fill: '#64748b' }} width={35} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 12, backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc', backdropFilter: 'blur(8px)' }}
                labelFormatter={(v) => `Time: ${v}`}
              />
              <Line
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
              />
              {cursorTime !== undefined && (
                <Line
                  type="monotone"
                  dataKey={() => null}
                  stroke="transparent"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  )
}
