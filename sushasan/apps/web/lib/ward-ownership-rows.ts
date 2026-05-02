import { WARD_META } from '@/lib/ward-meta'
import { WARD_GOVERNANCE } from '@/lib/ward-governance'
import { tryCreateServerClient } from '@/lib/supabase-optional'

export type WardOwnershipRow = {
  id: string
  wardNumber: number
  name: string
  subtitle: string
  tier: 'pilot' | 'core' | 'context'
  corporatorName: string
  policeStation: string
}

function sortRows(rows: WardOwnershipRow[]) {
  return [...rows].sort((a, b) => a.wardNumber - b.wardNumber)
}

/** Static rows — safe on server or client (no Supabase). */
export function getSeedWardOwnershipRows(): WardOwnershipRow[] {
  return sortRows(
    Object.values(WARD_META).map((m) => {
      const gov = WARD_GOVERNANCE[String(m.wardnum)]
      return {
        id: String(m.wardnum),
        wardNumber: m.wardnum,
        name: m.name,
        subtitle: m.subtitle,
        tier: m.tier,
        corporatorName: gov?.corporator_name ?? 'TBD',
        policeStation: gov?.police_station ?? 'Local PS',
      }
    }),
  )
}

/**
 * Pilot GeoJSON wards + governance labels; corporator/name overridden from Supabase `wards` when present.
 */
export async function getWardOwnershipBundle(): Promise<{
  rows: WardOwnershipRow[]
  source: 'supabase' | 'seed'
}> {
  const seed = getSeedWardOwnershipRows()
  const supabase = tryCreateServerClient()
  if (!supabase) return { rows: seed, source: 'seed' }

  const ids = Object.keys(WARD_META)
  const { data: dbRows, error } = await supabase
    .from('wards')
    .select('id, name, corporator_name')
    .in('id', ids)

  if (error || !dbRows?.length) return { rows: seed, source: 'seed' }

  const byId = new Map(dbRows.map((r) => [String(r.id), r]))

  const rows = Object.values(WARD_META).map((m) => {
    const gov = WARD_GOVERNANCE[String(m.wardnum)]
    const db = byId.get(String(m.wardnum))
    const dbCorp = db?.corporator_name != null ? String(db.corporator_name).trim() : ''
    const dbName = db?.name != null ? String(db.name).trim() : ''
    return {
      id: String(m.wardnum),
      wardNumber: m.wardnum,
      name: dbName || m.name,
      subtitle: m.subtitle,
      tier: m.tier,
      corporatorName: dbCorp || gov?.corporator_name || 'TBD',
      policeStation: gov?.police_station ?? 'Local PS',
    }
  })

  return { rows: sortRows(rows), source: 'supabase' }
}
