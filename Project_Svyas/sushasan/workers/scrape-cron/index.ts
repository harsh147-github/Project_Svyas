/**
 * Scrape cron — runs every 60 minutes via Inngest
 * Triggers per-source scrapers and fans out classification events
 */

import { inngest } from '../inngest'

export const scrapeCron = inngest.createFunction(
  { id: 'scrape-cron', name: 'Hourly scrape trigger' },
  { cron: '0 * * * *' },
  async ({ step }) => {
    const SOURCES = ['twitter', 'reddit', 'instagram', 'facebook', 'telegram', 'gmaps', 'news']

    // Fan out one event per source — each handles its own scraper
    await Promise.all(
      SOURCES.map((source) =>
        step.sendEvent(`trigger-${source}`, {
          name: 'sushasan/scrape.source',
          data: { source },
        })
      )
    )

    return { triggered: SOURCES.length }
  }
)
