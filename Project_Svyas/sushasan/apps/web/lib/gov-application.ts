import { createHash } from 'crypto'
import type { Mission } from './gov-mission'

/**
 * The government application form — what a ward officer actually receives.
 *
 * Everything upstream (voice capture, synthesis, clustering, solution
 * synthesis) exists to produce this one artefact: a structured, numbered,
 * quotable dossier that a PMC ward officer can act on, and that the citizen
 * can follow up on by reference number. Until a grievance has a number, it is
 * a feeling; once it has a number, it is a file.
 *
 * ── A deliberate integrity boundary ────────────────────────────────────────
 * Sushaasan is an independent civic-technology platform, NOT a government
 * body. So this module does NOT mint anything that could pass for a
 * PMC-issued application number or a PMC acknowledgement receipt — that would
 * be fabricating a government record, and a citizen who quoted it at a ward
 * counter would be turned away, or worse, believed.
 *
 * What it mints instead is an unambiguously Sushaasan reference: the `SUS/`
 * prefix, the platform's name on every rendering, and an explicit line stating
 * that this is an advisory dossier and not an official PMC receipt. The number
 * is real and useful — it is stable, quotable, and resolves to this dossier —
 * it just doesn't pretend to be the government's.
 */

// ── Application number ───────────────────────────────────────────────────────

const ISSUE_CODE: Record<string, string> = {
  traffic: 'TRF',
  water: 'WTR',
  electricity: 'ELE',
  garbage: 'SWM',
  other: 'GEN',
}

export type ApplicationNumberInput = {
  wardId: string
  issueTag: string
  /** Stable identifier — cluster id, post id, or mission id. */
  ref: string
  /** Defaults to now. Pass the grievance's creation time for stability. */
  at?: Date
}

/**
 * Build a stable Sushaasan reference number.
 *
 * Shape:  SUS/W46/WTR/2026-07/4B7C21
 *         │   │   │   │       └─ 6 hex chars derived from the grievance ref
 *         │   │   │   └───────── filing month
 *         │   │   └───────────── issue category
 *         │   └───────────────── PMC electoral ward
 *         └───────────────────── Sushaasan, not PMC
 *
 * Deterministic on purpose: the same grievance always yields the same number,
 * with no database counter to coordinate. A citizen who screenshots it on
 * Tuesday and an officer who opens it on Friday see the same string.
 */
export function buildApplicationNumber(input: ApplicationNumberInput): string {
  const at = input.at ?? new Date()
  const month = `${at.getUTCFullYear()}-${String(at.getUTCMonth() + 1).padStart(2, '0')}`
  const issue = ISSUE_CODE[input.issueTag] ?? ISSUE_CODE.other

  const digest = createHash('sha256')
    .update(`${input.wardId}|${input.issueTag}|${input.ref}|${month}`)
    .digest('hex')
    .slice(0, 6)
    .toUpperCase()

  return `SUS/W${input.wardId}/${issue}/${month}/${digest}`
}

// ── Form model ───────────────────────────────────────────────────────────────

export type FormField = { label: string; labelMr?: string; value: string }

export type FormSection = {
  title: string
  titleMr?: string
  fields: FormField[]
}

export type ApplicationForm = {
  applicationNumber: string
  /** ISO timestamp the dossier was compiled. */
  compiledAt: string
  wardId: string
  wardName: string
  wardNumber: number
  issueTag: string
  issueLabel: string
  /** Officer this dossier is addressed to. */
  addressedTo: string
  department: string
  subject: string
  sections: FormSection[]
  /** Action steps, if a solution exists — rendered as a numbered schedule. */
  schedule: ScheduleRow[]
  totalCostInr: number | null
  timelineDays: number | null
  priorityScore: number | null
  budgetFeasible: boolean | null
  /** Always rendered. Non-negotiable. */
  disclaimer: string
}

export type ScheduleRow = {
  step: number
  action: string
  dept: string
  timelineDays: number
  costInr: number
}

