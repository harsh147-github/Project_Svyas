import { NextRequest, NextResponse } from 'next/server'
import { isGovAuthed } from '@/lib/auth'
import { getMission } from '@/lib/gov-mission'
import {
  buildApplicationForm,
  renderApplicationText,
  renderApplicationHtml,
  type ApplicationForm,
} from '@/lib/gov-application'
import { translateFormal, isSarvamConfigured } from '@/lib/sarvam'

/**
 * GET /api/gov/application/[id]?format=json|text|html&lang=en|mr
 *
 * The officer-facing dossier for one mission ("46-water"), with a stable
 * Sushaasan reference number.
 *
 * `lang=mr` runs the narrative fields through Sarvam's formal-register
 * translation. This is the difference between a brief a Pune ward officer
 * skims and one they can forward to a junior engineer who works in Marathi all
 * day. Structural labels are already bilingual; this translates the *content*.
 */

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

/** Fields worth spending a translation call on — narrative, not numbers. */
function isTranslatable(value: string): boolean {
  if (!value.trim()) return false
  // Skip pure figures, counts, dates and "3.8 of 5" style cells.
  if (/^[\d\s.,₹%/-]+$/.test(value)) return false
  if (/^\d+(\.\d+)? of \d+$/.test(value)) return false
  return value.length > 3
}

/**
 * Translate the narrative surface of the form in place.
 * Best-effort throughout: a failed leg leaves the English text standing rather
 * than blanking a field on a document an officer is about to act on.
 */
async function localiseForm(form: ApplicationForm, target: string): Promise<ApplicationForm> {
  const tr = async (text: string): Promise<string> => {
    if (!isTranslatable(text)) return text
    try {
      const out = await translateFormal(text, target, 'en-IN')
      return out.text || text
    } catch (err) {
      console.error('[gov/application] translate failed, keeping English:', err)
      return text
    }
  }

  const subject = await tr(form.subject)

  const sections = await Promise.all(
    form.sections.map(async (section) => ({
      ...section,
      fields: await Promise.all(
        section.fields.map(async (f) => ({ ...f, value: await tr(f.value) })),
      ),
    })),
  )

  const schedule = await Promise.all(
    form.schedule.map(async (row) => ({ ...row, action: await tr(row.action) })),
  )

  return { ...form, subject, sections, schedule }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!isGovAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const mission = await getMission(params.id)
  if (!mission) {
    return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
  }

  const url = new URL(req.url)
  const format = (url.searchParams.get('format') ?? 'json').toLowerCase()
  const lang = (url.searchParams.get('lang') ?? 'en').toLowerCase()

  let form = buildApplicationForm(mission)

  // Only pay for translation when a non-English rendering is actually asked for.
  if (lang !== 'en' && !lang.startsWith('en-') && isSarvamConfigured()) {
    form = await localiseForm(form, lang)
  }

  if (format === 'text') {
    return new NextResponse(renderApplicationText(form), {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `inline; filename="${form.applicationNumber.replace(/\//g, '-')}.txt"`,
      },
    })
  }

  if (format === 'html') {
    return new NextResponse(renderApplicationHtml(form), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  return NextResponse.json({
    ...form,
    text: renderApplicationText(form),
    html: renderApplicationHtml(form),
  })
}
