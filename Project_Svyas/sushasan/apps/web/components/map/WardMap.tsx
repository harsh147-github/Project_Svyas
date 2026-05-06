'use client'

import { useEffect, useRef, useCallback } from 'react'

const ISSUE_COLORS: Record<string, string> = {
  traffic:     '#EF4444',
  water:       '#3B82F6',
  electricity: '#F59E0B',
  garbage:     '#10B981',
  other:       '#8B5CF6',
}

// Real OSM vector tiles via OpenFreeMap (no API key, free).
// Positron = clean light style with full road network + buildings + lakes.
const BASEMAP_STYLE = 'https://tiles.openfreemap.org/styles/positron'

export function WardMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<unknown>(null)
  const popupRef     = useRef<unknown>(null)

  const initMap = useCallback(async () => {
    if (!containerRef.current || mapRef.current) return

    const maplibregl = (await import('maplibre-gl')).default
    await import('maplibre-gl/dist/maplibre-gl.css')

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      // Centre on actual pilot ward bbox (NIBM + Mohammadwadi + Kondhwa belt)
      center: [73.937, 18.466],
      zoom: 13,
      // Lock to greater Pune so we only fetch Pune-area tiles, not the world
      maxBounds: [
        [73.74, 18.38], // SW — Khadakwasla / Sinhgad foothills
        [74.05, 18.65], // NE — past Wagholi / Lohegaon
      ],
      minZoom: 11.5,
      maxZoom: 17,
      attributionControl: false,
    })

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')

    mapRef.current = map

    map.on('load', () => {
      if (map.getSource('wards-pilot')) return  // guard against double-mount
      // ── Ward sources ──────────────────────────────────────────────────────
      map.addSource('wards-context', {
        type: 'geojson',
        data: '/geojson/wards-context.geojson',
      })
      map.addSource('wards-pilot', {
        type: 'geojson',
        data: '/geojson/wards-pilot.geojson',
        promoteId: 'wardnum',
      })

      // ── Context wards — thin clean black subdivision lines ─────────────
      map.addLayer({
        id: 'context-fill',
        type: 'fill',
        source: 'wards-context',
        paint: {
          'fill-color': '#0a0a0a',
          'fill-opacity': 0.02,
        },
      })
      map.addLayer({
        id: 'context-border',
        type: 'line',
        source: 'wards-context',
        paint: {
          'line-color': '#0a0a0a',
          'line-width': 1.2,
          'line-opacity': 0.55,
        },
      })

      // ── Pilot wards — saffron fill, very subtle baseline, bold on select
      map.addLayer({
        id: 'pilot-fill',
        type: 'fill',
        source: 'wards-pilot',
        paint: {
          'fill-color': '#FF9933',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 0.55,
            ['boolean', ['feature-state', 'hover'], false],    0.18,
            0.06,
          ],
        },
      })

      // ── Pilot ward "railway-track" double-stripe border ────────────────
      // Layer 1: thick black baseline line
      map.addLayer({
        id: 'pilot-border-base',
        type: 'line',
        source: 'wards-pilot',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], '#c8741a',
            '#0a0a0a',
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 7,
            5,
          ],
          'line-opacity': 0.95,
        },
      })
      // Layer 2: white dashed line on top — creates the railroad-tracks effect
      map.addLayer({
        id: 'pilot-border-dash',
        type: 'line',
        source: 'wards-pilot',
        layout: { 'line-cap': 'butt' },
        paint: {
          'line-color': '#ffffff',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 2.4,
            1.6,
          ],
          'line-dasharray': [2, 2],
          'line-opacity': 0.95,
        },
      })

      // Context ward labels — neighbourhood-name hints on outer wards
      map.addLayer({
        id: 'context-labels',
        type: 'symbol',
        source: 'wards-context',
        minzoom: 12,
        layout: {
          'text-field': ['get', 'Name2'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 12, 9, 15, 11],
          'text-letter-spacing': 0.18,
          'text-font': ['Noto Sans Regular'],
          'text-transform': 'uppercase',
          'text-max-width': 8,
        },
        paint: {
          'text-color': '#0a0a0a',
          'text-opacity': 0.45,
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.6,
        },
      })

      // Pilot ward labels — uppercase WARD number (saffron) + serif name
      // Two-line format mirrors the kondo-city / civic-design reference
      map.addLayer({
        id: 'pilot-labels',
        type: 'symbol',
        source: 'wards-pilot',
        layout: {
          'text-field': [
            'format',
            ['concat', 'WARD ', ['to-string', ['get', 'wardnum']]],
            { 'font-scale': 0.62, 'text-color': '#c8741a' },
            '\n', {},
            ['get', 'Name2'],
            { 'font-scale': 1.05 },
          ],
          'text-size': ['interpolate', ['linear'], ['zoom'], 11, 11, 13, 14, 15, 16],
          'text-letter-spacing': 0.06,
          'text-font': ['Noto Sans Bold'],
          'text-max-width': 9,
          'text-line-height': 1.4,
          'text-transform': 'uppercase',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#0a0a0a',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2.4,
          'text-halo-blur': 0.4,
        },
      })

      // ── Hotspot cluster source ────────────────────────────────────────────
      map.addSource('clusters', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      // Glow ring
      map.addLayer({
        id: 'hotspot-glow',
        type: 'circle',
        source: 'clusters',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'post_count'], 1, 22, 50, 40],
          'circle-color': [
            'match', ['get', 'issue_tag'],
            'traffic',     ISSUE_COLORS.traffic,
            'water',       ISSUE_COLORS.water,
            'electricity', ISSUE_COLORS.electricity,
            'garbage',     ISSUE_COLORS.garbage,
            ISSUE_COLORS.other,
          ],
          'circle-opacity': 0.14,
          'circle-blur': 0.8,
        },
      })

      // Solid dot
      map.addLayer({
        id: 'hotspots',
        type: 'circle',
        source: 'clusters',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'post_count'], 1, 9, 20, 18, 50, 28],
          'circle-color': [
            'match', ['get', 'issue_tag'],
            'traffic',     ISSUE_COLORS.traffic,
            'water',       ISSUE_COLORS.water,
            'electricity', ISSUE_COLORS.electricity,
            'garbage',     ISSUE_COLORS.garbage,
            ISSUE_COLORS.other,
          ],
          'circle-opacity': 0.95,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
        },
      })

      // ── Interactions ──────────────────────────────────────────────────────
      let selectedId: number | null = null

      function clearSelected() {
        if (selectedId !== null) {
          map.setFeatureState({ source: 'wards-pilot', id: selectedId }, { selected: false })
          selectedId = null
        }
      }

      // Ward click → selection highlight + dispatch event for SelectedWardPanel
      map.on('click', 'pilot-fill', (e) => {
        if (!e.features?.length) return
        const props = e.features[0].properties
        const wardnum = props?.wardnum as number

        clearSelected()
        selectedId = wardnum
        map.setFeatureState({ source: 'wards-pilot', id: wardnum }, { selected: true })

        const name = props?.Name2 ?? `Ward ${wardnum}`
        window.dispatchEvent(new CustomEvent('sushaasan:ward-selected', {
          detail: { wardnum, name, tier: props?.tier ?? 'pilot' },
        }))
      })

      // Hotspot click
      map.on('click', 'hotspots', (e) => {
        if (!e.features?.length) return
        const p = e.features[0].properties ?? {}
        // @ts-expect-error geojson coords
        const coords = e.features[0].geometry.coordinates.slice() as [number, number]
        const color = ISSUE_COLORS[p.issue_tag as string] ?? '#FF9933'

        let platforms: string[] = []
        try {
          const sp = p.source_platforms
          platforms = typeof sp === 'string' ? JSON.parse(sp) : (Array.isArray(sp) ? sp : [])
        } catch { platforms = [] }

        const platformIcons: Record<string, string> = {
          instagram: '📷', reddit: '💬', twitter: '𝕏', facebook: '📘',
        }
        const platformHtml = platforms.length > 0
          ? `<div class="popup-platforms">${platforms.map((pl: string) => `<span class="popup-platform-badge">${platformIcons[pl] ?? '📌'} ${pl}</span>`).join(' ')}</div>`
          : ''

        const citizenSection = p.citizen_headline
          ? `<div class="popup-citizen"><div class="popup-section-label">FOR CITIZENS</div><div class="popup-citizen-headline">${p.citizen_headline}</div>${p.problem_simple ? `<div class="popup-citizen-detail">${p.problem_simple}</div>` : ''}</div>`
          : ''

        const govSection = p.gov_summary
          ? `<div class="popup-gov"><div class="popup-section-label">FOR GOVERNMENT</div><div class="popup-gov-text">${p.gov_summary}</div></div>`
          : ''

        const fallbackSolution = !p.citizen_headline && p.solution_summary
          ? `<div class="popup-solution"><b>Solution →</b> ${p.solution_summary}</div>`
          : ''

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(popupRef.current as any)?.remove()
        const popup = new maplibregl.Popup({
          offset: 16, maxWidth: '340px', className: 'sushasan-popup',
        })
          .setLngLat(coords)
          .setHTML(`
            <div class="popup-inner">
              <span class="popup-tag" style="background:${color}22;color:${color};border:1px solid ${color}55">
                ${(p.issue_tag as string ?? '').toUpperCase()}
              </span>
              <div class="popup-issue-text">${p.centroid_text ?? ''}</div>
              <div class="popup-meta">
                <span><b>${p.post_count ?? 0}</b> reports</span>
                <span>severity ${Number(p.severity_avg ?? 0).toFixed(1)}/5</span>
              </div>
              ${platformHtml}
              ${citizenSection}
              ${govSection}
              ${fallbackSolution}
              <a href="/dashboard/nibm" class="popup-cta">Full AI solution brief →</a>
            </div>
          `)
          .addTo(map)
        popupRef.current = popup

        e.stopPropagation()
      })

      // Click outside — deselect
      map.on('click', (e) => {
        // @ts-expect-error defaultPrevented not standard on MapLibre events
        if (e.defaultPrevented) return
        const features = map.queryRenderedFeatures(e.point, { layers: ['pilot-fill', 'hotspots'] })
        if (!features.length) {
          clearSelected()
          window.dispatchEvent(new CustomEvent('sushaasan:ward-cleared'))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(popupRef.current as any)?.remove()
        }
      })

      // External deselect (e.g. user closes panel)
      window.addEventListener('sushaasan:ward-deselect', () => {
        clearSelected()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(popupRef.current as any)?.remove()
      })

      // Geolocation: fly to user, find containing pilot ward, select it
      window.addEventListener('sushaasan:locate', (ev) => {
        const { lat, lng } = (ev as CustomEvent).detail as { lat: number; lng: number }
        map.flyTo({ center: [lng, lat], zoom: 14, speed: 1.4 })
        // small delay so source data is queryable at new viewport
        setTimeout(() => {
          const point = map.project([lng, lat])
          const feats = map.queryRenderedFeatures(point, { layers: ['pilot-fill'] })
          if (feats.length) {
            const f = feats[0]
            const wardnum = f.properties?.wardnum as number
            clearSelected()
            selectedId = wardnum
            map.setFeatureState({ source: 'wards-pilot', id: wardnum }, { selected: true })
            window.dispatchEvent(new CustomEvent('sushaasan:ward-selected', {
              detail: { wardnum, name: f.properties?.Name2 ?? `Ward ${wardnum}`, tier: f.properties?.tier ?? 'pilot' },
            }))
          }
        }, 700)
      })

      // Cursors + hover state for ward fill
      let hoverId: number | null = null
      map.on('mousemove', 'pilot-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer'
        const wardnum = e.features?.[0]?.properties?.wardnum as number | undefined
        if (wardnum == null || wardnum === hoverId) return
        if (hoverId !== null) {
          map.setFeatureState({ source: 'wards-pilot', id: hoverId }, { hover: false })
        }
        hoverId = wardnum
        map.setFeatureState({ source: 'wards-pilot', id: hoverId }, { hover: true })
      })
      map.on('mouseleave', 'pilot-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoverId !== null) {
          map.setFeatureState({ source: 'wards-pilot', id: hoverId }, { hover: false })
          hoverId = null
        }
      })
      map.on('mouseenter', 'hotspots',   () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'hotspots',   () => { map.getCanvas().style.cursor = '' })

      fetchClusters(map)
    })
  }, [])

  useEffect(() => {
    initMap()
    return () => {
      // @ts-expect-error mapref
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [initMap])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      role="img"
      aria-label="Pune ward map showing civic issues in NIBM Kondhwa area"
    />
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchClusters(map: any) {
  try {
    const res = await fetch('/api/ward/all')
    if (!res.ok) return
    const { clusters, wardSeverity } = await res.json()

    const source = map.getSource('clusters') as { setData: (d: unknown) => void } | undefined
    source?.setData({
      type: 'FeatureCollection',
      features: (clusters as Array<Record<string, unknown>>).map((c) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
        properties: c,
      })),
    })

    for (const { wardnum, severity_avg } of (wardSeverity as Array<{ wardnum: number; severity_avg: number }>) ?? []) {
      map.setFeatureState({ source: 'wards-pilot', id: wardnum }, { severity_avg })
    }
  } catch {
    // renders fine without live data
  }
}