const ISSUE_LABEL: Record<string, string> = {
  traffic: 'Traffic & Roads',
  water: 'Water Supply',
  electricity: 'Electricity & Street Lighting',
  garbage: 'Sanitation & Solid Waste',
  other: 'General Civic',
}

const ISSUE_LABEL_MR: Record<string, string> = {
  traffic: 'वाहतूक व रस्ते',
  water: 'पाणीपुरवठा',
  electricity: 'वीज व पथदिवे',
  garbage: 'स्वच्छता व घनकचरा',
  other: 'सर्वसाधारण नागरी',
}

/** Default department when the solution doesn't name one. */
const DEFAULT_DEPT: Record<string, string> = {
  traffic: 'Traffic Engineering Cell / Roads Department',
  water: 'Water Supply Department',
  electricity: 'Street-Light Cell / MSEDCL',
  garbage: 'Solid Waste Management Department',
  other: 'PMC Ward Office',
}

export const APPLICATION_DISCLAIMER =
  'Sushaasan is an independent civic-technology platform and is not a government body. ' +
  'This dossier is an AI-generated advisory compiled from public reports; the reference ' +
  'number above is a Sushaasan tracking reference and is NOT a PMC-issued application ' +
  'number or acknowledgement. Cost and timeline figures are indicative estimates for ' +
  'planning only. The officer decides and acts.'

function inr(n: number | null | undefined): string {
  if (!n) return '—'
  return `₹${n.toLocaleString('en-IN')}`
}

/**
 * Compile a mission into the officer-facing application form.
 *
 * Deliberately renders "not recorded" rather than omitting a field when data
 * is missing: a form with a visible gap tells the officer what to go verify,
 * whereas a form that silently drops the row hides the gap.
 */
