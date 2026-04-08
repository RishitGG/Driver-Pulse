import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const severityColor = { low: '#06C167', medium: '#FFC043', high: '#E11900' }
const CALM_COLOR = '#276EF1'
const SEVERITY_RANK = { low: 1, medium: 2, high: 3 }

function escapeHtml(s) {
  if (s == null || s === '') return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function strongerSeverity(a, b) {
  return (SEVERITY_RANK[b] || 0) > (SEVERITY_RANK[a] || 0) ? b : a
}

const eventIcon = (severity) => {
  const isHigh = severity === 'high'
  const size = isHigh ? 16 : 14
  const anchor = size / 2
  const ring = isHigh ? 'box-shadow:0 0 0 3px rgba(225,25,0,0.35),0 2px 6px rgba(0,0,0,0.35);' : 'box-shadow:0 1px 4px rgba(0,0,0,0.3);'
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${severityColor[severity] || '#757575'};border:2px solid white;${ring}"></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
  })
}

const cursorIcon = L.divIcon({
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#276EF1;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

/** Build [startIdx, endIdx] segments; segment ending at endIdx uses severityAtEnd if set */
function buildRiskSegments(route, events, durationSec) {
  const len = route.length
  if (len < 2 || !durationSec || durationSec <= 0) return null

  const severityAtIndex = new Map()
  for (const ev of events || []) {
    if (typeof ev.offset_sec !== 'number') continue
    const idx = Math.min(
      Math.max(0, Math.floor((ev.offset_sec / durationSec) * (len - 1))),
      len - 1
    )
    const prev = severityAtIndex.get(idx)
    severityAtIndex.set(idx, prev ? strongerSeverity(prev, ev.severity) : ev.severity || 'low')
  }

  const breakPoints = new Set([0, len - 1])
  severityAtIndex.forEach((_, idx) => breakPoints.add(idx))
  const sorted = [...breakPoints].sort((a, b) => a - b)

  const segments = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    const slice = route.slice(a, b + 1)
    if (slice.length < 2) continue
    const sev = severityAtIndex.get(b)
    segments.push({ latlngs: slice, severity: sev || null })
  }
  return segments.length ? segments : null
}

function eventPopupHtml(ev) {
  const label = escapeHtml(ev.label?.replace(/_/g, ' ') || 'Event')
  const emoji = escapeHtml(ev.emoji || '')
  const sev = escapeHtml(ev.severity || 'low')
  const conf = ev.confidence != null ? Math.round(Number(ev.confidence) * 100) : null
  const summary = ev.explain?.summary ? escapeHtml(ev.explain.summary) : ''
  let html = `<div class="trip-map-popup"><strong>${emoji} ${label}</strong><br/>`
  html += `Severity: <strong>${sev}</strong>`
  if (conf != null) html += `<br/>Confidence: ${conf}%`
  if (summary) html += `<br/><span class="trip-map-popup-summary">${summary}</span>`
  html += '</div>'
  return html
}

export default function TripMap({ route, events, cursorIndex, durationSec }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const cursorMarker = useRef(null)

  useEffect(() => {
    if (!mapRef.current || !route || route.length === 0) return

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        scrollWheelZoom: true,
        zoomControl: true,
      })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OSM',
      }).addTo(mapInstance.current)
    }

    const map = mapInstance.current

    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) map.removeLayer(layer)
    })

    const segments = buildRiskSegments(route, events, durationSec)
    let fitBounds = null
    const extendFit = (layer) => {
      const lb = layer.getBounds()
      fitBounds = fitBounds ? fitBounds.extend(lb) : lb
    }

    if (segments) {
      let drew = false
      for (const seg of segments) {
        const isRisk = seg.severity != null
        const color = isRisk ? severityColor[seg.severity] || CALM_COLOR : CALM_COLOR
        const weight = isRisk && seg.severity !== 'low' ? 5 : 4
        const opacity = isRisk ? 0.92 : 0.55
        const poly = L.polyline(seg.latlngs, { color, weight, opacity }).addTo(map)
        extendFit(poly)
        drew = true
      }
      if (!drew) {
        const poly = L.polyline(route, { color: CALM_COLOR, weight: 4, opacity: 0.8 }).addTo(map)
        extendFit(poly)
      }
    } else {
      const poly = L.polyline(route, {
        color: CALM_COLOR,
        weight: 4,
        opacity: 0.8,
      }).addTo(map)
      extendFit(poly)
    }

    L.marker(route[0], {
      icon: L.divIcon({
        html: `<div style="width:12px;height:12px;border-radius:50%;background:#06C167;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
        className: '',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      }),
    })
      .addTo(map)
      .bindPopup('Start')

    L.marker(route[route.length - 1], {
      icon: L.divIcon({
        html: `<div style="width:12px;height:12px;border-radius:2px;background:#E11900;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
        className: '',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      }),
    })
      .addTo(map)
      .bindPopup('End')

    events?.forEach((ev) => {
      if (ev.location) {
        L.marker(ev.location, { icon: eventIcon(ev.severity) })
          .addTo(map)
          .bindPopup(eventPopupHtml(ev))
      }
    })

    if (fitBounds?.isValid()) map.fitBounds(fitBounds, { padding: [30, 30] })

    cursorMarker.current = L.marker(route[0], { icon: cursorIcon }).addTo(map)
  }, [route, events, durationSec])

  useEffect(() => {
    if (cursorMarker.current && route && cursorIndex !== undefined) {
      const idx = Math.min(Math.max(0, cursorIndex), route.length - 1)
      cursorMarker.current.setLatLng(route[idx])
    }
  }, [cursorIndex, route])

  return (
    <div className="relative w-full h-full min-h-[300px]">
      <div ref={mapRef} className="absolute inset-0 rounded-xl z-0" />
      <div className="absolute top-3 right-3 z-[500] max-w-[200px] rounded-xl border border-white/5 bg-slate-900/80 p-3 text-[11px] leading-snug text-slate-300 shadow-xl backdrop-blur-md">
        <p className="mb-2 font-bold text-white uppercase tracking-wider">Risk along route</p>
        <ul className="space-y-1">
          <li className="flex items-center gap-1.5">
            <span className="h-1 w-4 shrink-0 rounded-full opacity-80" style={{ background: CALM_COLOR }} />
            Calm segment
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-1 w-4 shrink-0 rounded-full" style={{ background: severityColor.low }} />
            Low
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-1 w-4 shrink-0 rounded-full" style={{ background: severityColor.medium }} />
            Medium
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-1 w-4 shrink-0 rounded-full" style={{ background: severityColor.high }} />
            High
          </li>
          <li className="flex items-center gap-2 pt-1.5 border-t border-white/10 mt-2">
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border-2 border-white bg-[#276EF1] shadow" />
            Playback
          </li>
        </ul>
      </div>
    </div>
  )
}
