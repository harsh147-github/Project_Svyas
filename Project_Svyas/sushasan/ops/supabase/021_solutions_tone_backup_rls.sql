-- 021_solutions_tone_backup_rls.sql — close an anon-exposed table
--
-- solutions_tone_backup had RLS disabled, meaning the anon key could read
-- and write every row. It's a service-role-only backup table (mirrors the
-- dispatch_log pattern in 007): enable RLS with zero policies = deny-all to
-- anon/authenticated, and service_role bypasses RLS entirely regardless, so
-- no explicit service-role policy is needed or created.

ALTER TABLE public.solutions_tone_backup ENABLE ROW LEVEL SECURITY;
