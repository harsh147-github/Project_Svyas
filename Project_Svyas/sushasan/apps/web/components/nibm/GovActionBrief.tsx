'use client'

/**
 * GovActionBrief.tsx
 *
 * Renders the NIBM solution brief in Indian government "noting" format.
 * This is the format district-level officials (DC, AMC, Corporator) are
 * trained to read and act on — paragraphs numbered Para 1–6, a budget
 * table with authority-level flags, and a Decision Box.
 *
 * Rendered when ?view=gov is set on /dashboard/nibm
 */

import React from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

interface PhaseRow {
  phase: number
  description: string
  dept: string
  timeline: string
  costLakh: number
  authority: 'minor' | 'amc' | 'standing'
}

interface GovActionBriefProps {
  /** ISO date string from Supabase, or null if using fallback data */
  generatedAt?: string | null
  /** solution_id from Supabase for the brief footer */
  briefId?: string | null
  /** feasibility_score from Phase 3 (0–10) */
  feasibilityScore?: number | null
  /** From phase4_government_display.executive_summary */
  executiveSummary?: string | null
  /** From phase4_government_display.recommended_action */
  recommendedAction?: string | null
}

// ── Static brief data (NIBM Ward 46 traffic pilot) ──────────────────────────

const FILE_NO = 'SUH/W46/TRF/2026/034'
const SUBJECT = 'Persistent traffic congestion and road safety hazards at the NIBM–Mohammadwadi–Kondhwa corridor — Ward 46, Pune — Request for coordinated multi-departmental intervention'

const FACTS = [
  { label: 'Reports collected', value: '19 verified public posts (Mar–May 2026)' },
  { label: 'Sources', value: 'Instagram, Reddit, PunePulse, PunekarNews, Google Maps' },
  { label: 'Peak vehicle flow', value: '63,000 vehicles/day at NIBM Chowk (PunePulse count)' },
  { label: 'Accident record', value: '13 accidents incl. 4 fatalities at this corridor (2022–24)' },
  { label: 'Congestion severity', value: '4.2 / 5.0 (AI-assessed citizen severity score)' },
  { label: 'Priority score', value: '87 / 100 (Sushaasan urgency index)' },
  { label: 'Ward annual budget', value: '₹3.5 Cr (PMC Ward 46 allocation FY 2025–26)' },
  { label: 'Solution cost estimate', value: '₹2.48 Cr (70.9% of annual allocation)' },
]

const PRECEDENTS = [
  {
    ward: 'Ward 55 — Hadapsar',
    issue: 'Identical junction congestion pattern + encroachment',
    action: 'PMC Roads + Traffic Police joint enforcement MoU, ANPR cameras, bollard installation',
    outcome: '31% reduction in peak-hour congestion within 6 months',
    timeline: '2023–24',
  },
  {
    ward: 'Ward 32 — Kothrud',
    issue: 'Heavy-vehicle night movement causing residential complaints',
    action: 'Designated terminal zone, timed entry restriction, VMS advisory boards',
    outcome: 'Zero heavy-vehicle-related accidents in subsequent 12 months',
    timeline: '2022–23',
  },
]

const DEPARTMENTS = [
  {
    label: 'a.',
    name: 'Pune Traffic Police — Kondhwa Division',
    role: 'Enforcement operations, e-Challan backend integration, ANPR camera authority',
    contact: 'DCP (Traffic), Pune City',
  },
  {
    label: 'b.',
    name: 'PMC Roads Department — Zone D',
    role: 'Civil infrastructure: bollards, road markings, drainage works, contractor empanelment',
    contact: 'Executive Engineer, Roads (Zone D)',
  },
  {
    label: 'c.',
    name: 'PMC Traffic Engineering Cell',
    role: 'Signal timing optimisation, VMS board procurement, technical specifications',
    contact: 'City Traffic Engineer, PMC',
  },
  {
    label: 'd.',
    name: 'RTO Pune',
    role: 'Heavy vehicle movement permits, overloading enforcement coordination',
    contact: 'Regional Transport Officer, Pune',
  },
]

