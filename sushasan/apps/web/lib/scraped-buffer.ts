import type { ScrapeEngineReport } from '@/lib/scrapers/engine'
import type { N8nScrapeReport } from '@/lib/scrapers/n8n-scrape-engine'

type PersistSummary = {
  attempted: number
  inserted_or_updated: number
  failed: number
  errors: string[]
}

type BufferedReport = (ScrapeEngineReport | N8nScrapeReport) & {
  persisted?: PersistSummary
}

let lastReport: BufferedReport | null = null

export function setLastScrapeReport(report: BufferedReport) {
  lastReport = report
}

export function getLastScrapeReport(): BufferedReport | null {
  return lastReport
}

