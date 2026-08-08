-- 016_brief_audio_storage.sql — storage bucket for TTS gov-brief audio
-- (see app/api/gov/brief-audio/route.ts). Briefs are immutable once
-- generated, so the cache key (sha256 of text+voice+model+lang) has a
-- near-100% hit rate after the first synthesis — this bucket IS the cache.
--
-- Private bucket: briefs may contain a corporator's name/budget figures.
-- Only the service role writes/reads directly; the app hands out short-lived
-- signed URLs (see brief-audio route) rather than making the bucket public.
insert into storage.buckets (id, name, public)
values ('gov-brief-audio', 'gov-brief-audio', false)
on conflict (id) do nothing;

-- Deny-by-default (no policies) for anon/authenticated — service role
-- bypasses RLS/storage policies regardless, so no explicit policy is needed
-- for the app's own reads/writes via SUPABASE_SERVICE_KEY.