const PHASES: PhaseRow[] = [
  {
    phase: 1,
    description: 'Emergency enforcement reset — mobile CCTV deployment, joint task-force MoU, ~50 challans/day at chronic spots',
    dept: 'Traffic Police + PMC Roads',
    timeline: '30 days',
    costLakh: 12,
    authority: 'minor',
  },
  {
    phase: 2,
    description: '24 ANPR cameras (IS 14458 rated), 47 crash-rated bollards at encroachment points, VMS boards, control room at ward office',
    dept: 'PMC Roads + Traffic Engineering',
    timeline: '45 days',
    costLakh: 130,
    authority: 'amc',
  },
  {
    phase: 3,
    description: '3-acre heavy-vehicle terminal (PMC parcel Sy. 47/2), QR-enforced loading bays, PMPML stop optimisation',
    dept: 'PMC Roads + RTO',
    timeline: '60 days',
    costLakh: 80,
    authority: 'amc',
  },
  {
    phase: 4,
    description: 'Public transparency dashboard (ward46traffic.pmc.gov.in), independent traffic-flow audit, 15 youth PMC Traffic Wardens',
    dept: 'PMC IT + Traffic Engineering',
    timeline: '30 days',
    costLakh: 26,
    authority: 'minor',
  },
]

const RECOMMENDED_ACTIONS = [
  'Convene a joint meeting of PMC Roads (Zone D), Pune Traffic Police (Kondhwa Division), and RTO Pune within 7 days to sign the enforcement MoU.',
  'Direct PMC Roads Department to initiate tender proceedings for ANPR cameras and bollards (Phase 2) under the PMC Standard Schedule of Rates.',
  'Direct the Traffic Engineering Cell to submit revised signal-timing plans for NIBM Chowk, Mohammadwadi Phata, and Konark Pyramid Square within 15 days.',
  'Assign a nodal officer from the Ward 46 Corporator\'s office to coordinate resident liaison and monthly Ward Traffic Coordination Committee meetings.',
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null) {
  if (!iso) return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

const AUTHORITY_BADGE: Record<string, { label: string; cls: string }> = {
  minor:    { label: 'Minor Works — Corporator', cls: 'bg-india-green/10 text-india-green border-india-green/30' },
  amc:      { label: 'AMC Approval Required',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  standing: { label: 'Standing Committee',      cls: 'bg-navy/8 text-navy border-navy/20' },
}

// ── Component ────────────────────────────────────────────────────────────────

export function GovActionBrief({
  generatedAt,
  briefId,
  feasibilityScore,
  executiveSummary,
  recommendedAction,
}: GovActionBriefProps) {
  const totalLakh = PHASES.reduce((s, p) => s + p.costLakh, 0)
  const totalDays = PHASES.reduce((s, p) => s + parseInt(p.timeline), 0)

  return (
    <div className="font-sans text-[#1a1a1a] space-y-0">

      {/* ── Document header — looks like a physical PMC file cover ────────── */}
      <div className="bg-white border border-[#c8741a]/30 rounded-t-2xl overflow-hidden">
        {/* Saffron top stripe */}
        <div className="h-2 bg-gradient-to-r from-[#FF9933] via-[#FF9933] to-[#138808]" />

        <div className="px-7 py-5 space-y-4">
          {/* File header row */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#7a766d]">
                Government Action Brief — Sushaasan Civic Intelligence
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-xs font-bold text-[#0B1F3A] bg-[#0B1F3A]/6 px-2 py-0.5 rounded border border-[#0B1F3A]/15">
                  File No. {FILE_NO}
                </span>
                <span className="text-[10px] text-[#7a766d]">
                  Generated: {fmtDate(generatedAt)}
                </span>
              </div>
            </div>
            {/* Priority band */}
            <div className="bg-[#EF4444]/8 border border-[#EF4444]/25 rounded-xl px-4 py-2 text-center">
              <div className="font-serif text-2xl font-bold text-[#EF4444] leading-none">87/100</div>
              <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-[#EF4444]/80 mt-0.5">
                Priority · Action Required
              </div>
            </div>
          </div>

          {/* To / From */}
          <div className="grid sm:grid-cols-2 gap-2 text-xs border-t border-[#1a1a1a]/8 pt-4">
            <div className="space-y-1">
              <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-[#7a766d]">To</span>
              <div className="font-medium text-[#0B1F3A]">Additional Municipal Commissioner, Zone D, PMC</div>
              <div className="text-[#7a766d] text-[11px]">cc: Ward 46 Corporator · DCP Traffic, Pune City · EE Roads Zone D</div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-[#7a766d]">From</span>
              <div className="font-medium text-[#0B1F3A]">Sushaasan Civic Intelligence Platform</div>
              <div className="text-[#7a766d] text-[11px]">sushaasan.in · harshsonavane@sushaasan.in</div>
            </div>
          </div>

          {/* Subject */}
          <div className="border border-[#1a1a1a]/10 rounded-xl p-4 bg-[#fafaf7]">
            <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-[#7a766d] block mb-1">
              Subject
            </span>
            <p className="text-[13px] font-semibold text-[#1a1a1a] leading-snug">
              {SUBJECT}
            </p>
          </div>
        </div>
      </div>

      {/* ── Body — numbered paragraphs ────────────────────────────────────── */}
      <div className="bg-white border-x border-[#c8741a]/30 px-7 py-6 space-y-8">

        {/* Para 1 — Statement of Case */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#0B1F3A]">
            Para 1 — Statement of Case
          </h3>
          <div className="bg-[#fafaf7] rounded-xl border border-[#1a1a1a]/8 p-4 text-[13px] text-[#1a1a1a] leading-relaxed space-y-2">
            <p>
              The NIBM–Mohammadwadi–Kondhwa corridor in Ward 46, Pune is experiencing severe and worsening traffic congestion that presents an imminent public-safety risk. Between March and May 2026, Sushaasan&apos;s AI pipeline processed 19 verified public posts from citizens, journalists, and local reporters sourced from Instagram, Reddit, PunePulse, PunekarNews, and Google Maps.
            </p>
            <p>
              The data identifies three primary failure points: (1) uncontrolled mixed vehicle flow at NIBM Chowk with no physical lane segregation; (2) chronic heavy-vehicle encroachment on residential roads during day hours; and (3) non-functional traffic signals at Konark Pyramid Square creating unmanaged intersections. The corridor records 63,000 vehicles/day at peak with 13 documented accidents including 4 fatalities in the 2022–24 period.
            </p>
            {executiveSummary && (
              <p className="border-t border-[#1a1a1a]/8 pt-2 text-[12px] text-[#5a5650]">
                <span className="font-semibold text-[#1a1a1a]">AI synthesis note: </span>
                {executiveSummary}
              </p>
            )}
          </div>
        </div>

        {/* Para 2 — Facts and Figures */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#0B1F3A]">
            Para 2 — Facts and Figures
          </h3>
          <div className="rounded-xl border border-[#1a1a1a]/8 overflow-hidden">
            <table className="w-full text-xs">
              <tbody>
                {FACTS.map((f, i) => (
                  <tr key={f.label} className={i % 2 === 0 ? 'bg-white' : 'bg-[#fafaf7]'}>
                    <td className="px-4 py-2.5 font-semibold text-[#0B1F3A] w-48 border-r border-[#1a1a1a]/6">
                      {f.label}
                    </td>
                    <td className="px-4 py-2.5 text-[#3a3632]">{f.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Para 3 — Precedents */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#0B1F3A]">
            Para 3 — Precedents and Reference Cases
          </h3>
          <div className="space-y-3">
            {PRECEDENTS.map((p, i) => (
              <div key={p.ward} className="border border-[#1a1a1a]/8 rounded-xl p-4 bg-white space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-semibold text-[#0B1F3A] text-[13px]">{p.ward}</div>
                    <div className="text-[11px] text-[#7a766d]">{p.timeline}</div>
                  </div>
                  <span className="text-[9px] font-bold tracking-[0.14em] uppercase px-2 py-0.5 rounded-full
                                   bg-india-green/8 text-india-green border border-india-green/20">
                    Resolved
                  </span>
                </div>
                <div className="grid sm:grid-cols-3 gap-3 text-[11px]">
                  <div>
                    <div className="font-bold text-[#7a766d] uppercase tracking-wider text-[9px] mb-0.5">Issue</div>
                    <div className="text-[#3a3632]">{p.issue}</div>
                  </div>
                  <div>
                    <div className="font-bold text-[#7a766d] uppercase tracking-wider text-[9px] mb-0.5">Action Taken</div>
                    <div className="text-[#3a3632]">{p.action}</div>
                  </div>
                  <div>
                    <div className="font-bold text-[#7a766d] uppercase tracking-wider text-[9px] mb-0.5">Outcome</div>
                    <div className="font-semibold text-india-green">{p.outcome}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Para 4 — Responsible Departments */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#0B1F3A]">
            Para 4 — Responsible Departments and Nodal Officers
          </h3>
          <div className="space-y-2">
            {DEPARTMENTS.map((d) => (
              <div key={d.label} className="flex gap-3 border border-[#1a1a1a]/8 rounded-xl p-4 bg-white">
                <span className="font-bold text-[#0B1F3A] text-sm w-5 flex-shrink-0 pt-0.5">{d.label}</span>
                <div className="space-y-1 min-w-0">
                  <div className="font-semibold text-[#0B1F3A] text-[13px]">{d.name}</div>
                  <div className="text-[11px] text-[#5a5650] leading-relaxed">{d.role}</div>
                  <div className="text-[10px] text-[#7a766d]">Contact: {d.contact}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Para 5 — Budget Table */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#0B1F3A]">
            Para 5 — Budget Estimate and Financial Authority
          </h3>
          <p className="text-[11px] text-[#7a766d]">
            All estimates based on PMC Standard Schedule of Rates (SSR) 2025–26.
            Minor Works threshold: ₹25 lakh (Corporator discretion). Above ₹25 lakh: AMC approval required.
          </p>
          <div className="rounded-xl border border-[#1a1a1a]/8 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#0B1F3A] text-white">
                  <th className="px-4 py-2.5 text-left font-bold tracking-wide text-[10px]">Phase</th>
                  <th className="px-4 py-2.5 text-left font-bold tracking-wide text-[10px]">Scope</th>
                  <th className="px-4 py-2.5 text-left font-bold tracking-wide text-[10px]">Department</th>
                  <th className="px-4 py-2.5 text-left font-bold tracking-wide text-[10px]">Timeline</th>
                  <th className="px-4 py-2.5 text-right font-bold tracking-wide text-[10px]">Est. (₹ Lakh)</th>
                  <th className="px-4 py-2.5 text-left font-bold tracking-wide text-[10px]">Authority</th>
                </tr>
              </thead>
              <tbody>
                {PHASES.map((p, i) => {
                  const badge = AUTHORITY_BADGE[p.authority]
                  return (
                    <tr key={p.phase} className={i % 2 === 0 ? 'bg-white' : 'bg-[#fafaf7]'}>
                      <td className="px-4 py-3 font-bold text-[#0B1F3A] border-r border-[#1a1a1a]/6">
                        Phase {p.phase}
                      </td>
                      <td className="px-4 py-3 text-[#3a3632] leading-snug border-r border-[#1a1a1a]/6">
                        {p.description}
                      </td>
                      <td className="px-4 py-3 text-[#5a5650] whitespace-nowrap border-r border-[#1a1a1a]/6">
                        {p.dept}
                      </td>
                      <td className="px-4 py-3 text-[#5a5650] whitespace-nowrap border-r border-[#1a1a1a]/6">
                        {p.timeline}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#0B1F3A] border-r border-[#1a1a1a]/6">
                        {p.costLakh}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-bold tracking-[0.12em] uppercase px-2 py-0.5 rounded-full border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {/* Total row */}
                <tr className="bg-[#0B1F3A]/5 border-t-2 border-[#0B1F3A]/15">
                  <td colSpan={4} className="px-4 py-3 font-bold text-[#0B1F3A] text-right">
                    Total Estimated Cost
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[#0B1F3A] text-base">
                    {totalLakh}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-[#5a5650]">
                    70.9% of ward budget
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-3 text-[10px]">
            {Object.entries(AUTHORITY_BADGE).map(([key, b]) => (
              <span key={key} className={`px-2.5 py-1 rounded-full border font-bold tracking-[0.1em] uppercase ${b.cls}`}>
                {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Para 6 — Recommended Actions */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#0B1F3A]">
            Para 6 — Recommended Actions
          </h3>
          {recommendedAction && (
            <div className="bg-[#FF9933]/8 border border-[#FF9933]/20 rounded-xl p-4 text-[12px] text-[#3a3632] leading-relaxed mb-3">
              <span className="font-semibold text-[#c8741a]">AI recommendation: </span>
              {recommendedAction}
            </div>
          )}
          <div className="space-y-2">
            {RECOMMENDED_ACTIONS.map((action, i) => (
              <div key={i} className="flex gap-3 border border-[#1a1a1a]/8 rounded-xl p-4 bg-white">
                <span className="font-bold text-[#0B1F3A] text-sm w-6 flex-shrink-0 pt-0.5">
                  {['i.', 'ii.', 'iii.', 'iv.'][i]}
                </span>
                <p className="text-[12.5px] text-[#3a3632] leading-relaxed">{action}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Decision Box ────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#c8741a]/30 rounded-b-2xl overflow-hidden">
        <div className="px-7 py-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#1a1a1a]/10" />
            <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#0B1F3A]">
              Decision
            </h3>
            <div className="flex-1 h-px bg-[#1a1a1a]/10" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { id: 'approved',   label: 'Approved as submitted', cls: 'border-india-green/40 hover:bg-india-green/5' },
              { id: 'modified',   label: 'Approved with modifications', cls: 'border-amber-300 hover:bg-amber-50' },
              { id: 'escalate',   label: 'Escalate to AMC / Standing Committee', cls: 'border-[#0B1F3A]/30 hover:bg-[#0B1F3A]/4' },
              { id: 'return',     label: 'Return for additional information', cls: 'border-[#1a1a1a]/20 hover:bg-[#fafaf7]' },
            ].map((opt) => (
              <label key={opt.id}
                     className={`flex items-center gap-3 border rounded-xl p-3.5 cursor-pointer transition-colors ${opt.cls}`}>
                <input type="radio" name="decision" value={opt.id}
                       className="w-4 h-4 accent-[#FF9933]" />
                <span className="text-[12.5px] font-medium text-[#1a1a1a]">{opt.label}</span>
              </label>
            ))}
          </div>

          {/* Signature row */}
          <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-[#1a1a1a]/8">
            {[
              { label: 'Name', placeholder: 'Full name' },
              { label: 'Designation', placeholder: 'Post / rank' },
              { label: 'Date', placeholder: fmtDate() },
            ].map((f) => (
              <div key={f.label} className="space-y-1">
                <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-[#7a766d]">
                  {f.label}
                </div>
                <div className="border-b-2 border-[#1a1a1a]/20 pb-1 text-[12px] text-[#7a766d]">
                  {f.placeholder}
                </div>
              </div>
            ))}
          </div>

          {/* Footer metadata */}
          <div className="pt-3 border-t border-[#1a1a1a]/6 flex flex-wrap items-center justify-between gap-2
                          text-[9px] text-[#9a9590] font-mono">
            <span>
              Sushaasan Civic Intelligence · sushaasan.in · {FILE_NO}
            </span>
            <span className="flex items-center gap-2">
              {feasibilityScore && (
                <span className="px-2 py-0.5 bg-india-green/8 text-india-green border border-india-green/20 rounded-full font-sans font-bold uppercase tracking-wider text-[8px]">
                  Feasibility {feasibilityScore}/10
                </span>
              )}
              {briefId && <span>brief_id: {briefId.slice(0, 8)}…</span>}
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}
