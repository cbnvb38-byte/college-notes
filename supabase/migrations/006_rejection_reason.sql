-- Migration: 006_rejection_reason.sql
-- Description: Add rejection_reason column to notes table for admin moderation.
-- Idempotent: safe to run multiple times.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notes'
      AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE public.notes ADD COLUMN rejection_reason TEXT;
  END IF;
END
$$;
