'use client'

import { useState } from 'react'
import { StatusBadge } from './StatusBadge'
import { BudgetBar } from './BudgetBar'

interface SolutionStep {
  step: number
  action: string
  dept: string
  timeline_days: number
  cost_est_inr: number
}

interface Solution {
  id: string
  issue_tag: string
  summary: string
  steps: SolutionStep[]
  total_cost_est_inr: number
  timeline_days: number
  priority_score: number
  budget_feasible: boolean
  status: string
}

interface Props {
  solution: Solution
  wardBudget?: number
}

const ISSUE_COLOR: Record<string, string> = {
  traffic:     '#EF4444',
  water:       '#3B82F6',
  electricity: '#F59E0B',
  garbage:     '#10B981',
  other:       '#8B5CF6',
}

function formatINR(amount: number): string {
  if (amount >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(1)}L`
  if (amount >= 1_000)   return `₹${(amount / 1_000).toFixed(0)}K`
  return `₹${amount}`
}

export function SolutionCard({ solution, wardBudget }: Props) {
  const [open, setOpen] = useState(false)

  const color = ISSUE_COLOR[solution.issue_tag] ?? '#FF9933'

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
      {/* Card header */}
      <div className="p-4 flex items-start gap-3">
        {/* Priority score ring */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                     text-xs font-bold border-2"
          style={{ borderColor: color, color }}
        >
          {Math.round(solution.priority_score)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase"
              style={{ background: `${color}22`, color }}
            >
              {solution.issue_tag}
            </span>
            <StatusBadge status={solution.status} />
            {solution.budget_feasible ? (
              <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-green-500/10 text-green-400">
                Budget feasible
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-red-500/10 text-red-400">
                Over budget
              </span>
            )}
          </div>

          <p className="text-sm text-white/80 leading-relaxed">{solution.summary}</p>

          <div className="flex flex-wrap gap-3 mt-2 text-xs text-white/40">
            <span>{formatINR(solution.total_cost_est_inr)} estimated</span>
            <span>{solution.timeline_days} days</span>
            <span>{solution.steps.length} steps</span>
          </div>
        </div>
      </div>

      {/* Budget bar */}
      {wardBudget && (
        <div className="px-4 pb-3">
          <BudgetBar spent={solution.total_cost_est_inr} total={wardBudget} />
        </div>
      )}

      {/* Accordion toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2.5 flex items-center justify-between
                   border-t border-white/10 text-xs text-white/40
                   hover:text-white/70 hover:bg-white/5 transition-all"
        aria-expanded={open}
      >
        <span>Suggested approach — step by step</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {/* Steps accordion */}
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-white/10">
          {solution.steps.map((step) => (
            <div key={step.step} className="flex gap-3 pt-3">
              <div
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                           text-[10px] font-bold border"
                style={{ borderColor: color, color }}
              >
                {step.step}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/80">{step.action}</p>
                <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-white/35">
                  <span>{step.dept}</span>
                  <span>{step.timeline_days}d</span>
                  <span>{formatINR(step.cost_est_inr)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
