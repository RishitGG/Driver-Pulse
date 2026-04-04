import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

/** Demo overlay — not live traffic or official incident data */
const DEMO_ZONES = [
  {
    center: [12.9782, 77.5835],
    radiusM: 820,
    color: '#E11900',
    title: 'Elevated historical risk',
  },
  {
    center: [12.965, 77.598],
    radiusM: 650,
    color: '#FF6937',
    title: 'Moderate risk cluster',
  },
  {
    center: [12.988, 77.605],
    radiusM: 480,
    color: '#FFC043',
    title: 'Watch zone',
  },
]

const MAP_CENTER = [12.9716, 77.5946]
const DEFAULT_ZOOM = 12

export default function RiskZonesPreviewMap() {
  const mapRef = useRef(null)

  useEffect(() => {
    const el = mapRef.current
    if (!el) return

    const map = L.map(el, {
      scrollWheelZoom: false,
      zoomControl: true,
      dragging: true,
    }).setView(MAP_CENTER, DEFAULT_ZOOM)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)

    const circles = []
    for (const z of DEMO_ZONES) {
      const c = L.circle(z.center, {
        radius: z.radiusM,
        color: z.color,
        weight: 2,
        fillColor: z.color,
        fillOpacity: 0.18,
      })
        .addTo(map)
        .bindPopup(
          `<div class="trip-map-popup"><strong>${z.title}</strong><br/><span style="font-size:11px;opacity:0.85">Demo overlay — illustrative only</span></div>`
        )
      circles.push(c)
    }

    if (circles.length) {
      map.fitBounds(L.featureGroup(circles).getBounds(), { padding: [24, 24], maxZoom: 13 })
    }

    return () => {
      map.remove()
    }
  }, [])

  return (
    <div className="relative h-[220px] w-full min-h-[200px] overflow-hidden rounded-lg border border-orange-200/80 bg-orange-50/30">
      <div ref={mapRef} className="absolute inset-0 z-0 rounded-lg" />
    </div>
  )
}
