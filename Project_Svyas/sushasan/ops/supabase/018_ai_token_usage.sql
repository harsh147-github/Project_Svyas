-- 018_ai_token_usage.sql — chat() discarded `usage` from both providers
-- entirely. "Sarvam is cheaper than Claude" was an assertion nobody could
-- actually check against this project's own traffic — these columns are
-- what lets the daily/eval reports compute real ₹ spend per provider.
ALTER TABLE ai_provider_events ADD COLUMN IF NOT EXISTS prompt_tokens int;
ALTER TABLE ai_provider_events ADD COLUMN IF NOT EXISTS completion_tokens int;
ALTER TABLE ai_provider_events ADD COLUMN IF NOT EXISTS cost_est_inr numeric(10,4);
