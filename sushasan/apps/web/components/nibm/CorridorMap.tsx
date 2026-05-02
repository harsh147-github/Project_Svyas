'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import {
  HOTSPOTS,
  CORRIDOR_PATH,
  NIBM_CORRIDOR_CENTER,
  type Hotspot,
} from '@/lib/nibm-pilot-data'

const SEVERITY_COLOR_BY_INTENSITY = (i: number) =>
  i >= 0.95 ? '#dc2626'   // critical red
  : i >= 0.85 ? '#ea580c' // saffron-burnt
  : i >= 0.70 ? '#f59e0b' // amber
  : '#10b981'             // green

type Props = {
  selectedHotspotId: string | null
  onSelectHotspot: (id: string) => void
}

export function CorridorMap({ selectedHotspotId, onSelectHotspot }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)
  const [mapReady, setMapReady] = useState(false)

  const initMap = useCallback(async () => {
    if (!containerRef.current || mapRef.current) return

    const maplibregl = (await import('maplibre-gl')).default
    await import('maplibre-gl/dist/maplibre-gl.css')

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        ? `https://api.mapbox.com/styles/v1/mapbox/light-v11?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
        : 'https://tiles.openfreemap.org/styles/positron',
      center: NIBM_CORRIDOR_CENTER,
      zoom: 15.4,
      minZoom: 13,
      maxZoom: 19,
      attributionControl: false,
      pitch: 0,
      bearing: 0,
      pitchWithRotate: false,
      dragRotate: false,
    })
    map.touchZoomRotate.disableRotation()
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    mapRef.current = map

    map.on('load', () => {
      // Corridor centerline polyline
      map.addSource('corridor', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: CORRIDOR_PATH },
        },
      })
      map.addLayer({
        id: 'corridor-glow',
        type: 'line',
        source: 'corridor',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#FF9933',
          'line-width': 12,
          'line-blur': 8,
          'line-opacity': 0.18,
        },
      })
      map.addLayer({
        id: 'corridor-line',
        type: 'line',
        source: 'corridor',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#FF9933',
          'line-width': 3.5,
          'line-opacity': 0.85,
        },
      })

      // Hotspots as a GeoJSON source
      map.addSource('hotspots', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: HOTSPOTS.map((h) => ({
            type: 'Feature',
            id: h.id,
            properties: {
              id: h.id,
              label: h.label,
              intensity: h.intensity,
              blurb: h.blurb,
              color: SEVERITY_COLOR_BY_INTENSITY(h.intensity),
            },
            geometry: { type: 'Point', coordinates: [h.lng, h.lat] },
          })),
        },
        promoteId: 'id',
      })

      // Outer halo (animated via feature-state on hover)
      map.addLayer({
        id: 'hotspots-halo',
        type: 'circle',
        source: 'hotspots',
        paint: {
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 38,
            ['boolean', ['feature-state', 'hover'], false], 32,
            26,
          ],
          'circle-color': ['get', 'color'],
          'circle-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 0.18,
            ['boolean', ['feature-state', 'hover'], false], 0.16,
            0.12,
          ],
          'circle-blur': 0.65,
          'circle-pitch-alignment': 'map',
        },
      })

      // Solid core circle
      map.addLayer({
        id: 'hotspots-core',
        type: 'circle',
        source: 'hotspots',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'intensity'],
            0.5, 8,
            0.7, 11,
            0.9, 14,
            1.0, 16,
          ],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.92,
          'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 4,
            ['boolean', ['feature-state', 'hover'], false], 3,
            2,
          ],
          'circle-stroke-color': '#ffffff',
        },
      })

      // Hotspot text labels
      map.addLayer({
        id: 'hotspot-labels',
        type: 'symbol',
        source: 'hotspots',
        layout: {
          'text-field': ['get', 'label'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 11,
          'text-offset': [0, 1.6],
          'text-anchor': 'top',
          'text-allow-overlap': false,
          'text-padding': 4,
        },
        paint: {
          'text-color': '#0a0a0a',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2,
        },
      })

      // Hover state
      let hoverId: string | null = null
      map.on('mousemove', 'hotspots-core', (e) => {
        const f = e.features?.[0]
        if (!f) return
        if (hoverId !== null && hoverId !== f.id) {
          map.setFeatureState({ source: 'hotspots', id: hoverId }, { hover: false })
        }
        hoverId = f.id as string
        map.setFeatureState({ source: 'hotspots', id: hoverId }, { hover: true })
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'hotspots-core', () => {
        if (hoverId !== null) {
          map.setFeatureState({ source: 'hotspots', id: hoverId }, { hover: false })
        }
        hoverId = null
        map.getCanvas().style.cursor = ''
      })

      map.on('click', 'hotspots-core', (e) => {
        const f = e.features?.[0]
        if (!f) return
        const id = f.id as string
        onSelectHotspot(id)
      })

      setMapReady(true)
    })
  }, [onSelectHotspot])

  useEffect(() => {
    initMap()
    return () => {
      if (mapRef.current) {
        type DisposableMap = { remove: () => void }
        const m = mapRef.current as DisposableMap
        if (typeof m.remove === 'function') m.remove()
        mapRef.current = null
      }
    }
  }, [initMap])

  // When the parent changes the selected hotspot, fly to it and toggle feature-state.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    type FeatureStateMap = {
      flyTo: (opts: { center: [number, number]; zoom?: number; speed?: number; curve?: number; essential?: boolean }) => void
      setFeatureState: (target: { source: string; id: string }, state: Record<string, unknown>) => void
    }
    const map = mapRef.current as FeatureStateMap

    HOTSPOTS.forEach((h) => {
      map.setFeatureState({ source: 'hotspots', id: h.id }, { selected: h.id === selectedHotspotId })
    })

    if (selectedHotspotId) {
      const h: Hotspot | undefined = HOTSPOTS.find((x) => x.id === selectedHotspotId)
      if (h) {
        map.flyTo({
          center: [h.lng, h.lat],
          zoom: 16.4,
          speed: 0.9,
          curve: 1.4,
          essential: true,
        })
      }
    }
  }, [mapReady, selectedHotspotId])

  return (
    <div ref={containerRef} className="w-full h-full" aria-label="NIBM corridor map" />
  )
}
