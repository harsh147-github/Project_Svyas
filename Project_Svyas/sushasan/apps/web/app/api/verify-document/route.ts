import { NextRequest, NextResponse } from 'next/server'
import { submitDocument, getDocJobStatus, isSarvamConfigured, toBcp47, TRANSLATE_LANGUAGES } from '@/lib/sarvam'

/**
 * Supporting-document capture for civic grievances (Sarvam Vision).
 *
 *   POST /api/verify-document   — upload a document, get a job id back
 *   GET  /api/verify-document?jobId=…  — poll extraction status
 *
 * Why this exists: a complaint backed by paper moves differently. A resident
 * holding an unexecuted PMC work order, a water bill that contradicts the
 * supply record, or a society resolution about a collapsed drain is holding
 * the strongest evidence in the whole pipeline — and today it arrives as a
 * photo of a page that nothing can read. This turns it into text the
 * grievance dossier can quote.
 *
 * ── Scope, stated plainly ──────────────────────────────────────────────────
 * This EXTRACTS what a document says. It does not verify that the document is
 * genuine, and nothing downstream may present it as verified. An extracted
 * work-order number is a claim for a human to check against PMC records — the
 * response carries `verified: false` permanently so no caller can drift into
 * treating extraction as authentication.
 *
 * Digitization is asynchronous and slower than a serverless request should
 * live, so POST returns a job id rather than blocking on the result.
 */

export const runtime = 'nodejs'
export const maxDuration = 120

const MAX_BYTES = 15 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/tiff',
])

// Document jobs are the most expensive thing a citizen can trigger, so this
// limiter is tighter than the report one: 5 documents per IP per 30 minutes.
const _rate = new Map<string, { n: number; reset: number }>()
const LIMIT = 5
const WINDOW_MS = 30 * 60 * 1000

function limited(ip: string): boolean {
  const now = Date.now()
  if (_rate.size > 5000) for (const [k, v] of _rate) if (now > v.reset) _rate.delete(k)
  const e = _rate.get(ip)
  if (!e || now > e.reset) { _rate.set(ip, { n: 1, reset: now + WINDOW_MS }); return false }
  if (e.n >= LIMIT) return true
  e.n++
  return false
}

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

/** Strip path separators — the name is echoed back and used as a storage key. */
function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'document'
  return base.replace(/[^\w.\-() ]/g, '_').slice(0, 120) || 'document'
}

export async function POST(req: NextRequest) {
  if (limited(clientIp(req))) {
    return NextResponse.json(
      { error: 'Too many documents submitted. Please wait before trying again.' },
      { status: 429 },
    )
  }

  if (!isSarvamConfigured()) {
    return NextResponse.json(
      { error: 'Document reading is not configured', unavailable: true },
      { status: 503 },
    )
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = form.get('document') as File | Blob | null
  if (!file || (file as Blob).size === 0) {
    return NextResponse.json({ error: 'No document attached' }, { status: 400 })
  }
  if ((file as Blob).size > MAX_BYTES) {
    return NextResponse.json({ error: 'Document too large (max 15 MB)' }, { status: 413 })
  }

  const type = (file as Blob).type
  if (type && !ALLOWED_TYPES.has(type)) {
    return NextResponse.json(
      { error: 'Unsupported file type. Attach a PDF or a photo of the document.' },
      { status: 415 },
    )
  }

  const fileName = safeFileName(file instanceof File ? file.name : 'document')
  // Most civic paperwork in Pune is Marathi or English; the caller can override.
  const language = toBcp47(form.get('language') as string | null, TRANSLATE_LANGUAGES) ?? 'mr-IN'

  try {
    const job = await submitDocument(file as Blob, fileName, {
      language,
      outputFormat: 'md',
    })

    return NextResponse.json({
      jobId: job.jobId,
      state: job.state,
      fileName,
      language,
      // Extraction is not authentication. This flag is constant on purpose.
      verified: false,
      note: 'Text is extracted from the document as submitted. Sushaasan does not verify authenticity — details must be confirmed against official records.',
    })
  } catch (err) {
    console.error('[verify-document] submit failed:', err)
    return NextResponse.json({ error: 'Could not process the document' }, { status: 502 })
  }
}

export async function GET(req: NextRequest) {
  if (!isSarvamConfigured()) {
    return NextResponse.json(
      { error: 'Document reading is not configured', unavailable: true },
      { status: 503 },
    )
  }

  const jobId = new URL(req.url).searchParams.get('jobId')
  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 })
  }

  try {
    const status = await getDocJobStatus(jobId)
    return NextResponse.json({
      jobId: status.jobId,
      state: status.state,
      done: status.done,
      succeeded: status.succeeded,
      // ZIP of the extracted output when the job succeeded.
      outputUrl: status.outputUrl,
      error: status.error,
      verified: false,
    })
  } catch (err) {
    console.error('[verify-document] status failed:', err)
    return NextResponse.json({ error: 'Could not check document status' }, { status: 502 })
  }
}
