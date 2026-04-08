import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

export default function TimelineSlider({ maxSec, currentSec, onChange, isPlaying, onPlayPause }) {
  const pct = maxSec > 0 ? (currentSec / maxSec) * 100 : 0

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/5 mt-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => onChange(Math.max(0, currentSec - 30))}
          className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all shadow-sm"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          onClick={onPlayPause}
          className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg active:scale-95"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        <button
          onClick={() => onChange(Math.min(maxSec, currentSec + 30))}
          className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all shadow-sm"
        >
          <SkipForward className="w-5 h-5" />
        </button>

        <span className="text-[13px] font-mono font-bold text-slate-400 w-12 text-center">{formatTime(currentSec)}</span>

        {/* Slider */}
        <div className="flex-1 relative h-6 flex items-center group">
          <div className="absolute inset-x-0 h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all shadow-[0_0_8px_rgba(99,102,241,0.6)]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={maxSec}
            value={currentSec}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-x-0 w-full h-6 opacity-0 cursor-pointer"
          />
          <div
            className="absolute w-4 h-4 bg-indigo-400 rounded-full border border-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.8)] pointer-events-none transition-all group-hover:scale-125"
            style={{ left: `calc(${pct}% - 8px)` }}
          />
        </div>

        <span className="text-[13px] font-mono font-bold text-slate-400 w-12 text-center">{formatTime(maxSec)}</span>
      </div>
    </div>
  )
}
