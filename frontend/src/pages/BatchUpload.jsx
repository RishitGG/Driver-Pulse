import { useState, useRef } from 'react'
import { Upload, Download, FileSpreadsheet, Activity, DollarSign, AlertTriangle, ChevronDown, ChevronUp, Info, BarChart3, CheckCircle, XCircle, Bell } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const SEVERITY_COLORS = { low: '#06C167', medium: '#FFC043', high: '#E11900' }
const FORECAST_COLORS = { ahead: '#06C167', on_track: '#276EF1', at_risk: '#E11900' }
const SITUATION_COLORS = {
  NORMAL: '#06C167', TRAFFIC_STOP: '#276EF1', SPEED_BREAKER: '#FFC043',
  CONFLICT: '#E11900', ESCALATING: '#A3000B', ARGUMENT_ONLY: '#FF6937', MUSIC_OR_CALL: '#7356BF',
}

export default function BatchUpload() {
  const [mode, setMode] = useState('stress') // 'stress' | 'earnings'
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)
  const inputRef = useRef(null)

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const endpoint = mode === 'stress' ? '/api/batch/stress' : '/api/batch/earnings'
      const res = await fetch(endpoint, { method: 'POST', body: formData })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Upload failed (${res.status})`)
      }
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = (type) => {
    const a = document.createElement('a')
    a.href = `/api/batch/template/${type}`
    a.download = `${type}_template.csv`
    a.click()
  }

  const downloadResults = () => {
    if (!result) return
    const json = JSON.stringify(result, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${mode}_batch_results.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadResultsCSV = () => {
    if (!result?.results?.length) return
    const rows = result.results
    const keys = Object.keys(rows[0]).filter(k => typeof rows[0][k] !== 'object')
    const header = keys.join(',')
    const lines = rows.map(r => keys.map(k => {
      const v = r[k]
      return v === null || v === undefined ? '' : v
    }).join(','))
    const csv = header + '\n' + lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${mode}_batch_results.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Batch CSV Upload</h1>
        <p className="text-sm text-uber-gray-500 mt-1">
          Upload a CSV file with multiple trip windows to get stress &amp; earnings predictions in bulk — no manual entry needed.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-uber-gray-100 rounded-lg p-1 w-fit">
        {[
          { key: 'stress', label: 'Stress Detection', icon: Activity },
          { key: 'earnings', label: 'Earnings Forecast', icon: DollarSign },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setMode(key); setResult(null); setError(null); setFile(null) }}
            className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === key ? 'bg-white text-uber-black shadow-sm' : 'text-uber-gray-500 hover:text-uber-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Template + Upload card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template download */}
        <div className="bg-white rounded-xl p-6 border border-uber-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-uber-blue" />
            <h3 className="text-sm font-semibold text-uber-gray-700">CSV Format</h3>
          </div>
          <p className="text-xs text-uber-gray-500 mb-4">
            {mode === 'stress'
              ? 'Each row = one 30-second sensor window. Requires 15 feature columns (motion, audio, speed aggregates). Add optional trip_id and timestamp columns for identification.'
              : 'Each row = one earnings velocity log entry. Requires driver_id, timestamp, cumulative_earnings, elapsed_hours, current_velocity, target_velocity, velocity_delta, trips_completed, target_earnings.'
            }
          </p>
          <div className="bg-uber-gray-50 rounded-lg p-3 mb-4">
            <p className="text-[10px] text-uber-gray-500 font-semibold uppercase tracking-wider mb-1">Required columns</p>
            <div className="flex flex-wrap gap-1">
              {(mode === 'stress'
                ? ['motion_max', 'motion_mean', 'motion_p95', 'brake_intensity', 'audio_db_max', 'audio_db_p90', 'speed_mean', '...+8 more']
                : ['driver_id', 'timestamp', 'cumulative_earnings', 'elapsed_hours', 'current_velocity', 'target_velocity', 'trips_completed', 'target_earnings']
              ).map(col => (
                <span key={col} className="text-[10px] bg-white px-2 py-0.5 rounded border border-uber-gray-200 font-mono">
                  {col}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => downloadTemplate(mode)}
            className="flex items-center gap-2 px-4 py-2 bg-uber-gray-100 hover:bg-uber-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Template CSV
          </button>
        </div>

        {/* File upload */}
        <div className="bg-white rounded-xl p-6 border border-uber-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-uber-gray-700 mb-3">Upload CSV</h3>

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f) }}
            className="border-2 border-dashed border-uber-gray-200 rounded-xl p-8 text-center cursor-pointer
              hover:border-uber-blue hover:bg-blue-50/30 transition-colors"
          >
            <Upload className="w-8 h-8 text-uber-gray-300 mx-auto mb-2" />
            <p className="text-sm text-uber-gray-500">
              {file ? (
                <span className="text-uber-blue font-medium">{file.name}</span>
              ) : (
                <>Drop CSV here or <span className="text-uber-blue font-medium">click to browse</span></>
              )}
            </p>
            <p className="text-[10px] text-uber-gray-400 mt-1">Supports .csv files</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => { if (e.target.files[0]) setFile(e.target.files[0]) }}
            />
          </div>

          {file && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="w-4 h-4 text-uber-green" />
                <span className="font-medium">{file.name}</span>
                <span className="text-uber-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button
                onClick={() => { setFile(null); setResult(null); setError(null) }}
                className="text-xs text-uber-gray-400 hover:text-uber-red"
              >
                Remove
              </button>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-uber-black text-white
              py-3 rounded-lg font-medium text-sm hover:bg-uber-gray-800 transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Processing…
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                Run {mode === 'stress' ? 'Stress Detection' : 'Earnings Prediction'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results */}
      {result && mode === 'stress' && <StressResults result={result} expandedRow={expandedRow} setExpandedRow={setExpandedRow} />}
      {result && mode === 'earnings' && <EarningsResults result={result} expandedRow={expandedRow} setExpandedRow={setExpandedRow} />}

      {/* Export buttons */}
      {result && (
        <div className="flex gap-3">
          <button
            onClick={downloadResults}
            className="flex items-center gap-2 px-4 py-2 border border-uber-gray-200 rounded-lg text-sm font-medium hover:border-uber-gray-400 transition"
          >
            <Download className="w-4 h-4" /> Export JSON
          </button>
          <button
            onClick={downloadResultsCSV}
            className="flex items-center gap-2 px-4 py-2 border border-uber-gray-200 rounded-lg text-sm font-medium hover:border-uber-gray-400 transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      )}
    </div>
  )
}


/* ── Stress Results ─────────────────────────────────────── */

function StressResults({ result, expandedRow, setExpandedRow }) {
  const { summary, results } = result

  const pieData = Object.entries(summary.situation_counts || {}).map(([name, count]) => ({
    name, value: count, fill: SITUATION_COLORS[name] || '#AFAFAF',
  }))
  const severityData = Object.entries(summary.severity_counts || {}).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), value: count, fill: SEVERITY_COLORS[name],
  }))

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SumCard label="Windows Processed" value={summary.total_windows} icon={FileSpreadsheet} color="text-uber-blue" />
        <SumCard label="Avg Confidence" value={`${Math.round(summary.avg_confidence * 100)}%`} icon={Activity} color="text-uber-green" />
        <SumCard label="High Severity" value={summary.severity_counts?.high || 0} icon={AlertTriangle} color="text-uber-red" />
        <SumCard label="Notifications" value={summary.notifications_triggered} icon={Bell} color="text-uber-orange" />
        <SumCard label="Stress Score" value={summary.stress_score} icon={Activity} color={summary.stress_score > 3 ? 'text-uber-red' : 'text-uber-green'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-uber-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-uber-gray-700 mb-4">Situation Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name.replace(/_/g, ' ')} (${value})`}>
                {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-5 border border-uber-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-uber-gray-700 mb-4">Severity Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={severityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]}>
                {severityData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Results table */}
      <div className="bg-white rounded-xl border border-uber-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-uber-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-uber-gray-700">Per-Window Results ({results.length})</h3>
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-uber-gray-50 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 text-xs text-uber-gray-500 font-semibold">#</th>
                <th className="text-left px-4 py-2 text-xs text-uber-gray-500 font-semibold">Trip</th>
                <th className="text-left px-4 py-2 text-xs text-uber-gray-500 font-semibold">Situation</th>
                <th className="text-left px-4 py-2 text-xs text-uber-gray-500 font-semibold">Severity</th>
                <th className="text-left px-4 py-2 text-xs text-uber-gray-500 font-semibold">Confidence</th>
                <th className="text-left px-4 py-2 text-xs text-uber-gray-500 font-semibold">Notify</th>
                <th className="text-left px-4 py-2 text-xs text-uber-gray-500 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <StressRow key={i} r={r} i={i} expanded={expandedRow === i} onToggle={() => setExpandedRow(expandedRow === i ? null : i)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function StressRow({ r, i, expanded, onToggle }) {
  return (
    <>
      <tr className={`border-b border-uber-gray-50 hover:bg-uber-gray-50/50 ${expanded ? 'bg-blue-50/30' : ''}`}>
        <td className="px-4 py-3 text-uber-gray-400 font-mono text-xs">{r.row_index + 1}</td>
        <td className="px-4 py-3 font-mono text-xs">{r.trip_id || r.timestamp || '-'}</td>
        <td className="px-4 py-3">
          <span className="flex items-center gap-1.5">
            <span>{r.emoji}</span>
            <span className="font-medium">{r.situation_name?.replace(/_/g, ' ')}</span>
          </span>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
            r.severity === 'high' ? 'bg-red-100 text-red-700' :
            r.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }`}>
            {r.severity}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-uber-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${r.confidence >= 0.75 ? 'bg-uber-green' : r.confidence >= 0.5 ? 'bg-uber-yellow' : 'bg-uber-red'}`}
                style={{ width: `${Math.round(r.confidence * 100)}%` }}
              />
            </div>
            <span className="font-mono text-xs">{Math.round(r.confidence * 100)}%</span>
          </div>
        </td>
        <td className="px-4 py-3">
          {r.should_notify ? <Bell className="w-4 h-4 text-uber-orange" /> : <span className="text-uber-gray-300">—</span>}
        </td>
        <td className="px-4 py-3">
          <button onClick={onToggle} className="p-1 rounded hover:bg-uber-gray-100 transition">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="bg-uber-gray-50 px-6 py-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Top features */}
              {r.top_features?.length > 0 && (
                <div>
                  <p className="text-xs text-uber-gray-500 font-semibold uppercase tracking-wider mb-2">Top Feature Deviations</p>
                  <div className="space-y-2">
                    {r.top_features.map((f, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <span className="text-xs font-mono w-40 truncate">{f.feature}</span>
                        <div className="flex-1 h-2 bg-uber-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-uber-blue" style={{ width: `${Math.min(f.z_score * 15, 100)}%` }} />
                        </div>
                        <span className="text-xs font-mono text-uber-gray-500 w-16 text-right">z={f.z_score}</span>
                        <span className="text-xs font-mono text-uber-gray-400 w-16 text-right">val={f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* All probabilities */}
              {r.all_probabilities && Object.keys(r.all_probabilities).length > 0 && (
                <div>
                  <p className="text-xs text-uber-gray-500 font-semibold uppercase tracking-wider mb-2">Class Probabilities</p>
                  <div className="space-y-1.5">
                    {Object.entries(r.all_probabilities).sort(([,a], [,b]) => b - a).map(([cls, prob]) => (
                      <div key={cls} className="flex items-center gap-2">
                        <span className="text-[10px] w-28 truncate">{cls.replace(/_/g, ' ')}</span>
                        <div className="flex-1 h-1.5 bg-uber-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${prob * 100}%`, backgroundColor: SITUATION_COLORS[cls] || '#AFAFAF' }} />
                        </div>
                        <span className="text-[10px] font-mono w-10 text-right">{(prob * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}


/* ── Earnings Results ───────────────────────────────────── */

function EarningsResults({ result, expandedRow, setExpandedRow }) {
  const { summary, results } = result

  const forecastData = Object.entries(summary.forecast_counts || {}).map(([name, count]) => ({
    name: name.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
    value: count,
    fill: FORECAST_COLORS[name] || '#AFAFAF',
  }))

  const velocityTrend = results.map((r, i) => ({
    idx: i + 1,
    predicted: r.predicted_velocity,
    target: r.target_velocity,
    current: r.current_velocity,
    hour: r.hour_of_day ?? i,
  }))

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SumCard label="Entries Processed" value={summary.total_entries} icon={FileSpreadsheet} color="text-uber-blue" />
        <SumCard label="Avg Predicted ₹/hr" value={`₹${summary.avg_predicted_velocity}`} icon={DollarSign} color="text-uber-green" />
        <SumCard label="Best Velocity" value={`₹${summary.best_velocity}`} icon={CheckCircle} color="text-uber-green" />
        <SumCard label="Worst Velocity" value={`₹${summary.worst_velocity}`} icon={XCircle} color="text-uber-red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-uber-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-uber-gray-700 mb-4">Predicted vs Target Velocity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={velocityTrend} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
              <XAxis dataKey="idx" tick={{ fontSize: 11 }} label={{ value: 'Entry #', position: 'insideBottom', offset: -3, fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
              <Tooltip formatter={(v) => [`₹${v}`, '']} />
              <Legend verticalAlign="top" height={30} />
              <Bar dataKey="predicted" name="Predicted" fill="#276EF1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" name="Target" fill="#E2E2E2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-5 border border-uber-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-uber-gray-700 mb-4">Forecast Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={forecastData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                label={({ name, value }) => `${name} (${value})`}
              >
                {forecastData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Results table */}
      <div className="bg-white rounded-xl border border-uber-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-uber-gray-100">
          <h3 className="text-sm font-semibold text-uber-gray-700">Per-Entry Results ({results.length})</h3>
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-uber-gray-50 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 text-xs text-uber-gray-500 font-semibold">#</th>
                <th className="text-left px-4 py-2 text-xs text-uber-gray-500 font-semibold">Driver</th>
                <th className="text-left px-4 py-2 text-xs text-uber-gray-500 font-semibold">Hour</th>
                <th className="text-left px-4 py-2 text-xs text-uber-gray-500 font-semibold">Predicted ₹/hr</th>
                <th className="text-left px-4 py-2 text-xs text-uber-gray-500 font-semibold">Target ₹/hr</th>
                <th className="text-left px-4 py-2 text-xs text-uber-gray-500 font-semibold">Status</th>
                <th className="text-left px-4 py-2 text-xs text-uber-gray-500 font-semibold">Progress</th>
                <th className="text-left px-4 py-2 text-xs text-uber-gray-500 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <EarningsRow key={i} r={r} i={i} expanded={expandedRow === i} onToggle={() => setExpandedRow(expandedRow === i ? null : i)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function EarningsRow({ r, i, expanded, onToggle }) {
  const statusColor = {
    ahead: 'bg-green-100 text-green-700',
    on_track: 'bg-blue-100 text-blue-700',
    at_risk: 'bg-red-100 text-red-700',
  }
  return (
    <>
      <tr className={`border-b border-uber-gray-50 hover:bg-uber-gray-50/50 ${expanded ? 'bg-blue-50/30' : ''}`}>
        <td className="px-4 py-3 text-uber-gray-400 font-mono text-xs">{r.row_index + 1}</td>
        <td className="px-4 py-3 font-mono text-xs">{r.driver_id || '-'}</td>
        <td className="px-4 py-3 text-xs">{r.hour_of_day ?? '-'}</td>
        <td className="px-4 py-3 font-semibold">₹{r.predicted_velocity}</td>
        <td className="px-4 py-3 text-uber-gray-500">₹{r.target_velocity}</td>
        <td className="px-4 py-3">
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
            statusColor[r.forecast_status] || 'bg-uber-gray-100 text-uber-gray-600'
          }`}>
            {r.forecast_status?.replace(/_/g, ' ')}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-uber-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-uber-green" style={{ width: `${r.pct_target || 0}%` }} />
            </div>
            <span className="font-mono text-xs">{r.pct_target}%</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <button onClick={onToggle} className="p-1 rounded hover:bg-uber-gray-100 transition">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="bg-uber-gray-50 px-6 py-4">
            <div className="grid grid-cols-4 gap-4 text-xs">
              <div><span className="text-uber-gray-400">Cumulative Earnings</span><p className="font-semibold">₹{r.cumulative_earnings}</p></div>
              <div><span className="text-uber-gray-400">Elapsed Hours</span><p className="font-semibold">{r.elapsed_hours}h</p></div>
              <div><span className="text-uber-gray-400">Remaining</span><p className="font-semibold">₹{r.remaining_earnings}</p></div>
              <div><span className="text-uber-gray-400">Hours to Target</span><p className="font-semibold">{r.hours_to_target ?? '—'}h</p></div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}


/* ── Shared summary card ────────────────────────────────── */

function SumCard({ label, value, icon: Icon, color = 'text-uber-black' }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-uber-gray-100">
      <Icon className={`w-5 h-5 ${color} mb-1.5`} />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] text-uber-gray-400 mt-0.5">{label}</p>
    </div>
  )
}
