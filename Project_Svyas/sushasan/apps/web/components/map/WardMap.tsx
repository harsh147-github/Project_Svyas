'use client'

import { useEffect, useRef, useCallback } from 'react'

const ISSUE_COLORS: Record<string, string> = {
  traffic:     '#EF4444',
  water:       '#3B82F6',
  electricity: '#F59E0B',
  garbage:     '#10B981',
  other:       '#8B5CF6',
}

const ISSUE_ICONS: Record<string, string> = {
  traffic:     '🚗',
  water:       '💧',
  electricity: '⚡',
  garbage:     '🗑️',
  other:       '📌',
}

function makeIconImageData(
  emoji: string,
  bgColor: string,
  size = 48,
): { width: number; height: number; data: Uint8Array } {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Soft drop shadow
  ctx.shadowColor = 'rgba(0,0,0,0.28)'
  ctx.shadowBlur = 4
  ctx.shadowOffsetY = 1.5

  // Filled circle background
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2)
  ctx.fillStyle = bgColor
  ctx.fill()

  // White border ring
  ctx.shadowColor = 'transparent'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2.5
  ctx.stroke()

  // Emoji centred
  ctx.font = `${Math.round(size * 0.44)}px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, size / 2, size / 2 + 1)

  const raw = ctx.getImageData(0, 0, size, size)
  return { width: size, height: size, data: new Uint8Array(raw.data.buffer) }
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
      // Centre on all of Pune so the full city + all wards are visible at startup
      center: [73.856, 18.524],
      zoom: 11.8,
      // Lock to greater Pune so we only fetch Pune-area tiles, not the world
      maxBounds: [
        [73.68, 18.35], // SW — Hinjawadi / Mulshi foothills
        [74.10, 18.68], // NE — past Wagholi / Alandi
      ],
      minZoom: 11,
      maxZoom: 17,
      attributionControl: false,
    })

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')

    mapRef.current = map

    map.on('load', () => {
      if (map.getSource('wards-pilot')) return  // guard against double-mount
      // ── Ward sources ──────────────────────────────────────────────────────
      // Both pilot + context promoted on wardnum so every one of the 58 PMC
      // electoral wards has its own feature-state for selected/hover.
      map.addSource('wards-context', {
        type: 'geojson',
        data: '/geojson/wards-context.geojson',
        promoteId: 'wardnum',
      })
      map.addSource('wards-pilot', {
        type: 'geojson',
        data: '/geojson/wards-pilot.geojson',
        promoteId: 'wardnum',
      })

      // ── Context wards — all wards get a visible saffron fill so every
      //    part of Pune looks interactive and accessible to citizens.
      map.addLayer({
        id: 'context-fill',
        type: 'fill',
        source: 'wards-context',
        paint: {
          'fill-color': '#FF9933',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 0.38,
            ['boolean', ['feature-state', 'hover'], false], 0.22,
            ['>', ['coalesce', ['feature-state', 'severity_avg'], 0], 0], 0.18,
            0.14,
          ],
        },
      })
      // Saffron border on every context ward — matches the pilot-ward style
      map.addLayer({
        id: 'context-border-base',
        type: 'line',
        source: 'wards-context',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], '#c8741a',
            ['boolean', ['feature-state', 'hover'], false],    '#FF9933',
            '#FF9933',
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 2.8,
            ['boolean', ['feature-state', 'hover'], false],    2.0,
            1.2,
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 1.0,
            ['boolean', ['feature-state', 'hover'], false],    0.85,
            0.7,
          ],
        },
      })

      // ── Pilot wards — saffron fill, gentle at rest, lights up on hover/select
      map.addLayer({
        id: 'pilot-fill',
        type: 'fill',
        source: 'wards-pilot',
        paint: {
          'fill-color': '#FF9933',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 0.42,
            ['boolean', ['feature-state', 'hover'], false],    0.18,
            0.06,
          ],
        },
      })
      // Single saffron border — bright on selected/hover so the ward "lifts" off the streets
      map.addLayer({
        id: 'pilot-border-base',
        type: 'line',
        source: 'wards-pilot',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], '#c8741a',
            ['boolean', ['feature-state', 'hover'], false],    '#FF9933',
            '#FF9933',
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 3.5,
            ['boolean', ['feature-state', 'hover'], false],    2.5,
            1.4,
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 1.0,
            ['boolean', ['feature-state', 'hover'], false],    0.85,
            0.5,
          ],
        },
      })

      // Context ward labels — every ward shows its name from zoom 12+
      map.addLayer({
        id: 'context-labels',
        type: 'symbol',
        source: 'wards-context',
        minzoom: 12,
        layout: {
          'text-field': [
            'format',
            ['concat', 'WARD ', ['to-string', ['get', 'wardnum']]],
            { 'font-scale': 0.6 },
            '\n', {},
            ['get', 'Name2'],
            { 'font-scale': 1.0 },
          ],
          'text-size': ['interpolate', ['linear'], ['zoom'], 12, 9, 15, 12],
          'text-letter-spacing': 0.1,
          'text-font': ['Noto Sans Regular'],
          'text-transform': 'uppercase',
          'text-max-width': 9,
          'text-line-height': 1.4,
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#0a0a0a',
          'text-opacity': 0.55,
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.8,
        },
      })

      // Pilot ward labels — bolder, saffron WARD number on top
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

      // Pre-render emoji icons onto canvas and register with the map
      const iconDefs = [
        { name: 'icon-traffic',     emoji: ISSUE_ICONS.traffic,     color: ISSUE_COLORS.traffic },
        { name: 'icon-water',       emoji: ISSUE_ICONS.water,       color: ISSUE_COLORS.water },
        { name: 'icon-electricity', emoji: ISSUE_ICONS.electricity, color: ISSUE_COLORS.electricity },
        { name: 'icon-garbage',     emoji: ISSUE_ICONS.garbage,     color: ISSUE_COLORS.garbage },
        { name: 'icon-other',       emoji: ISSUE_ICONS.other,       color: ISSUE_COLORS.other },
      ]
      for (const { name, emoji, color } of iconDefs) {
        if (!map.hasImage(name)) {
          map.addImage(name, makeIconImageData(emoji, color, 48))
        }
      }

      // Soft glow ring behind each icon
      map.addLayer({
        id: 'hotspot-glow',
        type: 'circle',
        source: 'clusters',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'post_count'], 1, 26, 50, 44],
          'circle-color': [
            'match', ['get', 'issue_tag'],
            'traffic',     ISSUE_COLORS.traffic,
            'water',       ISSUE_COLORS.water,
            'electricity', ISSUE_COLORS.electricity,
            'garbage',     ISSUE_COLORS.garbage,
            ISSUE_COLORS.other,
          ],
          'circle-opacity': 0.13,
          'circle-blur': 0.9,
        },
      })

      // Emoji icon markers (replaces plain coloured dots)
      map.addLayer({
        id: 'hotspot-icons',
        type: 'symbol',
        source: 'clusters',
        layout: {
          'icon-image': [
            'match', ['get', 'issue_tag'],
            'traffic',     'icon-traffic',
            'water',       'icon-water',
            'electricity', 'icon-electricity',
            'garbage',     'icon-garbage',
            'icon-other',
          ],
          'icon-size': [
            'interpolate', ['linear'], ['get', 'post_count'],
            1, 0.65,   20, 0.85,   50, 1.1,
          ],
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-pitch-alignment': 'viewport',
          'icon-rotation-alignment': 'viewport',
        },
      })

      // ── Interactions ──────────────────────────────────────────────────────
      // Track selection across BOTH sources (pilot or context).
      let selected: { source: 'wards-pilot' | 'wards-context'; id: number } | null = null

      function clearSelected() {
        if (selected) {
          map.setFeatureState({ source: selected.source, id: selected.id }, { selected: false })
          selected = null
        }
      }

      function selectWard(source: 'wards-pilot' | 'wards-context', props: Record<string, unknown>) {
        const wardnum = props?.wardnum as number
        if (wardnum == null) return
        clearSelected()
        selected = { source, id: wardnum }
        map.setFeatureState({ source, id: wardnum }, { selected: true })
        window.dispatchEvent(new CustomEvent('sushaasan:ward-selected', {
          detail: {
            wardnum,
            name: (props?.Name2 as string) ?? `Ward ${wardnum}`,
            tier: (props?.tier as string) ?? source.replace('wards-', ''),
          },
        }))
      }

      // Click on any pilot ward
      map.on('click', 'pilot-fill', (e) => {
        if (!e.features?.length) return
        selectWard('wards-pilot', e.features[0].properties as Record<string, unknown>)
      })

      // Click on any context ward — every one of the 58 PMC wards is now selectable
      map.on('click', 'context-fill', (e) => {
        if (!e.features?.length) return
        // If the click also hit a pilot ward (overlap), let pilot-fill handle it
        const pilotHit = map.queryRenderedFeatures(e.point, { layers: ['pilot-fill'] })
        if (pilotHit.length) return
        selectWard('wards-context', e.features[0].properties as Record<string, unknown>)
      })

      // Hotspot click
      map.on('click', 'hotspot-icons', (e) => {
        if (!e.features?.length) return
        const p = e.features[0].properties ?? {}
        // @ts-expect-error geojson coords
        const coords = e.features[0].geometry.coordinates.slice() as [number, number]

        // Mobile: skip the floating popup — open the CitizenSheet bottom sheet directly
        if (window.innerWidth < 768) {
          window.dispatchEvent(new CustomEvent('sushaasan:citizen-sheet-open', {
            detail: { wardId: String(p.ward_id ?? ''), issueTag: String(p.issue_tag ?? '') },
          }))
          e.stopPropagation()
          return
        }

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
              <div class="popup-cta-row">
                     <button class="popup-btn-citizen" onclick="window.dispatchEvent(new CustomEvent('sushaasan:citizen-sheet-open',{detail:{wardId:'${p.ward_id ?? ''}',issueTag:'${p.issue_tag ?? ''}'}}))">
                       \u{1F465} What's happening?
                     </button>
                     <button class="popup-btn-gov" onclick="window.dispatchEvent(new CustomEvent('sushaasan:gov-sheet-open',{detail:{wardId:'${p.ward_id ?? ''}'}}))">
                       \u{1F4CB} Action Brief
                     </button>
                   </div>
            </div>
          `)
          .addTo(map)
        popupRef.current = popup

        e.stopPropagation()
      })

      // Click outside — deselect (checks all interactive layers so tapping any
      // ward or hotspot does not accidentally trigger the deselect path)
      map.on('click', (e) => {
        // @ts-expect-error defaultPrevented not standard on MapLibre events
        if (e.defaultPrevented) return
        const features = map.queryRenderedFeatures(e.point, { layers: ['pilot-fill', 'context-fill', 'hotspot-icons'] })
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

      // Geolocation: fly to user, find containing ward (pilot or context), select it
      window.addEventListener('sushaasan:locate', (ev) => {
        const { lat, lng } = (ev as CustomEvent).detail as { lat: number; lng: number }
        map.flyTo({ center: [lng, lat], zoom: 14, speed: 1.4 })
        setTimeout(() => {
          const point = map.project([lng, lat])
          const pilotFeats = map.queryRenderedFeatures(point, { layers: ['pilot-fill'] })
          if (pilotFeats.length) {
            selectWard('wards-pilot', pilotFeats[0].properties as Record<string, unknown>)
            return
          }
          const contextFeats = map.queryRenderedFeatures(point, { layers: ['context-fill'] })
          if (contextFeats.length) {
            selectWard('wards-context', contextFeats[0].properties as Record<string, unknown>)
          }
        }, 700)
      })

      // From /add-report: fly to a specific ward centroid and select it (any ward)
      window.addEventListener('sushaasan:auto-select-ward', ((e: CustomEvent) => {
        const { wardId, lat, lng } = e.detail as { wardId: string; lat: number; lng: number }
        map.flyTo({ center: [lng, lat], zoom: 14.5, speed: 1.2, curve: 1.2 })
        map.once('moveend', () => {
          const point = map.project([lng, lat])
          const pilotFeats = map.queryRenderedFeatures(point, { layers: ['pilot-fill'] })
          if (pilotFeats.length) {
            selectWard('wards-pilot', pilotFeats[0].properties as Record<string, unknown>)
            return
          }
          const contextFeats = map.queryRenderedFeatures(point, { layers: ['context-fill'] })
          if (contextFeats.length) {
            selectWard('wards-context', contextFeats[0].properties as Record<string, unknown>)
            return
          }
          // Fallback: synthesise props from wardId
          selectWard('wards-context', { wardnum: Number(wardId), Name2: `Ward ${wardId}` })
        })
      }) as EventListener)

      // Cursors + hover state — broadcasts to side panels.
      // Both pilot and context wards hover, with pilot taking precedence on overlap.
      let hover: { source: 'wards-pilot' | 'wards-context'; id: number } | null = null

      function clearHover() {
        if (hover) {
          map.setFeatureState({ source: hover.source, id: hover.id }, { hover: false })
          hover = null
        }
      }

      function setHover(source: 'wards-pilot' | 'wards-context', props: Record<string, unknown>) {
        const wardnum = props?.wardnum as number
        if (wardnum == null) return
        if (hover && hover.source === source && hover.id === wardnum) return
        clearHover()
        hover = { source, id: wardnum }
        map.setFeatureState({ source, id: wardnum }, { hover: true })
        window.dispatchEvent(new CustomEvent('sushaasan:ward-hovered', {
          detail: {
            wardnum,
            name: (props?.Name2 as string) ?? `Ward ${wardnum}`,
            tier: (props?.tier as string) ?? source.replace('wards-', ''),
          },
        }))
      }

      map.on('mousemove', 'pilot-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer'
        if (e.features?.[0]) setHover('wards-pilot', e.features[0].properties as Record<string, unknown>)
      })
      map.on('mousemove', 'context-fill', (e) => {
        // If pilot covers this point, let pilot-fill handler run instead
        const pilotHit = map.queryRenderedFeatures(e.point, { layers: ['pilot-fill'] })
        if (pilotHit.length) return
        map.getCanvas().style.cursor = 'pointer'
        if (e.features?.[0]) setHover('wards-context', e.features[0].properties as Record<string, unknown>)
      })
      map.on('mouseleave', 'pilot-fill', () => {
        map.getCanvas().style.cursor = ''
        clearHover()
        window.dispatchEvent(new CustomEvent('sushaasan:ward-unhovered'))
      })
      map.on('mouseleave', 'context-fill', () => {
        map.getCanvas().style.cursor = ''
        clearHover()
        window.dispatchEvent(new CustomEvent('sushaasan:ward-unhovered'))
      })
      // ── Hotspot tooltips ─────────────────────────────────────────────────
      const tooltip = document.createElement('div')
      tooltip.setAttribute('data-sushasan-tooltip', '1')
      tooltip.style.cssText = `
        position: absolute;
        pointer-events: none;
        z-index: 10;
        background: rgba(11,31,58,0.88);
        color: #fff;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        font-family: -apple-system, sans-serif;
        white-space: nowrap;
        box-shadow: 0 4px 14px rgba(0,0,0,0.25);
        opacity: 0;
        transition: opacity 0.15s ease;
        transform: translateY(-4px);
        pointer-events: none;
      `
      document.body.appendChild(tooltip)

      map.on('mouseenter', 'hotspot-icons', (e) => {
        map.getCanvas().style.cursor = 'pointer'
        const features = e.features
        if (!features || features.length === 0) return
        const p = features[0].properties as Record<string, unknown>
        const issueLabel = ({ traffic: 'Traffic', water: 'Water', electricity: 'Electricity', garbage: 'Garbage', other: 'Other' } as Record<string, string>)[String(p.issue_tag ?? '')] ?? String(p.issue_tag ?? '')
        const count = p.post_count ?? ''
        const area = p.ward_name ?? ''
        tooltip.textContent = `${issueLabel} · ${count} reports · ${area}`
        tooltip.style.opacity = '1'
        const rect = map.getCanvas().getBoundingClientRect()
        tooltip.style.left = `${rect.left + e.point.x}px`
        tooltip.style.top = `${rect.top + e.point.y - 44}px`
      })

      map.on('mousemove', 'hotspot-icons', (e) => {
        const rect = map.getCanvas().getBoundingClientRect()
        tooltip.style.left = `${rect.left + e.point.x}px`
        tooltip.style.top = `${rect.top + e.point.y - 44}px`
      })

      map.on('mouseleave', 'hotspot-icons', () => {
        map.getCanvas().style.cursor = ''
        tooltip.style.opacity = '0'
      })

      fetchClusters(map)
    })
  }, [])

  // When a citizen submits a report (from InlineReportSheet on this page),
  // immediately add their formal grievance as a hotspot on the map.
  useEffect(() => {
    function handleReportSubmitted(ev: Event) {
      const cluster = (ev as CustomEvent).detail as Record<string, unknown>
      if (!cluster || typeof cluster.lng !== 'number' || typeof cluster.lat !== 'number') return
      // Add to session list if not already there
      if (!_userClusters.find((c) => c.id === cluster.id)) {
        _userClusters.push(cluster)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = mapRef.current as any
      if (map) applyClusterData(map, _lastApiClusters)
    }
    window.addEventListener('sushaasan:report-submitted', handleReportSubmitted)
    return () => window.removeEventListener('sushaasan:report-submitted', handleReportSubmitted)
  }, [])

  // Listen for issue-filter events from LegendBar and filter hotspot layers accordingly
  useEffect(() => {
    function handleIssueFilter(ev: Event) {
      const map = mapRef.current as {
        setFilter: (layer: string, filter: unknown) => void;
        getLayer: (id: string) => unknown;
      } | null
      if (!map) return
      const { filters } = (ev as CustomEvent).detail as { filters: string[] }
      const filter = filters.length === 0
        ? null
        : ['in', ['get', 'issue_tag'], ['literal', filters]]
      // Only set filter if the layers exist
      if (map.getLayer('hotspot-icons')) map.setFilter('hotspot-icons', filter)
      if (map.getLayer('hotspot-glow'))  map.setFilter('hotspot-glow', filter)
    }

    window.addEventListener('sushaasan:issue-filter', handleIssueFilter)
    return () => window.removeEventListener('sushaasan:issue-filter', handleIssueFilter)
  }, [])

  useEffect(() => {
    initMap()
    return () => {
      // @ts-expect-error mapref
      mapRef.current?.remove()
      mapRef.current = null
      // Remove the tooltip DOM node if it was created
      document.querySelectorAll('div[data-sushasan-tooltip]').forEach(el => el.remove())
    }
  }, [initMap])

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full"
        role="img"
        aria-label="Pune ward map showing civic issues across the city"
      />
    </div>
  )
}

