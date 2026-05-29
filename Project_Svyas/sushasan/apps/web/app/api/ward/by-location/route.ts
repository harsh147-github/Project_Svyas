import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

type GeoFeature = {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][] | number[][][][]
  }
}

type GeoFeatureCollection = {
  type: 'FeatureCollection'
  features: GeoFeature[]
}

/**
 * Ray-casting point-in-polygon test.
 * Returns true if [lng, lat] is inside the ring (array of [lng, lat] positions).
 */
function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1]
    const xj = ring[j][0], yj = ring[j][1]
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

/**
 * Check if [lng, lat] is inside a GeoJSON Polygon or MultiPolygon geometry.
 * Only checks outer rings (index 0) — holes are ignored for civic ward lookup.
 */
function pointInFeature(lng: number, lat: number, feature: GeoFeature): boolean {
  const { type, coordinates } = feature.geometry

  if (type === 'Polygon') {
    const rings = coordinates as number[][][]
    return pointInRing(lng, lat, rings[0])
  }

  if (type === 'MultiPolygon') {
    const polygons = coordinates as number[][][][]
    return polygons.some(rings => pointInRing(lng, lat, rings[0]))
  }

  return false
}

function findWardInFile(filePath: string, lng: number, lat: number) {
  const raw = readFileSync(filePath, 'utf-8')
  const geojson = JSON.parse(raw) as GeoFeatureCollection
  for (const feature of geojson.features) {
    if (pointInFeature(lng, lat, feature)) {
      return {
        ward_id:   String(feature.properties.wardnum ?? feature.properties.id ?? ''),
        ward_name: String(feature.properties.Name2 ?? feature.properties.name ?? ''),
      }
    }
  }
  return null
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const latStr = searchParams.get('lat')
    const lngStr = searchParams.get('lng')

    const lat = parseFloat(latStr ?? '')
    const lng = parseFloat(lngStr ?? '')

    if (!isFinite(lat) || !isFinite(lng)) {
      return NextResponse.json({ ward_id: null })
    }

    const pilotPath   = join(process.cwd(), 'public', 'geojson', 'wards-pilot.geojson')
    const contextPath = join(process.cwd(), 'public', 'geojson', 'wards-context.geojson')

    // Try pilot wards first
    const pilotMatch = findWardInFile(pilotPath, lng, lat)
    if (pilotMatch && pilotMatch.ward_id) {
      return NextResponse.json(pilotMatch)
    }

    // Fall back to context wards
    const contextMatch = findWardInFile(contextPath, lng, lat)
    if (contextMatch && contextMatch.ward_id) {
      return NextResponse.json(contextMatch)
    }

    return NextResponse.json({ ward_id: null })
  } catch (err) {
    console.error('[api/ward/by-location]', err)
    return NextResponse.json({ ward_id: null })
  }
}
