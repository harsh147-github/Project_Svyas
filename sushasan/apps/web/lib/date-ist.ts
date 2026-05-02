/** Monday (Asia/Kolkata) as YYYY-MM-DD for solution week_start uniqueness. */
export function mondayWeekStartIST(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = fmt.formatToParts(new Date())
  const y = Number(parts.find((p) => p.type === 'year')?.value)
  const m = Number(parts.find((p) => p.type === 'month')?.value) - 1
  const d = Number(parts.find((p) => p.type === 'day')?.value)
  const cur = new Date(Date.UTC(y, m, d))
  const day = cur.getUTCDay()
  const diff = cur.getUTCDate() - day + (day === 0 ? -6 : 1)
  cur.setUTCDate(diff)
  return cur.toISOString().slice(0, 10)
}
