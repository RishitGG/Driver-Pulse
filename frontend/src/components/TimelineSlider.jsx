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
    <div className="bg-white rounded-xl p-4 shadow-sm border border-uber-gray-100">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(0, currentSec - 30))}
          className="p-1.5 rounded-lg hover:bg-uber-gray-100 transition"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={onPlayPause}
          className="p-2 rounded-full bg-uber-black text-white hover:bg-uber-gray-800 transition"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          onClick={() => onChange(Math.min(maxSec, currentSec + 30))}
          className="p-1.5 rounded-lg hover:bg-uber-gray-100 transition"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono text-uber-gray-500 w-10">{formatTime(currentSec)}</span>

        {/* Slider */}
        <div className="flex-1 relative h-6 flex items-center">
          <div className="absolute inset-x-0 h-1.5 bg-uber-gray-100 rounded-full">
            <div
              className="h-full bg-uber-blue rounded-full transition-all"
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
            className="absolute w-4 h-4 bg-uber-blue rounded-full border-2 border-white shadow-md pointer-events-none transition-all"
            style={{ left: `calc(${pct}% - 8px)` }}
          />
        </div>

        <span className="text-xs font-mono text-uber-gray-500 w-10 text-right">{formatTime(maxSec)}</span>
      </div>
    </div>
  )
}
