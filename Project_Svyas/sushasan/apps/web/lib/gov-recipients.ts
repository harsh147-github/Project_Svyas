import { promises as fs } from 'node:fs'
import path from 'node:path'

// Who a ward's brief gets delivered to. Email (if set) → automated Resend send;
// phone → WhatsApp delivery. Edit public/data/gov-recipients.json to fill these.

export type Recipient = {
  wardId: string
  name: string | null
  email: string | null
  phone: string | null
  office: string | null
}

let _cache: Record<string, unknown> | null = null

async function load(): Promise<Record<string, unknown>> {
  if (_cache) return _cache
  try {
    const p = path.join(process.cwd(), 'public', 'data', 'gov-recipients.json')
    _cache = JSON.parse(await fs.readFile(p, 'utf-8')) as Record<string, unknown>
  } catch {
    _cache = {}
  }
  return _cache ?? {}
}

export async function getRecipient(wardId: string): Promise<Recipient> {
  const reg = await load()
  const wards = (reg.wards ?? {}) as Record<string, Record<string, unknown>>
  const w = wards[wardId] ?? {}
  const defaultEmail = (reg.default_office_email as string) ?? null
  return {
    wardId,
    name: (w.name as string) ?? null,
    email: (w.email as string) ?? defaultEmail,
    phone: (w.phone as string) ?? null,
    office: (w.office as string) ?? null,
  }
}
