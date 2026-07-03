// WhatsApp delivery for authority briefs — the NammaKasa-style channel.
//
// Two modes, complementary:
//  1. sendWhatsApp(): automated send via Meta's WhatsApp Business Cloud API.
//     Inert until WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID are set
//     (Meta Business verification required — see docs/OUTREACH.md). Only fires
//     for real mobile numbers, never ward-office landlines.
//  2. waShareLink(): a wa.me deep link with the brief prefilled, embedded in
//     the daily digest email — one tap forwards the brief to any officer's
//     WhatsApp from a phone. Works today with zero setup.

export function isWhatsAppConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
}

// Normalise an Indian number to E.164-without-plus (Cloud API format).
// Returns null for anything that isn't a plausible mobile (e.g. 020- landlines),
// so we never attempt WhatsApp delivery to a desk phone.
export function toWaNumber(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `91${digits}`
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) return digits
  return null
}

export async function sendWhatsApp(toRaw: string, text: string): Promise<{ ok: boolean; detail?: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneId) return { ok: false, detail: 'whatsapp not configured' }
  const to = toWaNumber(toRaw)
  if (!to) return { ok: false, detail: `not a WhatsApp-capable mobile: ${toRaw}` }
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text.slice(0, 4096), preview_url: true },
      }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) return { ok: false, detail: `cloud-api ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}` }
    return { ok: true }
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) }
  }
}

// wa.me deep link with the brief text prefilled. With a mobile number it opens
// that chat directly; without one it opens WhatsApp's contact picker.
export function waShareLink(text: string, phone?: string | null): string {
  const to = toWaNumber(phone)
  const encoded = encodeURIComponent(text)
  return to ? `https://wa.me/${to}?text=${encoded}` : `https://wa.me/?text=${encoded}`
}
