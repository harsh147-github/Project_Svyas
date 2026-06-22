import type { Mission } from './gov-mission'

// Formats a mission into the "brief that lands in the officer's inbox / WhatsApp"
// — the delivery payload (the missile). The deep link points back to the War Room.

const ISSUE_LABEL: Record<string, string> = {
  traffic: 'Traffic & Roads', water: 'Water Supply', electricity: 'Electricity & Lighting',
  garbage: 'Sanitation & Waste', other: 'Civic',
}

function inr(n: number) {
  if (!n) return '₹0'
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}

export type Brief = {
  subject: string
  link: string
  whatsappText: string
  plainText: string
  emailHtml: string
}

export function buildBrief(mission: Mission, baseUrl: string, token: string): Brief {
  const { ward, cluster, solution, issueTag } = mission
  const label = ISSUE_LABEL[issueTag] ?? 'Civic'
  const link = `${baseUrl}/gov/war-room/${mission.id}${token ? `?token=${token}` : ''}`

  const headline = cluster?.gov_summary || cluster?.centroid_text || `${label} grievance in ${ward.name}`
  const evidence = cluster
    ? `${cluster.post_count} public reports · severity ${(cluster.severity_avg ?? 0).toFixed(1)}/5`
    : 'New signal'
  const plan = solution
    ? `Proposed: ${solution.summary} (est. ${inr(solution.total_cost_est_inr)}, ${solution.timeline_days}d, priority ${solution.priority_score}/100${solution.budget_feasible ? ', within budget' : ', needs budget review'})`
    : 'AI plan pending — open the War Room to draft one.'

  const subject = `Sushaasan brief · ${label} · Ward ${ward.ward_number} ${ward.name}`

  const plainText = [
    `SUSHAASAN CIVIC BRIEF — Ward ${ward.ward_number}, ${ward.name}`,
    ``,
    `Issue: ${label}`,
    `${headline}`,
    ``,
    `Evidence: ${evidence}`,
    `${plan}`,
    ``,
    `Open the War Room to dissect, plan with Sushaasan AI, and close the loop:`,
    link,
    ``,
    `— Sushaasan (independent civic-tech). Indicative advisory; the officer decides.`,
  ].join('\n')

  const whatsappText = [
    `*Sushaasan civic brief* — Ward ${ward.ward_number}, ${ward.name}`,
    ``,
    `*${label}:* ${headline}`,
    `📊 ${evidence}`,
    solution ? `🛠 ${solution.summary}` : `🛠 AI plan pending`,
    solution ? `💰 ${inr(solution.total_cost_est_inr)} · ⏱ ${solution.timeline_days}d · priority ${solution.priority_score}/100` : '',
    ``,
    `▶ Solve it with Sushaasan AI:`,
    link,
  ].filter(Boolean).join('\n')

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const emailHtml = `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#0A0A0A">
  <div style="background:#0B1F3A;padding:20px 24px;border-radius:14px 14px 0 0">
    <div style="color:#FF9933;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700">Sushaasan civic brief</div>
    <div style="color:#fff;font-size:18px;font-weight:600;margin-top:4px">Ward ${ward.ward_number} · ${esc(ward.name)}</div>
  </div>
  <div style="border:1px solid #eee;border-top:none;border-radius:0 0 14px 14px;padding:22px 24px">
    <div style="font-size:11px;color:#FF9933;font-weight:700;text-transform:uppercase;letter-spacing:1px">${label}</div>
    <h2 style="font-size:18px;margin:6px 0 10px;line-height:1.3">${esc(headline)}</h2>
    <p style="font-size:13px;color:#555;margin:0 0 6px">📊 ${esc(evidence)}</p>
    <p style="font-size:13px;color:#333;margin:0 0 18px">🛠 ${esc(plan)}</p>
    <a href="${link}" style="display:inline-block;background:#FF9933;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:999px">Open the War Room →</a>
    <p style="font-size:11px;color:#999;margin-top:20px;line-height:1.5">Sushaasan is an independent civic-technology platform, not a government body. This brief is AI-generated, indicative advisory only — the officer decides and acts.</p>
  </div>
</div>`.trim()

  return { subject, link, whatsappText, plainText, emailHtml }
}
