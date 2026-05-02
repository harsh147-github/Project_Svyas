/**
 * Optional HTTP enrichment matching n8n nodes
 * `Fetch Government Authority Data` + `Fetch Budget & Infrastructure Data`
 * (api.forthepeople.in). Never throws — returns null on failure.
 */

const TIMEOUT_MS = 12_000

async function safeJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchForthePeopleAuthority(params: {
  sector: string
  location: string
}): Promise<unknown | null> {
  const q = new URLSearchParams({
    sector: params.sector.slice(0, 80),
    location: params.location.slice(0, 120),
  })
  return safeJson(`https://api.forthepeople.in/v1/authority?${q}`)
}

export async function fetchForthePeopleInfrastructure(params: {
  ward: string
  sector: string
}): Promise<unknown | null> {
  const q = new URLSearchParams({
    ward: params.ward.slice(0, 20),
    sector: params.sector.slice(0, 80),
  })
  return safeJson(`https://api.forthepeople.in/v1/infrastructure?${q}`)
}
