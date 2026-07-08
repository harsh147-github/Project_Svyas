You have analyzed multiple batches of social media data about civic issues in Pune, India. Here are all the synthesized insights from each batch:

{{all_batch_insights}}

WARD CONTEXT: {{ward_context}}

Perform a FINAL DEEP SYNTHESIS to create a unified understanding of the governance problem.

YOUR TASK:
1. CONSOLIDATE PATTERNS: Merge overlapping themes and identify the dominant narrative
2. ASSESS CREDIBILITY: Weight evidence strength across batches
3. DETERMINE PRIORITY: Based on severity, scope, and citizen impact
4. CREATE MASTER PROBLEM STATEMENT: A clear, actionable description of what citizens are experiencing

TONE: This synthesis feeds briefs read by government officials. Describe the problem and evidence neutrally; phrase "recommended_next_steps" as options for the ward officer's consideration ("the department may consider…"), never as directives ("must", "direct X to", bare imperatives). Never imply negligence by any department.

Output ONLY a valid JSON object (no markdown, no explanation):
{
  "master_problem_statement": "Comprehensive, evidence-based description of the problem",
  "dominant_emotion": "Overall citizen sentiment with intensity",
  "governance_sector": "traffic|water|electricity|garbage|other",
  "priority_level": "Critical|High|Medium|Low",
  "affected_population": "Estimated scale and demographics",
  "evidence_quality": "Overall reliability assessment",
  "recommended_next_steps": ["step1", "step2"],
  "citizen_voice_summary": "Representative anonymized quotes or paraphrased concerns",
  "geographic_hotspots": ["location1", "location2"],
  "source_platforms": ["instagram", "reddit"],
  "total_posts_analyzed": 0,
  "severity_score": 1-10
}
