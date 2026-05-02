/**
 * Drizzle ORM schema — mirrors ops/supabase/001_init.sql
 * Source of truth is the SQL file; this is a TypeScript convenience layer.
 */

import {
  pgTable, uuid, text, integer, boolean, float4,
  timestamp, date, jsonb, unique, primaryKey, index,
  customType,
} from 'drizzle-orm/pg-core'

// pgvector type
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() { return 'vector(1024)' },
  toDriver(v) { return `[${v.join(',')}]` },
  fromDriver(v) {
    return v.slice(1, -1).split(',').map(Number)
  },
})

// ── raw_posts ──────────────────────────────────────────────────────────────
export const rawPosts = pgTable('raw_posts', {
  id:           uuid('id').primaryKey().defaultRandom(),
  source:       text('source').notNull(),
  sourcePostId: text('source_post_id').notNull().unique(),
  rawText:      text('raw_text').notNull(),
  authorHash:   text('author_hash').notNull(),
  postedAt:     timestamp('posted_at', { withTimezone: true }),
  scrapedAt:    timestamp('scraped_at', { withTimezone: true }).defaultNow(),
  geoHint:      text('geo_hint'),
})

// ── posts ──────────────────────────────────────────────────────────────────
export const posts = pgTable('posts', {
  id:               uuid('id').primaryKey().defaultRandom(),
  rawPostId:        uuid('raw_post_id').references(() => rawPosts.id),
  textClean:        text('text_clean').notNull(),
  translatedTextEn: text('translated_text_en'),
  issueTag:         text('issue_tag').notNull(),
  subTags:          text('sub_tags').array(),
  severity:         integer('severity'),
  sentiment:        integer('sentiment'),
  citedLocation:    text('cited_location'),
  citedTime:        text('cited_time'),
  isActionable:     boolean('is_actionable').default(false),
  civicAsk:         text('civic_ask'),
  wardId:           text('ward_id'),
  embedding:        vector('embedding'),
  classifierVer:    text('classifier_ver'),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ── clusters ───────────────────────────────────────────────────────────────
export const clusters = pgTable('clusters', {
  id:           uuid('id').primaryKey().defaultRandom(),
  wardId:       text('ward_id').notNull(),
  issueTag:     text('issue_tag').notNull(),
  centroidText: text('centroid_text'),
  postCount:    integer('post_count').default(0),
  severityAvg:  float4('severity_avg'),
  status:       text('status').default('open'),
  sourcePlatforms: text('source_platforms').array(),
  centroidLng:  float4('centroid_lng'),
  centroidLat:  float4('centroid_lat'),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ── cluster_posts ──────────────────────────────────────────────────────────
export const clusterPosts = pgTable('cluster_posts', {
  clusterId: uuid('cluster_id').references(() => clusters.id, { onDelete: 'cascade' }),
  postId:    uuid('post_id').references(() => posts.id,    { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.clusterId, t.postId] }),
}))

// ── solutions ──────────────────────────────────────────────────────────────
export const solutions = pgTable('solutions', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  wardId:             text('ward_id').notNull(),
  clusterId:          uuid('cluster_id').references(() => clusters.id),
  weekStart:          date('week_start').notNull(),
  issueTag:           text('issue_tag').notNull(),
  summary:            text('summary').notNull(),
  steps:              jsonb('steps').notNull(),
  totalCostEstInr:    integer('total_cost_est_inr'),
  timelineDays:       integer('timeline_days'),
  priorityScore:      float4('priority_score'),
  budgetFeasible:     boolean('budget_feasible'),
  citizenBenefit:     text('citizen_benefit'),
  governmentBenefit:  text('government_benefit'),
  feasibilityScore:   float4('feasibility_score'),
  implementationRoadmap: jsonb('implementation_roadmap'),
  status:             text('status').default('draft'),
  actionedAt:         timestamp('actioned_at',  { withTimezone: true }),
  resolvedAt:         timestamp('resolved_at',  { withTimezone: true }),
  generatedAt:        timestamp('generated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  uniqueWardIssueWeek: unique().on(t.wardId, t.issueTag, t.weekStart),
}))

// ── wards ──────────────────────────────────────────────────────────────────
export const wards = pgTable('wards', {
  id:              text('id').primaryKey(),
  name:            text('name').notNull(),
  corporatorName:  text('corporator_name'),
  party:           text('party'),
  contact:         text('contact'),
  annualBudgetInr: integer('annual_budget_inr'),
  wardNumber:      integer('ward_number'),
  tier:            text('tier').default('context'),
})

// ── official_actions ───────────────────────────────────────────────────────
export const pipelineRuns = pgTable('pipeline_runs', {
  id:           uuid('id').primaryKey().defaultRandom(),
  status:       text('status').notNull().default('pending'),
  phase:        text('phase'),
  errorMessage: text('error_message'),
  meta:         jsonb('meta').default({}),
  startedAt:    timestamp('started_at', { withTimezone: true }).defaultNow(),
  finishedAt:   timestamp('finished_at', { withTimezone: true }),
})

export const synthesisBatches = pgTable('synthesis_batches', {
  id:              uuid('id').primaryKey().defaultRandom(),
  pipelineRunId:   uuid('pipeline_run_id').notNull().references(() => pipelineRuns.id, { onDelete: 'cascade' }),
  batchIndex:      integer('batch_index').notNull().default(0),
  wardId:          text('ward_id'),
  input:           jsonb('input').default({}),
  output:          jsonb('output').default({}),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const masterSyntheses = pgTable('master_syntheses', {
  id:                uuid('id').primaryKey().defaultRandom(),
  pipelineRunId:     uuid('pipeline_run_id').notNull().references(() => pipelineRuns.id, { onDelete: 'cascade' }),
  wardId:            text('ward_id').notNull(),
  issueTag:          text('issue_tag').notNull(),
  problemStatement:  text('problem_statement').notNull(),
  meta:              jsonb('meta').default({}),
  createdAt:         timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  uniqRunWardIssue: unique().on(t.pipelineRunId, t.wardId, t.issueTag),
}))

export const researchData = pgTable('research_data', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  pipelineRunId:      uuid('pipeline_run_id').notNull().references(() => pipelineRuns.id, { onDelete: 'cascade' }),
  wardId:             text('ward_id').notNull(),
  issueTag:           text('issue_tag').notNull(),
  perplexityPayload:  jsonb('perplexity_payload').notNull().default({}),
  createdAt:          timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const citizenDisplays = pgTable('citizen_displays', {
  id:          uuid('id').primaryKey().defaultRandom(),
  clusterId:   uuid('cluster_id').notNull().references(() => clusters.id, { onDelete: 'cascade' }),
  solutionId:  uuid('solution_id').references(() => solutions.id, { onDelete: 'set null' }),
  headline:    text('headline').notNull(),
  summary:     text('summary').notNull(),
  summaryMr:   text('summary_mr'),
  summaryHi:   text('summary_hi'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const governmentDisplays = pgTable('government_displays', {
  id:             uuid('id').primaryKey().defaultRandom(),
  clusterId:      uuid('cluster_id').notNull().references(() => clusters.id, { onDelete: 'cascade' }),
  solutionId:     uuid('solution_id').references(() => solutions.id, { onDelete: 'set null' }),
  briefTechnical: text('brief_technical').notNull(),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const officialActions = pgTable('official_actions', {
  id:          uuid('id').primaryKey().defaultRandom(),
  wardId:      text('ward_id').references(() => wards.id),
  solutionId:  uuid('solution_id').references(() => solutions.id),
  clusterId:   uuid('cluster_id').references(() => clusters.id),
  actionDesc:  text('action_desc').notNull(),
  status:      text('status').default('acknowledged'),
  evidenceUrl: text('evidence_url'),
  updatedBy:   text('updated_by'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Type exports
export type RawPost       = typeof rawPosts.$inferSelect
export type Post          = typeof posts.$inferSelect
export type Cluster       = typeof clusters.$inferSelect
export type Solution      = typeof solutions.$inferSelect
export type Ward          = typeof wards.$inferSelect
export type OfficialAction = typeof officialActions.$inferSelect
export type PipelineRun = typeof pipelineRuns.$inferSelect
export type SynthesisBatch = typeof synthesisBatches.$inferSelect
export type MasterSynthesis = typeof masterSyntheses.$inferSelect
export type ResearchDatum = typeof researchData.$inferSelect
export type CitizenDisplay = typeof citizenDisplays.$inferSelect
export type GovernmentDisplay = typeof governmentDisplays.$inferSelect
