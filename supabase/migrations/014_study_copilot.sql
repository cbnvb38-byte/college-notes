-- Migration: 014_study_copilot.sql
-- Description: Adds tables for Premium Study Copilot (AI generations, usage tracking, and profile plan limits).

-- =========================================================================
-- 1. Profiles Table Updates for Copilot Limits
-- =========================================================================

-- Add plan and limit tracking columns safely if they do not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'plan') THEN
        ALTER TABLE public.profiles ADD COLUMN plan TEXT DEFAULT 'free';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'ai_monthly_limit') THEN
        ALTER TABLE public.profiles ADD COLUMN ai_monthly_limit INTEGER DEFAULT 3;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'ai_used_this_month') THEN
        ALTER TABLE public.profiles ADD COLUMN ai_used_this_month INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'ai_usage_reset_at') THEN
        ALTER TABLE public.profiles ADD COLUMN ai_usage_reset_at TIMESTAMPTZ;
    END IF;
END $$;


-- =========================================================================
-- 2. New Table: ai_generations
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.ai_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
    generation_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    prompt_version TEXT,
    input_text_hash TEXT,
    result_json JSONB,
    result_text TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Constraint for allowed generation types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_generation_type'
  ) THEN
    ALTER TABLE public.ai_generations
      ADD CONSTRAINT valid_generation_type CHECK (
        generation_type IN (
          'summary', 'mcq', 'flashcards', 'important_questions', 
          'short_notes', 'revision_plan', 'doubt_answer', 
          'key_concepts', 'weak_topic_practice'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id ON public.ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_note_id ON public.ai_generations(note_id);


-- =========================================================================
-- 3. New Table: ai_usage
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    usage_month TEXT NOT NULL, -- e.g., '2026-07'
    generations_count INTEGER NOT NULL DEFAULT 0,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_month UNIQUE(user_id, usage_month)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id_month ON public.ai_usage(user_id, usage_month);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trigger_ai_usage_updated_at ON public.ai_usage;
CREATE TRIGGER trigger_ai_usage_updated_at
BEFORE UPDATE ON public.ai_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- =========================================================================
-- 4. RLS & Security Policies
-- =========================================================================

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- ai_generations policies
DROP POLICY IF EXISTS "Allow users to view their own AI generations" ON public.ai_generations;
CREATE POLICY "Allow users to view their own AI generations"
  ON public.ai_generations FOR SELECT
  USING (user_id = public.requesting_user_id());

DROP POLICY IF EXISTS "Allow users to delete their own AI generations" ON public.ai_generations;
CREATE POLICY "Allow users to delete their own AI generations"
  ON public.ai_generations FOR DELETE
  USING (user_id = public.requesting_user_id());

-- ai_usage policies
DROP POLICY IF EXISTS "Allow users to view their own AI usage" ON public.ai_usage;
CREATE POLICY "Allow users to view their own AI usage"
  ON public.ai_usage FOR SELECT
  USING (user_id = public.requesting_user_id());

-- (Insert/Update for these tables are handled by Service Role exclusively on the server)

-- =========================================================================
-- 5. Grants
-- =========================================================================

GRANT ALL ON public.ai_generations TO service_role;
GRANT SELECT, DELETE ON public.ai_generations TO authenticated;

GRANT ALL ON public.ai_usage TO service_role;
GRANT SELECT ON public.ai_usage TO authenticated;
