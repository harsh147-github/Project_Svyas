# Pipeline workers

The **Inngest** function that orchestrates the daily civic pipeline lives in the Next.js app so it deploys with Vercel:

- `apps/web/lib/inngest/functions/daily-pipeline.ts`
- HTTP handler: `apps/web/app/api/inngest/route.ts`
- Cron enqueue: `apps/web/app/api/cron/daily-pipeline/route.ts`

Point the Inngest dashboard “Serve” URL to:

`https://sushaasan.in/api/inngest`

Run `002_pipeline_tables.sql` in Supabase before expecting DB writes from future phase implementations.
