/**
 * @deprecated — orchestration runs in the Next.js app for Vercel:
 * `apps/web/lib/inngest/functions/daily-pipeline.ts` + `apps/web/app/api/inngest/route.ts`
 *
 * Re-export the event name so any future standalone worker can stay aligned.
 */
export const DAILY_PIPELINE_EVENT = 'sushasan/pipeline.daily_requested' as const
