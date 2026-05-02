'use client'

import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useEffect, useRef, useCallback, useState } from 'react'
import { getWardData } from '@/lib/data'
import { WARD_META, getWardMeta } from '@/lib/ward-meta'
import { getWardGovernance } from '@/lib/ward-governance'
import { FORTHEPEOPLE_PUNE_URL } from '@/lib/forthepeople'
import { HotspotPreview } from '@/components/map/HotspotPreview'

const ISSUE_COLORS: Record<string, string> = {
  traffic:     '#EF4444',
  water:       '#3B82F6',
  electricity: '#F59E0B',
  garbage:     '#10B981',
  other:       '#8B5CF6',
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

export type WardMapVariant = 'dashboard' | 'transparency'
export type WardMapTheme = 'dark' | 'light'

const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const LIGHT_STYLE = 'https://tiles.openfreemap.org/styles/positron'

type SelectedWard = {
  id: string
  name: string
  subtitle: string
  tier: string
  corporatorName: string
  party: string
  annualBudgetInr: number | null
  wardOfficer: string
  policeStation: string
  msedclSubdivision: string
  pmcWaterZone: string
  pmcSwmDepot: string
}

type HotspotTip = {
  lng: number
  lat: number
  x: number
  y: number
  fx: number
  fy: number
  issue_tag: string
  centroid_text: string
  post_count: number
  severity_avg: number
  status: string
  ward_id: string
  wardName: string
  solution_summary?: string
  citizen_headline?: string
  citizen_summary?: string
  government_teaser?: string
  source_platforms: string[]
}

type WardMapProps = {
  variant?: WardMapVariant
  /** 'dark' = kaun.city style; 'light' = classic light map. Defaults to light unless overridden. */
  theme?: WardMapTheme
}

export function WardMap({ variant = 'dashboard', theme }: WardMapProps) {
  const resolvedTheme: WardMapTheme = theme ?? 'light'
  const isDark = resolvedTheme === 'dark'

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)
  const [selectedWard, setSelectedWard] = useState<SelectedWard | null>(null)
  /** Mirrors GET /api/ward/all — whether hotspot circles came from Supabase or seed JSON. */
  const [clusterSource, setClusterSource] = useState<'supabase' | 'seed' | 'unknown'>('unknown')
  const [hotspotTip, setHotspotTip] = useState<HotspotTip | null>(null)
  const hotspotTipRef = useRef<HotspotTip | null>(null)
  const hideTipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    hotspotTipRef.current = hotspotTip
  }, [hotspotTip])

  const clearHideTip = useCallback(() => {
    if (hideTipTimerRef.current) {
      clearTimeout(hideTipTimerRef.current)
      hideTipTimerRef.current = null
    }
  }, [])

  const scheduleHideTip = useCallback(() => {
    clearHideTip()
    hideTipTimerRef.current = setTimeout(() => {
      hotspotTipRef.current = null
      setHotspotTip(null)
    }, 200)
  }, [clearHideTip])

  useEffect(() => {
    if (!hotspotTip) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearHideTip()
        hotspotTipRef.current = null
        setHotspotTip(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hotspotTip, clearHideTip])

  /** Keep fixed anchor in sync when the page scrolls or the map container moves */
  useEffect(() => {
    if (!hotspotTip) return
    const tick = () => {
      const map = mapRef.current as { project: (c: [number, number]) => { x: number; y: number }; getContainer: () => HTMLElement } | null
      const tip = hotspotTipRef.current
      if (!map || !tip) return
      const { x, y, fx, fy } = anchorForHotspotTip(map, tip.lng, tip.lat)
      setHotspotTip((p) => {
        if (!p) return null
        const next = { ...p, x, y, fx, fy }
        hotspotTipRef.current = next
        return next
      })
    }
    tick()
    window.addEventListener('scroll', tick, true)
    window.addEventListener('resize', tick)
    return () => {
      window.removeEventListener('scroll', tick, true)
      window.removeEventListener('resize', tick)
    }
  }, [hotspotTip?.lng, hotspotTip?.lat])

  const initMap = useCallback(async () => {
    if (!containerRef.current || mapRef.current) return

    const maplibregl = (await import('maplibre-gl')).default
    await import('maplibre-gl/dist/maplibre-gl.css')

    // Force the classic light basemap; boundaries carry the kaun.city-like definition.
    const baseStyle = LIGHT_STYLE

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: baseStyle,
      center: [73.910, 18.470],
      zoom: 13.0,
      minZoom: 11,
      maxZoom: 18,
      maxPitch: 0,
      renderWorldCopies: false,
      fadeDuration: 200,
      attributionControl: false,
      hash: false,
      pitchWithRotate: false,
      dragRotate: false,
    })

    map.touchZoomRotate.disableRotation()
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')

    mapRef.current = map

    const wardFillSelected     = isDark ? '#FF9933' : '#FF9933'
    const wardFillRamp         = isDark
      ? ['#1a1410', '#3d2710', '#7a3d10', '#c8741a', '#FF9933']
      : ['#fff7ec', '#ffe9cb', '#ffd699', '#ff9933', '#c8741a']
    const labelMain            = isDark ? '#f5f1e8' : '#0A0A0A'
    const labelSub             = isDark ? '#a8a39a' : '#5b5b58'
    const labelHaloColor       = isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)'
    const contextFill          = isDark ? '#0d0d0d' : '#fafaf7'
    const contextFillOpacity   = isDark ? 0.35 : 0.55
    const contextOutlineColor  = isDark ? '#FF9933' : '#9a9a98'
    const contextOutlineOp     = isDark ? 0.18 : 0.55
    const wardBorderBaseColor  = isDark ? '#FF9933' : '#0A0A0A'
    const hotspotStrokeColor   = isDark ? '#0A0A0A' : '#ffffff'

    map.on('load', () => {
      map.addSource('wards-pilot', {
        type: 'geojson',
        data: '/geojson/wards-pilot.geojson',
        promoteId: 'wardnum',
      })
      map.addSource('wards-context', {
        type: 'geojson',
        data: '/geojson/wards-context.geojson',
      })

      fetch('/geojson/wards-pilot.geojson')
        .then((r) => r.json())
        .then((gj) => {
          gj.features = gj.features.map((f: { properties: Record<string, unknown> }) => {
            const wardnum = Number(f.properties?.wardnum)
            const meta = WARD_META[wardnum]
            return {
              ...f,
              properties: {
                ...f.properties,
                _displayName: meta?.name ?? (f.properties?.Name2 as string) ?? `Ward ${wardnum}`,
                _subtitle:    meta?.subtitle ?? '',
                _wardLabel:   `WARD ${wardnum}`,
                _tier:        meta?.tier ?? (f.properties?.tier as string) ?? 'pilot',
              },
            }
          })
          const src = map.getSource('wards-pilot') as { setData: (d: unknown) => void } | undefined
          src?.setData(gj)
        })
        .catch(() => {})

      map.addLayer({
        id: 'context-fill',
        type: 'fill',
        source: 'wards-context',
        paint: { 'fill-color': contextFill, 'fill-opacity': contextFillOpacity },
      })
      map.addLayer({
        id: 'context-outline',
        type: 'line',
        source: 'wards-context',
        paint: {
          'line-color': contextOutlineColor,
          'line-width': 0.8,
          'line-opacity': contextOutlineOp,
          'line-dasharray': [2, 2],
        },
      })

      map.addLayer({
        id: 'wards-fill',
        type: 'fill',
        source: 'wards-pilot',
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            wardFillSelected,
            [
              'interpolate', ['linear'],
              ['coalesce', ['feature-state', 'severity_avg'], 0],
              0,   wardFillRamp[0],
              2,   wardFillRamp[1],
              3.5, wardFillRamp[2],
              5,   wardFillRamp[3],
            ],
          ],
          'fill-opacity': isDark
            ? [
                'case',
                ['boolean', ['feature-state', 'selected'], false], 0.42,
                ['boolean', ['feature-state', 'hovered'],  false], 0.30,
                0.20,
              ]
            : [
                'case',
                ['boolean', ['feature-state', 'selected'], false], 0.32,
                ['boolean', ['feature-state', 'hovered'],  false], 0.22,
                0.14,
              ],
        },
      })

      // Glowing halo (wide, blurred) — kaun.city signature look
      map.addLayer({
        id: 'wards-border-halo',
        type: 'line',
        source: 'wards-pilot',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#FF9933',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], isDark ? 18 : 10,
            ['boolean', ['feature-state', 'hovered'],  false], isDark ? 12 : 7,
            isDark ? 8 : 4,
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], isDark ? 0.62 : 0.34,
            ['boolean', ['feature-state', 'hovered'],  false], isDark ? 0.48 : 0.26,
            isDark ? 0.28 : 0.18,
          ],
          'line-blur': isDark ? 5 : 3,
        },
      })

      // Outer soft aura (widest) — sits under halo for extra neon depth
      map.addLayer(
        {
          id: 'wards-border-aura',
          type: 'line',
          source: 'wards-pilot',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#ffb347',
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'selected'], false], isDark ? 26 : 15,
              ['boolean', ['feature-state', 'hovered'],  false], isDark ? 20 : 11,
              isDark ? 14 : 8,
            ],
            'line-opacity': [
              'case',
              ['boolean', ['feature-state', 'selected'], false], isDark ? 0.22 : 0.14,
              ['boolean', ['feature-state', 'hovered'],  false], isDark ? 0.16 : 0.11,
              isDark ? 0.10 : 0.07,
            ],
            'line-blur': isDark ? 10 : 7,
          },
        },
        'wards-border-halo'
      )

      // Sharp saffron line on top
      map.addLayer({
        id: 'wards-border',
        type: 'line',
        source: 'wards-pilot',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': wardBorderBaseColor,
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], isDark ? 2.4 : 2.6,
            ['boolean', ['feature-state', 'hovered'],  false], isDark ? 1.8 : 1.9,
            isDark ? 1.2 : 1.2,
          ],
          'line-opacity': isDark ? 0.95 : 0.92,
        },
      })

      map.addLayer({
        id: 'ward-labels',
        type: 'symbol',
        source: 'wards-pilot',
        layout: {
          'text-field': [
            'format',
            ['coalesce', ['get', '_wardLabel'], ['concat', 'WARD ', ['to-string', ['get', 'wardnum']]]],
            { 'font-scale': 0.72, 'text-color': '#FF9933' },
            '\n',
            {},
            ['coalesce', ['get', '_displayName'], ['get', 'Name2']],
            { 'font-scale': 1.0, 'text-color': labelMain },
            '\n',
            {},
            ['coalesce', ['get', '_subtitle'], ''],
            { 'font-scale': 0.68, 'text-color': labelSub },
          ],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 11.5, 0, 12.5, 9, 14, 12, 16, 13],
          'text-line-height': 1.25,
          'text-letter-spacing': 0.06,
          'text-anchor': 'center',
          'text-justify': 'center',
          'text-allow-overlap': false,
          'text-padding': 4,
          'symbol-placement': 'point',
        },
        paint: {
          'text-halo-color': labelHaloColor,
          'text-halo-width': 1.6,
          'text-halo-blur': 0.4,
        },
      })

      map.addSource('clusters', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        promoteId: 'id',
      })

      map.addLayer({
        id: 'hotspot-glow',
        type: 'circle',
        source: 'clusters',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'post_count'],
            1, 18, 30, 38,
          ],
          'circle-color': [
            'match', ['get', 'issue_tag'],
            'traffic',     ISSUE_COLORS.traffic,
            'water',       ISSUE_COLORS.water,
            'electricity', ISSUE_COLORS.electricity,
            'garbage',     ISSUE_COLORS.garbage,
            ISSUE_COLORS.other,
          ],
          'circle-opacity': isDark ? 0.22 : 0.14,
          'circle-blur': 1,
        },
      })

      map.addLayer({
        id: 'hotspots',
        type: 'circle',
        source: 'clusters',
        paint: {
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            ['*', ['interpolate', ['linear'], ['get', 'post_count'], 1, 7, 20, 16, 50, 26], 1.18],
            ['interpolate', ['linear'], ['get', 'post_count'], 1, 7, 20, 16, 50, 26],
          ],
          'circle-color': [
            'match', ['get', 'issue_tag'],
            'traffic',     ISSUE_COLORS.traffic,
            'water',       ISSUE_COLORS.water,
            'electricity', ISSUE_COLORS.electricity,
            'garbage',     ISSUE_COLORS.garbage,
            ISSUE_COLORS.other,
          ],
          'circle-opacity': 0.94,
          'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false], 4,
            2.5,
          ],
          'circle-stroke-color': hotspotStrokeColor,
        },
      })

      let selectedWardId: number | null = null
      let hoveredWardId: number | null = null
      let wardHoverRaf = 0
      let pendingWardId: number | null = null

      let hoveredHotspotId: string | number | null = null
      let hsHoverRaf = 0

      let tipMoveRaf = 0
      const syncTipScreen = () => {
        const tip = hotspotTipRef.current
        if (!tip) return
        const { x, y, fx, fy } = anchorForHotspotTip(map, tip.lng, tip.lat)
        setHotspotTip((prev) => {
          if (!prev) return null
          const next = { ...prev, x, y, fx, fy }
          hotspotTipRef.current = next
          return next
        })
      }
      const onMapMove = () => {
        cancelAnimationFrame(tipMoveRaf)
        tipMoveRaf = requestAnimationFrame(syncTipScreen)
      }
      map.on('move', onMapMove)
      map.on('zoom', onMapMove)

      const selectWard = (wardId: number, props: Record<string, unknown>, lng?: number, lat?: number) => {
        if (selectedWardId !== null && selectedWardId !== wardId) {
          map.setFeatureState({ source: 'wards-pilot', id: selectedWardId }, { selected: false })
        }
        selectedWardId = wardId
        map.setFeatureState({ source: 'wards-pilot', id: wardId }, { selected: true })

        const meta = getWardMeta(wardId)
        const name = meta?.name ?? (props._displayName as string) ?? (props.Name2 as string) ?? `Ward ${wardId}`
        const subtitle = meta?.subtitle ?? (props._subtitle as string) ?? ''
        const tier = meta?.tier ?? (props._tier as string) ?? 'pilot'
        const wardData = getWardData(String(wardId))
        const gov = getWardGovernance(String(wardId))
        const corporatorName = wardData?.ward.corporator_name ?? gov?.corporator_name ?? 'TBD — Public PMC record pending'
        const party = wardData?.ward.party ?? gov?.party ?? ''
        const annualBudgetInr = wardData?.ward.annual_budget_inr ?? gov?.annual_budget_inr ?? null

        setSelectedWard({
          id: String(wardId),
          name,
          subtitle,
          tier,
          corporatorName,
          party,
          annualBudgetInr,
          wardOfficer: gov?.ward_officer ?? 'PMC Ward Office',
          policeStation: gov?.police_station ?? 'Local Police Station',
          msedclSubdivision: gov?.msedcl_subdivision ?? 'MSEDCL Subdivision',
          pmcWaterZone: gov?.pmc_water_zone ?? 'PMC Water Zone',
          pmcSwmDepot: gov?.pmc_swm_depot ?? 'PMC SWM Depot',
        })

        void (async () => {
          const idStr = String(wardId)
          try {
            const res = await fetch(`/api/ward/${idStr}`)
            if (!res.ok) return
            const json = (await res.json()) as {
              ward?: {
                name?: string
                corporator_name?: string
                party?: string
                annual_budget_inr?: number
              }
            }
            const w = json.ward
            if (!w) return
            setSelectedWard((prev) => {
              if (!prev || prev.id !== idStr) return prev
              return {
                ...prev,
                name: w.name || prev.name,
                corporatorName: w.corporator_name ?? prev.corporatorName,
                party: w.party ?? prev.party,
                annualBudgetInr:
                  typeof w.annual_budget_inr === 'number' && w.annual_budget_inr > 0
                    ? w.annual_budget_inr
                    : prev.annualBudgetInr,
              }
            })
          } catch {
            /* keep seed / governance snapshot */
          }
        })()

        if (typeof lng === 'number' && typeof lat === 'number') {
          map.easeTo({
            center: [lng, lat],
            duration: 780,
            zoom: Math.max(map.getZoom(), 13.6),
            easing: easeOutCubic,
          })
        }
      }

      map.on('click', 'wards-fill', (e) => {
        if (!e.features?.length) return
        const ward = e.features[0].properties as Record<string, unknown>
        const wardId = Number(ward?.wardnum)
        if (!Number.isFinite(wardId)) return
        selectWard(wardId, ward, e.lngLat.lng, e.lngLat.lat)
      })

      map.on('mouseenter', 'wards-fill', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mousemove', 'wards-fill', (e) => {
        if (!e.features?.length) return
        const wardId = Number(e.features[0].properties?.wardnum)
        if (!Number.isFinite(wardId)) return
        pendingWardId = wardId
        cancelAnimationFrame(wardHoverRaf)
        wardHoverRaf = requestAnimationFrame(() => {
          wardHoverRaf = 0
          const wid = pendingWardId
          if (wid === null || !Number.isFinite(wid)) return
          if (hoveredWardId === wid) return
          if (hoveredWardId !== null) {
            map.setFeatureState({ source: 'wards-pilot', id: hoveredWardId }, { hovered: false })
          }
          hoveredWardId = wid
          map.setFeatureState({ source: 'wards-pilot', id: wid }, { hovered: true })
        })
      })
      map.on('mouseleave', 'wards-fill', () => {
        map.getCanvas().style.cursor = ''
        cancelAnimationFrame(wardHoverRaf)
        wardHoverRaf = 0
        if (hoveredWardId !== null) {
          map.setFeatureState({ source: 'wards-pilot', id: hoveredWardId }, { hovered: false })
        }
        hoveredWardId = null
      })

      map.on('mousemove', 'hotspots', (e) => {
        const f = e.features?.[0]
        const featureId = f?.id
        if (!f || featureId === undefined || featureId === null) return
        cancelAnimationFrame(hsHoverRaf)
        hsHoverRaf = requestAnimationFrame(() => {
          hsHoverRaf = 0
          if (hoveredHotspotId !== null && hoveredHotspotId !== featureId) {
            map.setFeatureState({ source: 'clusters', id: hoveredHotspotId }, { hover: false })
          }
          hoveredHotspotId = featureId
          map.setFeatureState({ source: 'clusters', id: featureId }, { hover: true })
          map.getCanvas().style.cursor = 'pointer'

          clearHideTip()
          const g = f.geometry as { type?: string; coordinates?: [number, number] }
          const coords = g.coordinates ?? [0, 0]
          const p = (f.properties ?? {}) as Record<string, unknown>
          const wid = String(p.ward_id ?? '')
          const wn = getWardMeta(Number(wid))?.name
          const { x, y, fx, fy } = anchorForHotspotTip(map, coords[0], coords[1])
          const srcRaw = p.source_platforms
          const source_platforms = Array.isArray(srcRaw)
            ? srcRaw.map((s) => String(s))
            : typeof srcRaw === 'string' && srcRaw
              ? [srcRaw]
              : []
          const next: HotspotTip = {
            lng: coords[0],
            lat: coords[1],
            x,
            y,
            fx,
            fy,
            issue_tag: String(p.issue_tag ?? ''),
            centroid_text: String(p.centroid_text ?? ''),
            post_count: Number(p.post_count ?? 0),
            severity_avg: Number(p.severity_avg ?? 0),
            status: String(p.status ?? 'open'),
            ward_id: wid,
            wardName: wn ?? `Ward ${wid}`,
            solution_summary: p.solution_summary ? String(p.solution_summary) : undefined,
            citizen_headline: p.citizen_headline ? String(p.citizen_headline) : undefined,
            citizen_summary: p.citizen_summary ? String(p.citizen_summary) : undefined,
            government_teaser: p.government_teaser ? String(p.government_teaser) : undefined,
            source_platforms,
          }
          hotspotTipRef.current = next
          setHotspotTip(next)
        })
      })
      map.on('mouseleave', 'hotspots', () => {
        cancelAnimationFrame(hsHoverRaf)
        hsHoverRaf = 0
        if (hoveredHotspotId !== null) {
          map.setFeatureState({ source: 'clusters', id: hoveredHotspotId }, { hover: false })
        }
        hoveredHotspotId = null
        map.getCanvas().style.cursor = ''
        scheduleHideTip()
      })

      const onFindMyWard = () => {
        if (!navigator.geolocation) return
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            map.easeTo({
              center: [pos.coords.longitude, pos.coords.latitude],
              zoom: 14.5,
              duration: 1000,
              easing: easeOutCubic,
            })
          },
          () => map.easeTo({
            center: [73.910, 18.470],
            zoom: 13.0,
            duration: 750,
            easing: easeOutCubic,
          }),
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 120000 }
        )
      }
      window.addEventListener('sushasan:find-my-ward', onFindMyWard)

      const onSelectWardEvt = (evt: Event) => {
        const ce = evt as CustomEvent<{ wardId: number | string }>
        const wid = Number(ce.detail?.wardId)
        if (!Number.isFinite(wid)) return
        const props = (WARD_META[wid] ?? {}) as Record<string, unknown>
        selectWard(wid, props)
      }
      window.addEventListener('sushasan:select-ward', onSelectWardEvt as EventListener)

      const onDeselect = () => {
        if (selectedWardId !== null) {
          map.setFeatureState({ source: 'wards-pilot', id: selectedWardId }, { selected: false })
        }
        selectedWardId = null
        setSelectedWard(null)
      }
      window.addEventListener('sushasan:deselect-ward', onDeselect)

      const onRefreshMapData = () => {
        void fetchClusters(map, setClusterSource)
      }
      window.addEventListener('sushasan:refresh-map-data', onRefreshMapData)

      void fetchClusters(map, setClusterSource)

      map.on('remove', () => {
        cancelAnimationFrame(wardHoverRaf)
        cancelAnimationFrame(hsHoverRaf)
        cancelAnimationFrame(tipMoveRaf)
        map.off('move', onMapMove)
        map.off('zoom', onMapMove)
        clearHideTip()
        window.removeEventListener('sushasan:find-my-ward', onFindMyWard)
        window.removeEventListener('sushasan:select-ward', onSelectWardEvt as EventListener)
        window.removeEventListener('sushasan:deselect-ward', onDeselect)
        window.removeEventListener('sushasan:refresh-map-data', onRefreshMapData)
      })
    })
  }, [variant, isDark, clearHideTip, scheduleHideTip, setClusterSource])

  useEffect(() => {
    initMap()
    return () => {
      clearHideTip()
      hotspotTipRef.current = null
      setHotspotTip(null)
      // @ts-expect-error mapref
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [initMap, clearHideTip])

  const tipColor = hotspotTip ? (ISSUE_COLORS[hotspotTip.issue_tag] ?? '#888') : '#888'
  const statusLabel =
    hotspotTip?.status === 'resolved'
      ? 'Resolved'
      : hotspotTip?.status === 'in_progress'
        ? 'In progress'
        : 'Open'

  return (
    <div
      className={
        variant === 'transparency'
          ? 'relative w-full h-full min-h-[320px]'
          : 'relative w-full h-full'
      }
    >
      <div
        ref={containerRef}
        className="w-full h-full"
        role="img"
        aria-label="Pune ward hotspot map showing civic issues across the NIBM Wanowrie Kondhwa belt"
      />

      {hotspotTip &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="tooltip"
            className="hotspot-tip-card pointer-events-auto fixed z-[10050] w-[min(320px,calc(100vw-32px))]
                       rounded-2xl border border-ink/10 bg-white/98 p-4 shadow-xl backdrop-blur-sm
                       text-left"
            style={{
              left: hotspotTip.fx,
              top: hotspotTip.fy,
              transform: 'translate(-50%, calc(-100% - 14px))',
            }}
            onMouseEnter={clearHideTip}
            onMouseLeave={scheduleHideTip}
          >
            <HotspotPreview
              wardName={hotspotTip.wardName}
              issueTag={hotspotTip.issue_tag}
              issueColor={tipColor}
              centroidText={hotspotTip.centroid_text}
              postCount={hotspotTip.post_count}
              severityAvg={hotspotTip.severity_avg}
              statusLabel={statusLabel}
              solutionSummary={hotspotTip.solution_summary}
              citizenHeadline={hotspotTip.citizen_headline}
              citizenSummary={hotspotTip.citizen_summary}
              governmentTeaser={hotspotTip.government_teaser}
              sourcePlatforms={hotspotTip.source_platforms}
            />
            <Link
              href={`/dashboard/ward/${hotspotTip.ward_id}`}
              className="mt-3 inline-flex w-full justify-center text-center text-[12px] font-medium px-3 py-2
                         rounded-lg bg-ink text-white hover:bg-ink/88 transition-colors
                         focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2"
            >
              Full ward analysis →
            </Link>
          </div>,
          document.body,
        )}

      {selectedWard && (
        <div
          className={
            isDark
              ? 'ward-card absolute right-4 top-4 z-30 w-[320px] rounded-2xl border border-saffron/30 bg-[#0d0d0d]/96 p-4 shadow-2xl backdrop-blur-md text-paper'
              : 'ward-card absolute right-4 top-4 z-30 w-[320px] rounded-2xl border border-ink/10 bg-white/96 p-4 shadow-lg backdrop-blur-sm'
          }
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={
                isDark
                  ? 'text-[10px] font-bold uppercase tracking-[0.16em] text-saffron'
                  : 'text-[10px] font-bold uppercase tracking-[0.16em] text-saffron-dark'
              }
            >
              Ward {selectedWard.id} · Selected
            </span>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('sushasan:deselect-ward'))}
              className={
                isDark
                  ? 'text-paper/55 hover:text-paper transition-colors text-sm leading-none'
                  : 'text-ink/40 hover:text-ink transition-colors text-sm leading-none'
              }
              aria-label="Close ward details"
            >
              ✕
            </button>
          </div>
          <p
            className={
              isDark
                ? 'font-serif text-2xl leading-tight text-paper mb-0.5'
                : 'font-serif text-2xl leading-tight text-ink mb-0.5'
            }
          >
            {selectedWard.name}
          </p>
          {selectedWard.subtitle && (
            <p
              className={
                isDark
                  ? 'text-[12px] text-paper/60 italic mb-3'
                  : 'text-[12px] text-ink/55 italic mb-3'
              }
            >
              {selectedWard.subtitle}
            </p>
          )}

          {/* Ward incharge (corporator) */}
          <div
            className={
              isDark
                ? 'mb-2 rounded-lg border border-saffron/20 bg-saffron/8 px-3 py-2.5'
                : 'mb-2 rounded-lg border border-ink/10 bg-paper px-3 py-2.5'
            }
          >
            <div className={isDark ? 'text-[9px] font-bold uppercase tracking-[0.15em] text-saffron' : 'text-[9px] font-bold uppercase tracking-[0.15em] text-ink-3'}>
              Ward incharge · Corporator
            </div>
            <div className={isDark ? 'mt-1 text-[12px] font-semibold text-paper' : 'mt-1 text-[12px] font-semibold text-ink'}>
              {selectedWard.corporatorName}
            </div>
            <div className={isDark ? 'mt-1 flex flex-wrap gap-2 text-[10px] text-paper/60' : 'mt-1 flex flex-wrap gap-2 text-[10px] text-ink-3'}>
              {selectedWard.party ? <span>{selectedWard.party}</span> : <span>Party: TBD</span>}
              {selectedWard.annualBudgetInr ? (
                <>
                  <span>·</span>
                  <span>Budget {formatInrCompact(selectedWard.annualBudgetInr)}</span>
                </>
              ) : null}
            </div>
          </div>

          {/* Departments responsible (forthepeople.in style) */}
          <div
            className={
              isDark
                ? 'mb-3 rounded-lg border border-paper/10 bg-black/30 px-3 py-2.5 space-y-1.5'
                : 'mb-3 rounded-lg border border-ink/10 bg-paper px-3 py-2.5 space-y-1.5'
            }
          >
            <div className={isDark ? 'text-[9px] font-bold uppercase tracking-[0.15em] text-paper/55' : 'text-[9px] font-bold uppercase tracking-[0.15em] text-ink-3'}>
              Departments responsible
            </div>
            <DeptRow isDark={isDark} dot="#FF9933" label="Ward office"   value={selectedWard.wardOfficer} />
            <DeptRow isDark={isDark} dot="#EF4444" label="Police"        value={selectedWard.policeStation} />
            <DeptRow isDark={isDark} dot="#3B82F6" label="Water"         value={selectedWard.pmcWaterZone} />
            <DeptRow isDark={isDark} dot="#F59E0B" label="Electricity"   value={selectedWard.msedclSubdivision} />
            <DeptRow isDark={isDark} dot="#10B981" label="Solid waste"   value={selectedWard.pmcSwmDepot} />
          </div>

          <p className={isDark ? 'mb-3 text-[10px] text-paper/45 leading-snug' : 'mb-3 text-[10px] text-ink-3 leading-snug'}>
            Cross-check names & roles against{' '}
            <a
              href={FORTHEPEOPLE_PUNE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={isDark ? 'text-saffron underline-offset-2 hover:underline' : 'text-saffron-dark underline-offset-2 hover:underline'}
            >
              ForThePeople.in/pune
            </a>
            {' '}— we do not scrape their site; this is a public reference link.
          </p>

          <div className="flex items-center gap-2">
            <a
              href={`/dashboard/ward/${selectedWard.id}`}
              className={
                isDark
                  ? 'flex-1 text-center text-[12px] font-medium px-3 py-2 rounded-lg bg-saffron text-ink hover:brightness-110 transition'
                  : 'flex-1 text-center text-[12px] font-medium px-3 py-2 rounded-lg bg-ink text-white hover:bg-ink/85 transition-colors'
              }
            >
              View ward analysis →
            </a>
          </div>
          <div className={isDark ? 'mt-3 pt-3 border-t border-paper/10 flex items-center gap-2' : 'mt-3 pt-3 border-t border-ink/8 flex items-center gap-2'}>
            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-semibold ${
              selectedWard.tier === 'pilot'
                ? (isDark ? 'bg-saffron/20 text-saffron' : 'bg-saffron/15 text-saffron-dark')
                : (isDark ? 'bg-paper/8 text-paper/60' : 'bg-ink/8 text-ink/65')
            }`}>
              {selectedWard.tier === 'pilot'
                ? clusterSource === 'supabase'
                  ? 'Pilot · live clusters'
                  : clusterSource === 'seed'
                    ? 'Pilot · demo hotspots'
                    : 'Pilot'
                : 'Context only'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function DeptRow({
  isDark,
  dot,
  label,
  value,
}: {
  isDark: boolean
  dot: string
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2">
      <span
        className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full shrink-0"
        style={{ background: dot, boxShadow: `0 0 6px ${dot}` }}
        aria-hidden
      />
      <div className="min-w-0">
        <div className={isDark ? 'text-[9px] font-semibold uppercase tracking-[0.12em] text-paper/55' : 'text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-3'}>
          {label}
        </div>
        <div className={isDark ? 'text-[11px] text-paper truncate' : 'text-[11px] text-ink truncate'}>
          {value}
        </div>
      </div>
    </div>
  )
}

type MapTipProjection = {
  project: (lngLat: [number, number]) => { x: number; y: number }
  getContainer: () => HTMLElement
}

function anchorForHotspotTip(map: MapTipProjection, lng: number, lat: number) {
  const pt = map.project([lng, lat])
  const r = map.getContainer().getBoundingClientRect()
  return { x: pt.x, y: pt.y, fx: r.left + pt.x, fy: r.top + pt.y }
}

function formatInrCompact(value: number) {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(1)}Cr`
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)}K`
  return `₹${value}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchClusters(
  map: any,
  setSource: (s: 'supabase' | 'seed' | 'unknown') => void,
) {
  try {
    const res = await fetch('/api/ward/all')
    if (!res.ok) {
      setSource('unknown')
      return
    }
    const body = (await res.json()) as {
      clusters: unknown
      wardSeverity: Array<{ wardnum: number; severity_avg: number }>
      clusterSource?: 'supabase' | 'seed'
    }
    const { clusters, wardSeverity, clusterSource: src } = body
    if (src === 'supabase' || src === 'seed') setSource(src)
    else setSource('unknown')

    const source = map.getSource('clusters') as { setData: (data: unknown) => void } | undefined
    source?.setData({
      type: 'FeatureCollection',
      features: (clusters as Array<Record<string, unknown>>).map((c) => ({
        type: 'Feature',
        id: c.id as string,
        geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
        properties: c,
      })),
    })

    for (const { wardnum, severity_avg } of (wardSeverity as Array<{ wardnum: number; severity_avg: number }>) ?? []) {
      map.setFeatureState({ source: 'wards-pilot', id: wardnum }, { severity_avg })
    }
  } catch {
    setSource('unknown')
  }
}
