'use client'

import { useEffect, useRef, useCallback } from 'react'

// Issue category colors
const ISSUE_COLORS: Record<string, string> = {
  traffic:     '#EF4444',
  water:       '#3B82F6',
  electricity: '#F59E0B',
  garbage:     '#10B981',
  other:       '#8B5CF6',
}

export function WardMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)

  const initMap = useCallback(async () => {
    if (!containerRef.current || mapRef.current) return

    // Dynamic import — MapLibre is browser-only
    const maplibregl = (await import('maplibre-gl')).default
    await import('maplibre-gl/dist/maplibre-gl.css')

    const map = new maplibregl.Map({
      container: containerRef.current,
      // OpenFreeMap positron: white bg, dark road outlines, no API key
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [73.904, 18.473],   // Tribeca, NIBM Wanowrie
      zoom: 13.8,
      minZoom: 11,
      maxZoom: 18,
      attributionControl: false,
    })

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right'
    )
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'bottom-right'
    )

    mapRef.current = map

    map.on('load', () => {
      // ── Ward boundary sources ───────────────────────────────────────
      map.addSource('wards-pilot', {
        type: 'geojson',
        data: '/geojson/wards-pilot.geojson',
        promoteId: 'wardnum',
      })
      map.addSource('wards-context', {
        type: 'geojson',
        data: '/geojson/wards-context.geojson',
      })

      // Context ward — very subtle
      map.addLayer({
        id: 'context-fill',
        type: 'fill',
        source: 'wards-context',
        paint: { 'fill-color': '#000000', 'fill-opacity': 0.03 },
      })
      map.addLayer({
        id: 'context-outline',
        type: 'line',
        source: 'wards-context',
        paint: { 'line-color': '#999', 'line-width': 0.6, 'line-opacity': 0.4, 'line-dasharray': [3, 3] },
      })

      // Pilot ward fill — saffron tint, severity-driven
      map.addLayer({
        id: 'wards-fill',
        type: 'fill',
        source: 'wards-pilot',
        paint: {
          'fill-color': [
            'interpolate', ['linear'],
            ['coalesce', ['feature-state', 'severity_avg'], 0],
            0,   '#fff8f0',
            2,   '#FFE8C2',
            3.5, '#FF9933',
            5,   '#c8741a',
          ],
          'fill-opacity': 0.38,
        },
      })
      // Pilot ward border — saffron
      map.addLayer({
        id: 'wards-border',
        type: 'line',
        source: 'wards-pilot',
        paint: {
          'line-color': '#c8741a',
          'line-width': 2,
          'line-opacity': 0.9,
        },
      })
      // Selected ward highlight
      map.addLayer({
        id: 'wards-border-selected',
        type: 'line',
        source: 'wards-pilot',
        paint: {
          'line-color': '#FF9933',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            4, 0,
          ],
        },
      })

      // Ward name labels
      map.addLayer({
        id: 'ward-labels',
        type: 'symbol',
        source: 'wards-pilot',
        layout: {
          'text-field': ['get', 'Name2'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 12, 0, 13, 9, 15, 12],
          'text-letter-spacing': 0.06,
          'text-transform': 'uppercase',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        },
        paint: {
          'text-color': '#4a3000',
          'text-halo-color': 'rgba(255,255,255,0.85)',
          'text-halo-width': 1.5,
        },
      })

      // ── Hotspot cluster source ──────────────────────────────────────
      map.addSource('clusters', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      // Hotspot glow ring
      map.addLayer({
        id: 'hotspot-glow',
        type: 'circle',
        source: 'clusters',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'post_count'],
            1, 18, 30, 36,
          ],
          'circle-color': [
            'match', ['get', 'issue_tag'],
            'traffic',     ISSUE_COLORS.traffic,
            'water',       ISSUE_COLORS.water,
            'electricity', ISSUE_COLORS.electricity,
            'garbage',     ISSUE_COLORS.garbage,
            ISSUE_COLORS.other,
          ],
          'circle-opacity': 0.12,
          'circle-blur': 1,
        },
      })

      // Hotspot solid dot
      map.addLayer({
        id: 'hotspots',
        type: 'circle',
        source: 'clusters',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'post_count'],
            1, 8, 20, 18, 50, 28,
          ],
          'circle-color': [
            'match', ['get', 'issue_tag'],
            'traffic',     ISSUE_COLORS.traffic,
            'water',       ISSUE_COLORS.water,
            'electricity', ISSUE_COLORS.electricity,
            'garbage',     ISSUE_COLORS.garbage,
            ISSUE_COLORS.other,
          ],
          'circle-opacity': 0.92,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
        },
      })

      // ── Interactions ────────────────────────────────────────────────
      let selectedWardId: number | null = null

      map.on('click', 'wards-fill', (e) => {
        if (!e.features?.length) return
        const ward = e.features[0].properties
        const wardId = ward?.wardnum

        // Deselect previous
        if (selectedWardId !== null) {
          map.setFeatureState({ source: 'wards-pilot', id: selectedWardId }, { selected: false })
        }
        selectedWardId = wardId
        map.setFeatureState({ source: 'wards-pilot', id: wardId }, { selected: true })

        const wardName = ward?.Name2 ?? ward?.name ?? `Ward ${wardId}`

        new maplibregl.Popup({ offset: 12, maxWidth: '280px', className: 'sushasan-popup' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="popup-inner">
              <div class="popup-ward-no">WARD ${wardId}</div>
              <div class="popup-ward-name">${wardName}</div>
              <a href="/ward/${wardId}" class="popup-cta">View full analysis →</a>
            </div>
          `)
          .addTo(map)
      })

      map.on('click', 'hotspots', (e) => {
        if (!e.features?.length) return
        const p = e.features[0].properties ?? {}
        // @ts-expect-error geojson coords
        const coords = e.features[0].geometry.coordinates.slice() as [number, number]
        const color = ISSUE_COLORS[p.issue_tag as string] ?? '#FF9933'

        // Parse source_platforms if it's a JSON string
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

        new maplibregl.Popup({ offset: 16, maxWidth: '360px', className: 'sushasan-popup' })
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
              <a href="/dashboard/ward/${p.ward_id}" class="popup-cta">Full analysis →</a>
            </div>
          `)
          .addTo(map)
      })

      // Cursor changes
      map.on('mouseenter', 'wards-fill', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'wards-fill', () => { map.getCanvas().style.cursor = '' })
      map.on('mouseenter', 'hotspots', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'hotspots', () => { map.getCanvas().style.cursor = '' })

      // Load seed data
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
      aria-label="Pune ward hotspot map showing civic issues in NIBM Wanowrie area"
    />
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchClusters(map: any) {
  try {
    const res = await fetch('/api/ward/all')
    if (!res.ok) return
    const { clusters, wardSeverity } = await res.json()

    const source = map.getSource('clusters') as { setData: (data: unknown) => void } | undefined
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
    // Map renders fine without live data
  }
}
