'use client'
import { useState } from 'react'

interface DashboardFiltersProps {
  onSearch?: (query: string) => void
  onIssueType?: (type: string) => void
  onSort?: (sort: 'priority' | 'recent' | 'severity') => void
}

export function DashboardFilters({ onSearch, onIssueType, onSort }: DashboardFiltersProps) {
  const [search, setSearch] = useState('')
  const [issueType, setIssueType] = useState('all')
  const [sort, setSort] = useState<'priority' | 'recent' | 'severity'>('priority')

  const selectClass = "px-3 py-2 border border-ink/15 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-saffron/30 text-ink/70"

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <div className="relative flex-1 min-w-[180px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Search wards or issues…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); onSearch?.(e.target.value) }}
          className="w-full pl-9 pr-4 py-2 border border-ink/15 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-saffron/30 bg-white placeholder:text-ink/30"
        />
      </div>
      <select
        value={issueType}
        onChange={(e) => { setIssueType(e.target.value); onIssueType?.(e.target.value) }}
        className={selectClass}
      >
        <option value="all">All issues</option>
        <option value="traffic">Traffic</option>
        <option value="water">Water</option>
        <option value="electricity">Electricity</option>
        <option value="garbage">Garbage</option>
        <option value="other">Other</option>
      </select>
      <select
        value={sort}
        onChange={(e) => { const v = e.target.value as 'priority' | 'recent' | 'severity'; setSort(v); onSort?.(v) }}
        className={selectClass}
      >
        <option value="priority">Priority ↓</option>
        <option value="severity">Severity ↓</option>
        <option value="recent">Most recent</option>
      </select>
    </div>
  )
}
