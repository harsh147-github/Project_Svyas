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
