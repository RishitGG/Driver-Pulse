import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const severityColor = { low: '#06C167', medium: '#FFC043', high: '#E11900' }

const eventIcon = (severity) =>
  L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${severityColor[severity] || '#757575'};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })

const cursorIcon = L.divIcon({
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#276EF1;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

export default function TripMap({ route, events, cursorIndex }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const cursorMarker = useRef(null)

  useEffect(() => {
    if (!mapRef.current || !route || route.length === 0) return

    // Init map
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

    // Clear layers except tiles
    map.eachLayer(layer => {
      if (!(layer instanceof L.TileLayer)) map.removeLayer(layer)
    })

    // Polyline
    const polyline = L.polyline(route, {
      color: '#276EF1',
      weight: 4,
      opacity: 0.8,
    }).addTo(map)

    // Start / End
    L.marker(route[0], {
      icon: L.divIcon({
        html: `<div style="width:12px;height:12px;border-radius:50%;background:#06C167;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
        className: '', iconSize: [12, 12], iconAnchor: [6, 6],
      }),
    }).addTo(map).bindPopup('Start')

    L.marker(route[route.length - 1], {
      icon: L.divIcon({
        html: `<div style="width:12px;height:12px;border-radius:2px;background:#E11900;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
        className: '', iconSize: [12, 12], iconAnchor: [6, 6],
      }),
    }).addTo(map).bindPopup('End')

    // Event markers
    events?.forEach(ev => {
      if (ev.location) {
        L.marker(ev.location, { icon: eventIcon(ev.severity) })
          .addTo(map)
          .bindPopup(`<b>${ev.emoji} ${ev.label.replace(/_/g, ' ')}</b><br/>Confidence: ${Math.round(ev.confidence * 100)}%`)
      }
    })

    map.fitBounds(polyline.getBounds(), { padding: [30, 30] })

    // Cursor marker
    cursorMarker.current = L.marker(route[0], { icon: cursorIcon }).addTo(map)

    return () => {
      // don't destroy map, just clean up
    }
  }, [route, events])

  // Update cursor position
  useEffect(() => {
    if (cursorMarker.current && route && cursorIndex !== undefined) {
      const idx = Math.min(Math.max(0, cursorIndex), route.length - 1)
      cursorMarker.current.setLatLng(route[idx])
    }
  }, [cursorIndex, route])

  return <div ref={mapRef} className="w-full h-full min-h-[300px] rounded-xl z-0" />
}
