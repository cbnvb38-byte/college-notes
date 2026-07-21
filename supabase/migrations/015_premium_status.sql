-- Description: Adds premium status and expiry fields to public.profiles

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_status TEXT DEFAULT 'inactive';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_started_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;