export function buildApplicationForm(mission: Mission, opts: { at?: Date } = {}): ApplicationForm {
  const { ward, cluster, solution, issueTag, incharge } = mission
  const at = opts.at ?? new Date()

  const applicationNumber = buildApplicationNumber({
    wardId: mission.wardId,
    issueTag,
    ref: cluster?.id ?? mission.id,
    at,
  })

  const issueLabel = ISSUE_LABEL[issueTag] ?? ISSUE_LABEL.other
  const issueLabelMr = ISSUE_LABEL_MR[issueTag] ?? ISSUE_LABEL_MR.other
  const department = solution?.steps?.[0]?.dept ?? DEFAULT_DEPT[issueTag] ?? DEFAULT_DEPT.other
  const addressedTo = incharge.name
    ? `${incharge.name}, ${incharge.role ?? 'PMC Ward Officer'}`
    : (incharge.role ?? 'PMC Ward Officer (Asst. Municipal Commissioner)')

  const headline = cluster?.gov_summary || cluster?.centroid_text || `${issueLabel} grievance in ${ward.name}`
  const subject = `${issueLabel} — ${ward.name} (Ward ${ward.ward_number}): ${headline}`

  const sections: FormSection[] = [
    {
      title: 'A. Particulars of grievance',
      titleMr: 'अ. तक्रारीचा तपशील',
      fields: [
        { label: 'Nature of grievance', labelMr: 'तक्रारीचे स्वरूप', value: `${issueLabel} / ${issueLabelMr}` },
        { label: 'Description', labelMr: 'वर्णन', value: headline },
        {
          label: 'Citizen action sought',
          labelMr: 'नागरिकांची मागणी',
          value: solution?.summary ?? 'To be determined on site inspection.',
        },
      ],
    },
    {
      title: 'B. Jurisdiction',
      titleMr: 'ब. कार्यक्षेत्र',
      fields: [
        { label: 'Ward', labelMr: 'प्रभाग', value: `${ward.name} (Ward ${ward.ward_number})` },
        { label: 'Addressed to', labelMr: 'प्रति', value: addressedTo },
        { label: 'Concerned department', labelMr: 'संबंधित विभाग', value: department },
        { label: 'PMC region office', labelMr: 'क्षेत्रीय कार्यालय', value: incharge.region ?? 'Not recorded' },
        { label: 'Region contact', labelMr: 'संपर्क', value: incharge.regionPhone ?? incharge.helpline ?? 'Not recorded' },
      ],
    },
    {
      title: 'C. Evidence on record',
      titleMr: 'क. उपलब्ध पुरावे',
      fields: [
        {
          label: 'Public reports counted',
          labelMr: 'नोंदवलेल्या तक्रारी',
          value: cluster ? String(cluster.post_count) : 'Not recorded',
        },
        {
          label: 'Average severity',
          labelMr: 'सरासरी तीव्रता',
          value: cluster ? `${(cluster.severity_avg ?? 0).toFixed(1)} of 5` : 'Not recorded',
        },
        {
          label: 'Sources',
          labelMr: 'स्रोत',
          value: (cluster?.source_platforms ?? []).join(', ') || 'Mixed public sources',
        },
        {
          label: 'Current status',
          labelMr: 'सद्यस्थिती',
          value: cluster?.status ?? 'open',
        },
      ],
    },
    {
      title: 'D. Budget context',
      titleMr: 'ड. अर्थसंकल्पीय संदर्भ',
      fields: [
        {
          label: 'Ward annual allocation (approx.)',
          labelMr: 'प्रभाग वार्षिक तरतूद (अंदाजे)',
          value: ward.annual_budget_inr ? inr(ward.annual_budget_inr) : 'Not recorded',
        },
        {
          label: 'Estimated cost of proposed action',
          labelMr: 'प्रस्तावित कामाचा अंदाजित खर्च',
          value: inr(solution?.total_cost_est_inr ?? null),
        },
        {
          label: 'Within ward allocation',
          labelMr: 'तरतुदीच्या मर्यादेत',
          value: solution ? (solution.budget_feasible ? 'Yes — indicative' : 'Requires budget review') : 'Not assessed',
        },
      ],
    },
  ]

  // Verbatim resident reports, anonymised upstream. Officers trust these more
  // than any summary, so they go on the form rather than in an appendix.
  if (mission.samples.length > 0) {
    sections.push({
      title: 'E. Representative resident reports (anonymised)',
      titleMr: 'इ. नागरिकांच्या प्रातिनिधिक तक्रारी (निनावी)',
      fields: mission.samples.slice(0, 5).map((s, i) => ({
        label: `Report ${i + 1}`,
        value: s.location ? `${s.text} — [${s.location}]` : s.text,
      })),
    })
  }

  // The officer's own half of the form. Blank on purpose — this is where the
  // loop closes, and it should look like something waiting to be filled in.
  sections.push({
    title: 'F. For office use — action taken',
    titleMr: 'फ. कार्यालयीन वापरासाठी — केलेली कार्यवाही',
    fields: [
      { label: 'Received by', labelMr: 'प्राप्तकर्ता', value: '' },
      { label: 'Date of receipt', labelMr: 'प्राप्ती दिनांक', value: '' },
      { label: 'Action taken', labelMr: 'केलेली कार्यवाही', value: '' },
      { label: 'Work order / file no.', labelMr: 'कार्यादेश क्रमांक', value: '' },
      { label: 'Date of completion', labelMr: 'पूर्तता दिनांक', value: '' },
      { label: 'Signature', labelMr: 'स्वाक्षरी', value: '' },
    ],
  })

  const schedule: ScheduleRow[] = (solution?.steps ?? []).map((s) => ({
    step: s.step,
    action: s.action,
    dept: s.dept,
    timelineDays: s.timeline_days,
    costInr: s.cost_est_inr,
  }))

  return {
    applicationNumber,
    compiledAt: at.toISOString(),
    wardId: mission.wardId,
    wardName: ward.name,
    wardNumber: ward.ward_number,
    issueTag,
    issueLabel,
    addressedTo,
    department,
    subject,
    sections,
    schedule,
    totalCostInr: solution?.total_cost_est_inr ?? null,
    timelineDays: solution?.timeline_days ?? null,
    priorityScore: solution?.priority_score ?? null,
    budgetFeasible: solution?.budget_feasible ?? null,
    disclaimer: APPLICATION_DISCLAIMER,
  }
}

