-- Migration: 008_advanced_reviews_fixes.sql
-- Description: Idempotently adds missing tables, columns, and triggers for the advanced review system.

DO $$
BEGIN
  -- 1. Rename comment to review_text in public.ratings if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ratings' AND column_name = 'comment') THEN
    ALTER TABLE public.ratings RENAME COLUMN comment TO review_text;
  END IF;

  -- 2. Add new columns to public.ratings if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ratings' AND column_name = 'review_title') THEN
    ALTER TABLE public.ratings ADD COLUMN review_title TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ratings' AND column_name = 'is_verified_downloader') THEN
    ALTER TABLE public.ratings ADD COLUMN is_verified_downloader BOOLEAN DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ratings' AND column_name = 'status') THEN
    ALTER TABLE public.ratings ADD COLUMN status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'removed'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ratings' AND column_name = 'helpful_count') THEN
    ALTER TABLE public.ratings ADD COLUMN helpful_count INTEGER DEFAULT 0 NOT NULL;
  END IF;

  -- 3. Add new columns to public.notes if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'average_rating') THEN
    ALTER TABLE public.notes ADD COLUMN average_rating NUMERIC(3,1) DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'total_ratings') THEN
    ALTER TABLE public.notes ADD COLUMN total_ratings INTEGER DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'total_reviews') THEN
    ALTER TABLE public.notes ADD COLUMN total_reviews INTEGER DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- 4. Create public.review_helpful_votes
CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.ratings(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_helpful_vote UNIQUE (review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review_id ON public.review_helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_user_id ON public.review_helpful_votes(user_id);

ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE tablename = 'review_helpful_votes'
      AND policyname = 'Review helpful votes - owner manage'
  ) THEN
      CREATE POLICY "Review helpful votes - owner manage"
        ON public.review_helpful_votes
        FOR ALL
        TO authenticated
        USING (user_id = public.requesting_user_id())
        WITH CHECK (user_id = public.requesting_user_id());
  END IF;
END $$;

-- 5. Create public.review_reports
CREATE TABLE IF NOT EXISTS public.review_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES public.ratings(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_review_report UNIQUE (reporter_id, review_id)
);

CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON public.review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_reporter_id ON public.review_reports(reporter_id);

ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE tablename = 'review_reports'
      AND policyname = 'Review reports - reporter manage'
  ) THEN
      CREATE POLICY "Review reports - reporter manage"
        ON public.review_reports
        FOR ALL
        TO authenticated
        USING (reporter_id = public.requesting_user_id())
        WITH CHECK (reporter_id = public.requesting_user_id());
  END IF;
END $$;

-- 6. Helper function for helpful count trigger
CREATE OR REPLACE FUNCTION public.update_review_helpful_count()
RETURNS TRIGGER AS $$
DECLARE
  target_review_id UUID;
BEGIN
  target_review_id := COALESCE(NEW.review_id, OLD.review_id);
  
  UPDATE public.ratings
  SET helpful_count = (SELECT COUNT(*) FROM public.review_helpful_votes WHERE review_id = target_review_id)
  WHERE id = target_review_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_helpful_count'
  ) THEN
    CREATE TRIGGER trigger_update_helpful_count
    AFTER INSERT OR DELETE ON public.review_helpful_votes
    FOR EACH ROW EXECUTE FUNCTION public.update_review_helpful_count();
  END IF;
END $$;

-- 7. Helper function for note aggregate trigger
CREATE OR REPLACE FUNCTION public.update_note_rating_aggregates()
RETURNS TRIGGER AS $$
DECLARE
  target_note_id UUID;
BEGIN
  target_note_id := COALESCE(NEW.note_id, OLD.note_id);
  
  UPDATE public.notes
  SET 
    average_rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM public.ratings WHERE note_id = target_note_id AND status = 'visible'), 0),
    total_ratings = (SELECT COUNT(rating) FROM public.ratings WHERE note_id = target_note_id AND status = 'visible'),
    total_reviews = (SELECT COUNT(review_text) FROM public.ratings WHERE note_id = target_note_id AND status = 'visible')
  WHERE id = target_note_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_note_ratings'
  ) THEN
    CREATE TRIGGER trigger_update_note_ratings
    AFTER INSERT OR UPDATE OR DELETE ON public.ratings
    FOR EACH ROW EXECUTE FUNCTION public.update_note_rating_aggregates();
  END IF;
END $$;
