import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { run } from './index.js'
import { supabase } from './lib/supabase.js'

const app = express()
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (_, res) => res.json({
  status: 'ok',
  anthropic: !!process.env.ANTHROPIC_API_KEY,
  supabase: !!process.env.SUPABASE_URL,
  apify: !!process.env.APIFY_API_KEY,
  perplexity: !!process.env.PERPLEXITY_API_KEY,
  twitter: !!process.env.TWITTER_BEARER_TOKEN,
}))

// ── NIBM pilot shortcut ──────────────────────────────────────────────────────
// POST /api/run/nibm — runs the full pipeline pre-configured for the NIBM corridor
app.post('/api/run/nibm', async (req, res) => {
  try {
    const result = await run({
      ward_id: '46',
      search_keywords: 'NIBM Pune traffic jam Tribeca Wanawadi Kausarbaug Mohamadwadi congestion parking',
      city: 'Pune',
      state: 'Maharashtra',
      governance_sector: 'traffic',
    })
    res.json(result)
  } catch (err) {
    console.error('NIBM pipeline failed:', err)
    res.status(500).json({ error: err.message })
  }
})

// ── Generic run ──────────────────────────────────────────────────────────────
// POST /api/run — run for any ward/topic
app.post('/api/run', async (req, res) => {
  const { ward_id, search_keywords, city, state, governance_sector } = req.body
  if (!ward_id || !search_keywords) {
    return res.status(400).json({ error: 'ward_id and search_keywords are required' })
  }
  try {
    const result = await run({ ward_id, search_keywords, city, state, governance_sector })
    res.json(result)
  } catch (err) {
    console.error('Pipeline failed:', err)
    res.status(500).json({ error: err.message })
  }
})

// ── Read outputs ─────────────────────────────────────────────────────────────

// Latest NIBM synthesis (what the frontend reads)
app.get('/api/nibm/latest', async (req, res) => {
  const { data, error } = await supabase
    .from('sushaasan_phase3_optimized_solutions')
    .select(`
      *,
      sushaasan_phase4_citizen_display(citizen_summary, translated_summary),
      sushaasan_phase4_government_display(technical_brief)
    `)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return res.status(404).json({ error: 'No data yet. POST /api/run/nibm to generate.' })
  res.json(data)
})

// Citizen display for a solution
app.get('/api/citizen-display/:solution_id', async (req, res) => {
  const { data, error } = await supabase
    .from('sushaasan_phase4_citizen_display')
    .select('*')
    .eq('solution_id', req.params.solution_id)
    .single()
  if (error || !data) return res.status(404).json({ error: 'Not found' })
  res.json(data)
})

// Government brief for a solution
app.get('/api/government-display/:solution_id', async (req, res) => {
  const { data, error } = await supabase
    .from('sushaasan_phase4_government_display')
    .select('*')
    .eq('solution_id', req.params.solution_id)
    .single()
  if (error || !data) return res.status(404).json({ error: 'Not found' })
  res.json(data)
})

// Full solution plan
app.get('/api/solution/:solution_id', async (req, res) => {
  const { data, error } = await supabase
    .from('sushaasan_phase3_optimized_solutions')
    .select('*')
    .eq('solution_id', req.params.solution_id)
    .single()
  if (error || !data) return res.status(404).json({ error: 'Not found' })
  res.json(data)
})

// All runs
app.get('/api/runs', async (req, res) => {
  const { data } = await supabase
    .from('sushaasan_phase3_optimized_solutions')
    .select('run_id, solution_id, status, created_at, governance_sector, priority_level')
    .order('created_at', { ascending: false })
  res.json(data || [])
})

// Raw signals for a run
app.get('/api/signals/:run_id', async (req, res) => {
  const { data } = await supabase
    .from('sushaasan_raw_social_data')
    .select('*')
    .eq('run_id', req.params.run_id)
    .order('created_at', { ascending: false })
  res.json(data || [])
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Sushaasan backend running on http://localhost:${PORT}`)
  console.log(`  POST /api/run/nibm  — trigger NIBM traffic pipeline`)
  console.log(`  GET  /api/nibm/latest — latest synthesis output`)
  console.log(`  GET  /health        — check all credentials`)
})
