const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://web-eight-red-93.vercel.app'

export async function fetchAllWards() {
  const r = await fetch(`${BASE}/api/ward/all`)
  if (!r.ok) throw new Error('Failed to fetch wards')
  return r.json()
}

export async function fetchWard(id: string) {
  const r = await fetch(`${BASE}/api/ward/${id}`)
  if (!r.ok) throw new Error('Failed to fetch ward')
  return r.json()
}

export async function submitReport(payload: {
  raw_input: string
  ward_id?: string | null
  photo_url?: string | null
}) {
  const r = await fetch(`${BASE}/api/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return r.json()
}

export async function fetchWardByLocation(lat: number, lng: number) {
  const r = await fetch(`${BASE}/api/ward/by-location?lat=${lat}&lng=${lng}`)
  if (!r.ok) return null
  return r.json()
}
