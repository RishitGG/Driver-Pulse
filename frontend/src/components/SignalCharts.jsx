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
        <div key={key} className="bg-white rounded-xl p-4 shadow-sm border border-uber-gray-100">
          <p className="text-xs font-semibold text-uber-gray-500 mb-2">{label}</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
              <XAxis
                dataKey="timeLabel"
                tick={{ fontSize: 10 }}
                interval={Math.floor(data.length / 8)}
              />
              <YAxis domain={domain} tick={{ fontSize: 10 }} width={35} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
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
