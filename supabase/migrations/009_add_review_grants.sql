-- Migration: 009_add_review_grants.sql
-- Description: Grants missing privileges for review_reports and review_helpful_votes to Supabase roles.

-- 1. Grant usage on schema public (usually already granted, but safe to repeat)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Grant privileges on review_helpful_votes
GRANT ALL ON TABLE public.review_helpful_votes TO anon, authenticated, service_role;

-- 3. Grant privileges on review_reports
GRANT ALL ON TABLE public.review_reports TO anon, authenticated, service_role;

-- 4. Ensure RLS is enabled
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;