// ── Renderers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
}

/**
 * Plain-text rendering — what goes into email bodies, WhatsApp, and what a
 * ward clerk prints. Monospace-friendly, no markup to strip.
 */
export function renderApplicationText(form: ApplicationForm): string {
  const lines: string[] = []
  const rule = '='.repeat(64)
  const thin = '-'.repeat(64)

  lines.push(rule)
  lines.push('SUSHAASAN — CIVIC GRIEVANCE DOSSIER')
  lines.push('Advisory brief for the ward officer')
  lines.push(rule)
  lines.push(`Reference no.  : ${form.applicationNumber}`)
  lines.push(`Compiled on    : ${formatDate(form.compiledAt)}`)
  lines.push(`Ward           : ${form.wardName} (Ward ${form.wardNumber})`)
  lines.push(`To             : ${form.addressedTo}`)
  lines.push(`Department     : ${form.department}`)
  lines.push('')
  lines.push(`Subject: ${form.subject}`)
  lines.push('')

  for (const section of form.sections) {
    lines.push(thin)
    lines.push(section.title + (section.titleMr ? `  |  ${section.titleMr}` : ''))
    lines.push(thin)
    for (const field of section.fields) {
      const label = field.label.padEnd(32)
      lines.push(`${label}: ${field.value || '________________________'}`)
    }
    lines.push('')
  }

  if (form.schedule.length > 0) {
    lines.push(thin)
    lines.push('G. Proposed schedule of works (indicative)')
    lines.push(thin)
    for (const row of form.schedule) {
      lines.push(`${row.step}. ${row.action}`)
      lines.push(`   Department : ${row.dept}`)
      lines.push(`   Timeline   : ${row.timelineDays} days`)
      lines.push(`   Est. cost  : ${inr(row.costInr)}`)
      lines.push('')
    }
    lines.push(`TOTAL (indicative): ${inr(form.totalCostInr)} over ${form.timelineDays ?? '—'} days`)
    lines.push('')
  }

  lines.push(rule)
  lines.push(form.disclaimer)
  lines.push(rule)

  return lines.join('\n')
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * HTML rendering — the printable form. Styled to read as a municipal document
 * (ruled sections, reference block, signature line), not as a web app card,
 * because it will be printed and put in a physical file.
 */
export function renderApplicationHtml(form: ApplicationForm): string {
  const sectionsHtml = form.sections
    .map(
      (section) => `
    <section class="sec">
      <h2>${esc(section.title)}${section.titleMr ? `<span class="mr">${esc(section.titleMr)}</span>` : ''}</h2>
      <table>
        ${section.fields
          .map(
            (f) => `<tr>
          <th>${esc(f.label)}${f.labelMr ? `<span class="mr-inline">${esc(f.labelMr)}</span>` : ''}</th>
          <td>${f.value ? esc(f.value) : '<span class="blank"></span>'}</td>
        </tr>`,
          )
          .join('')}
      </table>
    </section>`,
    )
    .join('')

  const scheduleHtml =
    form.schedule.length === 0
      ? ''
      : `
    <section class="sec">
      <h2>G. Proposed schedule of works <span class="mr">जी. प्रस्तावित कामांचे वेळापत्रक</span></h2>
      <table class="sched">
        <thead>
          <tr><th>#</th><th>Action</th><th>Department</th><th>Days</th><th>Est. cost</th></tr>
        </thead>
        <tbody>
          ${form.schedule
            .map(
              (r) => `<tr>
            <td class="num">${r.step}</td>
            <td>${esc(r.action)}</td>
            <td>${esc(r.dept)}</td>
            <td class="num">${r.timelineDays}</td>
            <td class="num">${esc(inr(r.costInr))}</td>
          </tr>`,
            )
            .join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3">Total (indicative)</td>
            <td class="num">${form.timelineDays ?? '—'}</td>
            <td class="num">${esc(inr(form.totalCostInr))}</td>
          </tr>
        </tfoot>
      </table>
    </section>`

  return `
<div class="sus-form">
  <style>
    .sus-form { font-family: 'Inter', -apple-system, Segoe UI, Roboto, sans-serif;
                color:#0A0A0A; max-width:820px; margin:0 auto; background:#fff;
                border:1px solid #d8d8d0; }
    .sus-form .hdr { border-bottom:3px double #0B1F3A; padding:20px 28px 14px; }
    .sus-form .brand { font-size:10px; letter-spacing:3px; text-transform:uppercase;
                       color:#FF9933; font-weight:700; }
    .sus-form h1 { font-family:'Source Serif 4', Georgia, serif; font-size:20px;
                   margin:6px 0 2px; font-weight:700; }
    .sus-form .sub { font-size:12px; color:#555; }
    .sus-form .refblock { display:grid; grid-template-columns:auto 1fr; gap:2px 14px;
                          padding:14px 28px; background:#FAFAF7; border-bottom:1px solid #e5e5dd;
                          font-size:12px; }
    .sus-form .refblock dt { color:#666; font-weight:600; }
    .sus-form .refblock dd { margin:0; font-weight:600; }
    .sus-form .refno { font-family:ui-monospace, SFMono-Regular, Menlo, monospace;
                       letter-spacing:0.5px; color:#0B1F3A; }
    .sus-form .subject { padding:14px 28px; border-bottom:1px solid #e5e5dd;
                         font-size:13px; line-height:1.5; }
    .sus-form .subject strong { display:block; font-size:10px; letter-spacing:2px;
                                text-transform:uppercase; color:#888; margin-bottom:4px; }
    .sus-form .sec { padding:16px 28px; border-bottom:1px solid #eee; }
    .sus-form .sec h2 { font-size:12px; text-transform:uppercase; letter-spacing:1.2px;
                        color:#0B1F3A; margin:0 0 10px; font-weight:700; }
    .sus-form .mr { font-weight:500; color:#888; margin-left:8px; letter-spacing:0; }
    .sus-form .mr-inline { display:block; font-weight:400; color:#999; font-size:10px; }
    .sus-form table { width:100%; border-collapse:collapse; font-size:12.5px; }
    .sus-form th { text-align:left; vertical-align:top; width:34%; padding:6px 10px 6px 0;
                   color:#555; font-weight:600; }
    .sus-form td { padding:6px 0; vertical-align:top; line-height:1.5; }
    .sus-form .blank { display:inline-block; width:100%; border-bottom:1px dotted #aaa; height:14px; }
    .sus-form .sched th { width:auto; border-bottom:1px solid #ddd; padding:6px 8px; }
    .sus-form .sched td { padding:7px 8px; border-bottom:1px solid #f0f0f0; }
    .sus-form .sched tfoot td { font-weight:700; border-top:2px solid #0B1F3A; border-bottom:none; }
    .sus-form .num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
    .sus-form .foot { padding:14px 28px 18px; font-size:10.5px; line-height:1.6; color:#777;
                      background:#FAFAF7; }
    @media print { .sus-form { border:none; } .sus-form .sec { break-inside:avoid; } }
  </style>

  <div class="hdr">
    <div class="brand">Sushaasan · Civic Grievance Dossier</div>
    <h1>Advisory brief for the ward officer</h1>
    <div class="sub">Compiled from public civic reports · indicative advisory</div>
  </div>

  <dl class="refblock">
    <dt>Reference no.</dt><dd class="refno">${esc(form.applicationNumber)}</dd>
    <dt>Compiled on</dt><dd>${esc(formatDate(form.compiledAt))}</dd>
    <dt>Ward</dt><dd>${esc(form.wardName)} (Ward ${form.wardNumber})</dd>
    <dt>To</dt><dd>${esc(form.addressedTo)}</dd>
    <dt>Department</dt><dd>${esc(form.department)}</dd>
  </dl>

  <div class="subject"><strong>Subject</strong>${esc(form.subject)}</div>

  ${sectionsHtml}
  ${scheduleHtml}

  <div class="foot">${esc(form.disclaimer)}</div>
</div>`.trim()
}
