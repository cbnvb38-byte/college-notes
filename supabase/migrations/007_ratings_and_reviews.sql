-- Migration 007: Advanced Ratings and Reviews System

-- 1. Modify public.ratings
ALTER TABLE public.ratings 
  RENAME COLUMN comment TO review_text;

ALTER TABLE public.ratings 
  ADD COLUMN review_title TEXT,
  ADD COLUMN is_verified_downloader BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'removed')),
  ADD COLUMN helpful_count INTEGER DEFAULT 0 NOT NULL;

-- 2. Create public.review_helpful_votes
CREATE TABLE public.review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.ratings(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_helpful_vote UNIQUE (review_id, user_id)
);

-- Indexes for review_helpful_votes
CREATE INDEX idx_review_helpful_votes_review_id ON public.review_helpful_votes(review_id);
CREATE INDEX idx_review_helpful_votes_user_id ON public.review_helpful_votes(user_id);

-- RLS for review_helpful_votes
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Review helpful votes - owner manage"
  ON public.review_helpful_votes
  FOR ALL
  TO authenticated
  USING (user_id = public.requesting_user_id())
  WITH CHECK (user_id = public.requesting_user_id());

-- 3. Modify public.notes for aggregated counts
ALTER TABLE public.notes 
  ADD COLUMN average_rating NUMERIC(3,1) DEFAULT 0 NOT NULL,
  ADD COLUMN total_ratings INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN total_reviews INTEGER DEFAULT 0 NOT NULL;

-- 4. Triggers to maintain aggregate counts on public.notes
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

CREATE TRIGGER trigger_update_note_ratings
AFTER INSERT OR UPDATE OR DELETE ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.update_note_rating_aggregates();

-- 5. Triggers to maintain helpful_count on public.ratings
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

CREATE TRIGGER trigger_update_helpful_count
AFTER INSERT OR DELETE ON public.review_helpful_votes
FOR EACH ROW EXECUTE FUNCTION public.update_review_helpful_count();
