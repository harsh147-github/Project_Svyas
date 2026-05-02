/**
 * Ward metadata used for labels, popups, and ward cards.
 * Keys match `wardnum` from public/geojson/wards-pilot.geojson.
 */
export type WardMeta = {
  wardnum: number
  name: string
  subtitle: string
  tier: 'pilot' | 'core' | 'context'
}

export const WARD_META: Record<number, WardMeta> = {
  25: { wardnum: 25, name: 'Hadapsar Gaothan', subtitle: 'Satavwadi · Magarpatta',  tier: 'pilot' },
  26: { wardnum: 26, name: 'Wanwadi Gaothan',  subtitle: 'Vaiduwadi · Mohitewadi',   tier: 'pilot' },
  41: { wardnum: 41, name: 'Kondhwa Khurd',    subtitle: 'Mithanagar · Bibvewadi',  tier: 'core'  },
  42: { wardnum: 42, name: 'Ramtekadi',        subtitle: 'Sayyadnagar · Hadapsar',  tier: 'pilot' },
  43: { wardnum: 43, name: 'Wanowrie',         subtitle: 'Kausar Baug · Salunke',   tier: 'pilot' },
  44: { wardnum: 44, name: 'Kale Boratenagar', subtitle: 'Sasanenagar · Manjri',    tier: 'pilot' },
  46: { wardnum: 46, name: 'NIBM · Mohammadwadi', subtitle: 'Tribeca · Uruli Devachi', tier: 'pilot' },
  47: { wardnum: 47, name: 'Kondhwa Budruk',   subtitle: 'Yewalewadi · Pisoli',     tier: 'core'  },
}

export function getWardMeta(wardnum: number | string | undefined): WardMeta | null {
  const id = typeof wardnum === 'string' ? Number(wardnum) : wardnum
  if (typeof id !== 'number') return null
  return WARD_META[id] ?? null
}