// ── Optimistic user-submitted clusters (same browser session) ─────────────────
const _userClusters: Record<string, unknown>[] = []

// Load any cluster submitted before navigating to this page
if (typeof window !== 'undefined') {
  try {
    const pending = sessionStorage.getItem('sushasan:pending-report')
    if (pending) {
      sessionStorage.removeItem('sushasan:pending-report')  // consume once — prevent stale re-adds
      const parsed = JSON.parse(pending) as Record<string, unknown>
      if (!_userClusters.find((c) => c.id === parsed.id)) {
        _userClusters.push(parsed)
      }
    }
  } catch { /* private mode or parse error */ }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyClusterData(map: any, apiClusters: Record<string, unknown>[]) {
  const all = [...apiClusters, ..._userClusters]
  const source = map.getSource('clusters') as { setData: (d: unknown) => void } | undefined
  source?.setData({
    type: 'FeatureCollection',
    features: all
      .filter((c) => typeof c.lng === 'number' && typeof c.lat === 'number')
      .map((c) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
        properties: c,
      })),
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _lastApiClusters: Record<string, unknown>[] = []

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchClusters(map: any) {
  try {
    const res = await fetch('/api/ward/all')
    if (!res.ok) return
    const { clusters, wardSeverity } = await res.json()
    _lastApiClusters = clusters as Record<string, unknown>[]
    applyClusterData(map, _lastApiClusters)

    for (const { wardnum, severity_avg } of (wardSeverity as { wardnum: number; severity_avg: number }[]) ?? []) {
      map.setFeatureState({ source: 'wards-pilot', id: wardnum }, { severity_avg })
      map.setFeatureState({ source: 'wards-context', id: wardnum }, { severity_avg })
    }
  } catch {
    // renders fine without live data
  }
}
