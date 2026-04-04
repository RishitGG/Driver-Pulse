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
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">Batch CSV Upload</h1>
        <p className="text-[15px] text-slate-400 mt-1">
          Upload a CSV file with multiple trip windows to get stress &amp; earnings predictions in bulk — no manual entry needed.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-slate-900/60 backdrop-blur-md rounded-xl p-1.5 w-fit border border-white/5 shadow-inner">
        {[
          { key: 'stress', label: 'Stress Detection', icon: Activity },
          { key: 'earnings', label: 'Earnings Forecast', icon: DollarSign },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setMode(key); setResult(null); setError(null); setFile(null) }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[14px] font-bold transition-all duration-300 ${
              mode === key ? 'bg-indigo-600 text-white shadow-md border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Template + Upload card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Template download */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-5 h-5 text-indigo-400" />
            <h3 className="text-[16px] font-bold text-white tracking-wide">CSV Format</h3>
          </div>
          <p className="text-[13px] text-slate-400 mb-6 leading-relaxed">
            {mode === 'stress'
              ? 'Each row = one 30-second sensor window. Requires 15 feature columns (motion, audio, speed aggregates). Add optional trip_id and timestamp columns for identification.'
              : 'Each row = one earnings velocity log entry. Requires driver_id, timestamp, cumulative_earnings, elapsed_hours, current_velocity, target_velocity, velocity_delta, trips_completed, target_earnings.'
            }
          </p>
          <div className="bg-slate-950/50 rounded-xl p-4 mb-6 border border-white/5 shadow-inner">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">Required Columns</p>
            <div className="flex flex-wrap gap-2">
              {(mode === 'stress'
                ? ['motion_max', 'motion_mean', 'motion_p95', 'brake_intensity', 'audio_db_max', 'audio_db_p90', 'speed_mean', '...+8 more']
                : ['driver_id', 'timestamp', 'cumulative_earnings', 'elapsed_hours', 'current_velocity', 'target_velocity', 'trips_completed', 'target_earnings']
              ).map(col => (
                <span key={col} className="text-[11px] font-mono bg-indigo-500/10 text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-500/20">
                  {col}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => downloadTemplate(mode)}
            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 rounded-xl text-[14px] font-bold text-slate-200 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download Template CSV
          </button>
        </div>

        {/* File upload */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <h3 className="text-[16px] font-bold text-white tracking-wide mb-5">Upload Data</h3>

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f) }}
            className="border-2 border-dashed border-slate-700 rounded-2xl p-10 text-center cursor-pointer
              hover:border-indigo-500 hover:bg-indigo-500/5 transition-colors group"
          >
            <div className="w-16 h-16 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-white/5 group-hover:scale-110 transition-transform shadow-lg">
              <Upload className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="text-[14px] text-slate-400">
              {file ? (
                <span className="text-emerald-400 font-bold">{file.name}</span>
              ) : (
                <>Drag & drop CSV here or <span className="text-indigo-400 font-bold">browse</span></>
              )}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-2 tracking-wider">Supports .csv files up to 10MB</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => { if (e.target.files[0]) setFile(e.target.files[0]) }}
            />
          </div>

          {file && (
            <div className="flex items-center justify-between mt-6 bg-slate-950/50 p-4 rounded-xl border border-white/5">
              <div className="flex items-center gap-3 text-[14px]">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white truncate max-w-[150px] sm:max-w-xs">{file.name}</span>
                <span className="text-slate-500 font-mono text-xs">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
              <button
                onClick={() => { setFile(null); setResult(null); setError(null) }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Remove file"
              >
                <XCircle size={18} />
              </button>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white
              py-3.5 rounded-xl font-bold text-[14px] shadow-lg hover:from-indigo-400 hover:to-purple-500 transition-all transform hover:-translate-y-0.5
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" />
                Processing Data…
              </>
            ) : (
              <>
                <BarChart3 className="w-5 h-5" />
                Run {mode === 'stress' ? 'Stress Analysis' : 'Earnings Forecast'}
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
        <div className="flex gap-4">
          <button
            onClick={downloadResults}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-xl text-[14px] font-bold text-white hover:bg-slate-800/80 transition shadow-lg"
          >
            <Download className="w-5 h-5 text-indigo-400" /> Export JSON
          </button>
          <button
            onClick={downloadResultsCSV}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-xl text-[14px] font-bold text-white hover:bg-slate-800/80 transition shadow-lg"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Export CSV
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
        <SumCard label="Windows Processed" value={summary.total_windows} icon={FileSpreadsheet} color="text-indigo-400" />
        <SumCard label="Avg Confidence" value={`${Math.round(summary.avg_confidence * 100)}%`} icon={Activity} color="text-emerald-400" />
        <SumCard label="High Severity" value={summary.severity_counts?.high || 0} icon={AlertTriangle} color="text-rose-400" />
        <SumCard label="Notifications" value={summary.notifications_triggered} icon={Bell} color="text-amber-400" />
        <SumCard label="Stress Score" value={summary.stress_score} icon={Activity} color={summary.stress_score > 3 ? 'text-rose-400' : 'text-emerald-400'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl">
          <h3 className="text-[15px] font-bold text-white tracking-wide mb-6">Situation Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name.replace(/_/g, ' ')} (${value})`} labelLine={{ stroke: '#64748b' }}>
                {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc', backdropFilter: 'blur(8px)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl">
          <h3 className="text-[15px] font-bold text-white tracking-wide mb-6">Severity Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={severityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#cbd5e1' }} />
              <YAxis tick={{ fontSize: 12, fill: '#cbd5e1' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc', backdropFilter: 'blur(8px)' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]}>
                {severityData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Results table */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-white/10 bg-slate-800/50">
          <h3 className="text-[15px] font-bold text-white tracking-wide">Per-Window Results ({results.length})</h3>
        </div>
        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-[14px]">
            <thead className="bg-slate-950/80 sticky top-0 backdrop-blur-md z-10 shadow-sm">
              <tr>
                <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">#</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Trip</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Situation</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Severity</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Confidence</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Notify</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Details</th>
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
      <tr className={`border-b border-white/5 hover:bg-slate-800/50 transition-colors ${expanded ? 'bg-indigo-500/5' : ''}`}>
        <td className="px-6 py-4 text-slate-500 font-mono text-[12px]">{r.row_index + 1}</td>
        <td className="px-6 py-4 font-mono text-[12px] text-slate-300">{r.trip_id || r.timestamp || '-'}</td>
        <td className="px-6 py-4">
          <span className="flex items-center gap-2">
            <span className="text-xl bg-black/20 w-8 h-8 rounded-lg flex items-center justify-center border border-white/5">{r.emoji}</span>
            <span className="font-bold text-slate-200">{r.situation_name?.replace(/_/g, ' ')}</span>
          </span>
        </td>
        <td className="px-6 py-4">
          <span className={`inline-block px-3 py-1 rounded-xl text-[11px] font-bold tracking-wider uppercase border ${
            r.severity === 'high' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]' :
            r.severity === 'medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]' :
            'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
          }`}>
            {r.severity}
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full ${r.confidence >= 0.75 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : r.confidence >= 0.5 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'}`}
                style={{ width: `${Math.round(r.confidence * 100)}%` }}
              />
            </div>
            <span className="font-mono text-[13px] text-white">{Math.round(r.confidence * 100)}%</span>
          </div>
        </td>
        <td className="px-6 py-4 text-center">
          {r.should_notify ? <Bell className="w-5 h-5 text-amber-400 mx-auto drop-shadow-md" /> : <span className="text-slate-600">—</span>}
        </td>
        <td className="px-6 py-4">
          <button onClick={onToggle} className="p-2 rounded-xl border border-white/5 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition-all shadow-sm">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="bg-slate-950/60 p-0 border-b border-white/5">
            <div className="px-8 py-6 grid grid-cols-2 gap-10">
              {/* Top features */}
              {r.top_features?.length > 0 && (
                <div className="bg-slate-900/80 rounded-2xl p-5 border border-white/5 shadow-inner">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Top Feature Deviations</p>
                  <div className="space-y-3">
                    {r.top_features.map((f, j) => (
                      <div key={j} className="flex items-center gap-4">
                        <span className="text-[13px] text-slate-300 font-mono w-40 truncate">{f.feature}</span>
                        <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                          <div className="h-full rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" style={{ width: `${Math.min(f.z_score * 15, 100)}%` }} />
                        </div>
                        <span className="text-[12px] font-mono text-slate-500 w-16 text-right">z={f.z_score}</span>
                        <span className="text-[12px] font-mono font-bold text-white w-16 text-right">{f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* All probabilities */}
              {r.all_probabilities && Object.keys(r.all_probabilities).length > 0 && (
                <div className="bg-slate-900/80 rounded-2xl p-5 border border-white/5 shadow-inner">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Class Probabilities</p>
                  <div className="space-y-2.5">
                    {Object.entries(r.all_probabilities).sort(([,a], [,b]) => b - a).map(([cls, prob]) => (
                      <div key={cls} className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-300 w-32 truncate tracking-wide">{cls.replace(/_/g, ' ')}</span>
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                          <div className="h-full rounded-full shadow-lg" style={{ width: `${prob * 100}%`, backgroundColor: SITUATION_COLORS[cls] || '#AFAFAF', boxShadow: `0 0 8px ${SITUATION_COLORS[cls] || '#AFAFAF'}` }} />
                        </div>
                        <span className="text-[12px] font-mono font-bold text-white w-14 text-right">{(prob * 100).toFixed(1)}%</span>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <SumCard label="Entries Processed" value={summary.total_entries} icon={FileSpreadsheet} color="text-indigo-400" />
        <SumCard label="Avg Predicted ₹/hr" value={`₹${summary.avg_predicted_velocity}`} icon={DollarSign} color="text-emerald-400" />
        <SumCard label="Best Velocity" value={`₹${summary.best_velocity}`} icon={CheckCircle} color="text-emerald-400" />
        <SumCard label="Worst Velocity" value={`₹${summary.worst_velocity}`} icon={XCircle} color="text-rose-400" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl">
          <h3 className="text-[15px] font-bold text-white tracking-wide mb-6">Predicted vs Target Velocity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={velocityTrend} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="idx" tick={{ fontSize: 11, fill: '#cbd5e1' }} label={{ value: 'Entry #', position: 'insideBottom', offset: -3, fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#cbd5e1' }} tickFormatter={v => `₹${v}`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc', backdropFilter: 'blur(8px)' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} formatter={(v) => [`₹${v}`, '']} />
              <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
              <Bar dataKey="predicted" name="Predicted" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" name="Target" fill="#475569" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl">
          <h3 className="text-[15px] font-bold text-white tracking-wide mb-6">Forecast Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={forecastData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                label={({ name, value }) => `${name} (${value})`} labelLine={{ stroke: '#64748b' }}
              >
                {forecastData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc', backdropFilter: 'blur(8px)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Results table */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-white/10 bg-slate-800/50">
          <h3 className="text-[15px] font-bold text-white tracking-wide">Per-Entry Results ({results.length})</h3>
        </div>
        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-[14px]">
            <thead className="bg-slate-950/80 sticky top-0 backdrop-blur-md z-10 shadow-sm">
              <tr>
                <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">#</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Driver</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Hour</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Predicted ₹/hr</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Target ₹/hr</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Progress</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Details</th>
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
    ahead: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    on_track: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    at_risk: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  }
  return (
    <>
      <tr className={`border-b border-white/5 hover:bg-slate-800/50 transition-colors ${expanded ? 'bg-indigo-500/5' : ''}`}>
        <td className="px-6 py-4 text-slate-500 font-mono text-[12px]">{r.row_index + 1}</td>
        <td className="px-6 py-4 font-mono text-[12px] text-slate-300">{r.driver_id || '-'}</td>
        <td className="px-6 py-4 text-[13px] text-slate-300">{r.hour_of_day ?? '-'}</td>
        <td className="px-6 py-4 font-bold text-emerald-400">₹{r.predicted_velocity}</td>
        <td className="px-6 py-4 font-bold text-slate-400">₹{r.target_velocity}</td>
        <td className="px-6 py-4">
          <span className={`inline-block px-3 py-1 rounded-xl text-[11px] font-bold tracking-wider uppercase border shadow-sm ${
            statusColor[r.forecast_status] || 'bg-slate-800 text-slate-300'
          }`}>
            {r.forecast_status?.replace(/_/g, ' ')}
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div className="h-full rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" style={{ width: `${r.pct_target || 0}%` }} />
            </div>
            <span className="font-mono text-[13px] text-white">{r.pct_target}%</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <button onClick={onToggle} className="p-2 rounded-xl border border-white/5 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition-all shadow-sm">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="bg-slate-950/60 p-0 border-b border-white/5">
            <div className="px-8 py-6 grid grid-cols-4 gap-6 text-[13px]">
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/5"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Cumulative Earnings</span><p className="font-bold text-white text-[16px]">₹{r.cumulative_earnings}</p></div>
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/5"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Elapsed Hours</span><p className="font-bold text-white text-[16px]">{r.elapsed_hours}h</p></div>
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/5"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Remaining</span><p className="font-bold text-white text-[16px]">₹{r.remaining_earnings}</p></div>
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/5"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Hours to Target</span><p className="font-bold text-white text-[16px]">{r.hours_to_target ?? '—'}h</p></div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}


/* ── Shared summary card ────────────────────────────────── */

function SumCard({ label, value, icon: Icon, color = 'text-white' }) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-white/5 shadow-xl hover:-translate-y-1 transition-transform group">
      <Icon className={`w-6 h-6 ${color} mb-3 group-hover:scale-110 transition-transform`} />
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="text-[11px] font-bold tracking-wider uppercase text-slate-500 mt-1">{label}</p>
    </div>
  )
}
